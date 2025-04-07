const { Router } = require('express');


const router = Router();
const {login,register,renovarToken, borrarJWT} = require('../controllers/users');
const { validarJWT } = require('../middlewares/validar-jwt');
const { check } = require('express-validator');
router.post('/login', [
    check('email', 'El email es obligatorio').isEmail(),
    check('password', 'La contraseña es obligatoria').not().isEmpty()
], login);



router.get('/renew', validarJWT, renovarToken);

router.post('/logout',[], borrarJWT)


router.post('/register', [
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'El email es obligatorio').isEmail(),
    check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 })
], register);



module.exports = router;