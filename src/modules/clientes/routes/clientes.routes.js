const { Router } = require('express');
const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

// api handlers
const { crearClienteAPI, actualizarClienteAPI, listarClientesAPI, crearContratoAPI,
    asignacionUsuariosAPI, getClientePageAPI, actualizarCalendarioAPI, listarFechasAPI, actualizarFechaAPI, crearAPI, crearEgresoAPI, crearRolAPI, crearPermisoAPI, deleteFechasAPI, sumarFechasAPI } = require('../api/clientes.api');
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
router.get('/clientes/getClientePage', isAuthenticatedMW, checkPermissions([1, 2]), getClientePageAPI)

router.get('/clientes', (req, res) => {
    return res.send({ 'status': 'on' });
})
module.exports = router;