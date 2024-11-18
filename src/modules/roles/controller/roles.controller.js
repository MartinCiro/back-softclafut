const rolesUtils = require("../utils/roles.utils");

async function creaRoles(options) {
  const { nombre, descripcion, permisos  } = options;

  rolesUtils.validar(nombre, "el nombre");
  rolesUtils.validar(permisos, "los permisos");

  return rolesUtils.creaRoles(options)
  .then((data) => {
    return data;
  }).catch((error) => {
    if (error.status_cod) throw error;
    throw {
      ok: false,
      status_cod: 500,
      data: "Ocurrido un error inesperado y el rol no ha sido creado",
    };
  });
}

async function listaXRoles(id) {
  return rolesUtils
    .consultaXRoles(id)
    .then((data) => {
      return data;
    })
    .catch((error) => {
      if (error.status_cod) throw error;
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error inesperado y el rol no ha sido creado",
      };
    });
}

async function listaRoles(id) {
  return rolesUtils
    .consultaRoles(id)
    .then((data) => {
      return data;
    })
    .catch((error) => {
      if (error.status_cod) throw error;
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error inesperado y el rol no ha sido creado",
      };
    });
}

async function actualizaRoles(options) {
  const { id, nombre, descripcion, estado } = options;
  rolesUtils.validar(id, "el elemento a modificar");

  return await rolesUtils.actualizaRoles(options)
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

async function eliminaRoles(options) {
  const { id } = options;

  rolesUtils.validar(id, "el id del role a eliminar");
  return await rolesUtils.eliminaRoles(options)
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
  listaRoles,
  listaXRoles,
  actualizaRoles,
  creaRoles,
  eliminaRoles
};
