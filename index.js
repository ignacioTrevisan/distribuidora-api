const express = require("express");
const app = express();
const mysql = require("mysql2/promise");
const cookieParser = require("cookie-parser");
const { configDotenv } = require("dotenv");

const cors = require("cors");

require("dotenv").config();
// Configuración CORS más detallada
app.use(
  cors({
    origin: [
      "http://149.50.142.58",
      "http://localhost:3000",
      "https://distribuidoraorganica.com.ar",
      "https://www.distribuidoraorganica.com.ar",
    ], // Múltiples orígenes
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Métodos permitidos
    allowedHeaders: ["Content-Type", "x-token", "Authorization"], // Encabezados permitidos,
    credentials: true,
  })
);
app.use(cookieParser());
// Middleware para parsear JSON
app.use(express.json());

// Rutas
app.use("/api/categories", require("./routes/categorias"));
app.use("/api/users", require("./routes/users"));
app.use("/api/sections", require("./routes/secciones"));
app.use("/api/products", require("./routes/productos"));
app.use("/api/cantidadInicial", require("./routes/cantidadInicial"));
app.use("/api/portadas", require("./routes/portadas"));
app.use("/api/rubros", require("./routes/rubros"));
app.use("/api/muestra", require("./routes/muestra"));
app.use("/api/newProducts", require("./routes/newProducts"));
app.use("/api/seed", require("./routes/seed"));

app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://localhost:${process.env.PORT}`);
});
