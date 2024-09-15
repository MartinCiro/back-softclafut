const { getConnection } = require("../../../interface/DBConn.js");
const xlsx = require("xlsx");
const fs = require("fs");
const { v4 } = require("uuid");
const Excel = require("exceljs");;
const { Pool } = require("pg");
const { query } = require("express");

/**
 * @param {string} nombre
 * @param {string} nit
 * @param {string} direccion
 * @param {string} id_sede
 * @returns {
 *      Promise<{
 *          ok: boolean,
 *          status_cod: number,
 *          message: string
 *      }}
 */
async function insertarCliente(cliente) {
  const params = [];
  const pool = await getConnection();

  params.push(cliente.nombre);
  params.push(cliente.nit);
  params.push(cliente.direccion);
  params.push(cliente.id_sede);
  params.push(cliente.habilitado);

  return pool
    .query(
      `
        INSERT INTO cliente (
            nombre, nit, direccion, id_sede, habilitado)
        VALUES ( $1, $2, $3, $4, $5)
        RETURNING id;
    `,
      params
    )
    .then((data) => {
      return data.rows[0].id;
    })
    .catch((error) => {
      if (error.code && error.code == "23505")
        throw {
          ok: false,
          status_cod: 409,
          data: "El cliente se encuentra repetido",
        };
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error insertando nuevo cliente",
      };
    })
    .finally(() => pool.end);
}

/**
 *
 * @param {number} id_user
 * @param {number[]} clientes
 */
async function insertClientRelationship(id_user, clientes) {
  const pool = await getConnection();

  let query = {
    text: "INSERT INTO usuarioxcliente(id_usuario, id_cliente) VALUES($1, $2)",
    value: [id_user, {}],
  };

  for (const id_cliente of clientes) {
    query.value[1] = id_cliente;

    await pool
      .query(query.text, query.value)
      .catch((error) => {
        throw error;
      })
      .finally(() => pool.end());
  }
}

/**
 *
 * @param {number} id_usuario
 * @param {number} id_cliente
 */
async function deleteClientRelationship(id_usuario, id_cliente) {
  const pool = await getConnection();

  return pool
    .query(
      `
            DELETE FROM usuarioxcliente
            WHERE id_usuario = $1 AND id_cliente = $2
        `,
      [id_usuario, id_cliente]
    )
    .then((data) => data.rowCount > 0)
    .catch((error) => {
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error insertando nuevo cliente",
      };
    })
    .finally(() => pool.end);
}

/**
 * @param {{
 *      id_cliente: number,
 *      query: string,
 * }} options
 */
async function fetchClientes(options) {
  const pool = await getConnection();

  let queryWhere,
    params = [],
    query = ` 
        SELECT c.*, se.ciudad AS sede, CASE WHEN s.id IS NULL THEN 'Contrato vencido' ELSE s.nombre END AS servicio,
            s.id id_servicio, con.id id_contrato, 
            TO_CHAR(con.fecha_inicio::date, 'yyyy-mm-dd') fecha_inicio, 
            TO_CHAR(con.fecha_fin::date, 'yyyy-mm-dd') fecha_fin
        FROM cliente c 
        INNER JOIN sede se ON se.id = c.id_sede 
        LEFT JOIN contrato con ON c.id = con.id_cliente AND con.fecha_fin > CURRENT_DATE
        LEFT JOIN servicio s ON s.id = con.id_servicio `;

  if (options.id_cliente) {
    params.push(options.id_cliente);
    queryWhere = ` ${queryWhere ? `${queryWhere} AND` : ""} (c.id = $${
      params.length
    }) `;
  }

  if (options.query) {
    params.push(options.query);
    queryWhere = ` ${queryWhere ? `${queryWhere} AND` : ""} 
            ( (c.nombre LIKE '%' || $${params.length} || '%')
              OR (c.nit LIKE '%' || $${params.length} || '%') ) `;
  }

  if (queryWhere) {
    queryWhere = `WHERE (${queryWhere})`;
  }

  return pool
    .query(
      `
            ${query}
            ${queryWhere || ""}
        `,
      params
    )
    .then((data) => {
      return data.rows;
    })
    .catch((error) => {
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error de base de datos consultando clientes",
      };
    })
    .finally(() => pool.end());
}

/**
 *
 * @param {{nombre: string | undefined,
 *          nit: string | undefined,
 *          ubicacion: string | undefined,
 *          id_sede: number,
 *          id: number
 *          }} options
 * @returns { Promise<{
 *              ok: boolean,
 *              status_cod: number,
 *              message: string}> }
 */
