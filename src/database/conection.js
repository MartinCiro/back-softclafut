import config  from '../config';
import sql from 'mssql'

const dbSettings = {
    user: config.dbUser,
    password: config.dbPassword,
    server: config.dbHost,
    database: config.dbDatabase,
    options: {
        encrypt: true, // for azure
        trustServerCertificate: true // change to true for local dev / self-signed certs
      }
}

export async function getConnection(){
    try {
        const pool = await sql.connect(dbSettings);
        return pool;
    } catch (error) {
        console.log(error);
    }
}

/*const result = await pool.request().query('select * from equipos;');
    console.log(result) */
//getConecction();
export { sql };