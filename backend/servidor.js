const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // NUEVO: Protección contra ataques XSS y cabeceras seguras
require('dotenv').config();

// VALIDACIÓN CRÍTICA: Asegurar que el secreto JWT exista al levantar el servidor
if (!process.env.JWT_SECRET) {
    console.error('ERROR CRÍTICO: JWT_SECRET no está definido en el archivo .env');
    process.exit(1);
}

require('./db'); // Inicializa la base de datos automáticamente

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de Seguridad (Requisito EF 3)
app.use(helmet()); 

const corsOptions = {
    origin: 'http://localhost:8100', // Solo permite peticiones desde tu frontend local
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Rutas (con prefijo de versión V1)
app.use('/api/v1/usuarios', require('./routes/usuarios'));
app.use('/api/v1/canchas', require('./routes/canchas'));
app.use('/api/v1/reservas', require('./routes/reservas'));
app.use('/api/v1/metodos-pago', require('./routes/metodosPago'));

app.get('/', (req, res) => {
    res.json({ mensaje: '¡Servidor seguro de FaltaUno funcionando correctamente!' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});