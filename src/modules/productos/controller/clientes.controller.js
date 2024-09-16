const clienteUtils = require("../utils/clientes.utils");
const { utils } = require("xlsx");

/**
 *
 * @param {{
 *          nombre: string,
 *          nit: string,
 *          id_sede: string
 *        }} cliente
 * @param {number[]} obligaciones_tributarias
 */
async function crearCliente(cliente) {
  let error_message;

  if (!cliente.nombre)
    throw {
      ok: false,
      status_cod: 400,
      data: "No se ha proporcionado el nombre del cliente",
    };

  if (!cliente.nit)
    throw {
      ok: false,
      status_cod: 400,
      data: "No se ha proporcionado el NIT del cliente",
    };

  if (!cliente.id_sede)
    throw {
      ok: false,
      status_cod: 400,
      data: "No se ha proporcionado el id_sede del cliente",
    };

  const id_cliente = await clienteUtils
    .insertarCliente(cliente)
    .then((data) => {
      return data;
    })
    .catch((error) => {
      if (error.status_cod) throw error;
      console.log(error);
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error inesperado y el usuario no ha sido creado",
      };
    });

  if (cliente.contrato) {
    const { fecha_inicio, fecha_fin, id_servicio } = cliente.contrato;
    const { id_sede } = cliente;

    if (!fecha_inicio || !fecha_fin || !id_servicio || !id_sede) {
      error_message =
        "El cliente fue creado, sin embargo la información de contrato está incompleta";
    } else {
      await crearContrato({
        id_cliente,
        fecha_inicio,
        fecha_fin,
        id_servicio,
        id_sede,
      }).catch((error) => {
        error_message =
          "El cliente fue creado, sin embargo ocurrió un error creando el contrato";
      });
    }
  }

  return {
    id_cliente,
    message: error_message || "El usuario fue creado con éxito",
  };
}

/**
 *
 * @param {{nombre: string | undefined,
 *          nit: string | undefined,
 *          ubicacion: string | undefined,
 *          id_sede: number,
 *          id: number,
 *          obligaciones: number[] | undefined
 *          }} options
 */
async function modificarCliente(options) {
  let error_message,
    actualizado = false;
  const {
    nombre,
    direccion,
    id_sede,
    fecha_inicio,
    fecha_fin,
    habilitado,
    id_servicio,
  } = options;

  if (!options.id)
    throw {
      ok: false,
      status_cod: 400,
      data: "No se ha proporcionado el id en las opciones",
    };

  if (
    !nombre &&
    !direccion &&
    !id_sede &&
    !fecha_inicio &&
    !fecha_fin &&
    !habilitado &&
    !id_servicio
  ) {
    throw {
      ok: false,
      status_cod: 400,
      data: "No se ha proporcionado campos para actualizar",
    };
  }

  await clienteUtils.updateCliente(options).catch((error) => {
    if (error.status_cod) throw error;
    console.log(error);
    throw {
      ok: false,
      status_cod: 500,
      data: "Ocurrió un error inesperado y el cliente no ha sido actualizado",
    };
  });

  if (!fecha_inicio || !fecha_fin || !id_servicio) {
    await clienteUtils.updateContrato(options).catch((error) => {
      if (error.status_cod) throw error;
      console.log(error);
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error inesperado y el contrato no ha sido actualizado",
      };
    });
  }
  actualizado = true;

  return {
    message: error_message || "Cliente fue actualizado con éxito",
  };
}

/**
 * @param {{
 *      id_cliente: number,
 *      query: string,
 * }} options
 */
async function listarClientes(options) {
  let clientes = await clienteUtils.fetchClientes(options).catch((error) => {
    if (error.status_cod) throw error;
    console.log(error);
    throw {
      ok: false,
      status_cod: 500,
      data: "Ocurrió un error inesperado consultando clientes",
    };
  });

  return clientes;
}

async function listarRol(id_rol) {
  if (!id_rol)
    throw {
      ok: false,
      status_cod: 400,
      data: "No se ha proporcionado el id",
    };

  return clienteUtils
    .consultarRol(id_rol)
    .then((data) => {
      return data;
    })
    .catch((error) => {
      if (error.status_cod) throw error;
      console.log(error);
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error inesperado y el usuario no ha sido creado",
      };
    });
}

/**
 * @param {{
 *          id_cliente: number,
 *          fecha_inicio: Date,
 *          fecha_fin: Date,
 *          id_servicio: number,
 *          id_sede: number
 *      }} contrato
 */
async function crearContrato(contrato) {
  const { id_cliente, fecha_inicio, fecha_fin, id_servicio, id_sede } =
    contrato;

  if (!id_cliente)
    throw {
      ok: false,
      status_cod: 400,
      data: "No se ha proporcionado id del cliente",
    };

  return await clienteUtils
    .insertarContrato(contrato)
    .then((data) => {
      return data;
    })
    .catch((error) => {
      if (error.status_cod) throw error;
      console.log(error);
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error inesperado y el contrato no ha sido creado",
      };
    });
}

