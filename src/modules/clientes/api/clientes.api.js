const {
  crearCliente,
  modificarCliente,
  listarClientes,
  crearContrato,
  asignarUsuarios,
  getClientePage,
  cargarCalendariosMasivo,
  getListarFechas,
  actualizarFecha,
  crear,
  crearRol,
  crearPermiso,
  deleteFechas,
  sumarFechas
} = require("../controller/clientes.controller");
const ResponseBody = require("../../../shared/model/ResponseBody.model");

/**
 * @param {} req
 * @param {{}} res
 * @returns
 */
const crearClienteAPI = async (req, res) => {
  const {
    nombre,
    nit,
    direccion,
    obligaciones_tributarias,
    contrato,
    habilitado,
  } = req.body;

  const id_sede = req.body.id_sede || req.userData.id_sede;

  if (!nombre) {
    return res.json({
      ok: false,
      status_cod: 400,
      data: "No se ha proporcionado el nombre del cliente",
    });
  }

  if (!nit) {
    return res.json({
      ok: false,
      status_cod: 400,
      data: "No se ha proporcionado el NIT del cliente",
    });
  }

  if (!id_sede) {
    return res.json({
      ok: false,
      status_cod: 400,
      data: "No se ha proporcionado la sede",
    });
  }

  try {
    clienteResponse = await crearCliente(
      { nombre, nit, direccion, id_sede, contrato, habilitado },
      obligaciones_tributarias
    );
    message = new ResponseBody(true, 200, clienteResponse);
  } catch (error) {
    if (error.data) {
      message = new ResponseBody(error.ok, error.status_cod, error.data);
    } else {
      console.log(error);
      message = new ResponseBody(false, 500, {
        message:
          "Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde",
      });
    }
  }

  return res.json(message);
};

/**
 * @param {*} req
 * @param {{}} res
 */
const actualizarClienteAPI = async (req, res) => {
  const {
    nombre,
    direccion,
    obligaciones,
    id_sede,
    fecha_inicio,
    fecha_fin,
    habilitado,
    id_servicio,
  } = req.body;
  const { id } = req.query;

  if (!id) {
    return res.json({
      ok: false,
      status_cod: 400,
      data: "No se ha proporcionado el identificador del cliente",
    });
  }

  if (
    !nombre &&
    !direccion &&
    !obligaciones &&
    !id_sede &&
    !fecha_inicio &&
    !fecha_fin &&
    !habilitado &&
    !id_servicio
  ) {
    return res.json({
      ok: false,
      status_cod: 400,
      data: "No se ha proporcionado campos para actualizar",
    });
  }

  try {
    const updateClienteResponse = await modificarCliente({
      id,
      nombre,
      direccion,
      obligaciones,
      id_sede,
      fecha_inicio,
      fecha_fin,
      habilitado,
      id_servicio,
    });
    message = new ResponseBody(true, 200, updateClienteResponse);
  } catch (error) {
    if (error.status_cod) {
      message = new ResponseBody(error.ok, error.status_cod, error.data);
    } else {
      console.log(error);
      message = new ResponseBody(false, 500, {
        message:
          "Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde.",
      });
    }
  }

  return res.json(message);
};

/**
 * @param {*} req
 * @param {{}} res
 */
const listarClientesAPI = async (req, res) => {
  const { id_cliente, query, obligaciones } = req.query;

  try {
    const listarClienteResponse = await listarClientes({
      id_cliente,
      query,
      obligaciones,
    });
    message = new ResponseBody(true, 200, {
      message: "Se han consultado los clientes exitosamente",
      clientes: listarClienteResponse,
    });
  } catch (error) {
    if (error.data) {
      message = new ResponseBody(error.ok, error.status_cod, error.data);
    } else {
      message = new ResponseBody(false, 500, {
        message:
          "Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde",
      });
    }
  }

  return res.json(message);
};

