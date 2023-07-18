//importo router para crear rutas
import {Router} from 'express';
import {createProduct, getProductById, getProducts, deleteProductById, getTotalProducts, updateProductById} from '../controllers/products.controller';

const router = Router();

router.get('/products', getProducts)

router.post('/products', createProduct)

router.get('/products/count', getTotalProducts)

router.delete('/products/:id', deleteProductById)

router.put('/products/:id', updateProductById)

router.get('/products/:id', getProductById)

export default router