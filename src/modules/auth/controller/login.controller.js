const config = require('../../../config.js');
const Usuario = require('../model/usuario.js');
const { retrieveUser } = require('../utils/login.utils.js');
const jwt = require('jsonwebtoken');

/**
 * 
 * @param {{user: string, pass: string}} usuario 
 */
async function loginUser(usuario) {
    let usuarioRetrieved;
    const INVALIDMESSAGE = 'Usuario o contraseña inválida';
    const usuarioLogin = Usuario(usuario.user, usuario.pass);

    // Retrieve user
    usuarioRetrieved = await retrieveUser(usuarioLogin);

    if (!usuarioRetrieved) {
        throw new Error(INVALIDMESSAGE);
    }

    // Create JWT
    const token = jwt.sign(
        { id_user: usuarioRetrieved.id_user, username: usuarioRetrieved.usuario, rol: usuarioRetrieved.rol },
        config.JWT_SECRETO,
        { expiresIn: config.JWT_TIEMPO_EXPIRA }
    );

    return {
        ok: true,
        status_cod: 200,
        data: {
            token,
            usuario: {
                correo: usuarioRetrieved.correo,
                nombre: usuarioRetrieved.nombre,
                apellidos: usuarioRetrieved.apellidos,
                rol: usuarioRetrieved.rol,
                usuario: usuarioRetrieved.usuario,
                numeroContacto: usuarioRetrieved.numero_contacto,
            }
        }
    };
}

/**
 * @param {string} token 
 * @returns { {
*      id_user: string,
*      correo: string,
*      usuario: string,
*      nombre: string,
*      apellidos: string,
*      rol: number,
*      habilitado: number
* }}
*/
async function verifyJWT(token) {
    let response = {};

    // Decodificar el JWT sin verificar la firma
    const decodificada = jwt.decode(token);

    // Regla de excepción de verificación de JWT para el entorno local
    if (config.env === 'Dev') {
        console.log(decodificada);
        return { userInfo: decodificada };
    }

    // Verificar que el JWT decodificado contenga id_user
    if (!decodificada?.id_user) {
        throw { message: 'El JWT es incorrecto' };
    }


    // Verificar integridad del token
    try {
        // Verificar el token usando la clave secreta
        const verified = jwt.verify(jwt, config.JWT_SECRETO);

        // Cálculo del tiempo restante hasta la expiración
        const expireDate = new Date(verified.exp * 1000);
        const now = new Date();
        const diff = expireDate - now;
        const diffMins = Math.round(((diff % 86400000) % 3600000) / 60000);

        // Regenera el token si está a punto de expirar (menos de 10 minutos restantes)
        if (diffMins < 10) {
            // Crear un nuevo token sin el campo `exp` en el payload
            response.jwt = jwt.sign(
                { id_user: verified.id_user, username: verified.username }, // Asegúrate de usar los datos correctos
                config.JWT_SECRETO,
                { expiresIn: config.JWT_TIEMPO_EXPIRA }
            );
        }

        response.userInfo = verified;
        return response;

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw { message: 'JWT expirado. Por favor inicie sesión nuevamente' };
        } else {
            throw { message: 'El JWT es inválido' };
        }
    }
}



module.exports = {
    loginUser,
    verifyJWT
};
