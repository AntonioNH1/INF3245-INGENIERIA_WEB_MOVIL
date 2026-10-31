
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db'); // Conexión a la base de datos

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas de usuarios
const rutasUsuarios = require('./routes/usuarios');
app.use('/api/usuarios', rutasUsuarios);

// Rutas de canchas
const rutasCanchas = require('./routes/canchas');
app.use('/api/canchas', rutasCanchas);

// Rutas de reservas
const rutasReservas = require('./routes/reservas');
app.use('/api/reservas', rutasReservas);

// Rutas de métodos de pago
const rutasMetodosPago = require('./routes/metodosPago');
app.use('/api/metodos-pago', rutasMetodosPago);

app.get('/', (req, res) => {
    res.json({ mensaje: '¡Servidor de FaltaUno funcionando!' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
