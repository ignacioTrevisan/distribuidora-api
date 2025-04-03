// config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a la base de datos
const pool = mysql.createPool({
  host: process.env.DB_HOST || '149.50.142.58',
  user: process.env.DB_USER || 'apiuser',
  password: process.env.DB_PASSWORD || 'ApiPassword123!',
  database: process.env.DB_NAME || 'baseDeDatos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Función para verificar la conexión (útil para diagnósticos)
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a la base de datos establecida correctamente!');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    return false;
  }
}

module.exports = pool;
module.exports.testConnection = testConnection;