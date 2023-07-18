import { getConnection, sql, queries } from "../database";

export const getProducts = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(queries.getAllProduct);
    console.log(result);

    res.json(result.recordset);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
    res.send(error.message);
  }
};

export const createProduct = async (req, res) => {
  const { id, nombre_del_equipo } = req.body;
  if (id == null || nombre_del_equipo == null) {
    return res.status(400).json({ msg: "Bad Request. Please Fill all fields" });
  }
  console.log(id, nombre_del_equipo);
  try {
    const pool = await getConnection();
    await pool
      .request()
      .input("NumID", sql.Int, id)
      .input("NomQueQueramos", sql.VarChar(50), nombre_del_equipo)
      .query(queries.createNewProduct);
    //NomQueQueramos = a el valor recibido
    return res.json({ message: "Producto creado", id, nombre_del_equipo });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
    res.send(error.message);
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  const pool = await getConnection();

  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query(queries.getProductById);
  console.log(result);
  res.send(result.recordset[0]);
};

export const deleteProductById = async (req, res) => {
  const { id } = req.params;
  const pool = await getConnection();

  const result = await pool
    .request()
    .input("id", id)
    .query(queries.deleteProduct);
  console.log({ message: "Producto eliminado" });
  res.sendStatus(200);
};

export const getTotalProducts = async (req, res) => {
  const pool = await getConnection();

  const result = await pool.request().query(queries.getTotalProduct);
  console.log({ message: result });
  res.json(result.recordset[0][""]);
};

export const updateProductById = async (req, res) => {
  const { id } = req.params;
  const { nombre_del_equipo } = req.body;

  if (id == null || nombre_del_equipo == null) {
    return res.status(400).json({ msg: "Bad Request. Please Fill all fields" });
  }
  const pool = await getConnection();
  const result = await pool
    .request()
    .input("NumID", sql.Int, id)
    .input("NomQueQueramos", sql.VarChar(50), nombre_del_equipo)
    .query(queries.updateProductById);
  res.json({ message: "Actualizado con exito" });
};
