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

  // Si se pasa un 'client', utilizamos esa conexión de la transacción.
  const currentClient = client || pool;

  return currentClient.query(query, params)
    .then((data) => {
      return data.rowCount > 0 ? data.rows : null;
    })
    .catch((error) => {
      existe(error);
      throw new ResponseBody(false, 500, mensajeError || "Ha ocurrido un error inesperado en la base de datos.");
    });
}

async function creaPermisos(options) {
  const pool = await getConnection();
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); 

    const query = `
      INSERT INTO permiso (nombre, descripcion, estado)
      VALUES ($1, $2, $3)
      RETURNING id; 
    `;
    const params = [options.nombre, options.descripcion, 1];

    const result = await ejecutarConsulta(query, params, "Error al insertar el permiso", client);

    await client.query('COMMIT');  
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();  
  }
}

async function consultaPermisos(id) {
  let query = "SELECT * FROM permiso";
  const queryParams = [];

  if (id !== undefined) {
    query = `SELECT * FROM permiso WHERE id = $1`;
    queryParams.push(id); 
  }

  try {
    return await ejecutarConsulta(
      query, queryParams, 
      "Error al consultar los permisos"
    );
  } catch (error) {
    throw error; 
  }
}

async function actualizaPermisos(data) {
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
    UPDATE permiso
    SET ${actualizacionesSQL}
    WHERE id = $${valores.length + 1}
  `;
  
  const pool = await getConnection();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');  

    const result = await ejecutarConsulta(consulta, [...valores, id], 
      "Error al actualizar el permiso", client);

    await client.query('COMMIT');  
    return result;
  } catch (error) {
    await client.query('ROLLBACK'); 
    throw error;
  } finally {
    client.release();  
  }
}

async function eliminaPermisos(options) {
  const query = `DELETE FROM permiso WHERE id = $1`;
  const params = [options.id];

  const pool = await getConnection();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');  

    const result = await ejecutarConsulta(query, params, 
      "Error al eliminar el permiso", client);

    await client.query('COMMIT');  
    return result;
  } catch (error) {
    await client.query('ROLLBACK'); 
    throw error;
  } finally {
    client.release();  
  }
}


module.exports = {
  actualizaPermisos,
  consultaPermisos,
  validar,
  existe,
  creaPermisos,
  eliminaPermisos
};
