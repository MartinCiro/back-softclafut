const { loginUser, verifyJWT } = require("../controller/login.controller");
const ResponseBody = require('../../../shared/model/ResponseBody.model');
const { createUser, listarUsuarios, modificarUsuario, listarPermisos, listarPermisoXUsuario, listarRoles } = require("../controller/manager.controller");
const { decodePassword } = require("../utils/decodePass.utils");

/**
 * Callback para el endpoint `/auth/login`
 * @param { { body: {username: string, enpass: string}} } req 
 * @param { Express.Response } res 
 */
const loginAPI = async (req, res) => {
    const { username, enpass: encodedPassword } = req.body;
    let message, loginResponse, password;

    if (!username) {
        return res.status(400).json(new ResponseBody(false, 400, { message: 'No se ha proporcionado un nombre de usuario' }));
    } else if (!encodedPassword) {
        return res.status(400).json(new ResponseBody(false, 400, { message: 'No se ha proporcionado una contraseña' }));
    }

    try {
        password = decodePassword(encodedPassword);
    } catch (error) {
        console.log('Ha ocurrido un error decodificando contraseña: ', error);
        return res.status(500).json(new ResponseBody(false, 500, { message: 'Ha ocurrido un error con el formato de la contraseña' }));
    }

    try {
        loginResponse = await loginUser({ user: username, pass: password });
        message = new ResponseBody(loginResponse.ok, loginResponse.status_cod, loginResponse.data);
    } catch (error) {
        if (error.data) {
            message = new ResponseBody(error.ok, error.status_cod, error.data);
        } else {
            console.log(error);
            message = new ResponseBody(false, 500, { message: 'Ocurrió un error inesperado. Por favor inténtelo más tarde o comuníquese con el administrador' });
        }
    }

    return res.json(message);
}

/**
 * Callback para el endpoint `/auth/create/user`
 * @param { { body: {
 *              usuario: string,
 *              id_rol: string,
 *              habilitado: string,
 *              encpass: string,
 *            }
 *          } } req 
 * @param { Express.Response } res 
 */
const createUserAPI = async (req, res) => {

    const {
        usuario,
        encpass,
        id_rol,
        habilitado } = req.body;

    let message, createUserResponse, password;

    if (!usuario || !encpass || !id_rol || !habilitado) {
        return res.status(400).json(new ResponseBody(false, 400, 'No se han proporcionado datos suficientes para crear un nuevo usuario'));
    }

    try {
        password = decodePassword(encpass);
    } catch (error) {
        console.log('Ha ocurrido un error decodificando contraseña: ', error);
        return res.status(500).json(new ResponseBody(false, 500, 'Ha ocurrido un error con el formato de la contraseña'));
    }

    try {
        createUserResponse = await createUser({ usuario, pass: password, habilitado, id_rol });
        message = new ResponseBody(createUserResponse.ok, createUserResponse.status_cod, createUserResponse.data);
    } catch (error) {
        if (error.status_cod) {
            message = new ResponseBody(error.ok, error.status_cod, error.data);
        } else {
            console.log(error);
            message = new ResponseBody(false, 500, 'Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde.');
        }
    }

    return res.json(message);
}

/**
 * Callback para el middleware de verificación de JWT
 * next: 
 *      req.userData = {
 *          id_user: string,
 *          correo: string,
 *          usuario: string,
 *          nombre: string,
 *          apellidos: string,
 *          id_rol: number
 *      }
 */
const isAuthenticatedMW = async (req, res, next) => {
    const jwtRegex = /^[A-Za-z0-9_-]{2,}(?:\.[A-Za-z0-9_-]{2,}){2}$/;

    const token = req.get("jwt") || req.get("Authorization");

    if (!token) {
        return res.json(
            new ResponseBody(false, 403, { message: 'No se ha proporcionado token' })
        );
    }

    // Este condicional valida que el jwt proporcionado
    // tenga formato de jwt y no sea una cadena cualquiera
    if (!jwtRegex.test(token)) {
        return res.json(
            new ResponseBody(false, 403, { message: 'No se ha proporcionado un token válido' })
        );
    }

    let verifyResponse;

    // Verificar el JWT y obtener una respuesta para asignar a la variable req
    try {
        verifyResponse = await verifyJWT(token);
    } catch (error) {
        console.log(error)
        if (error.message) {
            return res.json(new ResponseBody(false, 403, error));
        } else {
            return res.json(new ResponseBody(false, 500, { message: 'Ocurrió un error validando el token del cliente. Por favor intente más tarde' }));
        }
    }

    /**
     * Tras verificarse exitosamente, verifyResponse tiene la propiedad userInfo, 
     * que es la decodificación del JWT en objeto.
     * 
     * NOTA:
     * Cuando se trabaja en el ambiente de desarrollo, verifyJWT tiene una regla 
     * para no verificar la autenticidad del token. Es decir, se pueden proporcionar
     * tokens vencidos e incorrectos, mas no corruptos.
     */
    req.userData = verifyResponse.userInfo;

    // Asignación a los headers de la respuesta el nuevo token auto-regenerado
    if (verifyResponse && verifyResponse.jwt) {
        res.set('new_token', verifyResponse.jwt);
    }

    next();
}

