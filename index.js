const express = require('express');
const app = express();
const mysql = require('mysql2/promise');
const cookieParser = require('cookie-parser');

const cors = require('cors');
require('dotenv').config();

// Configuración CORS más detallada
app.use(cors({
    origin: ['http://localhost:3001', 'http://127.0.0.1:3001'], // Orígenes permitidos
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'x-token', 'Authorization'], // Encabezados permitidos,
    credentials:true,
}));
app.use(cookieParser());
// Middleware para parsear JSON
app.use(express.json());

// Rutas
app.use('/api/categories', require('./routes/categorias'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sections', require('./routes/secciones'));
app.use('/api/products', require('./routes/productos'));
app.use('/api/cantidadInicial', require('./routes/cantidadInicial'));


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});