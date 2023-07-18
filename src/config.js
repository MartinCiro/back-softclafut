import {config} from 'dotenv' //intentar leer las variables de entorno definidas en el pc

config();

console.log(process.env.PORT);

export default{
    port: process.env.PORT || 3000,
    dbUser: process.env.DB_USER || '',
    dbPassword: process.env.DB_PASSWORD || '',
    dbHost: process.env.DB_HOST || '',
    dbDatabase: process.env.DB_DATABASE || '',
}