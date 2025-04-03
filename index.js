const express = require('express');
const app = express();
const mysql = require('mysql2/promise');
app.use(express.json());
const cors = require('cors');

// Crear un pool de conexiones (mejor práctica que una sola conexión)
const pool = mysql.createPool({
  host: '149.50.142.58',
  user: 'apiuser',
  password: 'ApiPassword123!',
  database: 'baseDeDatos'
});

app.use(cors());
app.use(cors({
    origin: '*'
}));



app.get('/', (req, res) => {
    res.json({ mensaje: '¡Bienvenido a mi API!' });
});

// Middleware para verificar la conexión
app.use(async (req, res, next) => {
    try {
        // Intentar una consulta simple para verificar la conexión
        await pool.query('SELECT 1');
        next();
    } catch (error) {
        console.error('Error de conexión a la base de datos:', error);
        res.status(500).json({ mensaje: 'Error de conexión a la base de datos' });
    }
});

app.use('/api/categories', require('./routes/categorias'))


// // Endpoint para obtener usuarios
// app.get('/api/usuarios', async (req, res) => {
//     try {
//         // Cambiado 'users' por 'usuarios' para que coincida con la tabla que creaste
//         const [rows] = await pool.query('SELECT * FROM usuarios');
//         res.json(rows);
//     } catch (error) {
//         console.error('Error al consultar usuarios:', error);
//         res.status(500).json({ mensaje: 'Error al consultar la base de datos' });
//     }
// });
// // Endpoint para crear un usuario
// app.post('/api/usuarios', async (req, res) => {
//     try {
//         const { nombre, email, password } = req.body;
        
//         // Validar datos de entrada
//         if (!nombre || !email || !password) {
//             return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
//         }
        
//         // Insertar usuario en la base de datos
//         const [result] = await pool.query(
//             'INSERT INTO usuarios (nombre, email, password, activo) VALUES (?, ?, ?, TRUE)',
//             [nombre, email, password]
//         );
        
//         res.status(201).json({ 
//             mensaje: 'Usuario creado', 
//             id: result.insertId,
//             usuario: { nombre, email, activo: true }
//         });
//     } catch (error) {
//         console.error('Error al crear usuario:', error);
//         res.status(500).json({ mensaje: 'Error al crear usuario en la base de datos' });
//     }
// });





const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});