/**
 * @param {{
 *      body: {
 *          id_cliente: number,
 *          fecha_inicio: Date,
 *          fecha_fin: Date,
 *          id_servicio: number
 *      },
 *      userInfo: {
 *          id_sede: number
 *      }
 * }} req
 * @param {*} res
 */
const crearContratoAPI = async (req, res) => {
  const { id_cliente, fecha_inicio, fecha_fin, id_servicio } = req.body;

  const { id_sede } = req.userData;

  try {
    contratoResponse = await crearContrato({
      id_cliente,
      fecha_inicio,
      fecha_fin,
      id_servicio,
      id_sede,
    });
    message = new ResponseBody(true, 200, {
      message: "Se ha creado el contrato exitosamente",
    });
  } catch (error) {
    if (error.data) {
      message = new ResponseBody(error.ok, error.status_cod, error.data);
    } else {
      message = new ResponseBody(false, 500, {
        message:
          "Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde",
      });
    }
  }

  return res.json(message);
};

/**
 *
 * @param {*} req
 * @param {*} res
 */
const asignacionUsuariosAPI = async (req, res) => {
  const { id_cliente, id_usuario } = req.body;

  if (!id_cliente) {
    return res.json({
      ok: false,
      status_cod: 400,
      data: "No se ha proporcionado id del cliente",
    });
  }

  if (!id_usuario) {
    return res.json({
      ok: false,
      status_cod: 400,
      data: "No se ha proporcionado id del usuario",
    });
  }

  try {
    await asignarUsuarios(id_cliente, id_usuario, req.method);
    message = new ResponseBody(true, 200, {
      message: `Usuario ${
        req.method == "POST" ? "" : "des"
      }asignado correctamente`,
    });
  } catch (error) {
    if (error.data) {
      message = new ResponseBody(error.ok, error.status_cod, error.data);
    } else {
      message = new ResponseBody(false, 500, {
        message:
          "Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde",
      });
    }
  }

  return res.json(message);
};

/**
 *
 * @param {{
 *      query: {
 *          id_cliente: number
 *      },
 *      userInfo: {
 *          id_sede: number,
 *          id_rol: number
 *      }
 * }} req
 * @param {*} res
 */
const getClientePageAPI = async (req, res) => {
  const { id_cliente } = req.query;

  if (!id_cliente) {
    return res.json({
      ok: false,
      status_cod: 400,
      data: "No se ha proporcionado identificador del cliente",
    });
  }

  try {
    const response = await getClientePage(id_cliente);
    message = new ResponseBody(true, 200, response);
  } catch (error) {
    if (error.data) {
      message = new ResponseBody(error.ok, error.status_cod, error.data);
    } else {
      console.log(error);
      message = new ResponseBody(false, 500, {
        message:
          "Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde",
      });
    }
  }

  return res.json(message);
};

const actualizarCalendarioAPI = async (req, res) => {
  const { file64 } = req.body;
  let message;
  // Validar campos
  if (!file64) {
    return res.json(
      new ResponseBody(
        false,
        400,
        "No se ha proporcionado el archivo en base64 o el nombre del archivo"
      )
    );
  }

  try {
    let response = await cargarCalendariosMasivo(file64);
    message = new ResponseBody(true, 200, "Datos cargados correctamente");
  } catch (error) {
    if (error.status_cod) {
      message = new ResponseBody(error.ok, error.status_cod, error.data);
    } else {
      console.log(error);
      message = new ResponseBody(false, 500, {
        message:
          "Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde",
      });
    }
    message = new ResponseBody(false, 500, error);
  }

  return res.json(message);
};

const listarFechasAPI = async (req, res) => {
  const element = req.query.element;
  let message;
  try {
    const resultado = await getListarFechas(element);
    message = new ResponseBody(true, 200, resultado);
  } catch (error) {
    if (error.status_cod) {
      message = new ResponseBody(error.ok, error.status_cod, error.data);
    } else {
      console.log(error);
      message = new ResponseBody(
        false,
        500,
        "Ocurrió un error en el proceso para listar las fechas"
      );
    }
  }

  return res.json(message);
};

