
const express = require('express');
const pool = require('../db');
const verificarToken = require('../middleware/auth');
const verificarAdmin = require('../middleware/admin');

const router = express.Router();

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
        res.status(500).json({ mensaje: 'Error al obtener las canchas' });
    }
});

// GET administrador: mostrar todas las canchas, habilitadas y deshabilitadas
router.get('/admin/todas', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT c.id, c.nombre, c.tipo_deporte, c.precio_hora, c.disponible, COUNT(r.id)::integer AS reservas_asociadas
            FROM Canchas c
            LEFT JOIN Reservas r ON r.cancha_id = c.id
            GROUP BY c.id
            ORDER BY c.id ASC
        `);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener todas las canchas:', error);
        res.status(500).json({ mensaje: 'Error al obtener las canchas' });
    }
});

// POST administrador: crear una cancha
router.post('/', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const cuerpo = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
            ? req.body
            : {};

        const nombre = typeof cuerpo.nombre === 'string' ? cuerpo.nombre.trim() : '';
        const tipoDeporte = typeof cuerpo.tipo_deporte === 'string'
            ? cuerpo.tipo_deporte.trim()
            : '';
        const precioTexto = String(cuerpo.precio_hora ?? '').trim();
        const precioHora = Number(precioTexto);

        if (!nombre || !tipoDeporte) {
            return res.status(400).json({
                mensaje: 'Debes indicar el nombre y el deporte de la cancha'
            });
        }

        if (!/^\d+$/.test(precioTexto) || !Number.isSafeInteger(precioHora) || precioHora <= 0) {
            return res.status(400).json({
                mensaje: 'El precio por hora debe ser un número entero mayor que cero'
            });
        }

        const resultado = await pool.query(
            `INSERT INTO Canchas (nombre, tipo_deporte, precio_hora, disponible) VALUES ($1, $2, $3, TRUE) RETURNING *`,
            [nombre, tipoDeporte, precioHora]
        );

        res.status(201).json({
            mensaje: 'Cancha creada correctamente',
            cancha: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al crear la cancha:', error);
        res.status(500).json({ mensaje: 'Error al crear la cancha' });
    }
});

// PUT administrador: editar los datos de una cancha
router.put('/:id', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const id = Number(req.params.id);

        const cuerpo = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
            ? req.body
            : {};

        const nombre = typeof cuerpo.nombre === 'string' ? cuerpo.nombre.trim() : '';
        const tipoDeporte = typeof cuerpo.tipo_deporte === 'string'
            ? cuerpo.tipo_deporte.trim()
            : '';
        const precioTexto = String(cuerpo.precio_hora ?? '').trim();
        const precioHora = Number(precioTexto);

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

        if (!/^\d+$/.test(precioTexto) || !Number.isSafeInteger(precioHora) || precioHora <= 0) {
            return res.status(400).json({
                mensaje: 'El precio por hora debe ser un número entero mayor que cero'
            });
        }

        const resultado = await pool.query(
            `UPDATE Canchas SET nombre = $1, tipo_deporte = $2, precio_hora = $3 WHERE id = $4 RETURNING *`,
            [nombre, tipoDeporte, precioHora, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontró la cancha' });
        }

        res.json({
            mensaje: 'Cancha actualizada correctamente',
            cancha: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al editar la cancha:', error);
        res.status(500).json({ mensaje: 'Error al actualizar la cancha' });
    }
});

// PATCH administrador: habilitar o deshabilitar una cancha
router.patch('/:id/disponibilidad', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const id = Number(req.params.id);

        const cuerpo = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
            ? req.body
            : {};

        const { disponible } = cuerpo;

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

        const resultado = await pool.query(
            `UPDATE Canchas SET disponible = $1 WHERE id = $2 RETURNING *`,
            [disponible, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontró la cancha' });
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
    let client;
    let transaccionIniciada = false;

    try {
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: 'El identificador de la cancha no es válido'
            });
        }

        client = await pool.connect();

        await client.query('BEGIN');
        transaccionIniciada = true;

        const cancha = await client.query(
            `SELECT id FROM Canchas WHERE id = $1 FOR UPDATE`,
            [id]
        );

        if (cancha.rows.length === 0) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(404).json({
                mensaje: 'No se encontró la cancha'
            });
        }

        const reservas = await client.query(
            `SELECT COUNT(*)::integer AS total FROM Reservas WHERE cancha_id = $1`,
            [id]
        );

        if (reservas.rows[0].total > 0) {
            await client.query('ROLLBACK');
            transaccionIniciada = false;

            return res.status(409).json({
                mensaje: `No se puede eliminar esta cancha porque tiene ${reservas.rows[0].total} reserva(s) asociada(s). Puedes deshabilitarla en su lugar.`
            });
        }

        await client.query('DELETE FROM Canchas WHERE id = $1', [id]);

        await client.query('COMMIT');
        transaccionIniciada = false;

        res.json({
            mensaje: 'Cancha eliminada correctamente'
        });
    } catch (error) {
        if (client && transaccionIniciada) {
            try {
                await client.query('ROLLBACK');
            } catch (errorRollback) {
                console.error('Error al revertir la eliminación de la cancha:', errorRollback);
            }
        }

        console.error('Error al eliminar la cancha:', error);
        res.status(500).json({ mensaje: 'Error al eliminar la cancha' });
    } finally {
        if (client) {
            client.release();
        }
    }
});

module.exports = router;
