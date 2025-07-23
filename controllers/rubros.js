// controllers/rubros.js
const { validationResult } = require("express-validator");
const pool = require("../config/db");

// Get all rubros
const getRubros = async (req, res) => {
  try {
    const { todos } = req.query;
    // console.log({ todos });
    let consulta = `select * from rubros ${
      todos === "false" || !todos ? "where visible = 1" : ""
    }`;
    const [rubros] = await pool.execute(consulta);
    res.json({
      ok: true,
      data: rubros,
    });
  } catch (error) {
    console.log("Error al obtener rubros", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  }
};

// Get rubro by ID
const getRubroById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rubro] = await pool.execute(`SELECT * FROM rubros WHERE id = ?`, [
      id,
    ]);
    if (rubro.length === 0) {
      return res.status(404).json({ ok: false, msg: "Rubro no encontrado" });
    }
    res.json({ ok: true, data: rubro[0] });
  } catch (error) {
    console.log("Error al obtener rubro", error);
    res.status(500).json({ ok: false, msg: "Error interno del servidor" });
  }
};

// Create new rubro
const createNewRubro = async (req, res) => {
  const { titulo, visible = true } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }
  try {
    let [rubro] = await pool.execute(
      `INSERT INTO rubros (titulo, visible) VALUES (?, ?)`,
      [titulo, visible]
    );
    let dataRubro = await pool.execute(`SELECT * FROM rubros where id = ?`, [
      rubro.insertId,
    ]);
    res.json({
      ok: true,
      data: dataRubro[0][0],
      msg: "Rubro creado correctamente",
    });
  } catch (error) {
    console.log("Error al crear rubro", error);
    res.status(500).json({ ok: false, msg: "Error interno del servidor" });
  }
};

// Update rubro
const updateRubro = async (req, res) => {
  const { id } = req.params;
  const { titulo, visible } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, msg: errors.array() });
  }
  try {
    const [result] = await pool.execute(
      `UPDATE rubros SET titulo = ?, visible = ? WHERE id = ?`,
      [titulo, visible, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, msg: "Rubro no encontrado" });
    }
    res.json({ ok: true, msg: "Rubro actualizado correctamente" });
  } catch (error) {
    console.log("Error al actualizar rubro", error);
    res.status(500).json({ ok: false, msg: "Error interno del servidor" });
  }
};

// Delete rubro
const deleteRubro = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute(`DELETE FROM rubros WHERE id = ?`, [
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, msg: "Rubro no encontrado" });
    }
    res.json({ ok: true, msg: "Rubro eliminado correctamente" });
  } catch (error) {
    console.log("Error al eliminar rubro", error);
    res.status(500).json({ ok: false, msg: "Error interno del servidor" });
  }
};

module.exports = {
  getRubros,
  getRubroById,
  createNewRubro,
  updateRubro,
  deleteRubro,
};
