// routes/productos.js
const express = require('express');
const { check } = require('express-validator');
const { Router } = require('express');
const router = Router();
const { 
    getProductos,
    getProductoById,
    createProducto,
    updateProducto,
    getProductsSlugActive,
    deleteProducto,
    toggleVisibilidadProducto,
    toggleDestacadoProducto,
    toggleNuevoProducto,
    getProductosDestacados,
    getProductosNuevos,
    getProductosBySeccion,
    getProductosByCategoria
} = require('../controllers/productos');
const { validarJWT, validarAdmin } = require('../middlewares/validar-jwt');
const { validationResult } = require('express-validator');

// Middleware para validar campos
const validarCampos = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            errors: errors.array()
        });
    }
    next();
};

// Rutas públicas
// Obtener todos los productos (solo visibles para usuarios, todos para admin)
router.get('/', getProductos);

router.get('/slugs', getProductsSlugActive)
// Obtener un producto por ID
router.get('/:id', getProductoById);

// Obtener productos destacados
router.get('/destacados/lista', getProductosDestacados);

// Obtener productos nuevos
router.get('/nuevos/lista', getProductosNuevos);

// Obtener productos por sección

router.get('/bySection/:idSeccion',[],getProductosBySeccion)

// Obtener productos por categoria

router.get('/byCategoria/:idCategoria',[],getProductosByCategoria)

// Rutas protegidas (requieren autenticación)
// Crear un nuevo producto
router.post('/', [
    validarJWT,
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('descripcion', 'La descripción es obligatoria').not().isEmpty(),
    check('idSeccion', 'El id de la sección es obligatorio').not().isEmpty(),
    check('destacado', 'El campo destacado debe ser un booleano').optional().isBoolean(),
    check('slug', 'El campo slug es obligatorio').not().isEmpty(),
      check('imagen_principal', 'La imagen principal es obligatoria').not().isEmpty(),
     check('imagen_extra1', 'La imagen extra numero 1 es obligatoria').not().isEmpty(),
     check('imagen_extra2', 'La imagen extra numero 2 es obligatoria').not().isEmpty(),
    check('nuevo', 'El campo nuevo debe ser un booleano').optional().isBoolean(),
    check('visible', 'El campo visible debe ser un booleano').optional().isBoolean(),
    validarCampos
], createProducto);

// Actualizar un producto
// Ruta para actualización parcial de productos
router.put('/:id', [
    validarJWT,
    check('nombre', 'El nombre es obligatorio').optional(),
    check('descripcion', 'La descripción debe ser texto').optional(),
    check('idSeccion', 'El id de la sección debe ser válido').optional(),
    check('destacado', 'El campo destacado debe ser un booleano').optional().isBoolean(),
    check('nuevo', 'El campo nuevo debe ser un booleano').optional().isBoolean(),
    check('visible', 'El campo visible debe ser un booleano').optional().isBoolean(),
    check('imagen_principal', 'La imagen principal debe ser una URL válida').optional(),
    check('imagen_extra1', 'La imagen extra 1 debe ser una URL válida').optional(),
    check('imagen_extra2', 'La imagen extra 2 debe ser una URL válida').optional(),
    validarCampos
], updateProducto);

// Eliminar un producto
router.delete('/:id', [
    validarJWT,
    validarAdmin
], deleteProducto);

// Toggles rápidos para cambiar estados
router.put('/visibilidad/:id', [
    validarJWT,
    check('visible', 'El campo visible debe ser un booleano').isBoolean(),
    validarCampos
], toggleVisibilidadProducto);

router.put('/destacado/:id', [
    validarJWT,
    check('destacado', 'El campo destacado debe ser un booleano').isBoolean(),
    validarCampos
], toggleDestacadoProducto);

router.put('/nuevo/:id', [
    validarJWT,
    check('nuevo', 'El campo nuevo debe ser un booleano').isBoolean(),
    validarCampos
], toggleNuevoProducto);

module.exports = router;