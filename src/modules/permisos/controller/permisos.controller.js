const permisosUtils = require("../utils/permisos.utils");

async function creaPermisos(dataPermiso) {
  const { nombre } = dataPermiso;

  permisosUtils.validar(nombre, "el nombre");
  return permisosUtils.existe(dataPermiso)
  .then((data) => {
    return data;
  }).catch((error) => {
    if (error.status_cod) throw error;
    throw {
      ok: false,
      status_cod: 500,
      data: "Ocurrido un error inesperado y el permiso no ha sido creado",
    };
  });
}

async function listaPermisos(id) {
  return permisosUtils
    .consultaPermisos(id)
    .then((data) => {
      return data;
    })
    .catch((error) => {
      if (error.status_cod) throw error;
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error inesperado y el permiso no ha sido creado",
      };
    });
}

async function actualizaPermisos(options) {
  const { id, nombre, descripcion, estado } = options;
  permisosUtils.validar(id, "el elemento a modificar");

  return await permisosUtils.actualizaPermisos(options)
  .then((data) => data)
  .catch((error) => {
    if (error.status_cod) throw error;
    throw {
      ok: false,
      status_cod: 500,
      data: "Ocurrió un error inesperado y el cliente no ha sido actualizado",
    };
  });
}

async function eliminaPermisos(options) {
  const { id } = options;

  permisosUtils.validar(id, "el id del permiso a eliminar");
  return await permisosUtils.eliminaPermisos(options)
  .then((data) => data)
  .catch((error) => {
    if (error.status_cod) throw error;
    throw {
      ok: false,
      status_cod: 500,
      data: "Ocurrido un error consultando la información en base de datos",
    };
  })
}

module.exports = {
  listaPermisos,
  actualizaPermisos,
  creaPermisos,
  eliminaPermisos
};
