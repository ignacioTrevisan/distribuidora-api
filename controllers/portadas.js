// controllers/portadas.js
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

// Función auxiliar para eliminar imagen
const eliminarImagen = async (rutaImagen) => {
    try {
        const rutaCompleta = path.join(__dirname, '../uploads/', rutaImagen);
        if (fs.existsSync(rutaCompleta)) {
            fs.unlinkSync(rutaCompleta);
        }
    } catch (error) {
        console.error('Error al eliminar la imagen:', error);
    }
};

// Obtener todas las portadas
const getPortadas = async (req, res) => {
    try {
        const [portadas] = await pool.execute(`
            SELECT p.*, pr.nombre as nombreProducto 
            FROM portadas p
            LEFT JOIN productos pr ON p.idProducto = pr.id
            ORDER BY p.id DESC
        `);
        
        res.json({
            ok: true,
            portadas
        });
    } catch (error) {
        console.error('Error al obtener portadas:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

// Obtener una portada por ID
const getPortadaById = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [portadas] = await pool.execute(`
            SELECT p.*, pr.nombre as nombreProducto 
            FROM portadas p
            LEFT JOIN productos pr ON p.idProducto = pr.id
            WHERE p.id = ?
            LIMIT 1
        `, [id]);
        
        if (portadas.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: `No se encontró la portada con ID: ${id}`
            });
        }
        
        res.json({
            ok: true,
            portada: portadas[0]
        });
    } catch (error) {
        console.error('Error al obtener portada por ID:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

// Obtener portadas por producto
const getPortadasByProducto = async (req, res) => {
    const { idProducto } = req.params;
    
    try {
        const [portadas] = await pool.execute(`
            SELECT * FROM portadas
            WHERE idProducto = ?
            ORDER BY id DESC
        `, [idProducto]);
        
        res.json({
            ok: true,
            portadas
        });
    } catch (error) {
        console.error('Error al obtener portadas por producto:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

// Crear una nueva portada
const createPortada = async (req, res) => {
    // Validar campos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            errors: errors.array()
        });
    }
    
    const { url, titulo, descripcion, activo = 1, idProducto = null } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Verificar si el producto existe (si se proporciona idProducto)
        if (idProducto) {
            const [productos] = await connection.execute(`
                SELECT id FROM productos WHERE id = ? LIMIT 1
            `, [idProducto]);
            
            if (productos.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    ok: false,
                    msg: `No se encontró el producto con ID: ${idProducto}`
                });
            }
        }
        
        // Insertar la nueva portada
        const [result] = await connection.execute(`
            INSERT INTO portadas (url, titulo, descripcion, activo, idProducto)
            VALUES (?, ?, ?, ?, ?)
        `, [url, titulo, descripcion, activo, idProducto]);
        
        await connection.commit();
        
        res.json({
            ok: true,
            msg: 'Portada creada correctamente',
            portada: {
                id: result.insertId,
                url,
                titulo,
                descripcion,
                activo,
                idProducto
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al crear portada:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    } finally {
        connection.release();
    }
};

// Actualizar una portada
const updatePortada = async (req, res) => {
    // Validar campos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            errors: errors.array()
        });
    }
    
    const { id } = req.params;
    const { url, titulo, descripcion, activo, idProducto = null } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Verificar si la portada existe
        const [portadas] = await connection.execute(`
            SELECT id, url FROM portadas WHERE id = ? LIMIT 1
        `, [id]);
        
        if (portadas.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                ok: false,
                msg: `No se encontró la portada con ID: ${id}`
            });
        }
        
        // Verificar si el producto existe (si se proporciona idProducto)
        if (idProducto) {
            const [productos] = await connection.execute(`
                SELECT id FROM productos WHERE id = ? LIMIT 1
            `, [idProducto]);
            
            if (productos.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    ok: false,
                    msg: `No se encontró el producto con ID: ${idProducto}`
                });
            }
        }
        
        // Si la URL cambió, eliminar la imagen anterior
        const portadaActual = portadas[0];
        if (url !== portadaActual.url) {
            await eliminarImagen(portadaActual.url);
        }
        
        // Actualizar la portada
        await connection.execute(`
            UPDATE portadas
            SET url = ?, titulo = ?, descripcion = ?, activo = ?, idProducto = ?
            WHERE id = ?
        `, [url, titulo, descripcion, activo, idProducto, id]);
        
        await connection.commit();
        
        res.json({
            ok: true,
            msg: 'Portada actualizada correctamente',
            portada: {
                id: parseInt(id),
                url,
                titulo,
                descripcion,
                activo,
                idProducto
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al actualizar portada:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    } finally {
        connection.release();
    }
};

// Eliminar una portada
const deletePortada = async (req, res) => {
    const { id } = req.params;
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Verificar si la portada existe
        const [portadas] = await connection.execute(`
            SELECT id, url FROM portadas WHERE id = ? LIMIT 1
        `, [id]);
        
        if (portadas.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                ok: false,
                msg: `No se encontró la portada con ID: ${id}`
            });
        }
        
        const portada = portadas[0];
        
        // Eliminar la imagen asociada
        if (portada.url) {
            await eliminarImagen(portada.url);
        }
        
        // Eliminar la portada
        await connection.execute(`
            DELETE FROM portadas WHERE id = ?
        `, [id]);
        
        await connection.commit();
        
        res.json({
            ok: true,
            msg: 'Portada eliminada correctamente'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al eliminar portada:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    } finally {
        connection.release();
    }
};

// Activar/Desactivar una portada
const toggleActivoPortada = async (req, res) => {
    const { id } = req.params;
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Verificar si la portada existe
        const [portadas] = await connection.execute(`
            SELECT id, activo FROM portadas WHERE id = ? LIMIT 1
        `, [id]);
        
        if (portadas.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                ok: false,
                msg: `No se encontró la portada con ID: ${id}`
            });
        }
        
        const portada = portadas[0];
        const nuevoEstado = portada.activo === 1 ? 0 : 1;
        
        // Actualizar estado activo
        await connection.execute(`
            UPDATE portadas SET activo = ? WHERE id = ?
        `, [nuevoEstado, id]);
        
        await connection.commit();
        
        res.json({
            ok: true,
            msg: nuevoEstado === 1 ? 'Portada activada correctamente' : 'Portada desactivada correctamente'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al cambiar estado de la portada:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    } finally {
        connection.release();
    }
};

// Exportación de todas las funciones
module.exports = {
    getPortadas,
    getPortadaById,
    createPortada,
    updatePortada,
    deletePortada,
    getPortadasByProducto,
    toggleActivoPortada
};