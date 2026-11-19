const express = require('express');
const cors = require('cors');
require('dotenv').config();

// VALIDACIÓN CRÍTICA: Asegurar que el secreto JWT exista al levantar el servidor
if (!process.env.JWT_SECRET) {
    console.error('ERROR CRÍTICO: JWT_SECRET no está definido en el archivo .env');
    process.exit(1); // Detiene el servidor porque la autenticación no funcionaría
}

require('./db'); // Inicializa la base de datos automáticamente

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/canchas', require('./routes/canchas'));
app.use('/api/reservas', require('./routes/reservas'));
app.use('/api/metodos-pago', require('./routes/metodosPago'));

app.get('/', (req, res) => {
    res.json({ mensaje: '¡Servidor de FaltaUno funcionando correctamente!' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Rutas (con prefijo de versión V1)
app.use('/api/v1/usuarios', require('./routes/usuarios'));
app.use('/api/v1/canchas', require('./routes/canchas'));
app.use('/api/v1/reservas', require('./routes/reservas'));
app.use('/api/v1/metodos-pago', require('./routes/metodosPago'));