const verificarAdmin = (req, res, next) => {
    const rol = String(req.usuario?.rol || '').trim().toLowerCase();

    if (rol !== 'admin') {
        return res.status(403).json({
            mensaje: 'No tienes permisos de administrador para realizar esta acción.'
        });
    }

    next();
};

module.exports = verificarAdmin;