// middlewares/validar-jwt.js
const jwt = require('jsonwebtoken');

// Secreto para JWT - debería coincidir con el del controlador
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware para validar JWT
const validarJWT = (req, res, next) => {
    // Obtener el token del header
    const token = req.header('x-token');

    // Verificar si hay token
    if (!token) {
        return res.status(401).json({
            ok: false,
            msg: 'No hay token en la petición'
        });
    }

    try {
        // Verificar el token
        const { uid, nombre, email } = jwt.verify(token, JWT_SECRET);
        
        // Agregar la información del usuario a la request
        req.uid = uid;
        req.nombre = nombre;
        req.email = email;

        next();
    } catch (error) {
        console.log(error)
        return res.status(401).json({
            ok: false,
            msg: 'Token no válido'
        });
    }
};

// Middleware para validar rol de administrador
const validarAdmin = (req, res, next) => {
    // Verificar que el middleware de JWT ya se ejecutó
    if (!req.uid) {
        return res.status(500).json({
            ok: false,
            msg: 'Se intenta verificar el rol sin validar el token primero'
        });
    }

    // Verificar si el usuario es administrador
    if (req.rol !== 'admin') {
        return res.status(403).json({
            ok: false,
            msg: 'No tiene permisos para realizar esta acción'
        });
    }

    next();
};

module.exports = {
    validarJWT,
    validarAdmin
};