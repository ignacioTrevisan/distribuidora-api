// routes/categorias.js
const express = require('express');
const { check } = require('express-validator');
const { Router } = require('express');
const router = Router();
const { 
    
    getAll,
    
} = require('../controllers/cantidadInicial');



router.get('/', [], 
    getAll
);


module.exports = router;