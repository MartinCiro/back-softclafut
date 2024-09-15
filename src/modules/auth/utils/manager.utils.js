const { getConnection } = require('../../../interface/DBConn.js');

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
    params.push(usuario.usuario);
    params.push(usuario.habilitado);

    return pool.query(`
        INSERT INTO usuario
        (usuario, contrasena, id_rol, habilitado)
        VALUES ($3, $1, $2, $4)
        RETURNING id;
        `, params)
        .then(data => {
            return data.rows[0].id;
        })
        .catch(error => {
            if (error.code && error.code == '23505') {
                let regexp = /(Key [(])(.*)[)]=/;
                let table = regexp.exec(error.detail)[2];
                throw {
                    ok: false,
                    status_cod: 409,
                    data: `No se ha podido crear el usuario: ${table} duplicado`
                }
            }
            console.log(error);
            throw {
                ok: false,
                status_cod: 500,
                data: 'Ocurrió un error insertando nuevo usuario'
            };
        }).finally(() => pool.end);
}


/**
 * 
 * @param {*} base64image 
 * @returns {Promise<{value: string | number}>}
 */
async function createProfilePic(base64image) {
    return;
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
    const { id, correo, id_sede, id_rol, numero_contacto, habilitado, id_cargo, nombre, apellidos } = options;
    let query, params = [];

    if (!id) throw {
        ok: false,
        status_cod: 400,
        data: 'No se puede ejecutar esta acción, debe ingresar el identificador del cliente',
    }

    params.push(id);

    if (correo) {
        params.push(correo);
        query = query ? `${query}, correo = $${params.length}` : `correo = $${params.length}`;
    }

    if (numero_contacto) {
        params.push(numero_contacto);
        query = query ? `${query}, numero_contacto = $${params.length}` : `numero_contacto = $${params.length}`;
    }

    if (habilitado) {
        params.push(habilitado);
        query = query ? `${query}, habilitado = $${params.length}` : `habilitado = $${params.length}`;
    }

    if (id_sede) {
        params.push(id_sede);
        query = query ? `${query}, id_sede = $${params.length}` : `id_sede = $${params.length}`;
    }

    if (id_rol) {
        params.push(id_rol);
        query = query ? `${query}, id_rol = $${params.length}` : `id_rol = $${params.length}`;
    }

    if (id_cargo) {
        params.push(id_cargo);
        query = query ? `${query}, id_cargo = $${params.length}` : `id_cargo = $${params.length}`;
    }
    if (nombre) {
        params.push(nombre);
        query = query ? `${query}, nombre = $${params.length}` : `nombre = $${params.length}`;
    }
    if (apellidos) {
        params.push(apellidos);
        query = query ? `${query}, apellidos = $${params.length}` : `apellidos = $${params.length}`;
    }

    if (!query) {
        throw {
            ok: false,
            status_cod: 400,
            data: 'No se han proporcionado campos suficientes'
        }
    }

    console.log(`
        UPDATE usuario SET
        ${query}
        WHERE id = $1;
    `);

    console.log(params);

    const pool = await getConnection();

    return pool.query(`
        UPDATE usuario SET
        ${query}
        WHERE id = $1;
    `, params
    ).then(data => {
        if (data.rowCount == 0) throw {
            ok: false,
            status_cod: 500,
            data: 'No se pudo actualizar el usuario',
        }
    }).catch((err) => {
        if (err.status_cod) throw err;
        console.error('Ocurrió un error actualizando usuario en la base de datos', err);
        throw {
            ok: false,
            status_cod: 500,
            data: `Ocurrió un error en base de datos actualizando el usuario`,
        }
    }).finally(() => pool.end());
};

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
        SELECT  p.nombre  AS permisos
        FROM rolxpermiso r 
        INNER JOIN permiso p ON p.id = r.id_permiso 
        INNER JOIN rol r2 ON r2.id  = r.id_rol 
        INNER JOIN usuario u  ON u.id_rol  = r.id_rol 
        WHERE r2.id = $1 AND u.id = $2
        `, [id_rol, id_usuario])
        .then(data => data.rows)
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
    fetchroles
}
