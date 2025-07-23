// controllers/rubros.js
const { validationResult } = require("express-validator");
const pool = require("../config/db");

// Get all products
const getNewProducts = async (req, res) => {
  try {
    const { todos, rubro } = req.query;
    let consulta = `SELECT * FROM newProducts`;
    if (todos === "false") {
      consulta = `SELECT n.* from newProducts as n, rubros as s where n.ID_RUBRO=s.id and s.visible=true ${
        rubro && `and s.titulo='${rubro}'`
      }`;
    }

    const [newProducts] = await pool.execute(consulta);
    res.json({
      ok: true,
      data: newProducts,
    });
  } catch (error) {
    console.log("Error al obtener los nuevos productos", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  }
};

// Get rubro by ID
const getNewProductsById = async (req, res) => {
  const { id } = req.params;
  try {
    const [newProducts] = await pool.execute(
      `SELECT * FROM newProducts WHERE id = ?`,
      [id]
    );
    if (newProducts.length === 0) {
      return res
        .status(404)
        .json({ ok: false, msg: "NewProduct no encontrado" });
    }
    res.json({ ok: true, data: newProducts[0] });
  } catch (error) {
    console.log("Error al obtener newProducts", error);
    res.status(500).json({ ok: false, msg: "Error interno del servidor" });
  }
};

// Create new product
const addNewProduct = async (req, res) => {
  const { codigo, descripcion, ID_RUBRO } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }
  try {
    let [newProduct] = await pool.execute(
      `INSERT INTO newProducts (codigo, descripcion, ID_RUBRO) VALUES (?, ?,?)`,
      [codigo, descripcion, ID_RUBRO]
    );
    let dataNewProduct = await pool.execute(
      `SELECT * FROM newProducts where codigo = ?`,
      [newProduct.insertId]
    );
    res.json({
      ok: true,
      data: dataNewProduct[0][0],
      msg: "newProduct creado correctamente",
    });
  } catch (error) {
    console.log("Error al crear newProduct", error);
    res.status(500).json({ ok: false, msg: "Error interno del servidor" });
  }
};

// Update rubro
const updateNewProduct = async (req, res) => {
  const { codigo } = req.params;
  const { descripcion, id_rubro } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, msg: errors.array() });
  }
  try {
    const [result] = await pool.execute(
      `UPDATE newProducts SET descripcion = ?, id_rubro = ? WHERE codigo = ?`,
      [descripcion, id_rubro, codigo]
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ ok: false, msg: "newProduct no encontrado" });
    }
    res.json({ ok: true, msg: "newProduct actualizado correctamente" });
  } catch (error) {
    console.log("Error al actualizar newProduct", error);
    res.status(500).json({ ok: false, msg: "Error interno del servidor" });
  }
};

// Delete rubro
const deleteNewProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute(
      `DELETE FROM newProducts WHERE codigo = ?`,
      [id]
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ ok: false, msg: "newProduct no encontrado" });
    }
    res.json({ ok: true, msg: "newProduct eliminado correctamente" });
  } catch (error) {
    console.log("Error al eliminar newProduct", error);
    res.status(500).json({ ok: false, msg: "Error interno del servidor" });
  }
};

module.exports = {
  getNewProducts,
  getNewProductsById,
  addNewProduct,
  updateNewProduct,
  deleteNewProduct,
};
