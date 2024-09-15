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
        // Usamos el campo 'username' en lugar de 'correo'
        queryWHERE = 'WHERE LOWER(u.username) = LOWER($1)';
    } else if (usuario.id_user) {
        params.push(usuario.id_user);
        // Usamos el campo 'id' para buscar por ID
        queryWHERE = 'WHERE u.id = $1';
    } else {
        throw {
            ok: false,
            status_cod: 400,
            data: 'No se ha proporcionado un identificador para el usuario',
        };
    }

    return pool
        .query(`
        SELECT 
            u.id AS id_user, 
            u.username AS usuario, 
            u.pass AS contrasena, 
            u.nombre, 
            u.apellido AS apellidos,
            u.id_rol AS id_rol
        FROM users u
        ${queryWHERE}
        `, params)
        .then(data => {
            if (data.rowCount > 0) {
                return data.rows[0];
            }
            return null; // Cambiar a `null` si no se encuentra el usuario
        })
        .catch(error => {
            console.log(error);
            throw {
                ok: false,
                status_cod: 400,
                data: 'Ocurrió un error consultando usuario',
            };
        }).finally(() => pool.end());
}


module.exports = {
    retrieveUser
}
