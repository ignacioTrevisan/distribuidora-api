const { validationResult } = require('express-validator');
const mysql = require('mysql2/promise');
const express = require('express');

const pool = mysql.createPool({
  host: '149.50.142.58',
  user: 'apiuser',
  password: 'ApiPassword123!',
  database: 'baseDeDatos'
});

const getAll = async (req, res = express.response) => {
    try {
        // Obtenemos todas las categorías sin incluir iconos
        const [categorias] = await pool.execute(`
            SELECT id, nombre as Nombre, activo
            FROM categorias
            ORDER BY nombre
        `);
            
        // Para cada categoría, obtenemos sus secciones (ahora los iconos y descripciones están en la tabla secciones)
        const resultado = await Promise.all(categorias.map(async (categoria) => {
            const [secciones] = await pool.execute(`
                SELECT 
                s.id as id,
                s.nombre as Nombre,
                s.descripcion as Descripcion,
                s.activo as activo,
                s.icono as icono
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
                activo: categoria.activo,
                Secciones: secciones
            };
        }));
            
        res.json(resultado);
    } catch (error) {
        console.error('Error al obtener categorías y secciones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

// Obtener solo categorías activas con sus secciones activas
const getActiveOnly = async (req, res = express.response) => {
    try {
        // Obtenemos solo las categorías activas sin iconos
        const [categorias] = await pool.execute(`
            SELECT id, nombre as Nombre, activo
            FROM categorias
            WHERE activo = true
            ORDER BY nombre
        `);
            
        // Para cada categoría, obtenemos solo sus secciones activas
        const resultado = await Promise.all(categorias.map(async (categoria) => {
            const [secciones] = await pool.execute(`
                SELECT 
                s.id as id,
                s.nombre as Nombre,
                s.descripcion as Descripcion,
                s.activo as activo,
                s.icono as icono
                FROM 
                categorias_secciones cs
                JOIN 
                secciones s ON cs.idSeccion = s.id
                WHERE 
                cs.idCategoria = ? AND s.activo = true
                ORDER BY 
                s.nombre
            `, [categoria.id]);
                
            // Retornamos la categoría con sus secciones activas
            return {
                Nombre: categoria.Nombre,
                activo: categoria.activo,
                Secciones: secciones
            };
        }));
            
        res.json(resultado);
    } catch (error) {
        console.error('Error al obtener categorías y secciones activas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

const getAllCategories = async (req, res = express.response) => {
    try {
        // Obtenemos todas las categorías 
        const [categorias] = await pool.execute(`
            SELECT id, nombre as Nombre, activo
            FROM categorias
            ORDER BY nombre
        `);
            
        return res.status(200).json({
            ok: true,
            data: categorias
        })
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

// Obtener solo categorías activas
const getActiveCategories = async (req, res = express.response) => {
    try {
        // Obtenemos solo las categorías activas
        const [categorias] = await pool.execute(`
            SELECT id, nombre as Nombre, activo
            FROM categorias
            WHERE activo = true
            ORDER BY nombre
        `);
            
        return res.status(200).json({
            ok: true,
            data: categorias
        })
    } catch (error) {
        console.error('Error al obtener categorías activas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

// Crear una nueva categoría
const createCategoria = async (req, res) => {
    // Validar los datos recibidos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            errors: errors.array()
        });
    }

    const { nombre, activo = true } = req.body;

    try {
        // Insertar la categoría
        const [result] = await pool.execute(`
            INSERT INTO categorias (nombre, activo)
            VALUES (?, ?)
        `, [nombre, activo]);

        res.status(201).json({
            ok: true,
            categoria: {
                id: result.insertId,
                nombre,
                activo
            }
        });
    } catch (error) {
        console.error('Error al crear categoría:', error);
        res.status(500).json({ 
            ok: false,
            msg: 'Error interno del servidor' 
        });
    }
};

// Actualizar una categoría
const updateCategoria = async (req, res) => {
    // Validar los datos recibidos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            errors: errors.array()
        });
    }

    const categoriaId = req.params.id;
    const { nombre, activo } = req.body;

    try {
        // Verificar si la categoría existe
        const [categoria] = await pool.execute(`
            SELECT id FROM categorias WHERE id = ?
        `, [categoriaId]);

        if (categoria.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'Categoría no encontrada'
            });
        }

        // Actualizar la categoría
        if (activo !== undefined) {
            await pool.execute(`
                UPDATE categorias
                SET nombre = ?, activo = ?
                WHERE id = ?
            `, [nombre, activo, categoriaId]);
        } else {
            await pool.execute(`
                UPDATE categorias
                SET nombre = ?
                WHERE id = ?
            `, [nombre, categoriaId]);
        }

        // Obtener el estado actual de activo si no se proporcionó
        let estadoActivo = activo;
        if (estadoActivo === undefined) {
            const [estadoActual] = await pool.execute(`
                SELECT activo FROM categorias WHERE id = ?
            `, [categoriaId]);
            estadoActivo = estadoActual[0].activo;
        }

        res.json({
            ok: true,
            categoria: {
                id: parseInt(categoriaId),
                nombre,
                activo: estadoActivo
            }
        });
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        res.status(500).json({ 
            ok: false,
            msg: 'Error interno del servidor' 
        });
    }
};

// Actualizar solo el estado activo de una categoría
const updateCategoriaActivo = async (req, res) => {
    const categoriaId = req.params.id;
    const { activo } = req.body;

    if (activo === undefined) {
        return res.status(400).json({
            ok: false,
            msg: 'El campo activo es obligatorio'
        });
    }

    try {
        // Verificar si la categoría existe
        const [categoria] = await pool.execute(`
            SELECT id, nombre FROM categorias WHERE id = ?
        `, [categoriaId]);

        if (categoria.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'Categoría no encontrada'
            });
        }

        // Actualizar solo el campo activo
        await pool.execute(`
            UPDATE categorias
            SET activo = ?
            WHERE id = ?
        `, [activo, categoriaId]);

        res.json({
            ok: true,
            categoria: {
                id: parseInt(categoriaId),
                nombre: categoria[0].nombre,
                activo
            }
        });
    } catch (error) {
        console.error('Error al actualizar estado de categoría:', error);
        res.status(500).json({ 
            ok: false,
            msg: 'Error interno del servidor' 
        });
    }
};

// Verificar si una categoría tiene secciones asociadas
const verificarSeccionesAsociadas = async (categoriaId) => {
    try {
        const [secciones] = await pool.execute(`
            SELECT COUNT(*) as total
            FROM categorias_secciones
            WHERE idCategoria = ?
        `, [categoriaId]);
        
        return secciones[0].total > 0;
    } catch (error) {
        console.error('Error al verificar secciones asociadas:', error);
        throw error;
    }
};

// Eliminar una categoría
const deleteCategoria = async (req, res) => {
    const categoriaId = req.params.id;

    try {
        // Verificar si la categoría existe
        const [categoria] = await pool.execute(`
            SELECT id FROM categorias WHERE id = ?
        `, [categoriaId]);

        if (categoria.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'Categoría no encontrada'
            });
        }

        // Verificar si tiene secciones asociadas
        const tieneSecciones = await verificarSeccionesAsociadas(categoriaId);
        
        if (tieneSecciones) {
            return res.status(400).json({
                ok: false,
                msg: 'No se puede eliminar la categoría porque tiene secciones asociadas. Elimine primero todas las secciones vinculadas.'
            });
        }

        // Si no tiene secciones asociadas, eliminar la categoría
        await pool.execute(`
            DELETE FROM categorias
            WHERE id = ?
        `, [categoriaId]);

        res.json({
            ok: true,
            msg: 'Categoría eliminada correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        res.status(500).json({ 
            ok: false,
            msg: 'Error interno del servidor' 
        });
    }
};

// Obtener todas las secciones
const getAllSecciones = async (req, res = express.response) => {
    try {
        // Obtenemos todas las secciones con sus iconos y descripciones
        const [secciones] = await pool.execute(`
            SELECT id, nombre as Nombre, descripcion as Descripcion, 
                   icono, activo
            FROM secciones
            ORDER BY nombre
        `);
            
        return res.status(200).json({
            ok: true,
            data: secciones
        });
    } catch (error) {
        console.error('Error al obtener secciones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Crear una nueva sección
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

    try {
        // Iniciar una transacción
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Insertar la sección con sus nuevos campos
            const [resultSeccion] = await connection.execute(`
                INSERT INTO secciones (nombre, descripcion, icono, activo)
                VALUES (?, ?, ?, ?)
            `, [nombre, descripcion, icono, activo]);

            const idSeccion = resultSeccion.insertId;

            // Si se proporcionó una categoría, crear la relación en categorias_secciones
            if (idCategoria) {
                await connection.execute(`
                    INSERT INTO categorias_secciones (idCategoria, idSeccion)
                    VALUES (?, ?)
                `, [idCategoria, idSeccion]);
            }

            // Confirmar la transacción
            await connection.commit();

            res.status(201).json({
                ok: true,
                seccion: {
                    id: idSeccion,
                    nombre,
                    descripcion,
                    icono,
                    activo
                }
            });
        } catch (error) {
            // Revertir la transacción en caso de error
            await connection.rollback();
            throw error;
        } finally {
            // Liberar la conexión
            connection.release();
        }
    } catch (error) {
        console.error('Error al crear sección:', error);
        res.status(500).json({ 
            ok: false,
            msg: 'Error interno del servidor' 
        });
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
    const { nombre, descripcion, icono, activo } = req.body;

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

        // Construir la consulta SQL dinámica para actualizar solo los campos proporcionados
        let updateQuery = 'UPDATE secciones SET ';
        const updateValues = [];
        
        if (nombre !== undefined) {
            updateQuery += 'nombre = ?, ';
            updateValues.push(nombre);
        }
        
        if (descripcion !== undefined) {
            updateQuery += 'descripcion = ?, ';
            updateValues.push(descripcion);
        }
        
        if (icono !== undefined) {
            updateQuery += 'icono = ?, ';
            updateValues.push(icono);
        }
        
        if (activo !== undefined) {
            updateQuery += 'activo = ?, ';
            updateValues.push(activo);
        }
        
        // Eliminar la coma final y agregar la condición WHERE
        updateQuery = updateQuery.slice(0, -2) + ' WHERE id = ?';
        updateValues.push(seccionId);

        // Actualizar la sección
        await pool.execute(updateQuery, updateValues);

        // Obtener la sección actualizada
        const [seccionActualizada] = await pool.execute(`
            SELECT id, nombre as Nombre, descripcion as Descripcion, 
                   icono, activo 
            FROM secciones 
            WHERE id = ?
        `, [seccionId]);

        res.json({
            ok: true,
            seccion: seccionActualizada[0]
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

        // Iniciar una transacción
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Eliminar primero las relaciones en categorias_secciones
            await connection.execute(`
                DELETE FROM categorias_secciones
                WHERE idSeccion = ?
            `, [seccionId]);

            // Luego eliminar la sección
            await connection.execute(`
                DELETE FROM secciones
                WHERE id = ?
            `, [seccionId]);

            // Confirmar la transacción
            await connection.commit();

            res.json({
                ok: true,
                msg: 'Sección eliminada correctamente'
            });
        } catch (error) {
            // Revertir la transacción en caso de error
            await connection.rollback();
            throw error;
        } finally {
            // Liberar la conexión
            connection.release();
        }
    } catch (error) {
        console.error('Error al eliminar sección:', error);
        res.status(500).json({ 
            ok: false,
            msg: 'Error interno del servidor' 
        });
    }
};
const getCategoryidByName =async(req,res)=>{
    const name = req.params.name;
     const [categorias] = await pool.execute(`
            select id from categorias where nombre = ?
        `,[name]);
    res.status(200).json({
        ok:true,
        id: categorias[0].id
    })
}
module.exports = {
    getAllCategories,
    getActiveCategories,
    createCategoria,
    getAll,
    getActiveOnly,
    updateCategoria,
    updateCategoriaActivo,
    deleteCategoria,
    getAllSecciones,
    createSeccion,
    updateSeccion,
    deleteSeccion,
    getCategoryidByName
};