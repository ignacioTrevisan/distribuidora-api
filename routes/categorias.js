// routes/categorias.js
const express = require('express');
const { check } = require('express-validator');
const router = express.Router();

const { 
    getCategorias, 
    getCategoria, 
    createCategoria, 
    updateCategoria, 
    deleteCategoria 
} = require('../controllers/categoryController');

const { validarJWT, validarAdmin } = require('../middlewares/validar-jwt');

// Ruta pública para obtener todas las categorías con sus secciones
router.get('/', getCategorias);

// Ruta pública para obtener una categoría específica
router.get('/:id', getCategoria);

// Rutas protegidas para administradores
// Crear categoría
router.post('/', [
    validarJWT,
    validarAdmin,
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('url', 'La URL es obligatoria').not().isEmpty(),
    check('icono', 'El icono es obligatorio').not().isEmpty()
], createCategoria);

// Actualizar categoría
router.put('/:id', [
    validarJWT,
    validarAdmin,
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('url', 'La URL es obligatoria').not().isEmpty(),
    check('icono', 'El icono es obligatorio').not().isEmpty()
], updateCategoria);

// Eliminar categoría
router.delete('/:id', [
    validarJWT,
    validarAdmin
], deleteCategoria);

module.exports = router;