/**
 * @param {number[]} roles
 * @returns {(req, res, next) => *}
 */
const checkPermissions = (roles) => {

    if (!(roles instanceof Array)) {
        throw {
            message: 'Se debe un especificar un array de números para especificar los roles'
        }
    }

    /**
    * @param {*} req 
    * @param {*} res 
    * @param {*} next 
    */
    return (req, res, next) => {
        const { id_rol } = req.userData;

        if (!id_rol || !roles.includes(id_rol)) {
            return res.status(403).json(new ResponseBody(
                false,
                403,
                { message: 'No posee permisos para realizar esta acción' }
            ));
        }

        next();
    }
}

const listarUsuariosAPI = async (req, res) => {
    try {
        const listarUsuarioResponse = await listarUsuarios();
        message = new ResponseBody(true, 200, { usuarios: listarUsuarioResponse });
    } catch (error) {
        if (error.data) {
            message = new ResponseBody(error.ok, error.status_cod, error.data);
        } else {
            console.log(error);
            message = new ResponseBody(false, 500, { message: 'Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde' });
        }
    }

    return res.json(message);
}


/**
 * 
 * @param {{body: {
 *      correo:string, 
 *      id_sede:number, 
 *      id_rol: number, 
 *      numero_contacto: string, 
 *      habilitado: number, 
 *      id_cargo: number,
 *      clientes: any[]
 *  }
 * }} req 
 * @param {*} res 
 * @returns 
 */
const actualizarUsuarioAPI = async (req, res) => {
    const { correo, id_sede, id_rol, numero_contacto, habilitado, id_cargo, nombre, apellidos } = req.body;
    const { id } = req.query;

    if (!id) {
        return res.json({
            ok: false,
            status_cod: 400,
            data: 'No se ha proporcionado el identificador del usuario',
        });
    }

    if (!numero_contacto && !correo && !id_rol && !habilitado && !id_sede && !id_cargo && !nombre && !apellidos) {
        return res.json({
            ok: false,
            status_cod: 400,
            data: 'No se ha proporcionado campos válidos para actualizar',
        });
    }

    try {
        const updateUsuarioResponse = await modificarUsuario({ id, correo, id_sede, id_rol, numero_contacto, habilitado, id_cargo, nombre, apellidos });
        message = new ResponseBody(true, 200, updateUsuarioResponse);
    } catch (error) {
        if (error.status_cod) {
            message = new ResponseBody(error.ok, error.status_cod, error.data);
        } else {
            console.log(error);
            message = new ResponseBody(false, 500, { message: 'Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde.' });
        }
    }

    return res.json(message);
}

const listarPermisosAPI = async (req, res) => {

    try {
        const listarPermisosResponse = await listarPermisos();
        message = new ResponseBody(true, 200, { permisos: listarPermisosResponse });
    } catch (error) {
        if (error.data) {
            message = new ResponseBody(error.ok, error.status_cod, error.data);
        } else {
            console.log(error);
            message = new ResponseBody(false, 500, { message: 'Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde' });
        }
    }

    return res.json(message);
}

const listarPermisosXUsuarioAPI = async (req, res) => {
    const { id_rol, id_usuario } = req.body;

    try {
        const listarPermisoXUsuarioResponse = await listarPermisoXUsuario(id_rol, id_usuario);
        message = new ResponseBody(true, 200, { permisos: listarPermisoXUsuarioResponse });
    } catch (error) {
        if (error.data) {
            message = new ResponseBody(error.ok, error.status_cod, error.data);
        } else {
            console.log(error);
            message = new ResponseBody(false, 500, { message: 'Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde' });
        }
    }

    return res.json(message);
}

const listarRolesAPI = async (req, res) => {

    try {
        const listarRolesResponse = await listarRoles();
        message = new ResponseBody(true, 200, { roles: listarRolesResponse });
    } catch (error) {
        if (error.data) {
            message = new ResponseBody(error.ok, error.status_cod, error.data);
        } else {
            console.log(error);
            message = new ResponseBody(false, 500, { message: 'Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde' });
        }
    }

    return res.json(message);
}

module.exports = {
    loginAPI,
    createUserAPI,
    isAuthenticatedMW,
    checkPermissions,
    listarUsuariosAPI,
    actualizarUsuarioAPI,
    listarPermisosAPI,
    listarPermisosXUsuarioAPI,
    listarRolesAPI
}