/**
 * @param {number} id_cliente
 * @param {number} id_usuario
 */
async function asignarUsuarios(id_cliente, id_usuario, method) {
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

  if (method === "POST") {
    try {
      await clienteUtils.insertClientRelationship(id_usuario, [id_cliente]);
    } catch (error) {
      if (error.status_cod) throw error;
      if (error.code != "23505") {
        console.log(error);

        throw {
          ok: false,
          status_cod: 500,
          data: "Ocurrió un error inesperado y el usuario no fue asignado",
        };
      }
    }
  } else if (method === "DELETE") {
    try {
      await clienteUtils.deleteClientRelationship(id_usuario, id_cliente);
    } catch (error) {
      if (error.status_cod) throw error;
      console.log(error);
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error inesperado y el usuario no fue asignado",
      };
    }
  }
}

/**
 * @param {number} id_cliente
 * @param {number} id_rol
 * @param {number} id_sede
 */
async function getClientePage(id_cliente) {
  let response = {};

  // Obtener el perfil
  try {
    let info_user = await clienteUtils.getClienteProfile(id_cliente);

    info_user = info_user.sort((a, b) => {
      if (a.fecha_inicio < b.fecha_inicio) {
        return 1;
      }
      if (a.fecha_inicio > b.fecha_inicio) {
        return -1;
      }

      return 0;
    })[0];

    response = { info_user };
  } catch (error) {
    if (error.status_cod) throw error;
    console.log(error);
    throw {
      ok: false,
      status_cod: 500,
      data: "Ocurrió un error inesperado y no se ha podido consultar la información del usuario",
    };
  }

  // Impuestos
  try {
    const vencimientos = await impuestoUtils.fetchImpuestoxcliente(id_cliente);

    let mapping = (item) => {
      const {
        id_impuesto,
        nombre,
        id_municipio,
        municipio,
        departamento,
        id_impuestoxmunicipio,
        tipo,
        periodicidad,
      } = item;

      return {
        id_impuesto,
        nombre,
        id_municipio,
        municipio,
        departamento,
        id_impuestoxmunicipio,
        tipo,
        periodicidad,
      };
    };

    let impuestos = vencimientos
      .map(mapping)
      .filter(
        (venc, index, array) =>
          array.findIndex(
            (item) => JSON.stringify(venc) === JSON.stringify(item)
          ) === index
      )
      .map((venc) => ({
        ...venc,
        vencimientos: vencimientos
          .filter(
            (item) => JSON.stringify(venc) === JSON.stringify(mapping(item))
          )
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
          .map((item) => {
            const { fecha, periodo } = item;
            return { fecha, periodo };
          }),
      }));

    response = { ...response, impuestos };
  } catch (error) {
    console.log(error);
  }

  // Usuarios
  try {
    const usuarios = await clienteUtils.fetchUsuarioxcliente(id_cliente);
    response = { ...response, usuarios };
  } catch (error) {
    console.log(error);
  }

  return response;
}

const extractRut = async (formulario) => {
  if (!formulario)
    throw {
      ok: false,
      status_cod: 400,
      data: "No se ha proporcionado el formulario",
    };

  try {
    const form = await requestAPIRUT(formulario);
    response = { info_user };
  } catch (error) {
    console.log(error);
  }
};

async function cargarCalendariosMasivo(file64) {
  // Extraer Excel
  let periodos = clienteUtils.excelToJson(clienteUtils.saveExcel(file64), [
    "id_impuesto",
    "uvt",
    "regimen",
    "digito",
    "vigencia",
    "periodicidad",
    "periodo",
    "fecha",
  ]);

  // CB para crear un index o ID provisional al calendario
  let indexer = (it) =>
    `${it.id_impuesto}${it.uvt}${it.regimen}${it.digito}${it.vigencia}${it.periodicidad}`;

  let calendarios = [];
  for (const [i, vencimiento] of periodos.entries()) {
    let indexCalendario = calendarios.findIndex(
      (it) => it.name == indexer(vencimiento)
    );
    if (indexCalendario < 0)
      indexCalendario =
        calendarios.push({
          name: indexer(vencimiento),
          ...vencimiento,
          periodo: undefined,
          fecha: undefined,
          periodos: [],
        }) - 1;

    const excelBaseDate = new Date(Date.UTC(1899, 11, 30));
    const mili =
      excelBaseDate.getTime() + (vencimiento.fecha + 1) * 24 * 60 * 60 * 1000;

    vencimiento.fecha = new Date(mili);

    calendarios[indexCalendario].periodos.push({
      periodo: vencimiento.periodo,
      fecha: vencimiento.fecha,
    });
  }

  for (const calendario of calendarios) {
    let idCalendario = await clienteUtils.insertarCalendario(calendario);
    for (const periodo of calendario.periodos) {
      //retirar en caso de querer enviar solo un dato
      await clienteUtils.insertarPeriodos(idCalendario, periodo);
    }
  }
}

