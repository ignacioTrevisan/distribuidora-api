const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '149.50.142.58',
  user: 'apiuser',
  password: 'ApiPassword123!',
  database: 'baseDeDatos'
});

const getAllCategories =async (req, res = express.response)=>{

    
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
            }
        module.exports ={getAllCategories};