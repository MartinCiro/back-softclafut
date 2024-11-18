const { getConnection } = require("../../../interface/DBConn.js");
const validar = (valor, nombre) => {
  if (!valor)
    throw {
      result: `No se ha proporcionado ${nombre}`,
      ok: false,
      status_cod: 400
    };
};

const existe = (error, datos = null) => {
  const errorMessages = {
    duplicateEntry: (field) => `El ${field} ya existe`,
    foreignKeyViolation: (field) => `La clave foránea del ${field} es inválida o no existe`,
    uniqueViolation: (field) => `El valor del ${field} ya está guardado`,
    notNullViolation: (field) => `El campo ${field} no puede ser nulo`,
  };
  const field = (datos && datos.length > 0 && datos[0] !== undefined) ? datos[0] : "registro";
  if (error.code == "23505")
    throw {
      result: errorMessages.duplicateEntry(field),
      ok: false,
      status_cod: 400
    };

  if (error.code == "23503")
    throw {
      result: errorMessages.foreignKeyViolation(field),
      ok: false,
      status_cod: 400
    };

  if (error.code == "23502")
    throw {
      result: errorMessages.notNullViolation(field),
      ok: false,
      status_cod: 400
    };
  throw error;
};

async function ejecutarConsulta(query, params = [], mensajeError, client = null) {
  const pool = await getConnection();

  const currentClient = client || pool;

  return currentClient.query(query, params)
    .then((data) => {
      return data.rowCount > 0 ? data.rows : "No se encontraron registros";
    })
    .catch((error) => {
      existe(error);
      throw new ResponseBody(false, 500, mensajeError || "Ha ocurrido un error inesperado en la base de datos.");
    });
}

async function creaRoles(options) {
  const { nombre, descripcion, permisos } = options;
  const pool = await getConnection();
  const client = await pool.connect();
  const paramsRol = [nombre, descripcion, 1];

  try {
    await client.query('BEGIN');

    const queryRol = `
      INSERT INTO rol (nombre, descripcion, estado)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;

    const resultRol = await ejecutarConsulta(queryRol, paramsRol, "Error al insertar el rol", client);
    const idRol = resultRol[0].id;

    const permisosLista = permisos.split(',').map(Number).filter(Number);
    console.log(permisosLista);
    if (permisosLista.length > 0) {
      const insertPermisosPromises = permisosLista.map(permiso => {
        return ejecutarConsulta(
          `INSERT INTO rolxpermiso (id_rol, id_permiso) VALUES ($1, $2)`,
          [idRol, permiso],
          "Error al asociar el permiso con el rol",
          client
        );
      });


      await Promise.all(insertPermisosPromises);
    }

    await client.query('COMMIT');

    return { result: "Rol y permisos insertados correctamente", ok: true, status_cod: 200 };
  } catch (error) {
    console.log(error);
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}


async function consultaRoles(id) {
  let query = "SELECT * FROM rol";
  const queryParams = [];

  if (id !== undefined) {
    query = `SELECT * FROM rol WHERE id = $1`;
    queryParams.push(id);
  }
  try {
    return await ejecutarConsulta(
      query, queryParams,
      "Error al consultar los rols"
    );
  } catch (error) {
    throw error;
  }
}

async function consultaXRoles(id) {
  let query = `SELECT 
        rol.id, 
        rol.nombre, 
        rol.descripcion, 
        string_agg(permiso.id::text, ',') AS permisos_ids, 
        string_agg(permiso.nombre, ',') AS permisos_nombres 
    FROM rol 
    LEFT JOIN rolxpermiso ON rolxpermiso.id_rol = rol.id 
    LEFT JOIN permiso ON rolxpermiso.id_permiso = permiso.id 
    GROUP BY rol.id;`;
  const queryParams = [];

  if (id !== undefined) {
    query = `SELECT 
        rol.id AS rol_id,
        rol.nombre AS rol_nombre,
        rol.descripcion AS rol_descripcion,
        string_agg(permiso.id::text, ',') AS permisos_ids,  -- Obtener los IDs de los permisos asociados al rol
        string_agg(permiso.nombre, ',') AS permisos_nombres  -- Obtener los nombres de los permisos
    FROM rol
    LEFT JOIN rolxpermiso ON rolxpermiso.id_rol = rol.id
    LEFT JOIN permiso ON rolxpermiso.id_permiso = permiso.id
    WHERE rol.id = $1 
    GROUP BY rol.id;`;
    queryParams.push(id);
  }

  try {
    return await ejecutarConsulta(
      query, queryParams,
      "Error al consultar los rols"
    );
  } catch (error) {
    throw error;
  }
}

async function actualizaRoles(data) {
  const { id } = data;
  const columnas = {
    nombre: data.nombre,
    descripcion: data.descripcion,
    estado: data.estado
  };

  const columnasFiltradas = Object.entries(columnas).filter(([key, value]) => value !== undefined);

  const actualizacionesSQL = columnasFiltradas
    .map(([key], index) => `${key} = $${index + 1}`)
    .join(', ');

  const valores = columnasFiltradas.map(([_, value]) => value);

  const consulta = `
    UPDATE rol
    SET ${actualizacionesSQL}
    WHERE id = $${valores.length + 1}
  `;

  const pool = await getConnection();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await ejecutarConsulta(consulta, [...valores, id],
      "Error al actualizar el rol", client);

    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function eliminaRoles(options) {
  const { id } = options;
  const pool = await getConnection();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verificar si el rol existe
    const queryVerificar = `SELECT 1 FROM rol WHERE id = $1`;
    const paramsVerificar = [id];

    const resultVerificar = await ejecutarConsulta(queryVerificar, paramsVerificar,
      "Error al verificar la existencia del rol", client);

    if (resultVerificar === "No se encontraron registros")
      throw {
        result: "El rol no existe.",
        ok: false,
        status_cod: 404
      }

    const queryEliminar = `DELETE FROM rol WHERE id = $1`;
    const paramsEliminar = [id];

    await ejecutarConsulta(queryEliminar, paramsEliminar,
      "Error al eliminar el rol", client);

    await client.query('COMMIT');

    return { result: "Rol eliminado correctamente", ok: true, status_cod: 200 };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  actualizaRoles,
  consultaRoles,
  validar,
  existe,
  creaRoles,
  eliminaRoles,
  consultaXRoles
};
