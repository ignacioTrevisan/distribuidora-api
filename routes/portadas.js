// routes/portadas.js
const { check } = require('express-validator');
const { Router } = require('express');
const router = Router();

const { 
    getPortadas, 
    getPortadaById, 
    createPortada, 
    updatePortada, 
    deletePortada,
    getPortadasByProducto,
    toggleActivoPortada
} = require('../controllers/portadas');
const { validarJWT, validarAdmin } = require('../middlewares/validar-jwt');

// Obtener todas las portadas
router.get('/', getPortadas);

// Obtener una portada por ID
router.get('/:id', getPortadaById);

// Obtener portadas por producto
router.get('/producto/:idProducto', getPortadasByProducto);

// Crear una nueva portada
router.post('/', [
    validarJWT,
    validarAdmin,
    check('url', 'La URL de la imagen es obligatoria').not().isEmpty(),
    check('titulo', 'El título puede tener máximo 100 caracteres').isLength({ max: 100 })
], createPortada);

// Actualizar una portada
router.put('/:id', [
    validarJWT,
    validarAdmin,
    check('url', 'La URL de la imagen es obligatoria').not().isEmpty(),
    check('titulo', 'El título puede tener máximo 100 caracteres').isLength({ max: 100 })
], updatePortada);

// Eliminar una portada
router.delete('/:id', [
    validarJWT,
    validarAdmin
], deletePortada);

// Activar/Desactivar una portada
router.put('/toggle-activo/:id', [
    validarJWT,
    validarAdmin
], toggleActivoPortada);

module.exports = router;