async function updateCliente(options) {
  const { id, nombre, direccion, id_sede, habilitado } = options;
  let query,
    params = [];

  if (!id)
    throw {
      ok: false,
      status_cod: 400,
      data: "No se puede ejecutar esta acción, debe ingresar el identificador del cliente",
    };

  params.push(id);

  if (nombre) {
    params.push(nombre);
    query = query
      ? `${query}, nombre = $${params.length}`
      : `nombre = $${params.length}`;
  }

  if (id_sede) {
    params.push(id_sede);
    query = query
      ? `${query}, id_sede = $${params.length}`
      : `id_sede = $${params.length}`;
  }

  if (direccion) {
    params.push(direccion);
    query = query
      ? `${query}, direccion = $${params.length}`
      : `direccion = $${params.length}`;
  }

  if (habilitado) {
    params.push(habilitado);
    query = query
      ? `${query}, habilitado = $${params.length}`
      : `habilitado = $${params.length}`;
  }

  const pool = await getConnection();

  return pool
    .query(
      `
      UPDATE cliente SET
      ${query}
      WHERE id = $1;
    `,
      params
    )
    .then((data) => {
      if (data.rowCount == 0)
        throw {
          ok: false,
          status_cod: 500,
          data: "No se pudo actualizar cliente",
        };
    })
    .catch((err) => {
      if (err.status_cod) throw err;
      console.error(
        "Ocurrió un error actualizando cliente en la base de datos",
        err
      );
      throw {
        ok: false,
        status_cod: 500,
        data: `Ocurrió un error en base de datos actualizando el cliente`,
      };
    })
    .finally(() => pool.end());
}

/**
 * @param {{
 *          }} options
 * @returns { Promise<{
 *              ok: boolean,
 *              status_cod: number,
 *              message: string}> }
 */
async function updateContrato(options) {
  const { id, fecha_inicio, fecha_fin, id_servicio } = options;
  let query,
    params = [];

  if (!id)
    throw {
      ok: false,
      status_cod: 400,
      data: "No se puede ejecutar esta acción, debe ingresar el identificador del cliente",
    };

  params.push(id);

  if (fecha_inicio) {
    params.push(fecha_inicio);
    query = query
      ? `${query}, fecha_inicio = $${params.length}`
      : `fecha_inicio = $${params.length}`;
  }

  if (fecha_fin) {
    params.push(fecha_fin);
    query = query
      ? `${query}, fecha_fin = $${params.length}`
      : `fecha_fin = $${params.length}`;
  }

  if (id_servicio) {
    params.push(direccion);
    query = query
      ? `${query}, id_servicio = $${params.length}`
      : `id_servicio = $${params.length}`;
  }

  const pool = await getConnection();

  return pool
    .query(
      `
       UPDATE contrato SET
       ${query}
       WHERE (id_cliente = $1 AND fecha_fin > CURRENT_DATE);
   `,
      params
    )
    .then((data) => {
      if (data.rowCount == 0)
        throw {
          ok: false,
          status_cod: 500,
          data: "No se pudo actualizar contrato",
        };
    })
    .catch((err) => {
      if (err.status_cod) throw err;
      console.error(
        "Ocurrió un error actualizando cliente en la base de datos",
        err
      );
      throw {
        ok: false,
        status_cod: 500,
        data: `Ocurrió un error en base de datos actualizando el cliente`,
      };
    })
    .finally(() => pool.end());
}

/**
 * Método para consultar la información del cliente
 * @param {string} id_cliente
 */
async function getInfoCliente(id_cliente) {
  const pool = await getConnection();

  return pool
    .query(
      `
        SELECT *
        FROM cliente
        WHERE id = $1
        `,
      [id_cliente]
    )
    .then((data) => {
      if (data.rowCount > 0) return data[0];
      throw {
        ok: false,
        status_cod: 400,
        data: "No se ha encontrado información del cliente o no está parametrizado",
      };
    })
    .catch((error) => {
      if (error.status_cod) throw error;
      throw {
        ok: false,
        status_cod: 500,
        data: "Ha ocurrido un error consultando el cliente en base de datos",
      };
    })
    .finally(() => pool.end());
}

