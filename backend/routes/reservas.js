const express = require('express');
const verificarToken = require('../middleware/auth');
const verificarAdmin = require('../middleware/admin'); // <-- Middleware centralizado de admin
const reservasController = require('../controllers/reservasController');

const router = express.Router();

// Rutas Públicas
router.get('/disponibilidad', reservasController.obtenerDisponibilidad);
router.get('/buscar-disponibles', reservasController.buscarDisponibles);

// Rutas Privadas (Usuarios logueados)
router.post('/', verificarToken, reservasController.crearReserva);
router.get('/mis-reservas', verificarToken, reservasController.obtenerMisReservas);
router.patch('/mis-reservas/:id/solicitar-cancelacion', verificarToken, reservasController.solicitarCancelacion);

// Rutas Privadas (Solo Administradores)
router.get('/', verificarToken, verificarAdmin, reservasController.obtenerTodas);
router.patch('/:id/cancelar', verificarToken, verificarAdmin, reservasController.cancelarAdmin);
router.patch('/:id/resolver-cancelacion', verificarToken, verificarAdmin, reservasController.resolverCancelacion);
router.delete('/:id', verificarToken, verificarAdmin, reservasController.eliminarReservaAdmin); // <-- Ruta DELETE que pedía el profe

module.exports = router;