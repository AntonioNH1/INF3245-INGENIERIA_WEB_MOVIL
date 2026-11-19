const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = require('../db');
const verificarToken = require('../middleware/auth');
const verificarAdmin = require('../middleware/admin');

const router = express.Router();

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const validarTelefono = (telefono) => {
    if (typeof telefono !== 'string') return false;
    const digitos = telefono.replace(/\D/g, '');
    return digitos.length >= 9 && digitos.length <= 15 && telefono.length <= 20;
};

// POST: REGISTRAR USUARIO
router.post('/registro', async (req, res) => {
    try {
        const nombre = String(req.body?.nombre || '').trim();
        const rut = String(req.body?.rut || '').trim();
        const email = String(req.body?.email || '').trim().toLowerCase();
        const telefono = String(req.body?.telefono || '').trim();
        const password = req.body?.password;

        if (!nombre || !rut || !email || !telefono || typeof password !== 'string') {
            return res.status(400).json({ mensaje: 'Debes completar todos los campos obligatorios.' });
        }
        if (nombre.length < 3 || nombre.length > 100) return res.status(400).json({ mensaje: 'Nombre entre 3 y 100 caracteres.' });
        if (rut.length > 20 || email.length > 100) return res.status(400).json({ mensaje: 'El RUT o el correo superan la longitud permitida.' });
        if (!EMAIL_REGEX.test(email)) return res.status(400).json({ mensaje: 'Ingresa un correo electrónico válido.' });
        if (!validarTelefono(telefono)) return res.status(400).json({ mensaje: 'Ingresa un teléfono válido.' });
        if (password.length < 4) return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 4 caracteres.' });

        const usuarioExistente = await pool.query(
            `SELECT id FROM Usuarios WHERE LOWER(email) = LOWER($1) OR LOWER(rut) = LOWER($2) LIMIT 1`,
            [email, rut]
        );

        if (usuarioExistente.rows.length > 0) {
            // CORRECCIÓN RÚBRICA: 409 Conflict en lugar de 400
            return res.status(409).json({ mensaje: 'El correo o RUT ya están registrados.' });
        }

        const passwordEncriptada = await bcrypt.hash(password, 10);
        const nuevoUsuario = await pool.query(
            `INSERT INTO Usuarios (nombre, rut, email, telefono, password) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, rut, email, telefono, rol`,
            [nombre, rut, email, telefono, passwordEncriptada]
        );

        return res.status(201).json({ mensaje: 'Usuario registrado exitosamente.', usuario: nuevoUsuario.rows[0] });

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        if (error.code === '23505') {
            // CORRECCIÓN RÚBRICA: 409 Conflict
            return res.status(409).json({ mensaje: 'El correo o RUT ya están registrados.' });
        }
        return res.status(500).json({ mensaje: 'Error interno en el servidor.' });
    }
});

