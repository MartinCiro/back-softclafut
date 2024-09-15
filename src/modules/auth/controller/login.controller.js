const config = require('../../../config.js');
const Usuario = require('../model/usuario.js');
const { retrieveUser } = require('../utils/login.utils.js');
const jsonwt = require('jsonwebtoken');

/**
 * 
 * @param {{user: string, pass: string}} usuario 
 */
async function loginUser(usuario) {
    let usuarioRetrieved;

    const INVALIDMESSAGE = 'Usuario o contraseña inválida';
    const usuarioLogin = Usuario(usuario.user, usuario.pass);

    // Retrieve user
    usuarioRetrieved = await retrieveUser(usuarioLogin)
        .catch(error => {
            if (error.status_cod) throw error;
            throw {
                ok: false,
                status: 500,
                data: { message: 'Ocurrió un error inesperado. Por favor inténtelo más tarde o comuníquese con el administrador' }
            };
        });

    // Usuario inválido
    if (!usuarioRetrieved) throw {
        ok: false,
        status_cod: 400,
        data: { message: INVALIDMESSAGE }
    };

    // Validar estado
    if (usuarioRetrieved.habilitado != '1') throw {
        ok: false,
        status_cod: 400,
        data: { message: 'El usuario no se encuentra habilitado.' }
    };

    // Password verifier
    if (!usuarioLogin.comparePassword(usuarioRetrieved.contrasena)) throw {
        ok: false,
        status_cod: 400,
        data: { message: INVALIDMESSAGE }
    };

    // Delete confidential data
    delete usuarioRetrieved.contrasena;
    delete usuarioRetrieved.habilitado;

    // Create JWT
    const token = jsonwt.sign(
        usuarioRetrieved,
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
 * @param {string} jwt 
 * @returns { {
 *      id_user: string,
 *      correo: string,
 *      usuario: string,
 *      nombre: string,
 *      apellidos: string,
 *      id_rol: number,
 *      habilitado: number
 * }}
 */
async function verifyJWT(jwt) {
    let response = {};

    const decodificada = jsonwt.decode(jwt);

    response.userInfo = decodificada;

    if (!response.userInfo?.id_user) {
        throw { message: 'El JWT es incorrecto' };
    }

    // Regla de excepción de verificación de JWT para el entorno local
    if (config.env == 'Dev') {
        return response;
    }

    // Verificar integridad del token
    try {
        jsonwt.verify(jwt, config.JWT_SECRETO);
    } catch (error) {
        if (error.expiredAt) throw {
            message: 'JWT expirado. Por favor inicie sesión nuevamente'
        }
        throw { message: 'El JWT es inválido' };
    }

    const expireDate = new Date(decodificada.exp * 1000);
    const now = new Date();
    const diff = (expireDate - now);
    const diffMins = Math.round(((diff % 86400000) % 3600000) / 60000);

    if (diffMins < 10) {
        response.jwt = jsonwt.sign(
            decodificada,
            config.JWT_SECRETO,
            { expiresIn: config.JWT_TIEMPO_EXPIRA }
        );
        return response;
    }

    return response;
}

module.exports = {
    loginUser,
    verifyJWT
};
