const {
  listaPermisos,
  actualizaPermisos,
  creaPermisos,
  eliminaPermisos
} = require("../controller/permisos.controller");
const ResponseBody = require("../../../shared/model/ResponseBody.model");

const creaPermisosAPI = async (req, res) => {
  const { nombre, descripcion } = req.body;
  let message;

  try {
    await creaPermisos({ nombre, descripcion });
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

const listaPermisosAPI = async (req, res) => {
  let { id } = req.body;
  let message;
  try {
    const resultado = await listaPermisos(id);
    message = new ResponseBody(true, 200, resultado);
  } catch (error) {
    message = error.status_cod 
    ? new ResponseBody(error.ok, error.status_cod, error.data)
    : new ResponseBody(false, 500, "Ocurrió un error en el proceso para listar las permisos");
  }
  return res.json(message);
};

const actualizaPermisosAPI = async (req, res) => {
  let message;
  const {
    id, nombre, descripcion, estado
  } = req.body;
  
  try {
    await actualizaPermisos({ id, nombre, descripcion, estado });
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

const eliminaPermisosAPI = async (req, res) => {
  const { id } = req.body;
  let message;

  try {
    await eliminaPermisos({ id });
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
  listaPermisosAPI,
  actualizaPermisosAPI,
  creaPermisosAPI,
  eliminaPermisosAPI
};
