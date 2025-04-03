const mysql = require('mysql2/promise');


export const pool = mysql.createPool({
  host: '149.50.142.58',
  user: 'apiuser',
  password: 'ApiPassword123!',
  database: 'baseDeDatos'
});