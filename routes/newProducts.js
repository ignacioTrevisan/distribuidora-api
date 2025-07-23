// routes/rubros.js
const { check } = require("express-validator");
const { Router } = require("express");
const router = Router();
const { validarJWT } = require("../middlewares/validar-jwt");

const {
  getNewProducts,
  addNewProduct,
  deleteNewProduct,
  updateNewProduct,
} = require("../controllers/newProducts");

// Rutas públicas

// Obtener todas las categorías con sus secciones (incluye inactivas)
router.get("/", [], getNewProducts);

router.post(
  "/",
  [
    check("codigo", "El codigo es obligatorio").not().isEmpty(),
    check("descripcion", "la descripcion es obligatorio").not().isEmpty(),
    check("descripcion", "la descripcion es demasiado pequeño").isLength({
      min: 3,
    }),
    check("ID_RUBRO", "el id del rubro es obligatorio").notEmpty(),
    check("ID_RUBRO", "el id del rubro debe ser de tipo int").isNumeric(),
    validarJWT,
    //Campo visible no es obligatorio xq por defecto es false
  ],
  addNewProduct
);

router.delete("/:id", [validarJWT], deleteNewProduct);

router.put(
  "/:codigo",
  [
    check("descripcion", "La descripcion es obligatoria").not().isEmpty(),
    check("descripcion", "La descripcion es demasiada pequeña").isLength({
      min: 3,
    }),
  ],
  updateNewProduct
);

module.exports = router;
