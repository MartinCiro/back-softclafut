const bcryptjs = require('bcryptjs');
const config = require('../../../config');

/**
 * Módulo para encapsular las funciones de manejo de contraseñas
 * @param {string} password Contraseña en texto claro
 * @param {number} id_rol ID del rol a asignar
 * @param {number[]} clientes Arreglo de clientes asignados al usuario
 * @returns { {
 *              getEncryptedPassword: () => string, 
 *              comparePassword: (password) => boolean,
 *              encodePassword: (newPass) => string,
 *              comparePasswords: (newPass, oldPass) => boolean,
 *              user: string, 
 *              id_rol: number,
 *              clientes: number[] 
 *            } }
 */
const Usuario = (user, password, id_rol, status=1) => {
    const saltRounds = parseInt(config.SALT); // Usar el número de rondas de salt desde la configuración
    const salt = bcryptjs.genSaltSync(saltRounds);
    const encryptedPassword = bcryptjs.hashSync(password || '', salt);

    return {
        getEncryptedPassword: () => encryptedPassword,
        comparePassword: (plainPassword) => bcryptjs.compareSync(plainPassword, encryptedPassword),
        encodePassword: (newPass) => {
            const newSalt = bcryptjs.genSaltSync(saltRounds); // Generar un nuevo salt
            return bcryptjs.hashSync(newPass, newSalt);
        },
        comparePasswords: (newPass, oldPassHash) => bcryptjs.compareSync(newPass, oldPassHash),
        user,
        id_rol,
        status
    };
};

module.exports = Usuario;
