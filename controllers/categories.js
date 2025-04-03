const { validationResult } = require('express-validator');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '149.50.142.58',
  user: 'apiuser',
  password: 'ApiPassword123!',
  database: 'baseDeDatos'
});

const getAll =async (req, res = express.response)=>{
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
                        s.id as id,
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
            }

const getAllCategories =async (req, res = express.response)=>{
        try {
            // Primero obtenemos todas las categorías
            const [categorias] = await pool.execute(`
                SELECT id, nombre as Nombre, url as Url, icono
                FROM categorias
                ORDER BY nombre
                `);
                
                
                    
                    return res.status(200).json({
                        ok:true,
                        data: categorias
                    })
                } catch (error) {
                    console.error('Error al obtener categorías y secciones:', error);
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

    const { nombre, url, icono } = req.body;

    try {
        // Insertar la categoría
        const [result] = await pool.execute(`
            INSERT INTO categorias (nombre, url, icono)
            VALUES (?, ?, ?)
        `, [nombre, url, icono]);

        res.status(201).json({
            ok: true,
            categoria: {
                id: result.insertId,
                nombre,
                url,
                icono
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
    const { nombre, url, icono } = req.body;

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
        await pool.execute(`
            UPDATE categorias
            SET nombre = ?, url = ?, icono = ?
            WHERE id = ?
        `, [nombre, url, icono, categoriaId]);

        res.json({
            ok: true,
            categoria: {
                id: parseInt(categoriaId),
                nombre,
                url,
                icono
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

        // Primero eliminar las relaciones en categorias_secciones
        await pool.execute(`
            DELETE FROM categorias_secciones
            WHERE idCategoria = ?
        `, [categoriaId]);

        // Luego eliminar la categoría
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
module.exports ={getAllCategories,createCategoria,getAll,
updateCategoria,
deleteCategoria};