const ResponseBody = require('../../../shared/model/ResponseBody.model');
const { crearImpuesto, listarImpuestos, asignarImpuesto, listarCalendarios } = require("../controller/impuesto.controller");

/**
 * @param {{
 *      body: {
 *          nombre: string,
 *          tipo: string,
 *          id_municipio: number,
 *          municipio: string,
 *          departamento: string,
 *      }
 * }} req 
 * @param {*} res
 */
const crearImpuestoAPI = async (req, res) => {
    const { nombre, tipo, id_municipio, municipio, departamento } = req.body;
    let message;

    if (!nombre) {
        return res.json({
            ok: false,
            status_cod: 400,
            data: 'No se ha proporcionado nombre de la obligación'
        });
    }

    if (!tipo) {
        return res.json({
            ok: false,
            status_cod: 400,
            data: 'No se ha proporcionado el tipo de la obligación'
        });
    }

    if (!id_municipio && !municipio && !departamento) {
        return res.json({
            ok: false,
            status_cod: 400,
            data: 'No se ha proporcionado el municipio'
        });
    }

    try {
        let result = await crearImpuesto({ nombre, tipo, id_municipio, municipio, departamento });
        message = new ResponseBody(true, 200, { message: 'Se ha creado el impuesto exitosamente', result });
    } catch (error) {
        if (error.data) {
            message = new ResponseBody(error.ok, error.status_cod, error.data);
        } else {
            console.log(error);
            message = new ResponseBody(false, 500, { message: 'Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde' });
        }
    }

    return res.json(message);
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const listarImpuestosAPI = async (req, res) => {
    let message;

    try {
        let response = await listarImpuestos();
        message = new ResponseBody(true, 200, response);
    } catch (error) {
        if (error.data) {
            message = new ResponseBody(error.ok, error.status_cod, error.data);
        } else {
            console.log(error);
            message = new ResponseBody(false, 500, { message: 'Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde' });
        }
    }

    return res.json(message);
}

const listarCalendariosAPI = async (req, res) => {
    let message;

    try {
        let result = await listarCalendarios();
        message = new ResponseBody(true, 200, result);
    } catch (error) {
        if (error.data) {
            message = new ResponseBody(error.ok, error.status_cod, error.data);
        } else {
            console.log(error);
            message = new ResponseBody(false, 500, { message: 'Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde' });
        }
    }

    return res.json(message);
}

/**
 * @param {{
 *      body: {
 *          id_impuesto: number,
 *          id_cliente: number,
 *          id_calendario: number
 *      }
 * }} req 
 * @param {*} res
 */
const asignarImpuestoAPI = async (req, res) => {
    const { id_impuesto, id_cliente, id_calendario } = req.body;

    try {
        await asignarImpuesto(id_impuesto, id_cliente, id_calendario);
        message = new ResponseBody(true, 200, { message: 'El impuesto ha sido asignado exitosamente' });
    } catch (error) {
        if (error.data) {
            message = new ResponseBody(error.ok, error.status_cod, error.data);
        } else {
            console.log(error);
            message = new ResponseBody(false, 500, { message: 'Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde' });
        }
    }

    return res.json(message);
}

const desasignarImpuestoAPI = async (req, res) => {

}

module.exports = {
    crearImpuestoAPI,
    listarImpuestosAPI,
    asignarImpuestoAPI,
    listarCalendariosAPI
}