const actualizarFechaAPI = async (req, res) => {
  let message;
  const { ide, tabla, cambio, campo } = req.body;
  let { id } = req.body;
  if (id === null && (ide !== "null" || ide !== null)) {
    id = ide;
  }
  try {
    await actualizarFecha({ id, tabla, cambio, campo });
    message = new ResponseBody(true, 200, {
      message: "Se ha actualizado los datos exitosamente",
    });
  } catch (error) {
    if (error.status_cod) {
      message = new ResponseBody(error.ok, error.status_cod, error.data);
    } else {
      console.log(error);
      message = new ResponseBody(false, 500, {
        message:
          "Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde.",
      });
    }
  }

  return res.json(message);
};

const crearAPI = async (req, res) => {
  const { id, descripcion, monto, fecha, tipo } = req.body;
  
  try {
    contratoResponse = await crear({ id, descripcion, monto, fecha, tipo });
    message = new ResponseBody(true, 200, {
      message: `Se ha creado el ${tipo} exitosamente`,
    });
  } catch (error) {
    if (error.data) {
      message = new ResponseBody(error.ok, error.status_cod, error.data);
    } else {
      message = new ResponseBody(false, 500, {
        message:
          "Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde",
      });
    }
  }

  return res.json(message);
};

const crearRolAPI = async (req, res) => {
  const { nombre, descripcion } = req.body;

  try {
    contratoResponse = await crearRol({ nombre, descripcion });
    message = new ResponseBody(true, 200, {
      message: "Se ha creado el rol exitosamente",
    });
  } catch (error) {
    if (error.data) {
      message = new ResponseBody(error.ok, error.status_cod, error.data);
    } else {
      message = new ResponseBody(false, 500, {
        message:
          "Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde",
      });
    }
  }

  return res.json(message);
};

const crearPermisoAPI = async (req, res) => {
  const { nombre, descripcion } = req.body;

  try {
    contratoResponse = await crearPermiso({ nombre, descripcion });
    message = new ResponseBody(true, 200, {
      message: "Se ha creado el permiso exitosamente",
    });
  } catch (error) {
    if (error.data) {
      message = new ResponseBody(error.ok, error.status_cod, error.data);
    } else {
      message = new ResponseBody(false, 500, {
        message:
          "Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde",
      });
    }
  }

  return res.json(message);
};

const deleteFechasAPI = async (req, res) => {
  const {id, tipo}  = req.body;
  let message;
  try {
    const resultado = await deleteFechas({id, tipo});
    message = new ResponseBody(true, 200, resultado);
  } catch (error) {
    if (error.status_cod) {
      message = new ResponseBody(error.ok, error.status_cod, error.data);
    } else {
      console.log(error);
      message = new ResponseBody(
        false,
        500,
        "Ocurrió un error en el proceso para listar las fechas"
      );
    }
  }

  return res.json(message);
};

const sumarFechasAPI = async (req, res) => {
  
  try {
    const response = await sumarFechas();
    message = new ResponseBody(true, 200, response);
  } catch (error) {
    if (error.data) {
      message = new ResponseBody(error.ok, error.status_cod, error.data);
    } else {
      console.log(error);
      message = new ResponseBody(false, 500, {
        message:
          "Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde",
      });
    }
  }

  return res.json(message);
};

module.exports = {
  crearClienteAPI,
  actualizarClienteAPI,
  listarClientesAPI,
  crearContratoAPI,
  asignacionUsuariosAPI,
  getClientePageAPI,
  actualizarCalendarioAPI,
  listarFechasAPI,
  actualizarFechaAPI,
  crearAPI,
  crearRolAPI,
  crearPermisoAPI,
  deleteFechasAPI,
  sumarFechasAPI
};
