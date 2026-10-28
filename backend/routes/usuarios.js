const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Esta línea lee el archivo .env
const pool = require('../db'); 
const router = express.Router();

router.post('/registro', async (req, res) => {
    try {
        const { nombre, rut, email, telefono, password } = req.body;

        // Validar que el email o el RUT no existan previamente
        const usuarioExistente = await pool.query(
            'SELECT * FROM Usuarios WHERE email = $1 OR rut = $2', 
            [email, rut]
        );
        if (usuarioExistente.rows.length > 0) {
            return res.status(400).json({ mensaje: 'El correo o RUT ya están registrados' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);

        // Insertar con los 5 valores
        const nuevoUsuario = await pool.query(
            'INSERT INTO Usuarios (nombre, rut, email, telefono, password) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, email, rol',
            [nombre, rut, email, telefono, passwordEncriptada]
        );

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            usuario: nuevoUsuario.rows[0]
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ mensaje: 'Error interno en el servidor' });
    }
});

// Ruta POST: Iniciar sesión
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Verificar si el usuario existe en la base de datos
        const resultado = await pool.query('SELECT * FROM Usuarios WHERE email = $1', [email]);
        if (resultado.rows.length === 0) {
            return res.status(400).json({ mensaje: 'Correo o contraseña incorrectos' });
        }

        const usuario = resultado.rows[0];

        // 2. Comparar la contraseña ingresada con la encriptada en la base de datos
        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            return res.status(400).json({ mensaje: 'Correo o contraseña incorrectos' });
        }

        // 3. Generar el Token JWT
        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '2h' } 
        );

        // 4. Responder al frontend con el token y los datos del usuario
        res.json({
            mensaje: 'Inicio de sesión exitoso',
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ mensaje: 'Error interno en el servidor' });
    }
});

module.exports = router;