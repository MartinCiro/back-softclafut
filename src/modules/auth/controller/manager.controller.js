const config = require('../../../config.js');
const { insertNewUser, updateUsuario, validator } = require('../utils/manager.utils.js');
const Usuario = require('../model/usuario.js');

const managerUtils = require("../utils/manager.utils.js");

/**
 * Método para crear un nuevo usuario
 * @param {{
 *          usuario: string,
 *          nombre: string,
 *          apellidos: string,
 *          numero_documento: string,
 *          id_sede: string,
 *          id_rol: string,
 *          correo: string,
 *          numero_contacto: string,
 *          habilitado: string,
 *          pass: string,
 *        }} nuevoUsuario
 * @param {number[] || string[]} clientes 
 */
async function createUser(nuevoUsuario) {
    validator(nuevoUsuario.user, 'el usuario');
    validator(nuevoUsuario.pass, 'la contrasena');
    validator(nuevoUsuario.id_rol, 'el rol');
    validator(nuevoUsuario.nombres, 'los nombres');
    validator(nuevoUsuario.apellidos, 'los apellidos');

    const usuario = Usuario(
        nuevoUsuario.user,
        nuevoUsuario.pass,
        nuevoUsuario.id_rol,
        nuevoUsuario.status
    );

    usuario.nombres = nuevoUsuario.nombres;
    usuario.apellidos = nuevoUsuario.apellidos;

    const id_usuario = await insertNewUser({ ...usuario })
        .catch(error => {
            if (error.status_cod) throw error;
            console.log(error);
            throw {
                ok: false,
                status_cod: 500,
                data: 'Ocurrió un error inesperado y el usuario no ha sido creado',
            }
        });

    return {
        ok: true,
        status_cod: 200,
        data: {
            id_usuario,
            message: 'El usuario fue creado con éxito',
        }
    }
}

async function listarUsuarios() {
    let usuarios = await managerUtils.fetchUsuarios()
        .catch(error => {
            if (error.status_cod) throw error;
            console.log(error);
            throw {
                ok: false,
                status_cod: 500,
                data: 'Ocurrió un error inesperado consultando usuarios'
            }
        });

    return usuarios;
}

/**
 * @param {{
 *      correo:string, 
 *      id_sede:number, 
 *      id_rol: number, 
 *      numero_contacto: string, 
 *      habilitado: number, 
 *      id_cargo:number,
 *      clientes: any[]
 *  }} options 
 */
async function modificarUsuario(options) {
    const { id, id_rol, estado, nombres, username, apellidos } = options;

    validator(id, 'el identificador del usuario');

    await updateUsuario(options)
        .then(() => { actualizado = true; })
        .catch(error => {
            if (error.status_cod) throw error;
            console.log(error);
            throw {
                ok: false,
                status_cod: 500,
                data: 'Ocurrió un error inesperado y el usuario no ha sido actualizado',
            }
        });

    return {
        message: 'El usuario fue actualizado con éxito'
    }
}
async function listarPermisos() {
    let permisos = await managerUtils.fetchPermisos()
        .catch(error => {
            if (error.status_cod) throw error;
            console.log(error);
            throw {
                ok: false,
                status_cod: 500,
                data: 'Ocurrió un error inesperado consultando permisos'
            }
        });

    return permisos;
}

async function listarRoles() {
    let permisos = await managerUtils.fetchroles()
        .catch(error => {
            if (error.status_cod) throw error;
            console.log(error);
            throw {
                ok: false,
                status_cod: 500,
                data: 'Ocurrió un error inesperado consultando roles'
            }
        });

    return permisos;
}

async function listarPermisoXUsuario(id_rol, id_usuario) {

    validator(id_rol, 'el rol');
    validator(id_usuario, 'el identificador de usuario');

    let permisosXusuario = await managerUtils.usuarioXpermisos(id_rol, id_usuario)
        .catch(error => {
            if (error.status_cod) throw error;
            console.log(error);
            throw {
                ok: false,
                status_cod: 500,
                data: 'Ocurrió un error inesperado consultando permisos'
            }
        });
    return permisosXusuario;
}

module.exports = {
    createUser,
    listarUsuarios,
    modificarUsuario,
    listarPermisos,
    listarPermisoXUsuario,
    listarRoles
}