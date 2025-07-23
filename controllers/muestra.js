// controllers/productos.js
const { validationResult } = require("express-validator");

const mysql = require("mysql2/promise");
const pool = mysql.createPool({
  host: "149.50.142.58",
  user: "apiuser",
  password: "ApiPassword123!",
  database: "baseDeDatos",
});

// Obtener todos los productos de muestra
const getProductos = async (req, res) => {
  try {
    // Determinar si mostrar todos los productos o solo activos
    const mostrarTodos = req.query.todos === "true" ? true : false;

    let query = `
            SELECT * FROM muestra`;

    // Si no es admin o no solicitó todos, mostrar solo productos activos
    if (!mostrarTodos) {
      query += " WHERE visible = 1 ";
    }

    // Añadir ordenación
    query += " ORDER BY id DESC";

    const [productos] = await pool.execute(query);

    res.json({
      ok: true,
      data: productos,
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  }
};

// Obtener un producto por ID
const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;

    const [productos] = await pool.execute(
      `
            SELECT * from muestras where id = ?
        `,
      [id]
    );

    if (productos.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Producto no encontrado o no disponible",
      });
    }

    res.json({
      ok: true,
      producto: productos[0],
    });
  } catch (error) {
    console.error("Error al obtener producto por ID:", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  }
};
// Obtener productos destacados
const getProductosDestacados = async (req, res) => {
  try {
    const [productos] = await pool.execute(`
            SELECT * from muestras where destacado=true and visible=1
        `);

    res.json({
      ok: true,
      total: productos.length,
      productos,
    });
  } catch (error) {
    console.error("Error al obtener productos destacados:", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  }
};

// Obtener productos nuevos
const getProductosNuevos = async (req, res) => {
  try {
    const [productos] = await pool.execute(`
                      SELECT * from muestras where nuevo=true and visible=1

        `);

    // Procesar las imágenes para incluir URLs completas
    const productosConImagenes = productos.map((producto) => {
      return {
        ...producto,
        imagenPrincipal: producto.imagenPrincipal,
      };
    });

    res.json({
      ok: true,
      total: productosConImagenes.length,
      productos: productosConImagenes,
    });
  } catch (error) {
    console.error("Error al obtener productos nuevos:", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  }
};

// Crear un nuevo producto
const createProducto = async (req, res) => {
  // Validar los datos recibidos
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      ok: false,
      errors: errors.array(),
    });
  }

  const {
    nombre,
    descripcion,
    imagen_principal,
    destacado = false,
    nuevo = false,
    visible = true,
  } = req.body;

  let connection;
  console.log({ nombre });
  console.log({ descripcion });
  console.log({ imagen_principal });
  console.log({ destacado });
  console.log({ nuevo });
  console.log({ visible });
  try {
    // Obtener conexión del pool
    connection = await pool.getConnection();

    // Iniciar transacción
    await connection.beginTransaction();

    // 3. Insertar el nuevo producto
    const [result] = await connection.execute(
      `
            INSERT INTO muestra (nombre, descripcion, destacado, nuevo, visible, imagen_principal)
            VALUES (?, ?, ?, ?, ?, ?)
        `,
      [
        nombre,
        descripcion,
        destacado ? 1 : 0,
        nuevo ? 1 : 0,
        visible ? 1 : 0,
        imagen_principal,
      ]
    );

    const productoId = result.insertId;

    // Confirmar la carga
    await connection.commit();

    // Liberar la conexión antes de hacer otras operaciones
    connection.release();
    connection = null;

    // Obtener los datos completos del producto creado (usar el pool general, no la conexión)
    const [producto] = await pool.execute(
      `
            SELECT * from muestra where id = ?
        `,
      [productoId]
    );

    // Procesar las imágenes para incluir URLs completas
    const productoConImagenes = {
      ...producto[0],
      imagenPrincipal: producto[0].imagenPrincipal
        ? `${process.env.BASE_URL}/uploads/productos/${producto[0].imagenPrincipal}`
        : null,
    };

    res.status(201).json({
      ok: true,
      data: productoConImagenes,
    });
  } catch (error) {
    console.error("Error al crear producto:", error);

    // Revertir la transacción en caso de error solo si la conexión sigue abierta
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Error al hacer rollback:", rollbackError);
      }
    }

    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  } finally {
    // Liberar la conexión si aún está abierta
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error("Error al liberar la conexión:", releaseError);
      }
    }
  }
};
// Actualizar un producto
const updateMuestra = async (req, res) => {
  // Validar los datos recibidos
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      ok: false,
      errors: errors.array(),
    });
  }

  const { id } = req.params;
  const { nombre, descripcion, destacado, nuevo, visible, imagen_principal } =
    req.body;

  // Iniciar una transacción
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Verificar si el producto existe y obtener sus datos actuales
    const [productos] = await connection.execute(
      `
            SELECT * FROM muestra 
            WHERE id = ?
            LIMIT 1
        `,
      [id]
    );

    // Verificar si se encontró el producto
    if (productos.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        ok: false,
        msg: `No se encontró el producto con ID: ${id}`,
      });
    }

    const productoActual = productos[0];

    // 2. Preparar los campos a actualizar
    const camposActualizados = {
      nombre: nombre !== undefined ? nombre : productoActual.nombre,
      descripcion:
        descripcion !== undefined ? descripcion : productoActual.descripcion,
      destacado:
        destacado !== undefined
          ? destacado
            ? 1
            : 0
          : productoActual.destacado,
      nuevo: nuevo !== undefined ? (nuevo ? 1 : 0) : productoActual.nuevo,
      visible:
        visible !== undefined ? (visible ? 1 : 0) : productoActual.visible,
      imagen_principal: productoActual.imagen_principal,
    };

    // 3. Gestionar las imágenes si se proporcionaron nuevas
    if (imagen_principal !== undefined) {
      camposActualizados.imagen_principal = imagen_principal;
    }
    // 4. Actualizar el producto
    await connection.execute(
      `
            UPDATE muestra
            SET nombre = ?, 
                descripcion = ?, 
                destacado = ?, 
                nuevo = ?, 
                visible = ?, 
                imagen_principal = ?
            WHERE id = ?
        `,
      [
        camposActualizados.nombre,
        camposActualizados.descripcion,
        camposActualizados.destacado,
        camposActualizados.nuevo,
        camposActualizados.visible,
        camposActualizados.imagen_principal,
        id,
      ]
    );

    // Confirmar la transacción
    await connection.commit();

    // Obtener los datos completos del producto actualizado
    const [productoActualizado] = await pool.execute(
      `
            SELECT * from muestra
            WHERE id = ?
        `,
      [id]
    );

    // CORRECCIÓN: No modificar las URLs de Cloudinary
    // Si las imágenes ya están almacenadas como URLs completas,
    // simplemente pasarlas sin concatenar ninguna ruta base
    const productoConImagenes = {
      ...productoActualizado[0],
      // No concatenamos rutas si ya son URLs completas
      imagen_principal: productoActualizado[0].imagen_principal || null,
    };

    res.json({
      ok: true,
      producto: productoConImagenes,
    });
  } catch (error) {
    // Revertir la transacción en caso de error
    await connection.rollback();
    console.error("Error al actualizar producto:", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  } finally {
    // Siempre liberar la conexión
    connection.release();
  }
};
// Eliminar un producto
const deleteProducto = async (req, res) => {
  const { id } = req.params;

  // Iniciar una transacción
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Verificar si el producto existe
    const [productos] = await connection.execute(
      `
            SELECT id, imagenPrincipal, imagen2, imagen3 FROM productos 
            WHERE id = ?
            LIMIT 1
        `,
      [id]
    );

    // Verificar si se encontró el producto
    if (productos.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        ok: false,
        msg: `No se encontró el producto con ID: ${id}`,
      });
    }

    const producto = productos[0];

    // 2. Eliminar las imágenes asociadas
    if (producto.imagenPrincipal) {
      await eliminarImagen(producto.imagenPrincipal);
    }
    if (producto.imagen2) {
      await eliminarImagen(producto.imagen2);
    }
    if (producto.imagen3) {
      await eliminarImagen(producto.imagen3);
    }

    // 3. Eliminar el producto
    await connection.execute(
      `
            DELETE FROM productos WHERE id = ?
        `,
      [id]
    );

    // Confirmar la transacción
    await connection.commit();

    res.json({
      ok: true,
      msg: "Producto eliminado correctamente",
    });
  } catch (error) {
    // Revertir la transacción en caso de error
    await connection.rollback();
    console.error("Error al eliminar producto:", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  } finally {
    // Siempre liberar la conexión
    connection.release();
  }
};