async function consultarRol(id_rol) {
  const pool = await getConnection();

  return pool
    .query(
      `
        SELECT u.nombre, u.apellidos, r2.nombre AS rol, p.nombre  AS permisos
        FROM rolxpermiso r 
            INNER JOIN permiso p ON p.id = r.id_permiso 
            INNER JOIN rol r2 ON r2.id  = r.id_rol 
            INNER JOIN usuario u ON u.id_rol  = r.id_rol 
        WHERE r2.id =$1
    `,
      [id_rol]
    )
    .then((data) => {
      return data.rows;
    })
    .catch((error) => {
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error consultando roles y permisos",
      };
    })
    .finally(() => pool.end);
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
async function insertarContrato(contrato) {
  const pool = await getConnection();

  const params = [
    contrato.id_sede,
    contrato.id_cliente,
    contrato.fecha_inicio,
    contrato.fecha_fin,
    contrato.id_servicio,
  ];

  return pool
    .query(
      `
        INSERT INTO contrato (id_sede, id_cliente, fecha_inicio, fecha_fin, id_servicio)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
    `,
      params
    )
    .then((data) => {
      return data.rows[0];
    })
    .catch((error) => {
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error insertando un nuevo contrato",
      };
    })
    .finally(() => pool.end);
}

/**
 * @param {number} id_cliente
 * @returns {Promise<{
 *    razon_social: string,
 *    nit: string,
 *    sede: string,
 *    fecha_inicio: Date,
 *    fecha_fin: Date,
 *    nombre_servicio: string,
 * }[]>}
 */
async function getClienteProfile(id_cliente) {
  const pool = await getConnection();

  return pool
    .query(
      `
        SELECT 
            c.nombre razon_social, c.nit, s.ciudad sede,
            TO_CHAR(con.fecha_inicio::date, 'yyyy-mm-dd') fecha_inicio, TO_CHAR(con.fecha_fin::date, 'yyyy-mm-dd') fecha_fin, ser.nombre nombre_servicio
        FROM cliente c
        INNER JOIN sede s ON s.id = c.id_sede
        LEFT JOIN contrato con ON con.id_cliente = c.id
        LEFT JOIN servicio ser ON ser.id = con.id_servicio
        WHERE c.id = $1
    `,
      [id_cliente]
    )
    .then((data) => {
      if (data.rowCount > 0) return data.rows;
      throw {
        ok: false,
        status_cod: 404,
        data: "No se ha encontrado un cliente con esa identificación",
      };
    })
    .catch((error) => {
      if (error.status_cod) throw error;

      throw {
        ok: false,
        status_cod: 404,
        data: "Ha ocurrido un error en base de datos y no se ha podido consultar el cliente",
      };
    })
    .finally(() => pool.end());
}

/**
 * @param {number} id_cliente
 */
async function fetchUsuarioxcliente(id_cliente) {
  const pool = await getConnection();

  if (!id_cliente) {
    throw {
      ok: false,
      status_cod: 400,
      data: "No se ha proporcionado un id_cliente",
    };
  }

  return pool
    .query(
      `
      SELECT u.nombre || ' ' || u.apellidos nombre,
          u.id, c.id id_cargo, c.nombre nombre_cargo
      FROM usuarioxcliente uxc
      INNER JOIN usuario u ON u.id = uxc.id_usuario 
      LEFT JOIN cargo c ON u.id_cargo = c.id
      WHERE uxc.id_cliente = $1
    `,
      [id_cliente]
    )
    .then((data) => data.rows)
    .catch((error) => {
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error de base de datos consultando clientes",
      };
    })
    .finally(() => pool.end());
}

function excelToJson(file, headers) {
  const workbook = xlsx.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const actualizarCalendario = xlsx.utils.sheet_to_json(worksheet, {
    header: headers,
    range: 1,
  });
  fs.unlinkSync(file.path);
  return actualizarCalendario;
}

function saveExcel(file64, nombre_archivo) {
  const excelName = v4();
  const path = `./processing/${excelName}`;

  fs.writeFileSync(path, file64, "base64");

  return { path, name: excelName };
}

async function descargarPlantillaActualizada() {
  const pool = await getConnection();
  const query = `
    SELECT 
    id_impuestoxmunicipio id, 
    nombre_impuesto AS nombre,
    tipo_impuesto AS tipo,
    municipio, departamento
    FROM vw_impuestoxmunicipio vi`;
  const result = await pool.query(query);
  let file_path = "src/templates/cargas/plantilla_calendario.xlsx";
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(file_path);
  const worksheet = workbook.getWorksheet("Impuestos x Municipio");
  console.log("Iniciando actualización de plantilla");
  result.rows.forEach((item, index) => {
    const rowIndex = index + 2;
    worksheet.getCell(rowIndex, 1).value = item.id;
    worksheet.getCell(rowIndex, 2).value = item.nombre;
    worksheet.getCell(rowIndex, 3).value = item.tipo;
    worksheet.getCell(rowIndex, 4).value = item.municipio;
    worksheet.getCell(rowIndex, 5).value = item.departamento;
  });

  await workbook.xlsx
    .writeFile(file_path)
    .then(() => {
      console.log("plantilla actualizada");
    })
    .catch((error) => {});
}

