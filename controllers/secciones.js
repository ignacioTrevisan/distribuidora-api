// controllers/sectionController.js
const { validationResult } = require('express-validator');
const pool = require('../config/db');

// Obtener todas las secciones
const getSecciones = async (req, res) => {
    try {
        // Consulta con JOIN para obtener secciones con su información de categoría
        const [secciones] = await pool.execute(`
            SELECT s.id, s.nombre, s.icono, s.descripcion, s.activo,
                   cs.idCategoria,
                   c.nombre as categoriaNombre
            FROM secciones s
            LEFT JOIN categorias_secciones cs ON s.id = cs.idSeccion
            LEFT JOIN categorias c ON cs.idCategoria = c.id
            ORDER BY s.nombre
        `);
        
        res.json({
            ok: true,
            secciones
        });
    } catch (error) {
        console.error('Error al obtener secciones:', error);
        res.status(500).json({ 
            ok: false,
            msg: 'Error interno del servidor' 
        });
    }
};
// Obtener una sección específica
const getSeccion = async (req, res) => {
    const seccionId = req.params.id;

    try {
        const [secciones] = await pool.execute(`
            SELECT id, nombre, url
            FROM secciones
            WHERE id = ?
        `, [seccionId]);

        if (secciones.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'Sección no encontrada'
            });
        }

        res.json({
            ok: true,
            seccion: secciones[0]
        });
    } catch (error) {
        console.error('Error al obtener sección:', error);
        res.status(500).json({ 
            ok: false,
            msg: 'Error interno del servidor' 
        });
    }
};
// Crear una nueva sección con relación a una categoría
const createSeccion = async (req, res) => {
    // Validar los datos recibidos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            errors: errors.array()
        });
    }

    const { nombre, descripcion, icono, activo = true, idCategoria } = req.body;

    // Iniciar una transacción
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. Verificar si la categoría existe usando el ID directamente
        const [categorias] = await connection.execute(`
            SELECT id, nombre FROM categorias 
            WHERE id = ?
            LIMIT 1
        `, [idCategoria]);

        // Verificar si se encontró la categoría
        if (categorias.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                ok: false,
                msg: `No se encontró la categoría con ID: ${idCategoria}`
            });
        }

        // 2. Insertar la nueva sección
        const [result] = await connection.execute(`
            INSERT INTO secciones (nombre, descripcion, icono, activo)
            VALUES (?, ?, ?, ?)
        `, [nombre, descripcion, icono, activo ? 1 : 0]);

        const seccionId = result.insertId;

        // 3. Crear la relación en la tabla categorias_secciones usando el ID proporcionado
        await connection.execute(`
            INSERT INTO categorias_secciones (idCategoria, idSeccion)
            VALUES (?, ?)
        `, [idCategoria, seccionId]);

        // Confirmar la transacción
        await connection.commit();

        // Obtener los datos completos de la sección creada
        const [seccion] = await pool.execute(`
            SELECT s.id, s.nombre, s.descripcion, s.icono, s.activo,
                   c.id as idCategoria, c.nombre as categoriaNombre
            FROM secciones s
            JOIN categorias_secciones cs ON s.id = cs.idSeccion
            JOIN categorias c ON cs.idCategoria = c.id
            WHERE s.id = ?
        `, [seccionId]);

        res.status(201).json({
            ok: true,
            seccion: seccion[0]
        });
    } catch (error) {
        // Revertir la transacción en caso de error
        await connection.rollback();
        console.error('Error al crear sección:', error);
        res.status(500).json({ 
            ok: false,
            msg: 'Error interno del servidor' 
        });
    } finally {
        // Siempre liberar la conexión
        connection.release();
    }
};
// Actualizar una sección
const updateSeccion = async (req, res) => {
    // Validar los datos recibidos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            errors: errors.array()
        });
    }

    const seccionId = req.params.id;
    const { nombre, descripcion, icono, activo = true, idCategoria } = req.body;


    try {
        // Verificar si la sección existe
        const [seccion] = await pool.execute(`
            SELECT id FROM secciones WHERE id = ?
        `, [seccionId]);

        if (seccion.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'Sección no encontrada'
            });
        }

        // Actualizar la sección
        // Actualizar la sección con los campos proporcionados
        await pool.execute(`
            UPDATE secciones
            SET nombre = ?, descripcion = ?, icono = ?, activo = ?
            WHERE id = ?
        `, [nombre, descripcion, icono, activo ? 1 : 0, seccionId]);

        // Actualizar la relación con la categoría si se proporciona idCategoria
        if (idCategoria) {
            // Verificar si la categoría existe
            const [categoria] = await pool.execute(`
            SELECT id FROM categorias WHERE id = ?
            `, [idCategoria]);

            if (categoria.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'Categoría no encontrada'
            });
            }

            // Actualizar la relación en categorias_secciones
            await pool.execute(`
            UPDATE categorias_secciones
            SET idCategoria = ?
            WHERE idSeccion = ?
            `, [idCategoria, seccionId]);
        }

        res.json({
            ok: true,
            seccion: {
                id: parseInt(seccionId),
                nombre,
                url
            }
        });
    } catch (error) {
        console.error('Error al actualizar sección:', error);
        res.status(500).json({ 
            ok: false,
            msg: 'Error interno del servidor' 
        });
    }
};

