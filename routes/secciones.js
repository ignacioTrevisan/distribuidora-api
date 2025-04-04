// routes/categorias.js
const express = require('express');
const { check } = require('express-validator');
const { Router } = require('express');
const router = Router();
const { 
    getSecciones,createSeccion
} = require('../controllers/secciones');

const { validarJWT, validarAdmin } = require('../middlewares/validar-jwt');

// Rutas públicas

// Obtener todas las categorías con sus secciones (incluye inactivas)
router.get('/', [], getSecciones);

router.post('/', [
    validarJWT,
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('descripcion', 'La descripción es obligatoria').not().isEmpty(),
    check('icono', 'El icono es obligatorio').not().isEmpty(),
    check('activo', 'El estado activo es obligatorio').default(true).isBoolean(),
    check('idCategoria', 'El id de la categoría es obligatorio').not().isEmpty(),
], createSeccion);

module.exports = router;