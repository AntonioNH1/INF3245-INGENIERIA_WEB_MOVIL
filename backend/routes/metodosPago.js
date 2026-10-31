
const express = require('express');
const pool = require('../db');
const verificarToken = require('../middleware/auth');

const router = express.Router();

// Obtener los métodos de pago del usuario autenticado
router.get('/', verificarToken, async (req, res) => {
    try {
        const usuarioId = req.usuario.id;

        const resultado = await pool.query(
            `SELECT id, marca, ultimos_cuatro, titular, vencimiento, fecha_registro
             FROM MetodosPago
             WHERE usuario_id = $1
             ORDER BY fecha_registro DESC`,
            [usuarioId]
        );

        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener métodos de pago:', error);
        res.status(500).json({
            mensaje: 'Error al obtener los métodos de pago'
        });
    }
});

// Agregar un método de pago
router.post('/', verificarToken, async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { marca, ultimos_cuatro, titular, vencimiento } = req.body;

        const marcasPermitidas = [
            'VISA',
            'MASTERCARD',
            'AMEX',
            'DÉBITO / CRÉDITO'
        ];

        if (!marca || !marcasPermitidas.includes(marca)) {
            return res.status(400).json({
                mensaje: 'La marca de la tarjeta no es válida'
            });
        }

        if (!/^\d{4}$/.test(String(ultimos_cuatro || ''))) {
            return res.status(400).json({
                mensaje: 'Debes indicar los últimos cuatro dígitos'
            });
        }

        if (!titular || titular.trim().length < 3 || titular.trim().length > 100) {
            return res.status(400).json({
                mensaje: 'El nombre del titular no es válido'
            });
        }

        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(vencimiento || '')) {
            return res.status(400).json({
                mensaje: 'El vencimiento debe tener el formato MM/AA'
            });
        }

        const [mes, anio] = vencimiento.split('/').map(Number);

        const fechaChile = new Date(
            new Date().toLocaleString('en-US', {
                timeZone: 'America/Santiago'
            })
        );

        const anioActual = fechaChile.getFullYear() % 100;
        const mesActual = fechaChile.getMonth() + 1;

        if (
            anio < anioActual ||
            (anio === anioActual && mes < mesActual)
        ) {
            return res.status(400).json({
                mensaje: 'La tarjeta está vencida'
            });
        }

        const duplicada = await pool.query(
            `SELECT id
             FROM MetodosPago
             WHERE usuario_id = $1
               AND marca = $2
               AND ultimos_cuatro = $3
               AND titular = $4
               AND vencimiento = $5`,
            [
                usuarioId,
                marca,
                ultimos_cuatro,
                titular.trim(),
                vencimiento
            ]
        );

        if (duplicada.rows.length > 0) {
            return res.status(409).json({
                mensaje: 'Esta tarjeta ya está registrada'
            });
        }

        const resultado = await pool.query(
            `INSERT INTO MetodosPago
                (usuario_id, marca, ultimos_cuatro, titular, vencimiento)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, marca, ultimos_cuatro, titular, vencimiento, fecha_registro`,
            [
                usuarioId,
                marca,
                ultimos_cuatro,
                titular.trim(),
                vencimiento
            ]
        );

        res.status(201).json({
            mensaje: 'Método de pago agregado correctamente',
            tarjeta: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al agregar método de pago:', error);
        res.status(500).json({
            mensaje: 'Error al guardar el método de pago'
        });
    }
});

// Eliminar un método de pago del usuario autenticado
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const tarjetaId = Number(req.params.id);

        if (!Number.isInteger(tarjetaId) || tarjetaId <= 0) {
            return res.status(400).json({
                mensaje: 'El identificador de la tarjeta no es válido'
            });
        }

        const resultado = await pool.query(
            `DELETE FROM MetodosPago
             WHERE id = $1 AND usuario_id = $2
             RETURNING id`,
            [tarjetaId, usuarioId]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                mensaje: 'No se encontró el método de pago'
            });
        }

        res.json({
            mensaje: 'Método de pago eliminado correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar método de pago:', error);
        res.status(500).json({
            mensaje: 'Error al eliminar el método de pago'
        });
    }
});

module.exports = router;
