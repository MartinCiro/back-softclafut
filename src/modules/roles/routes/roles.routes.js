const { Router } = require('express');

// api handlers
const { eliminaRolesAPI, actualizaRolesAPI, listaRolesxPermisosAPI,listaRolesAPI, creaRolesAPI } = require('../api/roles.api');
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
router.post('/rol', creaRolesAPI)

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
router.get('/rol', listaRolesAPI)

router.get('/rolx', listaRolesxPermisosAPI)

router.patch('/rol', actualizaRolesAPI)

router.delete('/rol', eliminaRolesAPI)

module.exports = router;