async function insertarCalendario(calendario) {
  const pool = await getConnection();
  let params = [
    calendario.id_impuesto,
    calendario.periodicidad,
    calendario.uvt,
    calendario.regimen,
    calendario.digito,
    calendario.vigencia,
  ];
  //descargarPlantillaActualizada();
  return pool
    .query(
      `
      INSERT INTO calendario_impuesto (id_impuestoxmunicipio, periodicidad, uvt, regimen, digito, vigencia)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
      `,
      params
    )
    .then((data) => {
      return data.rows[0].id;
    })
    .catch((error) => {
      if (error.code === "23505") {
        throw {
          ok: false,
          status_cod: 400,
          data: "El impuesto o periodo ya existe",
        };
      }

      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error actualizando el impuesto",
      };
    })
    .finally(() => pool.end());
}

async function insertarPeriodos(idCalendario, vencimiento) {
  const pool = await getConnection();

  let params = [idCalendario, vencimiento.periodo, vencimiento.fecha];
  await pool.query(
    `
      INSERT INTO periodo_vencimiento
      (id_calendario, periodo, fecha)
      VALUES ($1, $2, $3)`,
    params
  );
}

async function UVT_Cliente(id_cliente, uvt, digito_verificacion, nit) {
  const pool = await getConnection();

  return pool
    .query(
      `
        SELECT  FROM cliente c INNER JOIN informacion_rut ON  WHERE id = $1 AND nit = $2
    `,
      [id_cliente, nit]
    )
    .then((data) => {
      return data.rows[0];
    })
    .catch((error) => {
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error consultando el UVT por cliente",
      };
    })
    .finally(() => pool.end);
}

const validar = (valor, nombre) => {
  if (!valor)
    throw {
      ok: false,
      status_cod: 400,
      data: `No se ha proporcionado ${nombre}`,
    };
};

const existe = (error, datos) => {
  const errorMessages = {
    duplicateEntry: (field) => `El ${field} ya existe`,
  };

  if (error.code === "23505") {
    const field = datos;
    throw {
      ok: false,
      status_cod: 400,
      data: errorMessages.duplicateEntry(field),
    };
  }
};

async function getFechas(element) {
  const pool = await getConnection();
  if (element === undefined) {
    return pool
      .query(
        "SELECT origen, descripcion, monto, fecha, id, ide FROM datos_c"
      )
      .then((data) => {
        return data.rowCount > 0 ? data.rows : null;
      })
      .catch((error) => {
        if (error.status_cod) throw error;
        error.status_cod ? error : null;
        throw {
          ok: false,
          status_cod: 500,
          data: "Ha ocurrido un error consultando la información en la base de datos",
        };
      })
      .finally(() => pool.end());
  } else {
    return pool
      .query(
        `
        SELECT mes, descripcion, monto, fecha, id, ide FROM datos_c where origen=$1;
        `,
        [element]
      )
      .then((data) => {
        return data.rowCount > 0 ? data.rows : null;
      })
      .catch((error) => {
        if (error.status_cod) throw error;
        error.status_cod ? error : null;
        throw {
          ok: false,
          status_cod: 500,
          data: "Ha ocurrido un error consultando la información en la base de datos",
        };
      })
      .finally(() => pool.end());
  }
}

async function updateFechas(options) {
  const { tabla, id, cambio, campo } = options;

  const params = [id, cambio];
  const pool = await getConnection();
  return pool
    .query(
      `
    UPDATE ${tabla} SET
    ${campo} = $2
    WHERE id = $1;
  `,
      params
    )
    .then((data) => {
      data.rowCount > 0 ? data.rows : "No existe";
    })
    .catch((error) => {
      console.log(error);
      throw {
        ok: false,
        status_cod: 500,
        data: `Ocurrió un error en base de datos actualizando el cliente`,
      };
    })
    .finally(() => pool.end());
}

/**
 * @param {{
 *          descripcion: string,
 *          monto: float,
 *          fecha_ingreso: Date,
 *      }} ingreso
 */
