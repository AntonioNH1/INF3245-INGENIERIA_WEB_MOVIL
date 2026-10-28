const express = require('express');
const pool = require('../db');
const verificarToken = require('../middleware/auth'); // Importamos el guardia de seguridad
const router = express.Router();

// Ruta POST: Crear una nueva reserva (Protegida)
router.post('/', verificarToken, async (req, res) => {
    try {
        const { cancha_id, fecha_reserva, hora_inicio, hora_fin } = req.body;
        
        // El ID del usuario viene del token descifrado por el middleware, ¡no del frontend! 
        // Esto evita que un usuario intente hacer reservas a nombre de otro.
        const usuario_id = req.usuario.id; 

        // Insertar la reserva en PostgreSQL
        const nuevaReserva = await pool.query(
            `INSERT INTO Reservas (usuario_id, cancha_id, fecha_reserva, hora_inicio, hora_fin) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [usuario_id, cancha_id, fecha_reserva, hora_inicio, hora_fin]
        );

        res.status(201).json({
            mensaje: 'Reserva confirmada exitosamente',
            reserva: nuevaReserva.rows[0]
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ mensaje: 'Error al procesar la reserva' });
    }
});

// Ruta GET: Obtener las reservas del usuario logueado (Protegida)
router.get('/mis-reservas', verificarToken, async (req, res) => {
    try {
        const usuario_id = req.usuario.id;

        // Hacemos un JOIN con la tabla Canchas para devolver el nombre y deporte de la cancha reservada
        const misReservas = await pool.query(
            `SELECT r.id, r.fecha_reserva, r.hora_inicio, r.hora_fin, r.estado, 
                    c.nombre AS cancha_nombre, c.tipo_deporte 
             FROM Reservas r 
             JOIN Canchas c ON r.cancha_id = c.id 
             WHERE r.usuario_id = $1 
             ORDER BY r.fecha_reserva DESC`,
            [usuario_id]
        );

        res.json(misReservas.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ mensaje: 'Error al obtener el historial de reservas' });
    }
});

module.exports = router;