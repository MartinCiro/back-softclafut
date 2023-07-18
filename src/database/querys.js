//Archivo solo para consultas

export const queries = {
    getAllProduct:'SELECT * FROM equipos',
    createNewProduct: 'INSERT INTO equipos (id,nombre_del_equipo) VALUES (@NumID,@NomQueQueramos)',
    getProductById: 'SELECT * FROM equipos WHERE id = @id',
    deleteProduct : 'DELETE FROM [futbol].[dbo].[equipos] WHERE id = @id',
    getTotalProduct: 'SELECT COUNT(*) FROM equipos',
    updateProductById: 'UPDATE equipos SET nombre_del_equipo = @NomQueQueramos WHERE id = @NumID'
}