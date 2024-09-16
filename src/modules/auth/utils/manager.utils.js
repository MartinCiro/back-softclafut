const { getConnection } = require('../../../interface/DBConn.js');

const validator = (valor, nombre) => {
    if (!valor)
        throw {
        ok: false,
        status_cod: 400,
        data: `No se ha proporcionado ${nombre}`,
    };
};
  
const existe = (error, datos) => {
    const errorMessages = {
        duplicateEntry: (field) => `No se ha podido insertar el registro. El ${field} ya existe`,
    };

    if (error.code === "23505") {
        const field = datos;
        throw {
        ok: false,
        status_cod: 409,
        data: errorMessages.duplicateEntry(field),
        };
    }
};

/**
 * @param {{ 
 *              getEncryptedPassword: () => string, 
 *              comparePassword: (hash) => boolean,
 *              encodePassword: (newPass) => string,
 *              comparePasswords: (newPass, oldPass) => boolean,
 *              usuario: string,
 *              id_rol: string,
 *              habilitado: string,
 *        }} usuario
 */
async function insertNewUser(usuario) {
    /** @type {string[]} a */
    const params = [];
    const pool = await getConnection();
    
    // Configuración de la request
    params.push(usuario.getEncryptedPassword());
    params.push(usuario.id_rol);
    params.push(usuario.user);
    params.push(usuario.status);
    params.push(usuario.nombres);
    params.push(usuario.apellidos);

    return pool.query(`
        INSERT INTO users
        (pass, id_rol, username, estado, nombres, apellidos)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id;
        `, params)
        .then(data => {
            return data.rows[0].id;
        })
        .catch(error => {
            existe(error, 'username');
            console.log(error);
            throw {
                ok: false,
                status_cod: 500,
                data: 'Ocurrió un error insertando nuevo usuario'
            };
        }).finally(() => pool.end);
}

/**
 * @param {{
 *      id_usuario: number,
 *      query: string,
 *      id_sede: number,
 * }} options
 */
async function fetchUsuario(options) {
    const pool = await getConnection();

    let queryWhere,
        params = [],
        query = ` SELECT * \nFROM usuario u `;

    params.push(options.id_sede);
    queryWhere = `(u.id_sede = $${params.length})`;

    if (options.id_usuario) {
        params.push(options.id_usuario);
        queryWhere = ` ${queryWhere ? `${queryWhere} AND` : ''} (u.id = $${params.length}) `;
    }

    if (options.query) {
        params.push(options.query);
        queryWhere = ` ${queryWhere ? `${queryWhere} AND` : ''} 
            ( (u.nombre LIKE '%' || $${params.length} || '%')
                OR (u.apellidos LIKE '%' || $${params.length} || '%')  
                    OR (u.numero_documento LIKE '%' || $${params.length} || '%') 
                        OR (u.usuario LIKE '%' || $${params.length} || '%') )`;
    }

    return pool.query(`
            ${query}
            ${`\nWHERE (${queryWhere})`}
        `, params)
        .then(data => {
            return data.rows;
        })
        .catch(error => {
            console.log(error);
            throw {
                ok: false,
                status_cod: 500,
                data: 'Ocurrió un error de base de datos consultando usuarios',
            }
        }).finally(() => pool.end());
}

/**
 * Método para consultar la información del cliente
 * @param { number } id_cliente 
 */
async function fetchUsuarios() {
    const pool = await getConnection();

    return pool.query(` 
        SELECT 
            u.id id_usuario, u.nombre, apellidos, numero_documento, 
            correo, numero_contacto, habilitado, usuario nombre_usuario, 
            r.nombre AS rol, s.ciudad AS sede, id_cargo, c.nombre nombre_cargo
        FROM usuario u 
        INNER JOIN rol r ON r.id = u.id_rol 
        INNER JOIN sede s ON s.id = u.id_sede
        LEFT JOIN cargo c ON c.id = u.id_cargo 
        `,)
        .then(data => data.rows)
        .catch(error => {
            console.log(error);
            throw {
                ok: false,
                status_cod: 500,
                data: 'Ha ocurrido un error consultando el usuario en base de datos'
            }
        });
}

