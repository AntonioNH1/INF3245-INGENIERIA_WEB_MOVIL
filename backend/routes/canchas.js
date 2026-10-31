const express = require('express');
const pool = require('../db');
const verificarToken = require('../middleware/auth');

const router = express.Router();

// Verificar que el usuario tenga rol de administrador
const verificarAdmin = (req, res, next) => {
    const rol = String(req.usuario?.rol || '')
        .trim()
        .toLowerCase();

    if (!['admin', 'administrador'].includes(rol)) {
        return res.status(403).json({
            mensaje: 'No tienes permisos para administrar las canchas'
        });
    }

    next();
};

// GET público: mostrar solamente las canchas habilitadas
router.get('/', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT id, nombre, tipo_deporte, precio_hora, disponible
            FROM Canchas
            WHERE disponible = TRUE
            ORDER BY id ASC
        `);

        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener las canchas:', error);

        res.status(500).json({
            mensaje: 'Error al obtener las canchas'
        });
    }
});

// GET administrador: mostrar todas las canchas, habilitadas y deshabilitadas
router.get('/admin/todas', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT
                c.id,
                c.nombre,
                c.tipo_deporte,
                c.precio_hora,
                c.disponible,
                COUNT(r.id)::integer AS reservas_asociadas
            FROM Canchas c
            LEFT JOIN Reservas r ON r.cancha_id = c.id
            GROUP BY c.id
            ORDER BY c.id ASC
        `);

        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener todas las canchas:', error);

        res.status(500).json({
            mensaje: 'Error al obtener las canchas'
        });
    }
});

// POST administrador: crear una cancha
router.post('/', verificarToken, verificarAdmin, async (req, res) => {
    const nombre = String(req.body.nombre || '').trim();
    const tipoDeporte = String(req.body.tipo_deporte || '').trim();
    const precioHora = Number(req.body.precio_hora);

    if (!nombre || !tipoDeporte) {
        return res.status(400).json({
            mensaje: 'Debes indicar el nombre y el deporte de la cancha'
        });
    }

    if (!Number.isInteger(precioHora) || precioHora <= 0) {
        return res.status(400).json({
            mensaje: 'El precio por hora debe ser un número entero mayor que cero'
        });
    }

    try {
        const resultado = await pool.query(
            `INSERT INTO Canchas (nombre, tipo_deporte, precio_hora, disponible)
             VALUES ($1, $2, $3, TRUE)
             RETURNING *`,
            [nombre, tipoDeporte, precioHora]
        );

        res.status(201).json({
            mensaje: 'Cancha creada correctamente',
            cancha: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al crear la cancha:', error);

        res.status(500).json({
            mensaje: 'Error al crear la cancha'
        });
    }
});

// PUT administrador: editar los datos de una cancha
router.put('/:id', verificarToken, verificarAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const nombre = String(req.body.nombre || '').trim();
    const tipoDeporte = String(req.body.tipo_deporte || '').trim();
    const precioHora = Number(req.body.precio_hora);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            mensaje: 'El identificador de la cancha no es válido'
        });
    }

    if (!nombre || !tipoDeporte) {
        return res.status(400).json({
            mensaje: 'Debes indicar el nombre y el deporte de la cancha'
        });
    }

    if (!Number.isInteger(precioHora) || precioHora <= 0) {
        return res.status(400).json({
            mensaje: 'El precio por hora debe ser un número entero mayor que cero'
        });
    }

    try {
        const resultado = await pool.query(
            `UPDATE Canchas
             SET nombre = $1,
                 tipo_deporte = $2,
                 precio_hora = $3
             WHERE id = $4
             RETURNING *`,
            [nombre, tipoDeporte, precioHora, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'No se encontró la cancha'
            });
        }

        res.json({
            mensaje: 'Cancha actualizada correctamente',
            cancha: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al editar la cancha:', error);

        res.status(500).json({
            mensaje: 'Error al actualizar la cancha'
        });
    }
});

// PATCH administrador: habilitar o deshabilitar una cancha
router.patch('/:id/disponibilidad', verificarToken, verificarAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const { disponible } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            mensaje: 'El identificador de la cancha no es válido'
        });
    }

    if (typeof disponible !== 'boolean') {
        return res.status(400).json({
            mensaje: 'Debes indicar si la cancha estará habilitada o deshabilitada'
        });
    }

    try {
        const resultado = await pool.query(
            `UPDATE Canchas
             SET disponible = $1
             WHERE id = $2
             RETURNING *`,
            [disponible, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'No se encontró la cancha'
            });
        }

        res.json({
            mensaje: disponible
                ? 'Cancha habilitada correctamente'
                : 'Cancha deshabilitada correctamente',
            cancha: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al cambiar la disponibilidad:', error);

        res.status(500).json({
            mensaje: 'Error al cambiar la disponibilidad de la cancha'
        });
    }
});

// DELETE administrador: eliminar solamente si no tiene reservas asociadas
router.delete('/:id', verificarToken, verificarAdmin, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            mensaje: 'El identificador de la cancha no es válido'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Bloquear la cancha mientras se verifica si tiene reservas
        const cancha = await client.query(
            `SELECT id
             FROM Canchas
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );

        if (cancha.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                mensaje: 'No se encontró la cancha'
            });
        }

        // Contar todas las reservas asociadas, sin importar su estado
        const reservas = await client.query(
            `SELECT COUNT(*)::integer AS total
             FROM Reservas
             WHERE cancha_id = $1`,
            [id]
        );

        const totalReservas = reservas.rows[0].total;

        if (totalReservas > 0) {
            await client.query('ROLLBACK');

            return res.status(409).json({
                mensaje: `No se puede eliminar esta cancha porque tiene ${totalReservas} reserva(s) asociada(s). Puedes deshabilitarla en su lugar.`
            });
        }

        await client.query(
            'DELETE FROM Canchas WHERE id = $1',
            [id]
        );

        await client.query('COMMIT');

        res.json({
            mensaje: 'Cancha eliminada correctamente'
        });
    } catch (error) {
        await client.query('ROLLBACK');

        console.error('Error al eliminar la cancha:', error);

        res.status(500).json({
            mensaje: 'Error al eliminar la cancha'
        });
    } finally {
        client.release();
    }
});

module.exports = router;