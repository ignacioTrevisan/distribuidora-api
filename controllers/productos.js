// controllers/productos.js
const { validationResult } = require('express-validator');

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: '149.50.142.58',
  user: 'apiuser',
  password: 'ApiPassword123!',
  database: 'baseDeDatos'
});

// Obtener todos los productos
const getProductos = async (req, res) => {
    try {
        // Determinar si mostrar todos los productos o solo visibles
        const mostrarTodos = req.query.todos === 'true' ? true : false
        
        let query = `
            SELECT 
                p.id, 
                p.nombre, 
                p.slug,
                p.descripcion, 
                p.es_destacado as destacado, 
                p.es_nuevo as nuevo, 
                p.activo as visible,
                p.imagen_principal,
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
        `;
        
        // Si no es admin o no solicitó todos, mostrar solo productos visibles
        if (!mostrarTodos) {
            query += ' WHERE p.activo = 1 AND s.activo = 1 AND c.activo = 1';
        }
        
        // Añadir ordenación
        query += ' ORDER BY id DESC';
        
        const [productos] = await pool.execute(query);
        
      
    

        res.json({
            ok: true,
            total: productos.length,
           data:productos
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};



// Obtener un producto por ID
const getProductoById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [productos] = await pool.execute(`
            SELECT 
                p.id, 
                p.nombre, 
                p.descripcion, 
                p.destacado, 
                p.nuevo, 
                p.visible,
                p.imagenPrincipal,
                p.imagen2,
                p.imagen3,
                p.createdAt,
                p.updatedAt,
                s.id as idSeccion, 
                s.nombre as seccionNombre,
                c.id as idCategoria,
                c.nombre as categoriaNombre
            FROM productos p
            JOIN secciones s ON p.idSeccion = s.id
            JOIN categorias_secciones cs ON s.id = cs.idSeccion
            JOIN categorias c ON cs.idCategoria = c.id
            WHERE p.id = ?
        `, [id]);
        
        if (productos.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'Producto no encontrado'
            });
        }
        
        // Procesar las imágenes para incluir URLs completas
        const producto = {
            ...productos[0],
            imagenPrincipal: productos[0].imagenPrincipal ? `${process.env.BASE_URL}/uploads/productos/${productos[0].imagenPrincipal}` : null,
            imagen2: productos[0].imagen2 ? `${process.env.BASE_URL}/uploads/productos/${productos[0].imagen2}` : null,
            imagen3: productos[0].imagen3 ? `${process.env.BASE_URL}/uploads/productos/${productos[0].imagen3}` : null
        };

        res.json({
            ok: true,
            producto
        });
    } catch (error) {
        console.error('Error al obtener producto por ID:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

// Obtener productos destacados
const getProductosDestacados = async (req, res) => {
    try {
        const [productos] = await pool.execute(`
            SELECT 
                p.id, 
                p.nombre, 
                p.descripcion, 
                p.destacado, 
                p.nuevo, 
                p.visible,
                p.imagenPrincipal,
                p.imagen2,
                p.imagen3,
                s.id as idSeccion, 
                s.nombre as seccionNombre,
                c.id as idCategoria,
                c.nombre as categoriaNombre
            FROM productos p
            JOIN secciones s ON p.idSeccion = s.id
            JOIN categorias_secciones cs ON s.id = cs.idSeccion
            JOIN categorias c ON cs.idCategoria = c.id
            WHERE p.destacado = 1 AND p.visible = 1 AND s.activo = 1 AND c.activo = 1
            ORDER BY p.updatedAt DESC
        `);
        
        // Procesar las imágenes para incluir URLs completas
        const productosConImagenes = productos.map(producto => {
            return {
                ...producto,
                imagenPrincipal: producto.imagenPrincipal ? `${process.env.BASE_URL}/uploads/productos/${producto.imagenPrincipal}` : null,
                imagen2: producto.imagen2 ? `${process.env.BASE_URL}/uploads/productos/${producto.imagen2}` : null,
                imagen3: producto.imagen3 ? `${process.env.BASE_URL}/uploads/productos/${producto.imagen3}` : null
            };
        });

        res.json({
            ok: true,
            total: productosConImagenes.length,
            productos: productosConImagenes
        });
    } catch (error) {
        console.error('Error al obtener productos destacados:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

// Obtener productos nuevos
const getProductosNuevos = async (req, res) => {
    try {
        const [productos] = await pool.execute(`
            SELECT 
                p.id, 
                p.nombre, 
                p.descripcion, 
                p.destacado, 
                p.nuevo, 
                p.visible,
                p.imagenPrincipal,
                p.imagen2,
                p.imagen3,
                s.id as idSeccion, 
                s.nombre as seccionNombre,
                c.id as idCategoria,
                c.nombre as categoriaNombre
            FROM productos p
            JOIN secciones s ON p.idSeccion = s.id
            JOIN categorias_secciones cs ON s.id = cs.idSeccion
            JOIN categorias c ON cs.idCategoria = c.id
            WHERE p.nuevo = 1 AND p.visible = 1 AND s.activo = 1 AND c.activo = 1
            ORDER BY p.createdAt DESC
        `);
        
        // Procesar las imágenes para incluir URLs completas
        const productosConImagenes = productos.map(producto => {
            return {
                ...producto,
                imagenPrincipal: producto.imagenPrincipal ? `${process.env.BASE_URL}/uploads/productos/${producto.imagenPrincipal}` : null,
                imagen2: producto.imagen2 ? `${process.env.BASE_URL}/uploads/productos/${producto.imagen2}` : null,
                imagen3: producto.imagen3 ? `${process.env.BASE_URL}/uploads/productos/${producto.imagen3}` : null
            };
        });

        res.json({
            ok: true,
            total: productosConImagenes.length,
            productos: productosConImagenes
        });
    } catch (error) {
        console.error('Error al obtener productos nuevos:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

// Obtener productos por sección
const getProductosBySeccion = async (req, res) => {
    try {
        const { idSeccion } = req.params;
        
        // Verificar si la sección existe
        const [secciones] = await pool.execute(`
            SELECT id, nombre, activo FROM secciones WHERE id = ?
        `, [idSeccion]);
        
        if (secciones.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'Sección no encontrada'
            });
        }
        
        // Solo mostrar los productos si la sección está activa o si el usuario es admin
        const seccionActiva = secciones[0].activo === 1;
        const esAdmin = req.usuario?.admin;
        
        if (!seccionActiva && !esAdmin) {
            return res.status(404).json({
                ok: false,
                msg: 'Sección no disponible'
            });
        }
        
        let query = `
            SELECT 
                p.id, 
                p.nombre, 
                p.descripcion, 
                p.destacado, 
                p.nuevo, 
                p.visible,
                p.imagenPrincipal,
                p.imagen2,
                p.imagen3,
                s.id as idSeccion, 
                s.nombre as seccionNombre,
                c.id as idCategoria,
                c.nombre as categoriaNombre
            FROM productos p
            JOIN secciones s ON p.idSeccion = s.id
            JOIN categorias_secciones cs ON s.id = cs.idSeccion
            JOIN categorias c ON cs.idCategoria = c.id
            WHERE p.idSeccion = ?
        `;
        
        // Si no es admin, mostrar solo productos visibles
        if (!esAdmin) {
            query += ' AND p.visible = 1';
        }
        
        query += ' ORDER BY p.createdAt DESC';
        
        const [productos] = await pool.execute(query, [idSeccion]);
        
        // Procesar las imágenes para incluir URLs completas
        const productosConImagenes = productos.map(producto => {
            return {
                ...producto,
                imagenPrincipal: producto.imagenPrincipal ? `${process.env.BASE_URL}/uploads/productos/${producto.imagenPrincipal}` : null,
                imagen2: producto.imagen2 ? `${process.env.BASE_URL}/uploads/productos/${producto.imagen2}` : null,
                imagen3: producto.imagen3 ? `${process.env.BASE_URL}/uploads/productos/${producto.imagen3}` : null
            };
        });

        res.json({
            ok: true,
            seccion: {
                id: secciones[0].id,
                nombre: secciones[0].nombre,
                activo: secciones[0].activo === 1
            },
            total: productosConImagenes.length,
            productos: productosConImagenes
        });
    } catch (error) {
        console.error('Error al obtener productos por sección:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

// Función auxiliar para guardar imágenes
const guardarImagen = async (imagen, nombreArchivo) => {
    if (!imagen) return null;
    
    // Extraer la información de la imagen base64
    const matches = imagen.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
        throw new Error('Formato de imagen inválido');
    }
    
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Crear el directorio de uploads si no existe
    const uploadDir = path.join(__dirname, '../uploads/productos');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Guardar la imagen
    const filePath = path.join(uploadDir, nombreArchivo);
    await fs.promises.writeFile(filePath, buffer);
    
    return nombreArchivo;
};

// Función auxiliar para eliminar imágenes
const eliminarImagen = async (nombreArchivo) => {
    if (!nombreArchivo) return;
    
    const filePath = path.join(__dirname, '../uploads/productos', nombreArchivo);
    
    try {
        // Verificar si el archivo existe
        await fs.promises.access(filePath);
        // Eliminar el archivo
        await fs.promises.unlink(filePath);
    } catch (error) {
        // Si el archivo no existe, ignorar el error
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
};

// Crear un nuevo producto
const createProducto = async (req, res) => {
    // Validar los datos recibidos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            errors: errors.array()
        });
    }

    const { nombre, descripcion, slug, imagen_principal, imagen_extra1, imagen_extra2, idSeccion, destacado = false, nuevo = false, visible = true } = req.body;
  
    // Generar slug único si no se proporciona
    const slugFinal = slug || nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    
    let connection;
    
    try {
        // Obtener conexión del pool
        connection = await pool.getConnection();
        
        // Iniciar transacción
        await connection.beginTransaction();

        // 1. Verificar si la sección existe
        const [secciones] = await connection.execute(`
            SELECT id, nombre FROM secciones 
            WHERE id = ?
            LIMIT 1
        `, [idSeccion]);

        // Verificar si se encontró la sección
        if (secciones.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({
                ok: false,
                msg: `No se encontró la sección con ID: ${idSeccion}`
            });
        }

        // 2. Verificar si ya existe un producto con el mismo slug
        const [productosExistentes] = await connection.execute(`
            SELECT id FROM productos WHERE slug = ? LIMIT 1
        `, [slugFinal]);

        if (productosExistentes.length > 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
                ok: false,
                msg: `Ya existe un producto con el slug: ${slugFinal}`
            });
        }

        // 3. Insertar el nuevo producto
        const [result] = await connection.execute(`
            INSERT INTO productos (nombre, slug, descripcion, id_seccion, es_destacado, es_nuevo, activo, imagen_principal, imagen_extra1, imagen_extra2)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [nombre, slugFinal, descripcion, idSeccion, destacado ? 1 : 0, nuevo ? 1 : 0, visible ? 1 : 0, imagen_principal, imagen_extra1, imagen_extra2]);

        const productoId = result.insertId;

        // Confirmar la transacción
        await connection.commit();
        
        // Liberar la conexión antes de hacer otras operaciones
        connection.release();
        connection = null;

        // Obtener los datos completos del producto creado (usar el pool general, no la conexión)
        const [producto] = await pool.execute(`
            SELECT 
                p.id, 
                p.nombre, 
                p.slug,
                p.descripcion, 
                p.es_destacado as destacado, 
                p.es_nuevo as nuevo, 
                p.activo as visible,
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
        `, [productoId]);

        // Procesar las imágenes para incluir URLs completas
        const productoConImagenes = {
            ...producto[0],
            imagenPrincipal: producto[0].imagenPrincipal ? `${process.env.BASE_URL}/uploads/productos/${producto[0].imagenPrincipal}` : null,
            imagen2: producto[0].imagen2 ? `${process.env.BASE_URL}/uploads/productos/${producto[0].imagen2}` : null,
            imagen3: producto[0].imagen3 ? `${process.env.BASE_URL}/uploads/productos/${producto[0].imagen3}` : null
        };

        res.status(201).json({
            ok: true,
            producto: productoConImagenes
        });
    } catch (error) {
        console.error('Error al crear producto:', error);
        
        // Revertir la transacción en caso de error solo si la conexión sigue abierta
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Error al hacer rollback:', rollbackError);
            }
        }
        
        res.status(500).json({ 
            ok: false,
            msg: 'Error interno del servidor' 
        });
    } finally {
        // Liberar la conexión si aún está abierta
        if (connection) {
            try {
                connection.release();
            } catch (releaseError) {
                console.error('Error al liberar la conexión:', releaseError);
            }
        }
    }
};
// Actualizar un producto
const updateProducto = async (req, res) => {
    // Validar los datos recibidos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            errors: errors.array()
        });
    }

    const { id } = req.params;
    const { nombre, descripcion, idSeccion, destacado, nuevo, visible } = req.body;
    
    // Extraer las imágenes del cuerpo de la petición
    const { imagenPrincipal, imagen2, imagen3 } = req.body;
    
    // Iniciar una transacción
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. Verificar si el producto existe
        const [productos] = await connection.execute(`
            SELECT id, imagenPrincipal, imagen2, imagen3 FROM productos 
            WHERE id = ?
            LIMIT 1
        `, [id]);

        // Verificar si se encontró el producto
        if (productos.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                ok: false,
                msg: `No se encontró el producto con ID: ${id}`
            });
        }

        const productoActual = productos[0];

        // 2. Verificar si la sección existe
        const [secciones] = await connection.execute(`
            SELECT id, nombre FROM secciones 
            WHERE id = ?
            LIMIT 1
        `, [idSeccion]);

        // Verificar si se encontró la sección
        if (secciones.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                ok: false,
                msg: `No se encontró la sección con ID: ${idSeccion}`
            });
        }

        // 3. Gestionar las imágenes
        let nombreImagenPrincipal = productoActual.imagenPrincipal;
        let nombreImagen2 = productoActual.imagen2;
        let nombreImagen3 = productoActual.imagen3;

        // Si se proporciona una nueva imagen, eliminar la antigua y guardar la nueva
        if (imagenPrincipal && imagenPrincipal.startsWith('data:')) {
            // Eliminar imagen antigua si existe
            if (productoActual.imagenPrincipal) {
                await eliminarImagen(productoActual.imagenPrincipal);
            }
            // Guardar nueva imagen
            const timestamp = Date.now();
            nombreImagenPrincipal = `producto_principal_${timestamp}.jpg`;
            await guardarImagen(imagenPrincipal, nombreImagenPrincipal);
        } else if (imagenPrincipal === null) {
            // Si se envió null explícitamente, eliminar la imagen
            if (productoActual.imagenPrincipal) {
                await eliminarImagen(productoActual.imagenPrincipal);
            }
            nombreImagenPrincipal = null;
        }

        // Repetir para imagen2
        if (imagen2 && imagen2.startsWith('data:')) {
            if (productoActual.imagen2) {
                await eliminarImagen(productoActual.imagen2);
            }
            const timestamp = Date.now() + 1;
            nombreImagen2 = `producto_imagen2_${timestamp}.jpg`;
            await guardarImagen(imagen2, nombreImagen2);
        } else if (imagen2 === null) {
            if (productoActual.imagen2) {
                await eliminarImagen(productoActual.imagen2);
            }
            nombreImagen2 = null;
        }

        // Repetir para imagen3
        if (imagen3 && imagen3.startsWith('data:')) {
            if (productoActual.imagen3) {
                await eliminarImagen(productoActual.imagen3);
            }
            const timestamp = Date.now() + 2;
            nombreImagen3 = `producto_imagen3_${timestamp}.jpg`;
            await guardarImagen(imagen3, nombreImagen3);
        } else if (imagen3 === null) {
            if (productoActual.imagen3) {
                await eliminarImagen(productoActual.imagen3);
            }
            nombreImagen3 = null;
        }

        // 4. Actualizar el producto
        await connection.execute(`
            UPDATE productos
            SET nombre = ?, descripcion = ?, idSeccion = ?, destacado = ?, nuevo = ?, visible = ?, 
                imagenPrincipal = ?, imagen2 = ?, imagen3 = ?, updatedAt = NOW()
            WHERE id = ?
        `, [
            nombre, 
            descripcion, 
            idSeccion, 
            destacado ? 1 : 0, 
            nuevo ? 1 : 0, 
            visible ? 1 : 0, 
            nombreImagenPrincipal, 
            nombreImagen2, 
            nombreImagen3, 
            id
        ]);

        // Confirmar la transacción
        await connection.commit();

        // Obtener los datos completos del producto actualizado
        const [productoActualizado] = await pool.execute(`
            SELECT 
                p.id, 
                p.nombre, 
                p.descripcion, 
                p.destacado, 
                p.nuevo, 
                p.visible,
                p.imagenPrincipal,
                p.imagen2,
                p.imagen3,
                p.createdAt,
                p.updatedAt,
                s.id as idSeccion, 
                s.nombre as seccionNombre,
                c.id as idCategoria,
                c.nombre as categoriaNombre
            FROM productos p
            JOIN secciones s ON p.idSeccion = s.id
            JOIN categorias_secciones cs ON s.id = cs.idSeccion
            JOIN categorias c ON cs.idCategoria = c.id
            WHERE p.id = ?
        `, [id]);

        // Procesar las imágenes para incluir URLs completas
        const productoConImagenes = {
            ...productoActualizado[0],
            imagenPrincipal: productoActualizado[0].imagenPrincipal ? `${process.env.BASE_URL}/uploads/productos/${productoActualizado[0].imagenPrincipal}` : null,
            imagen2: productoActualizado[0].imagen2 ? `${process.env.BASE_URL}/uploads/productos/${productoActualizado[0].imagen2}` : null,
            imagen3: productoActualizado[0].imagen3 ? `${process.env.BASE_URL}/uploads/productos/${productoActualizado[0].imagen3}` : null
        };

        res.json({
            ok: true,
            producto: productoConImagenes
        });
    } catch (error) {
        // Revertir la transacción en caso de error
        await connection.rollback();
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ 
            ok: false,
            msg: 'Error interno del servidor' 
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
        const [productos] = await connection.execute(`
            SELECT id, imagenPrincipal, imagen2, imagen3 FROM productos 
            WHERE id = ?
            LIMIT 1
        `, [id]);

        // Verificar si se encontró el producto
        if (productos.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                ok: false,
                msg: `No se encontró el producto con ID: ${id}`
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
        await connection.execute(`
            DELETE FROM productos WHERE id = ?
        `, [id]);

        // Confirmar la transacción
        await connection.commit();

        res.json({
            ok: true,
            msg: 'Producto eliminado correctamente'
        });
    } catch (error) {
        // Revertir la transacción en caso de error
        await connection.rollback();
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ 
            ok: false,
            msg: 'Error interno del servidor' 
        });
    } finally {
        // Siempre liberar la conexión
        connection.release();
    }
};

// Toggle de visibilidad del producto
const toggleVisibilidadProducto = async (req, res) => {
    const { id } = req.params;
    const { visible } = req.body;
    
    try {
        // 1. Verificar si el producto existe
        const [productos] = await pool.execute(`
            SELECT id, visible FROM productos WHERE id = ? LIMIT 1
        `, [id]);
        
        if (productos.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: `No se encontró el producto con ID: ${id}`
            });
        }
        
        // 2. Actualizar la visibilidad
        await pool.execute(`
            UPDATE productos SET visible = ?, updatedAt = NOW() WHERE id = ?
        `, [visible ? 1 : 0, id]);
        
        // 3. Obtener el producto actualizado
        const [productoActualizado] = await pool.execute(`
            SELECT 
                p.id, 
                p.nombre, 
                p.descripcion, 
                p.destacado, 
                p.nuevo, 
                p.visible,
                p.imagenPrincipal,
                p.imagen2,
                p.imagen3,
                p.createdAt,
                p.updatedAt,
                s.id as idSeccion, 
                s.nombre as seccionNombre,
                c.id as idCategoria,
                c.nombre as categoriaNombre
            FROM productos p
            JOIN secciones s ON p.idSeccion = s.id
            JOIN categorias_secciones cs ON s.id = cs.idSeccion
            JOIN categorias c ON cs.idCategoria = c.id
            WHERE p.id = ?
        `, [id]);
        
        // Procesar las imágenes para incluir URLs completas
        const productoConImagenes = {
            ...productoActualizado[0],
            imagenPrincipal: productoActualizado[0].imagenPrincipal ? `${process.env.BASE_URL}/uploads/productos/${productoActualizado[0].imagenPrincipal}` : null,
            imagen2: productoActualizado[0].imagen2 ? `${process.env.BASE_URL}/uploads/productos/${productoActualizado[0].imagen2}` : null,
            imagen3: productoActualizado[0].imagen3 ? `${process.env.BASE_URL}/uploads/productos/${productoActualizado[0].imagen3}` : null
        };
        
        res.json({
            ok: true,
            msg: `Producto ${visible ? 'visible' : 'oculto'} correctamente`,
            producto: productoConImagenes
        });
    } catch (error) {
        console.error('Error al cambiar visibilidad del producto:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

// Toggle de destacado del producto
const toggleDestacadoProducto = async (req, res) => {
    const { id } = req.params;
    const { destacado } = req.body;
    
    try {
        // 1. Verificar si el producto existe
        const [productos] = await pool.execute(`
            SELECT id, destacado FROM productos WHERE id = ? LIMIT 1
        `, [id]);
        
        if (productos.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: `No se encontró el producto con ID: ${id}`
            });
        }
        
        // 2. Actualizar el estado destacado
        await pool.execute(`
            UPDATE productos SET destacado = ?, updatedAt = NOW() WHERE id = ?
        `, [destacado ? 1 : 0, id]);
        
        // 3. Obtener el producto actualizado
        const [productoActualizado] = await pool.execute(`
            SELECT 
                p.id, 
                p.nombre, 
                p.descripcion, 
                p.destacado, 
                p.nuevo, 
                p.visible,
                p.imagenPrincipal,
                p.imagen2,
                p.imagen3,
                p.createdAt,
                p.updatedAt,
                s.id as idSeccion, 
                s.nombre as seccionNombre,
                c.id as idCategoria,
                c.nombre as categoriaNombre
            FROM productos p
            JOIN secciones s ON p.idSeccion = s.id
            JOIN categorias_secciones cs ON s.id = cs.idSeccion
            JOIN categorias c ON cs.idCategoria = c.id
            WHERE p.id = ?
        `, [id]);
        
        // Procesar las imágenes para incluir URLs completas
        const productoConImagenes = {
            ...productoActualizado[0],
            imagenPrincipal: productoActualizado[0].imagenPrincipal ? `${process.env.BASE_URL}/uploads/productos/${productoActualizado[0].imagenPrincipal}` : null,
            imagen2: productoActualizado[0].imagen2 ? `${process.env.BASE_URL}/uploads/productos/${productoActualizado[0].imagen2}` : null,
            imagen3: productoActualizado[0].imagen3 ? `${process.env.BASE_URL}/uploads/productos/${productoActualizado[0].imagen3}` : null
        };
        
        res.json({
            ok: true,
            msg: `Producto ${destacado ? 'destacado' : 'no destacado'} correctamente`,
            producto: productoConImagenes
        });
    } catch (error) {
        console.error('Error al cambiar estado destacado del producto:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

// Toggle de nuevo del producto
const toggleNuevoProducto = async (req, res) => {
    const { id } = req.params;
    const { nuevo } = req.body;
    
    try {
        // 1. Verificar si el producto existe
        const [productos] = await pool.execute(`
            SELECT id, nuevo FROM productos WHERE id = ? LIMIT 1
        `, [id]);
        
        if (productos.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: `No se encontró el producto con ID: ${id}`
            });
        }
        
        // 2. Actualizar el estado nuevo
        await pool.execute(`
            UPDATE productos SET nuevo = ?, updatedAt = NOW() WHERE id = ?
        `, [nuevo ? 1 : 0, id]);
        
        // 3. Obtener el producto actualizado
        const [productoActualizado] = await pool.execute(`
            SELECT 
                p.id, 
                p.nombre, 
                p.descripcion, 
                p.destacado, 
                p.nuevo, 
                p.visible,
                p.imagenPrincipal,
                p.imagen2,
                p.imagen3,
                p.createdAt,
                p.updatedAt,
                s.id as idSeccion, 
                s.nombre as seccionNombre,
                c.id as idCategoria,
                c.nombre as categoriaNombre
            FROM productos p
            JOIN secciones s ON p.idSeccion = s.id
            JOIN categorias_secciones cs ON s.id = cs.idSeccion
            JOIN categorias c ON cs.idCategoria = c.id
            WHERE p.id = ?
        `, [id]);
        
        // Procesar las imágenes para incluir URLs completas
        const productoConImagenes = {
            ...productoActualizado[0],
            imagenPrincipal: productoActualizado[0].imagenPrincipal ? `${process.env.BASE_URL}/uploads/productos/${productoActualizado[0].imagenPrincipal}` : null,
            imagen2: productoActualizado[0].imagen2 ? `${process.env.BASE_URL}/uploads/productos/${productoActualizado[0].imagen2}` : null,
            imagen3: productoActualizado[0].imagen3 ? `${process.env.BASE_URL}/uploads/productos/${productoActualizado[0].imagen3}` : null
        };
        
        res.json({
            ok: true,
            msg: `Producto marcado como ${nuevo ? 'nuevo' : 'no nuevo'} correctamente`,
            producto: productoConImagenes
        });
    } catch (error) {
        console.error('Error al cambiar estado nuevo del producto:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

// Exportación de todas las funciones
module.exports = {
    getProductos,
    getProductoById,
    createProducto,
    updateProducto,
    deleteProducto,
    toggleVisibilidadProducto,
    toggleDestacadoProducto,
    toggleNuevoProducto,
    getProductosDestacados,
    getProductosNuevos,
    getProductosBySeccion
};