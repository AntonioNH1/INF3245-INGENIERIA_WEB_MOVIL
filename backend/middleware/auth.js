const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Leer el token del encabezado (el frontend lo enviará aquí)
    const token = req.header('Authorization');

    // Revisar si no hay token
    if (!token) {
        return res.status(401).json({ mensaje: 'No hay token, permiso denegado' });
    }

    try {
        // Verificar el token (removiendo la palabra "Bearer " que suele enviar el frontend)
        const tokenLimpio = token.replace('Bearer ', '');
        const cifrado = jwt.verify(tokenLimpio, process.env.JWT_SECRET);
        
        // Agregar los datos descifrados del usuario a la request
        req.usuario = cifrado;
        
        // Permite que el código continúe hacia la ruta protegida
        next(); 
    } catch (error) {
        res.status(401).json({ mensaje: 'Token no válido' });
    }
};