const { Router } = require('express');

// api handlers
const { eliminaPermisosAPI, actualizaPermisosAPI, listaPermisosAPI, creaPermisosAPI } = require('../api/permisos.api');
const { isAuthenticatedMW, checkPermissions } = require('../../auth/api/auth.api');


const router = Router();

/**
 *  {
 *      headers: {
 *          Authorization | jwt: string,
 *      },
 *      query: {
 *          id_cliente: number
 *      }
 *  }
 */
router.post('/permisos', creaPermisosAPI)

/**
 *  {
 *      headers: {
 *          Authorization | jwt: string,
 *      },
 *      query: {
 *          id_cliente: number
 *      }
 *  }
 */
router.get('/permisos', listaPermisosAPI)

router.patch('/permisos', actualizaPermisosAPI)

router.delete('/permisos', eliminaPermisosAPI)

module.exports = router;