/**
 * @param {{
 *      correo:string, 
 *      id_sede:number, 
 *      id_rol: number, 
 *      numero_contacto: string, 
 *      habilitado: number, 
 *      id_cargo: number,
 *      clientes: any[]
 *  }} options 
 */
async function updateUsuario(options) {
    const { id, ...fields } = options; // Extrae el ID y el resto de los campos
    if (!id) {
        throw {
            ok: false,
            status_cod: 400,
            data: 'El ID del usuario es requerido'
        };
    }

    const params = [id];
    const setClauses = [];

    // Construye dinámicamente la lista de campos a actualizar
    Object.keys(fields).forEach((field, index) => {
        if (fields[field] !== undefined && fields[field] !== null) {
            params.push(fields[field]);
            setClauses.push(`${field} = $${params.length}`);
        }
    });

    if (setClauses.length === 0) {
        throw {
            ok: false,
            status_cod: 400,
            data: 'No se han proporcionado campos para actualizar'
        };
    }

    // Construye la consulta SQL
    const query = `
        UPDATE users
        SET ${setClauses.join(', ')}
        WHERE id = $1;
    `;
    const pool = await getConnection();

    try {
        const result = await pool.query(query, params);
        console.log(result);
        if (result.rowCount === 0) {
            throw {
                ok: false,
                status_cod: 500,
                data: 'No se pudo actualizar el usuario'
            };
        }
    } catch (err) {
        if (err.status_cod) throw err;
        console.error('Ocurrió un error actualizando usuario en la base de datos', err);
        throw {
            ok: false,
            status_cod: 500,
            data: 'Ocurrió un error en la base de datos actualizando el usuario'
        };
    } finally {
        pool.end(); // Asegúrate de cerrar la conexión
    }
}


async function fetchPermisos() {
    const pool = await getConnection();

    return pool.query(` 
        SELECT 
        p.nombre, p.descripcion
        FROM permiso p   
        `)
        .then(data => data.rows)
        .catch(error => {
            console.log(error);
            throw {
                ok: false,
                status_cod: 500,
                data: 'Ha ocurrido un error consultando permisos en base de datos'
            }
        });
}
async function fetchroles() {
    const pool = await getConnection();

    return pool.query(` 
        SELECT 
        r.nombre, r.descripcion
        FROM rol r   
        `)
        .then(data => data.rows)
        .catch(error => {
            console.log(error);
            throw {
                ok: false,
                status_cod: 500,
                data: 'Ha ocurrido un error consultando roles en base de datos'
            }
        });
}

async function usuarioXpermisos(id_rol, id_usuario) {
    const pool = await getConnection();

    return pool.query(` 
        SELECT
            rol.id AS rol_id,
            rol.nombre AS rol_nombre,
            rol.descripcion AS rol_descripcion,
            rol.estado AS rol_estado,
            STRING_AGG(DISTINCT permiso.nombre, ', ') AS permisos_nombres,
            STRING_AGG(DISTINCT permiso.descripcion, ', ') AS permisos_descripciones
        FROM
            rol
        INNER JOIN
            rolxpermiso ON rol.id = rolxpermiso.id_rol
        INNER JOIN
            permiso ON rolxpermiso.id_permiso = permiso.id_permiso
        INNER JOIN
            users u ON u.id_rol = rol.id
        WHERE
            rol.id = $1 AND u.id = $2
        GROUP BY
            rol.id, rol.nombre, rol.descripcion, rol.estado
        ORDER BY
            rol.id;
        `, [id_rol, id_usuario])
        .then(data => {
            if (data.rowCount == 0) 
                throw {
                ok: false,
                status_cod: 500,
                data: 'No se pudo encontrar el usuario'
            }
        })
        .catch(error => {
            console.log(error);
            throw {
                ok: false,
                status_cod: 500,
                data: 'Ha ocurrido un error consultando los permisos del usuario en base de datos'
            }
        });
}
module.exports = {
    insertNewUser,
    fetchUsuarios,
    fetchUsuario,
    updateUsuario,
    fetchPermisos,
    usuarioXpermisos,
    fetchroles,
    validator
}
