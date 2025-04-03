const express = require('express');
const app = express();
const mysql = require('mysql2/promise');

app.use(express.json());

// Crear un pool de conexiones (mejor práctica que una sola conexión)
const pool = mysql.createPool({
  host: '149.50.142.58',
  user: 'apiuser',
  password: 'ApiPassword123!',
  database: 'baseDeDatos'
});
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

// Endpoint para obtener usuarios
app.get('/api/usuarios', async (req, res) => {
    try {
        // Cambiado 'users' por 'usuarios' para que coincida con la tabla que creaste
        const [rows] = await pool.query('SELECT * FROM usuarios');
        res.json(rows);
    } catch (error) {
        console.error('Error al consultar usuarios:', error);
        res.status(500).json({ mensaje: 'Error al consultar la base de datos' });
    }
});

// Endpoint para crear un usuario
app.post('/api/usuarios', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        
        // Validar datos de entrada
        if (!nombre || !email || !password) {
            return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
        }
        
        // Insertar usuario en la base de datos
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, activo) VALUES (?, ?, ?, TRUE)',
            [nombre, email, password]
        );
        
        res.status(201).json({ 
            mensaje: 'Usuario creado', 
            id: result.insertId,
            usuario: { nombre, email, activo: true }
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ mensaje: 'Error al crear usuario en la base de datos' });
    }
});

app.get('/api/categorias', async (req, res) => {
  try {
    // Primero obtenemos todas las categorías
    const [categorias] = await pool.execute(`
      SELECT id, nombre as Nombre, url as Url, icono
      FROM categorias
      ORDER BY nombre
    `);

    // Para cada categoría, obtenemos sus secciones
    const resultado = await Promise.all(categorias.map(async (categoria) => {
      const [secciones] = await pool.execute(`
        SELECT 
          s.nombre as Nombre,
          cs.descripcion as Descripcion,
          s.url as Url,
          cs.icono as icono
        FROM 
          categorias_secciones cs
        JOIN 
          secciones s ON cs.idSeccion = s.id
        WHERE 
          cs.idCategoria = ?
        ORDER BY 
          s.nombre
      `, [categoria.id]);

      // Retornamos la categoría con sus secciones en el formato esperado
      return {
        Nombre: categoria.Nombre,
        Url: categoria.Url,
        Secciones: secciones
      };
    }));

    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener categorías y secciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});



const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});