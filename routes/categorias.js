const { Router } = require('express');
const { check } = require('express-validator');
const { getAllCategories } = require('../controllers/categories');
const router = Router();

router.get('/all',[],getAllCategories)

module.exports = router;