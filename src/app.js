import express from 'express'
import config from './config'
import productsRoutes from './routes/products.routes'

const app = express()

//setings
app.set('port', config.port);

// middlewares
app.use(express.json()); //aceptar datos en json
app.use(express.urlencoded({ extended: false })); //aceptar datos en urlencoded o formularios

app.use(productsRoutes)
 
export default app