// Eliminar una sección
const deleteSeccion = async (req, res) => {
    const seccionId = req.params.id;

    try {
        // Verificar si la sección existe
        const [seccion] = await pool.execute(`
            SELECT id FROM secciones WHERE id = ?
        `, [seccionId]);

        if (seccion.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'Sección no encontrada'
            });
        }

        // Primero eliminar las relaciones en categorias_secciones
        await pool.execute(`
            DELETE FROM categorias_secciones
            WHERE idSeccion = ?
        `, [seccionId]);

        // Luego eliminar la sección
        await pool.execute(`
            DELETE FROM secciones
            WHERE id = ?
        `, [seccionId]);

        res.json({
            ok: true,
            msg: 'Sección eliminada correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar sección:', error);
        res.status(500).json({ 
            ok: false,
            msg: 'Error interno del servidor' 
        });
    }
};

// Asociar una sección a una categoría
const asociarSeccionCategoria = async (req, res) => {
    // Validar los datos recibidos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            errors: errors.array()
        });
    }

    const { idCategoria, idSeccion, descripcion, icono } = req.body;

    try {
        // Verificar si la categoría existe
        const [categoria] = await pool.execute(`
            SELECT id FROM categorias WHERE id = ?
        `, [idCategoria]);

        if (categoria.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'Categoría no encontrada'
            });
        }

        // Verificar si la sección existe
        const [seccion] = await pool.execute(`
            SELECT id FROM secciones WHERE id = ?
        `, [idSeccion]);

        if (seccion.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'Sección no encontrada'
            });
        }

        // Verificar si ya existe la relación
        const [relacion] = await pool.execute(`
            SELECT id FROM categorias_secciones 
            WHERE idCategoria = ? AND idSeccion = ?
        `, [idCategoria, idSeccion]);

        if (relacion.length > 0) {
            // Actualizar la relación existente
            await pool.execute(`
                UPDATE categorias_secciones
                SET descripcion = ?, icono = ?
                WHERE idCategoria = ? AND idSeccion = ?
            `, [descripcion, icono, idCategoria, idSeccion]);

            return res.json({
                ok: true,
                msg: 'Relación actualizada correctamente',
                relacion: {
                    id: relacion[0].id,
                    idCategoria,
                    idSeccion,
                    descripcion,
                    icono
                }
            });
        }

        // Crear nueva relación
        const [result] = await pool.execute(`
            INSERT INTO categorias_secciones (idCategoria, idSeccion, descripcion, icono)
            VALUES (?, ?, ?, ?)
        `, [idCategoria, idSeccion, descripcion, icono]);

        res.status(201).json({
            ok: true,
            relacion: {
                id: result.insertId,
                idCategoria,
                idSeccion,
                descripcion,
                icono
            }
        });
    } catch (error) {
        console.error('Error al asociar sección a categoría:', error);
        res.status(500).json({ 
            ok: false,
            msg: 'Error interno del servidor' 
        });
    }
};

// Eliminar asociación entre sección y categoría
const eliminarAsociacionSeccionCategoria = async (req, res) => {
    const { idCategoria, idSeccion } = req.params;

    try {
        // Verificar si existe la relación
        const [relacion] = await pool.execute(`
            SELECT id FROM categorias_secciones 
            WHERE idCategoria = ? AND idSeccion = ?
        `, [idCategoria, idSeccion]);

        if (relacion.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'Relación no encontrada'
            });
        }

        // Eliminar la relación
        await pool.execute(`
            DELETE FROM categorias_secciones
            WHERE idCategoria = ? AND idSeccion = ?
        `, [idCategoria, idSeccion]);

        res.json({
            ok: true,
            msg: 'Relación eliminada correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar asociación:', error);
        res.status(500).json({ 
            ok: false,
            msg: 'Error interno del servidor' 
        });
    }
};

module.exports = {
    getSecciones,
    getSeccion,
    createSeccion,
    updateSeccion,
    deleteSeccion,
    asociarSeccionCategoria,
    eliminarAsociacionSeccionCategoria
};