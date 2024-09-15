const { config } = require('dotenv');

config();

module.exports = {
    // Server Config
    port: process.env.PORT || 3000,
    env: process.env.env || 'Dev',

    // DBConn
    UserDB: process.env.UserDB,
    PasswordBD: process.env.PasswordDB,
    ServerDB: process.env.ServerDB,
    Database: process.env.Database,
    PortDB: process.env.PortDB,

    // Auth
    JWT_SECRETO: process.env.JWT_SECRETO,
    SALT: process.env.JWT_SALT,
    JWT_TIEMPO_EXPIRA: process.env.JWT_TIEMPO_EXPIRA || '1h',

};