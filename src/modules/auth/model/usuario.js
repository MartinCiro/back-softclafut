const bcryptjs = require('bcryptjs');
const config = require('../../../config');

/**
 * Módulo revelador para encapsular las funciones de validación de usuarios
 * @param {string} password
 * @param {number} id_rol id del rol a asignar
 * @param {number[]} clientes arreglo de clientes asignados al usuario
 * @returns { {
 *              getEncryptedPassword: () => string, 
 *              comparePassword: (hash) => boolean,
 *              encodePassword: (newPass) => string,
 *              comparePasswords: (newPass, oldPass) => boolean,
 *              email: string, 
 *              pass: string, 
 *              id_organizacion: string, 
 *              foto_perfil?: string,
 *              id_estado?: string,
 *              id_rol: number,
 *              clientes: number[] } }
 */
const Usuario = (user, password, id_rol) => {
    const pass = password || '';
    const salt = bcryptjs.genSaltSync(parseInt(config.SALT));
    const encryptedPassword = bcryptjs.hashSync(pass, salt);

    return {
        getEncryptedPassword: () => (encryptedPassword),
        comparePassword: (hash) => bcryptjs.compareSync(pass, hash),
        encodePassword: (newPass) => bcryptjs.hashSync(newPass, salt),
        comparePasswords: (newPass, oldPass) => bcryptjs.compareSync(oldPass, newPass),
        user,
        id_rol
    }
}

module.exports = Usuario;