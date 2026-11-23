
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// VALIDACIÓN CRÍTICA: Asegurar que el secreto JWT exista al levantar el servidor
if (!process.env.JWT_SECRET) {
    console.error('ERROR CRÍTICO: JWT_SECRET no está definido en el archivo .env');
    process.exit(1);
}

require('./db'); // Inicializa la base de datos automáticamente

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de Seguridad
app.use(helmet());

const corsOptions = {
    origin: 'http://localhost:8100',
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

// Middleware para rutas inexistentes
app.use((req, res, next) => {
    const error = new Error('Ruta no encontrada');
    error.status = 404;
    next(error);
});

// Manejador global de errores
app.use((error, req, res, next) => {
    console.error('Error no controlado en el servidor:', error);

    if (res.headersSent) {
        return next(error);
    }

    const estado = Number(error.status || error.statusCode);

    const codigo = Number.isInteger(estado) && estado >= 400 && estado <= 599
        ? estado
        : 500;

    let mensaje = 'Error interno del servidor';

    if (codigo === 400) {
        mensaje = error.type === 'entity.parse.failed'
            ? 'El cuerpo de la solicitud contiene JSON inválido'
            : 'La solicitud no es válida';
    } else if (codigo === 404) {
        mensaje = 'La ruta solicitada no existe';
    } else if (codigo < 500) {
        mensaje = 'No se pudo procesar la solicitud';
    }

    res.status(codigo).json({ mensaje });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
