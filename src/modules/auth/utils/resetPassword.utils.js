const { getConnection } = require('../../../interface/DBConn.js');

/**
 * 
 * @param { {username: string} | {id_user: string} | {email: string} } usuario 
 * @param { string } new_password bcryptjs coded password
 */
async function setNewPassword(usuario, new_password) {
    const pool = await getConnection();
    const params = [];

    params.push(new_password);

    if (usuario.username) {
        params.push[usuario.username];
        queryWHERE = 'WHERE LOWER(username) = LOWER($2)';
    } else if (usuario.id_user) {
        params.push[usuario.id_user];
        queryWHERE = 'WHERE id = $2';
    } else if (usuario.email) {
        params.push[usuario.email];
        queryWHERE = 'WHERE email = $2';
    }

    if (!queryWHERE) {
        throw { message: 'No se ha proporcionado un identificador para el usuario' };
    }

    return pool
        .query(`
        UPDATE usuario 
            SET 
                pass_date = CURRENT_TIMESTAMP,
                reset_pass_authorized = NULL,
                verify_code = NULL,
                password = $1
        ${queryWHERE}`, params)
        .then(data => {
            return data.rowCount > 0;
        })
        .catch(error => {
            throw { message: 'Ocurrió un error consultando usuario', error_message: error };
        }).finally(() => pool.end);

}

/**
 * Método para obtener el usuario de base de datos del usuario
 * @param {{username: string} | {id_user: string}} usuario 
 * @returns {Promise<{
*              id_user: string, 
*              username: string, 
*              password: string, 
*              email: string,
*              verify_code?: string,
*              reset_pass_authorized?: string} | undefined }
* @throws {{message: string} | any}
*/
async function retrieveUser(usuario) {
    const pool = await getConnection();
    const params = [];
    let queryWHERE;

    if (usuario.username) {
        params.push[usuario.username];
        queryWHERE = 'WHERE LOWER(username) = LOWER($1)';
    } else if (usuario.id_user) {
        params.push[usuario.id_user];
        queryWHERE = 'WHERE id = $1';
    } else if (usuario.email) {
        params.push[usuario.email];
        queryWHERE = 'WHERE email = $1';
    }

    if (!queryWHERE) {
        throw { message: 'No se ha proporcionado un identificador para el usuario' };
    }

    return pool
        .query(`
        SELECT 
            u.id as id_user, u.username, u.password, u.email, u.verify_code, u.reset_pass_authorized 
        FROM usuario u 
        ${queryWHERE}`, params)
        .then(data => {
            if (data.rowCount > 0) {
                return data.rows[0];
            }
        })
        .catch(error => {
            throw { message: 'Ocurrió un error consultando usuario', error_message: error };
        }).finally(() => pool.end);
}

module.exports = {
    setNewPassword,
    retrieveUser,
}