// Toggle de visibilidad del producto
const toggleVisibilidadProducto = async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  try {
    // 1. Verificar si el producto existe
    const [productos] = await pool.execute(
      `
            SELECT id, activo FROM productos WHERE id = ? LIMIT 1
        `,
      [id]
    );

    if (productos.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: `No se encontró el producto con ID: ${id}`,
      });
    }

    // 2. Actualizar la visibilidad
    await pool.execute(
      `
            UPDATE productos SET activo = ? WHERE id = ?
        `,
      [activo ? 1 : 0, id]
    );

    // 3. Obtener el producto actualizado
    const [productoActualizado] = await pool.execute(
      `
            SELECT 
                p.id, 
                p.nombre, 
                p.descripcion, 
                p.es_destacado as destacado, 
                p.es_nuevo as nuevo, 
                p.activo,
                p.imagen_principal as imagenPrincipal,
                p.imagen_extra1 as imagen2,
                p.imagen_extra2 as imagen3,
                s.id as idSeccion, 
                s.nombre as seccionNombre,
                c.id as idCategoria,
                c.nombre as categoriaNombre
            FROM productos p
            JOIN secciones s ON p.id_seccion = s.id
            JOIN categorias_secciones cs ON s.id = cs.idSeccion
            JOIN categorias c ON cs.idCategoria = c.id
            WHERE p.id = ?
        `,
      [id]
    );

    // Procesar las imágenes para incluir URLs completas
    const productoConImagenes = {
      ...productoActualizado[0],
      imagenPrincipal: imagenPrincipal,
      imagen2: imagen2,
      imagen3: imagen3,
    };

    res.json({
      ok: true,
      msg: `Producto ${activo ? "activo" : "oculto"} correctamente`,
      producto: productoConImagenes,
    });
  } catch (error) {
    console.error("Error al cambiar visibilidad del producto:", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  }
};

