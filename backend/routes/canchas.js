const express = require('express');
const pool = require('../db');
const router = express.Router();

// Ruta GET: Obtener todas las canchas
router.get('/', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM Canchas WHERE disponible = TRUE');
        res.json(resultado.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ mensaje: 'Error al obtener las canchas' });
    }
});

module.exports = router;