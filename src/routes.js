const { Router } = require('express');

const authRoutes = require('./modules/auth/routes/auth.routes');
const rolesRoutes = require('./modules/roles/routes/roles.routes');
const permisosRoutes = require('./modules/permisos/routes/permisos.routes');


const router = Router();

// Status api endpoint
router.get('/api-status', (req, res) => {
    return res.send({ 'status': 'on' });
});

router.use(authRoutes);
router.use(rolesRoutes);
router.use(permisosRoutes);

module.exports = router;