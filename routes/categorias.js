// routes/categorias.js
const express = require('express');
const { check } = require('express-validator');
const { Router } = require('express');
const router = Router();
const { 
    getAllCategories,
    getActiveCategories, 
    getAll,
    getActiveOnly,
    createCategoria, 
    updateCategoria,
    updateCategoriaActivo,
    deleteCategoria ,getCategoryidByName
} = require('../controllers/categories');

const { validarJWT, validarAdmin } = require('../middlewares/validar-jwt');

// Rutas públicas

// Obtener todas las categorías con sus secciones (incluye inactivas)
router.get('/', [], getAll);

router.get('/getCategoryidByName/:name',[], getCategoryidByName)

// Obtener solo categorías activas con sus secciones activas
router.get('/active', [], getActiveOnly);

// Obtener todas las categorías sin secciones (incluye inactivas)
router.get('/all', [], getAllCategories);

// Obtener solo categorías activas sin secciones
router.get('/all/active', [], getActiveCategories);

// Rutas protegidas para administradores

// Crear categoría
router.post('/', [
    validarJWT,
    check('nombre', 'El nombre es obligatorio').not().isEmpty()
], createCategoria);

// Actualizar categoría completa
router.put('/:id', [
    validarJWT,
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
], updateCategoria);

// Actualizar solo el estado activo de una categoría
router.patch('/:id/estado', [
    validarJWT,
    check('activo', 'El campo activo es obligatorio').isBoolean()
], updateCategoriaActivo);

// Eliminar categoría
router.delete('/:id', [
    validarJWT,
    validarAdmin
], deleteCategoria);

module.exports = router;