async function selectUVT_Cliente(id_cliente, uvt, digito_verificacion, nit) {
  function validar(valor, nombre) {
    if (!valor)
      throw {
        ok: false,
        status_cod: 400,
        data: `No se ha proporcionado ${nombre}`,
      };
  }
  validar(id_cliente, "el id del cliente");
  validar(uvt, "el uvt");
  validar(digito_verificacion, "el digito de verificacion");
  validar(nit, "el nit");

  let uvtCliente = await clienteUtils
    .UVT_Cliente(id_cliente, uvt, digito_verificacion, nit)
    .catch((error) => {
      if (error.status_cod) throw error;
      console.log(error);
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error inesperado y el rut no ha sido creado",
      };
    });
  return uvtCliente;
}

async function getListarFechas(element) {
  try {
    return await clienteUtils.getFechas(element);
  } catch (error) {
    if (error.status_cod) throw error;
    console.log(error);
    throw {
      ok: false,
      status_cod: 500,
      data: "Ha ocurrido un error consultando la información en base de datos",
    };
  }
}

async function actualizarFecha(options) {
  const { tabla, id, cambio, campo } = options;
  clienteUtils.validar(tabla, "el nombre de la tabla");
  clienteUtils.validar(id, "el elemento a modificar");
  clienteUtils.validar(cambio, "el nuevo valor");
  clienteUtils.validar(campo, "el campo a modificar");
  await clienteUtils.updateFechas(options).catch((error) => {
    if (error.status_cod) throw error;
    console.log(error);
    throw {
      ok: false,
      status_cod: 500,
      data: "Ocurrió un error inesperado y el cliente no ha sido actualizado",
    };
  });
}

async function crear(options) {
  const { id, descripcion, monto, fecha, tipo } = options;

  clienteUtils.validar(descripcion, "la descripción");
  clienteUtils.validar(monto, "el monto");
  clienteUtils.validar(fecha, "la fecha de ingreso");
  clienteUtils.validar(tipo, "el tipo de ingreso/egreso");

  return await clienteUtils
    .insertarValor(options)
    .then((data) => {
      return data;
    })
    .catch((error) => {
      if (error.status_cod) throw error;
      console.log(error);
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error inesperado y el registro ingreso no ha sido creado",
      };
    });
}

async function crearRol(dataRol) {
  const { nombre, descripcion } = dataRol;

  clienteUtils.validar(nombre, "el nombre");
  clienteUtils.validar(descripcion, "la descripción");

  return await clienteUtils
    .crearRol(dataRol)
    .then((data) => {
      return data;
    })
    .catch((error) => {
      if (error.status_cod) throw error;
      console.log(error);
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error inesperado y el rol no ha sido creado",
      };
    });
}

async function crearPermiso(dataPermiso) {
  const { nombre, descripcion } = dataPermiso;

  clienteUtils.validar(nombre, "el nombre");

  return await clienteUtils
    .crearPermiso(dataPermiso)
    .then((data) => {
      return data;
    })
    .catch((error) => {
      if (error.status_cod) throw error;
      console.log(error);
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error inesperado y el rol no ha sido creado",
      };
    });
}

async function deleteFechas(iden) {
  const { id, tipo } = iden;

  clienteUtils.validar(id, "el id");
  clienteUtils.validar(tipo, "el tipo");
  try {
    return await clienteUtils.deleteFechas({ id, tipo });
  } catch (error) {
    if (error.status_cod) throw error;
    console.log(error);
    throw {
      ok: false,
      status_cod: 500,
      data: "Ha ocurrido un error consultando la información en base de datos",
    };
  }
}

async function sumarFechas() {
  try {
    return await clienteUtils.sumarFechas();
  } catch (error) {
    if (error.status_cod) throw error;
    console.log(error);
    throw {
      ok: false,
      status_cod: 500,
      data: "Ha ocurrido un error consultando la información en base de datos",
    };
  }
}
module.exports = {
  crearCliente,
  modificarCliente,
  listarClientes,
  listarRol,
  crearContrato,
  asignarUsuarios,
  getClientePage,
  extractRut,
  selectUVT_Cliente,
  cargarCalendariosMasivo,
  getListarFechas,
  actualizarFecha,
  crear,
  crearRol,
  crearPermiso,
  deleteFechas,
  sumarFechas
};
