const { Router } = require('express');

const authRoutes = require('./modules/auth/routes/auth.routes');
const usuarioRoutes = require('./modules/usuarios/routes/usuarios.routes');
const productoRoutes = require('./modules/productos/routes/productos.routes');


const router = Router();

// Status api endpoint
router.get('/api-status', (req, res) => {
    return res.send({ 'status': 'on' });
});

router.use(authRoutes);
router.use(usuarioRoutes);
router.use(productoRoutes);

module.exports = router;