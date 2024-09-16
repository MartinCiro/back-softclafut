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
router.get('/clientes', isAuthenticatedMW, checkPermissions([1, 2]), listarFechasAPI)

module.exports = router;