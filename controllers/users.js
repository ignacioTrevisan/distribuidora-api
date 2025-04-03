// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Secreto para JWT - idealmente esto debería estar en variables de entorno
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = '24h';

// Pool de conexión a la base de datos
const pool = require('../config/db');

// Controlador para login
const login = async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            errors: errors.array()
        });
    }

    const { email, password } = req.body;

    try {
        // Obtener el usuario de la base de datos
        const [rows] = await pool.execute('SELECT id, nombre, email, password FROM usuarios WHERE email = ?', [email]);

        // Verificar si existe el usuario
        if (rows.length === 0) {
            return res.status(400).json({
                ok: false,
                msg: 'Credenciales incorrectas'
            });
        }

        const usuario = rows[0];

        // Verificar la contraseña
        const validPassword = bcrypt.compareSync(password, usuario.password);
        if (!validPassword) {
            return res.status(400).json({
                ok: false,
                msg: 'Credenciales incorrectas'
            });
        }

        // Generar JWT
        const payload = {
            uid: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // Responder con el token
        return res.status(200).json({
            ok: true,
            uid: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
         
            token
        });

    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error en el servidor, contacte al administrador'
        });
    }
};

// Controlador para verificar y renovar token
const renovarToken = async (req, res) => {
    // El uid y nombre vienen del middleware de validación JWT
    const { uid, nombre, email } = req;

    try {
        // Generar un nuevo JWT
        const payload = { uid, nombre, email };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        return res.json({
            ok: true,
            uid,
            nombre,
            email,
            token
        });

    } catch (error) {
        console.error('Error al renovar token:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error en el servidor'
        });
    }
};

// Controlador para registro
const register = async (req, res) => {
    // Validar los datos recibidos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            errors: errors.array()
        });
    }

    const { nombre, email, password } = req.body;

    try {
        // Verificar si el email ya existe
        const [existeEmail] = await pool.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
        
        if (existeEmail.length > 0) {
            return res.status(400).json({
                ok: false,
                msg: 'El email ya está registrado'
            });
        }

        // Hashear la contraseña
        const salt = bcrypt.genSaltSync();
        const hashedPassword = bcrypt.hashSync(password, salt);

        // Insertar el usuario
        const [result] = await pool.execute(
            'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
            [nombre, email, hashedPassword]
        );

        // Generar JWT
        const payload = {
            uid: result.insertId,
            nombre,
            email
            
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        return res.status(201).json({
            ok: true,
            uid: result.insertId,
            nombre,
            email,
            
            token
        });

    } catch (error) {
        console.error('Error en registro:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error en el servidor, contacte al administrador'
        });
    }
};

module.exports = {
    login,
    renovarToken,
    register
};