// POST: INICIAR SESIÓN
router.post('/login', async (req, res) => {
    try {
        const email = String(req.body?.email || '').trim().toLowerCase();
        const password = req.body?.password;

        if (!email || !password) {
            return res.status(400).json({ mensaje: 'Debes ingresar correo y contraseña.' });
        }

        const resultado = await pool.query(`SELECT * FROM Usuarios WHERE LOWER(email) = LOWER($1)`, [email]);

        if (resultado.rows.length === 0) {
            // CORRECCIÓN RÚBRICA: 401 Unauthorized en lugar de 400
            return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' });
        }

        const usuario = resultado.rows[0];
        const passwordValida = await bcrypt.compare(password, usuario.password);

        if (!passwordValida) {
            // CORRECCIÓN RÚBRICA: 401 Unauthorized en lugar de 400
            return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' });
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        return res.json({
            mensaje: 'Inicio de sesión exitoso.',
            token,
            usuario: { id: usuario.id, nombre: usuario.nombre, rut: usuario.rut, email: usuario.email, telefono: usuario.telefono, rol: usuario.rol }
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return res.status(500).json({ mensaje: 'Error interno en el servidor.' });
    }
});

// GET: OBTENER LOS DATOS DEL USUARIO AUTENTICADO
router.get('/yo', verificarToken, async (req, res) => {
    const usuarioId = Number(req.usuario?.id);
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) return res.status(401).json({ mensaje: 'No se pudo identificar al usuario de la sesión.' });

    try {
        const resultado = await pool.query(`SELECT id, nombre, rut, email, telefono, rol FROM Usuarios WHERE id = $1`, [usuarioId]);
        if (resultado.rows.length === 0) return res.status(404).json({ mensaje: 'No se encontró el usuario.' });
        return res.json({ usuario: resultado.rows[0] });
    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        return res.status(500).json({ mensaje: 'No se pudieron obtener los datos del perfil.' });
    }
});

// PUT: ACTUALIZAR LOS DATOS DEL USUARIO AUTENTICADO
router.put('/yo', verificarToken, async (req, res) => {
    const usuarioId = Number(req.usuario?.id);
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) return res.status(401).json({ mensaje: 'No se pudo identificar al usuario de la sesión.' });

    const nombre = String(req.body?.nombre || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const telefono = String(req.body?.telefono || '').trim();
    const currentPassword = req.body?.currentPassword;
    const newPassword = req.body?.newPassword;

    if (!nombre || !email || !telefono) return res.status(400).json({ mensaje: 'Nombre, correo y teléfono son obligatorios.' });
    if (nombre.length < 3 || nombre.length > 100) return res.status(400).json({ mensaje: 'Nombre entre 3 y 100 caracteres.' });
    if (email.length > 100 || !EMAIL_REGEX.test(email)) return res.status(400).json({ mensaje: 'Correo inválido.' });
    if (!validarTelefono(telefono)) return res.status(400).json({ mensaje: 'Teléfono inválido.' });

    const quiereCambiarPassword = currentPassword !== undefined || newPassword !== undefined;
    if (quiereCambiarPassword) {
        if (!currentPassword || !newPassword) return res.status(400).json({ mensaje: 'Ingresa la contraseña actual y la nueva.' });
        if (newPassword.length < 4 || newPassword.length > 72) return res.status(400).json({ mensaje: 'La nueva contraseña debe tener entre 4 y 72 caracteres.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const usuarioResultado = await client.query(`SELECT id, password FROM Usuarios WHERE id = $1 FOR UPDATE`, [usuarioId]);
        if (usuarioResultado.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ mensaje: 'No se encontró el usuario.' });
        }

        const correoExistente = await client.query(`SELECT id FROM Usuarios WHERE LOWER(email) = LOWER($1) AND id <> $2 LIMIT 1`, [email, usuarioId]);
        if (correoExistente.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ mensaje: 'Este correo electrónico ya está registrado por otro usuario.' });
        }

        let passwordHash = null;
        if (quiereCambiarPassword) {
            const passwordActualValida = await bcrypt.compare(currentPassword, usuarioResultado.rows[0].password);
            if (!passwordActualValida) {
                await client.query('ROLLBACK');
                return res.status(401).json({ mensaje: 'La contraseña actual es incorrecta.' });
            }
            passwordHash = await bcrypt.hash(newPassword, 10);
        }

        let actualizado;
        if (passwordHash) {
            actualizado = await client.query(
                `UPDATE Usuarios SET nombre = $1, email = $2, telefono = $3, password = $4 WHERE id = $5 RETURNING id, nombre, rut, email, telefono, rol`,
                [nombre, email, telefono, passwordHash, usuarioId]
            );
        } else {
            actualizado = await client.query(
                `UPDATE Usuarios SET nombre = $1, email = $2, telefono = $3 WHERE id = $4 RETURNING id, nombre, rut, email, telefono, rol`,
                [nombre, email, telefono, usuarioId]
            );
        }

        await client.query('COMMIT');
        return res.json({
            mensaje: passwordHash ? 'Los datos y la contraseña se actualizaron correctamente.' : 'Los datos se actualizaron correctamente.',
            usuario: actualizado.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar el perfil:', error);
        if (error.code === '23505') return res.status(409).json({ mensaje: 'El correo electrónico ya está registrado.' });
        return res.status(500).json({ mensaje: 'Error al actualizar los datos del perfil.' });
    } finally {
        client.release();
    }
});

// DELETE: ELIMINAR USUARIO (Solo Administradores)
router.delete('/:id', verificarToken, verificarAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ mensaje: 'ID inválido.' });

    try {
        const resultado = await pool.query(
            `DELETE FROM Usuarios WHERE id = $1 RETURNING id`, 
            [id]
        );
        if (resultado.rows.length === 0) return res.status(404).json({ mensaje: 'No se encontró el usuario.' });
        
        return res.json({ mensaje: 'Usuario eliminado permanentemente del sistema.' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        return res.status(500).json({ mensaje: 'Error al eliminar el usuario.' });
    }
});

module.exports = router;