const express = require('express');
const app = express();
const mysql = require('mysql2/promise');
app.use(express.json());
const cors = require('cors');
require('dotenv').config();


app.use(cors());
app.use(cors({
    origin: '*'
}));



app.use('/api/categories', require('./routes/categorias'))

app.use('/api/users',require('./routes/users'))




const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});