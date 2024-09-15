const { getConnection } = require('../../../interface/DBConn.js');

/**
 * Método para obtener el perfil de base de datos del usuario.
 * @param {{username: string} | {id_user: string}} usuario 
 * @returns {Promise<{
 *              id_user: string,
 *              correo: string, 
 *              usuario: string, 
 *              contrasena: string,
 *              nombre: string,
 *              apellidos: string,
 *              id_rol: number,
 *              habilitado: number} | undefined }
 * @throws {{message: string} | any}
 */
async function retrieveUser(usuario) {
    const pool = await getConnection();
    const params = [];
    let queryWHERE;

    if (usuario.user) {
        params.push(usuario.user);
        queryWHERE = 'WHERE ((LOWER(u.correo) = LOWER($1)) OR (LOWER(u.usuario) = LOWER($1)))';
    } else if (usuario.id_user) {
        params.push(usuario.id_user);
        queryWHERE = 'WHERE u.id = $1';
    }

    if (!queryWHERE) {
        throw {
            ok: false,
            status_cod: 400,
            data: 'No se ha proporcionado un identificador para el usuario',
        };
    }

    return pool
        .query(`
        SELECT 
            u.id AS id_user, u.correo, 
            u.usuario, u.contrasena,
            u.nombre, u.apellidos,
            u.id_rol, r.nombre as rol,
            u.habilitado, u.id_sede, u.numero_contacto 
        FROM usuario u
        LEFT JOIN rol r ON r.id = u.id_rol
        ${queryWHERE}
        `, params)
        .then(data => {
            if (data.rowCount > 0) {
                return data.rows[0];
            }
            return;
        })
        .catch(error => {
            console.log(error);
            throw {
                ok: false,
                status_cod: 400,
                data: 'Ocurrió un error consultando usuario',
            };
        }).finally(() => pool.end);
}

module.exports = {
    retrieveUser
}
