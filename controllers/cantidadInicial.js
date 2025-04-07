const mysql = require('mysql2/promise');
const express = require('express');

const pool = mysql.createPool({
  host: '149.50.142.58',
  user: 'apiuser',
  password: 'ApiPassword123!',
  database: 'baseDeDatos'
});


const getAll = async (req, res = express.response) => {
    try {
        // Obtenemos todas las categorías sin incluir iconos
        const [rows]= await pool.execute(`
           SELECT 
    (SELECT COUNT(*) FROM categorias) AS total_categorias,
    (SELECT COUNT(*) FROM secciones) AS total_secciones,
    (SELECT COUNT(*) FROM productos) AS total_productos;
        `);
            
        res.status(200).json({
            ok:true,
            data:rows[0],
        });
    } catch (error) {
        console.error('Error al obtener categorías y secciones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}


module.exports = {getAll};