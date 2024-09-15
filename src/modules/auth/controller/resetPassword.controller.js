const Usuario = require("../model/usuario");
const { setNewPassword, retrieveUser } = require("../utils/resetPassword.utils");

/**
 * Método para cambiar una contraseña 
 * @param {string} [id_user] id de usuario a modificar 
 * @param {string} new_password Nueva contraseña
 * @param {string} old_password Contraseña antigua
 * @param {{id_user: string, 
*           username: string, 
*           password: string, 
*           email: string,
*           verify_code?: string,
*           reset_pass_authorized?: string}} [usuarioRetrieved] Entidad de usuario
 */
async function changePassword(id_user, new_password, old_password, usuarioRetrieved) {
    const UNEXPECTEDERROR = 'Ocurrió un error inesperado. Por favor intentar más tarde o comuníquese con el administrador.';
    const usuarioUtils = Usuario();
    let message;

    if (!usuarioRetrieved) {
        if (!id_user) {
            throw {
                ok: false,
                status: 400,
                data: { message: 'No se ha proporcionado ningún identificador' }
            };
        }
        // Retrieve user
        try {
            usuarioRetrieved = await retrieveUser({ id_user });
        } catch (error) {
            console.log(error);
            message = {
                ok: false,
                status: 500,
                data: { message: UNEXPECTEDERROR }
            };
        }
    }

    // Error handler
    if (message) {
        throw message;
    } else if (!usuarioRetrieved) {
        // invalid identifier
        message = {
            ok: false,
            status: 500,
            data: { message: UNEXPECTEDERROR }
        };
        throw message;
    }

    /**
     * Verify that the actual password is the same as the old password given by the user
     */
    if (!usuarioUtils.comparePasswords(usuarioRetrieved.password, old_password)) {
        message = {
            ok: false,
            status: 403,
            data: { message: 'La contraseña no es válida.' }
        };
        throw message;
    }

    /**
     * Verify that the new password is not the same as the actual password
     */
    if (usuarioUtils.comparePasswords(usuarioRetrieved.password, new_password)) {
        message = {
            ok: false,
            status: 400,
            data: { message: 'La nueva contraseña no puede ser la misma que la actual' }
        };
        throw message;
    }

    // Change password
    await setNewPassword({ id_user }, usuarioUtils.encodePassword(new_password))
        .then(data => {
            if (data) message = {
                ok: false,
                status: 200,
                data: { message: 'La contraseña se ha modificado con éxito.' }
            };
        })
        .catch(error => {
            console.log(error);
        });

    // Error handler
    if (!message) {
        message = {
            ok: false,
            status: 500,
            data: { message: 'La contraseña no pudo ser modificada. Por favor póngase en contacto con el administrador.' }
        };
    }

    return message;
}

module.exports = {
    changePassword,
}