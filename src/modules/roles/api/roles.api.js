const {
  listaRoles,
  actualizaRoles,
  creaRoles,
  eliminaRoles,
  listaXRoles
} = require("../controller/roles.controller");
const ResponseBody = require("../../../shared/model/ResponseBody.model");

const creaRolesAPI = async (req, res) => {
  const { nombre, descripcion, permisos } = req.body;
  let message;

  try {
    await creaRoles({ nombre, descripcion, permisos });
    message = new ResponseBody(true, 200, {
      message: "Se ha creado el rol exitosamente",
    });
  } catch (error) {
    error.result && !error.result.toLowerCase().includes("error")
      ? (message = new ResponseBody(error.ok, error.status_cod, error.result)):
      (message = new ResponseBody(false, 500, {
        message:
          "Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde",
      }))
  }

  return res.json(message);
};

const listaRolesxPermisosAPI = async (req, res) => {
  const { id } = req.body;
  let message;
  try {
    const resultado = await listaXRoles(id);
    message = new ResponseBody(true, 200, resultado);
  } catch (error) {
    message = error.status_cod 
    ? new ResponseBody(error.ok, error.status_cod, error.data)
    : new ResponseBody(false, 500, "Ocurrió un error en el proceso para listar los roles");
  }
  return res.json(message);
};

const listaRolesAPI = async (req, res) => {
  const { id } = req.body;

  let message;
  try {
    const resultado = await listaRoles(id);
    message = new ResponseBody(true, 200, resultado);
  } catch (error) {
    message = error.status_cod 
    ? new ResponseBody(error.ok, error.status_cod, error.data)
    : new ResponseBody(false, 500, "Ocurrió un error en el proceso para listar los roles");
  }
  return res.json(message);
};

const actualizaRolesAPI = async (req, res) => {
  let message;
  const {
    id, nombre, descripcion, estado
  } = req.body;
  
  try {
    await actualizaRoles({ id, nombre, descripcion, estado });
    message = new ResponseBody(true, 200, {
      message: "Se ha actualizado los datos exitosamente",
    });
  } catch (error) {
    error.result && !error.result.toLowerCase().includes("error")
      ? (message = new ResponseBody(error.ok, error.status_cod, error.result)):
      (message = new ResponseBody(false, 500, {
        message:
          "Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde",
      }))
  }

  return res.json(message);
};

const eliminaRolesAPI = async (req, res) => {
  const { id } = req.body;
  let message;

  try {
    await eliminaRoles({ id });
    message = new ResponseBody(true, 200, {
      message: "El permiso ha sido eliminado exitosamente",
    });
  } catch (error) {
    error.result && !error.result.toLowerCase().includes("error")
      ? (message = new ResponseBody(error.ok, error.status_cod, error.result)):
      (message = new ResponseBody(false, 500, {
        message:
          "Ha ocurrido un error inesperado. Por favor inténtelo nuevamente más tarde",
      }))
  }

  return res.json(message);
};

module.exports = {
  listaRolesAPI,
  listaRolesxPermisosAPI,
  actualizaRolesAPI,
  creaRolesAPI,
  eliminaRolesAPI
};
