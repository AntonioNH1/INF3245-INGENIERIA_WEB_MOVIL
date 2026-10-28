const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db'); // Conexión a la base de datos

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Permite peticiones desde el frontend en Ionic
app.use(express.json()); // Permite recibir y leer datos en formato JSON


const rutasUsuarios = require('./routes/usuarios');
app.use('/api/usuarios', rutasUsuarios);

const rutasCanchas = require('./routes/canchas');
app.use('/api/canchas', rutasCanchas);

const rutasReservas = require('./routes/reservas');
app.use('/api/reservas', rutasReservas);

app.get('/', (req, res) => {
    res.json({ mensaje: '¡Servidor de FaltaUno funcionando!' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});