const { validationResult } = require('express-validator');
const express = require('express')
const validarCampos = (req, res = express.response, next) => {

    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({
            ok: false,
            errors: errores.mapped()
        })
    }



    next()
}

module.exports = {
    validarCampos
}