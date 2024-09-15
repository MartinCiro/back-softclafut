//const sql = require('pg');
const { Pool } = require("pg");
const config = require("../config.js");

const dbauth = {
    user: config.UserDB,
    password: config.PasswordBD,
    host: config.ServerDB,
    port: config.PortDB,
    database: config.Database
};

const dbauth_impuestos = {
  user: config.UserDBImpuestos,
  password: config.PasswordBDImpuestos,
  host: config.ServerDB,
  port: config.PortDB,
  database: config.DatabaseImpuestos
};
/**
 * Método para conectarse a la base de datos de nexia automation
 * @returns {Promise<Pool>}
 */
function getConnection() {
  return new Pool(dbauth);
}

/**
 * Método para conectarse a la base de datos de impuestos nacionales
 * @returns {Promise<Pool>}
 */
function getImpuestosConnection() {
  return new Pool(dbauth_impuestos);
}

module.exports = { getConnection, getImpuestosConnection };



//para usar mysql ------------------
/* const mysql = require("mysql2/promise"); // Importa la versión de Promise de mysql2
const config = require("../config.js");

const dbauth = {
    user: config.UserDB,
    password: config.PasswordBD,
    host: config.ServerDB,
    port: config.PortDB,
    database: config.Database
};

const dbauth_impuestos = {
  user: config.UserDBImpuestos,
  password: config.PasswordBDImpuestos,
  host: config.ServerDB,
  port: config.PortDB,
  database: config.DatabaseImpuestos,
};

/**
 * Método para conectarse a la base de datos de nexia automation
 * @returns {Promise<mysql.Pool>}
 */
/* async function getConnection() {
  const pool = mysql.createPool(dbauth);
  return pool;
} */

/**
 * Método para conectarse a la base de datos de impuestos nacionales
 * @returns {Promise<mysql.Pool>}
 */
/* async function getImpuestosConnection() {
  const pool = mysql.createPool(dbauth_impuestos);
  return pool;
} 

module.exports = { getConnection, getImpuestosConnection };
 */