async function insertarValor(options) {
  const pool = await getConnection();
  const tipo = options.tipo;
  const params = [
    options.descripcion,
    options.monto,
    "{" + options.fecha + "}",
  ];

  if(tipo === "egreso"){
    params.push(options.id);
    console.log(params)
    return pool
    .query(
      `
       INSERT INTO egresos (descripcion, monto, fecha, idi)
       VALUES ($1, $2, $3, $4) RETURNING id
   `,
      params
    )
    .then((data) => {
      return data.rows[0];
    })
    .catch((error) => {
      console.log(error);
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error insertando el ingreso",
      };
    })
    .finally(() => pool.end);
}else if (tipo === "ingreso"){
  console.log(params)
  return pool
    .query(
      `
       INSERT INTO ingresos (descripcion, monto, fecha)
       VALUES ($1, $2, $3) RETURNING id
   `,
      params
    )
    .then((data) => {
      console.log(data)
      return data.rows[0];
    })
    .catch((error) => {
      console.log(error);
      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error insertando el ingreso",
      };
    })
    .finally(() => pool.end);
}}


async function crearRol(dataRol) {
  const pool = await getConnection();

  const params = [dataRol.nombre, dataRol.descripcion];

  return pool
    .query(
      `
       INSERT INTO rol (nombre, descripcion)
       VALUES ($1, $2);
   `,
      params
    )
    .then((data) => {
      return data.rows[0];
    })
    .catch((error) => {
      existe(error, "rol");

      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error insertando el rol",
      };
    })
    .finally(() => pool.end);
}

async function crearPermiso(dataPermiso) {
  const pool = await getConnection();

  const params = [dataPermiso.nombre, dataPermiso.descripcion];

  return pool
    .query(
      `
       INSERT INTO permiso (nombre, descripcion)
       VALUES ($1, $2);
   `,
      params
    )
    .then((data) => {
      return data.rows[0];
    })
    .catch((error) => {
      existe(error, "permiso");

      throw {
        ok: false,
        status_cod: 500,
        data: "Ocurrió un error insertando el permiso",
      };
    })
    .finally(() => pool.end);
}

async function deleteFechas(dato) {
  const pool = await getConnection();
  const params = [dato.id];
  return pool
    .query(`delete from ${dato.tipo} where id=$1`, params)
    .then((data) => {
      return data.rowCount > 0
        ? `El ${dato.tipo} se elimino correctamente`
        : `El ${dato.tipo} no existe`;
    })
    .catch((error) => {
      console.log(error);
      if (error.status_cod) throw error;
      error.status_cod ? error : null;
      throw {
        ok: false,
        status_cod: 500,
        data: "Ha ocurrido un error consultando la información en la base de datos",
      };
    })
    .finally(() => pool.end());
}

async function sumarFechas() {
  const pool = await getConnection();
    return pool
      .query(
        `     
        SELECT
    COALESCE(egresos.mes::text, '0') as mes_egreso,
    COALESCE(egresos.suma_monto, 0) as monto_egreso,
    COALESCE(ingresos.mes::text, '0') as mes_ingreso,
    COALESCE(ingresos.suma_monto, 0) as monto_ingreso,
    GREATEST(0, COALESCE(ingresos.suma_monto, 0) - COALESCE(egresos.suma_monto, 0)) as resultado,
    COALESCE(TO_CHAR(fechas_ingresos.fecha1, 'YYYY-MM-DD'), NULL) as fecha,
    COALESCE(fechas_ingresos.id, 0) as id
FROM
    (SELECT * FROM suma_egresos()) as egresos,
    (SELECT * FROM suma_ingresos()) as ingresos,
    (
        SELECT
            fecha::date AS fecha1,
            id::int as id
        FROM ingresos
        ORDER BY id DESC
        LIMIT 1
    ) as fechas_ingresos;

      `)
      .then((data) => {
        return data.rowCount > 0 ? data.rows : null;
      })
      .catch((error) => {
        console.log(error)
        if (error.status_cod) throw error;
        error.status_cod ? error : null;
        throw {
          ok: false,
          status_cod: 500,
          data: "Ha ocurrido un error consultando la información en la base de datos",
        };
      })
      .finally(() => pool.end());
  
}

module.exports = {
  insertarCliente,
  updateCliente,
  consultarRol,
  getInfoCliente,
  insertClientRelationship,
  fetchClientes,
  insertarContrato,
  deleteClientRelationship,
  getClienteProfile,
  fetchUsuarioxcliente,
  updateContrato,
  UVT_Cliente,
  excelToJson,
  saveExcel,
  insertarCalendario,
  insertarPeriodos,
  descargarPlantillaActualizada,
  getFechas,
  updateFechas,
  validar,
  insertarValor,
  crearRol,
  crearPermiso,
  deleteFechas,
  sumarFechas
};