// Toggle de destacado del producto
const toggleDestacadoProducto = async (req, res) => {
  const { id } = req.params;
  const { destacado } = req.body;

  try {
    // 1. Verificar si el producto existe
    const [productos] = await pool.execute(
      `
            SELECT id, destacado FROM productos WHERE id = ? LIMIT 1
        `,
      [id]
    );

    if (productos.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: `No se encontró el producto con ID: ${id}`,
      });
    }

    // 2. Actualizar el estado destacado
    await pool.execute(
      `
            UPDATE productos SET destacado = ? WHERE id = ?
        `,
      [destacado ? 1 : 0, id]
    );

    // 3. Obtener el producto actualizado
    const [productoActualizado] = await pool.execute(
      `
            SELECT 
               * from muestra where id = ?
        `,
      [id]
    );

    // Procesar las imágenes para incluir URLs completas
    const productoConImagenes = {
      ...productoActualizado[0],
      imagen_principal: imagen_principal,
    };

    res.json({
      ok: true,
      msg: `Producto ${destacado ? "destacado" : "no destacado"} correctamente`,
      producto: productoConImagenes,
    });
  } catch (error) {
    console.error("Error al cambiar estado destacado del producto:", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  }
};

// Toggle de nuevo del producto
const toggleNuevoProducto = async (req, res) => {
  const { id } = req.params;
  const { nuevo } = req.body;

  try {
    // 1. Verificar si el producto existe
    const [productos] = await pool.execute(
      `
            SELECT id, nuevo FROM productos WHERE id = ? LIMIT 1
        `,
      [id]
    );

    if (productos.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: `No se encontró el producto con ID: ${id}`,
      });
    }

    // 2. Actualizar el estado nuevo
    await pool.execute(
      `
            UPDATE productos SET nuevo = ? WHERE id = ?
        `,
      [nuevo ? 1 : 0, id]
    );

    // 3. Obtener el producto actualizado
    const [productoActualizado] = await pool.execute(
      `
            SELECT * from muestras
            WHERE p.id = ?
        `,
      [id]
    );

    // Procesar las imágenes para incluir URLs completas
    const productoConImagenes = {
      ...productoActualizado[0],
      imagen_principal: imagen_principal,
    };

    res.json({
      ok: true,
      msg: `Producto marcado como ${
        nuevo ? "nuevo" : "no nuevo"
      } correctamente`,
      producto: productoConImagenes,
    });
  } catch (error) {
    console.error("Error al cambiar estado nuevo del producto:", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  }
};

// Exportación de todas las funciones
module.exports = {
  getProductos,
  getProductoById,
  createProducto,
  updateMuestra,
  deleteProducto,
  toggleVisibilidadProducto,
  toggleDestacadoProducto,
  toggleNuevoProducto,
  getProductosDestacados,
  getProductosNuevos,
};
