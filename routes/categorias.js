// routes/categorias.js
const express = require('express');
const { check } = require('express-validator');
const { Router } = require('express');
const router = Router();
const { 
    getAllCategories, 
    getCategoria, 
    getAll,
    createCategoria, 
    updateCategoria, 
    deleteCategoria 
} = require('../controllers/categories');

const { validarJWT, validarAdmin } = require('../middlewares/validar-jwt');

// Ruta pública para obtener todas las categorías con sus secciones
router.get('/', [],getAll);

router.get('/all', [],getAllCategories);
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