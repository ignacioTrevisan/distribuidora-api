// routes/rubros.js
const { check } = require("express-validator");
const { Router } = require("express");
const router = Router();
const {
  getSecciones,
  createSeccion,
  deleteSeccion,
  updateSeccion,
  toggleVisibilidadSeccion,
  getSectionIdByName,
} = require("../controllers/secciones");

const { validarJWT, validarAdmin } = require("../middlewares/validar-jwt");
const {
  getRubros,
  createNewRubro,
  updateRubro,
} = require("../controllers/rubros");

// Rutas públicas

// Obtener todas las categorías con sus secciones (incluye inactivas)
router.get("/", [], getRubros);

router.post(
  "/",
  [
    check("titulo", "El titulo es obligatorio").not().isEmpty(),
    check("titulo", "El titulo es demasiado pequeño").isLength({ min: 3 }),
    validarJWT,
    //Campo visible no es obligatorio xq por defecto es false
  ],
  createNewRubro
);

router.delete("/:id", [validarJWT], deleteSeccion);

router.put(
  "/:id",
  [
    check("titulo", "El titulo es obligatorio").not().isEmpty(),
    check("titulo", "El titulo es demasiado pequeño").isLength({ min: 3 }),
  ],
  updateRubro
);
router.put(
  "/visibilidad/:id",
  [
    validarJWT,
    check("visible", "El estado visible es obligatorio")
      .default(true)
      .isBoolean(),
  ],
  toggleVisibilidadSeccion
);
module.exports = router;
