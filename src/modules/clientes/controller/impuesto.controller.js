const { insertarImpuesto, fetchImpuesto, insertarImpuestoxMunicipio, insertarRelImpuestoxCliente, fetchCalendarios } = require("../utils/impuesto.utils");

/**
 * 
 * @param {{ 
 * nombre: string, 
 * tipo: string, 
 * id_municipio: string, 
 * municipio: string, 
 * departamento: string }} impuesto 
 * @returns { Promise<{
 *      id_impuesto: number,
 *      id_impuestoxmunicipio: number
 *  }> } 
 */
async function crearImpuesto(impuesto) {
    if (!impuesto.nombre) {
        return {
            ok: false,
            status_cod: 400,
            data: 'No se ha proporcionado nombre del impuesto'
        }
    }

    if (!impuesto.tipo) {
        return {
            ok: false,
            status_cod: 400,
            data: 'No se ha proporcionado el tipo del impuesto'
        };
    }

    if ((!impuesto.departamento && !impuesto.municipio)) {
        return {
            ok: false,
            status_cod: 400,
            data: 'No se ha proporcionado el municipio'
        };
    }

    const id_impuesto = await insertarImpuesto(impuesto)
        .catch(error => {
            if (error.status_cod) throw error;
            console.log(error);
            throw {
                ok: false,
                status_cod: 500,
                data: 'Ocurrió un error inesperado y el impuesto no ha sido creado'
            }
        });

    const id_impuestoxmunicipio = await insertarImpuestoxMunicipio(id_impuesto, impuesto)
        .catch(error => {
            if (error.status_cod) throw error;
            console.log(error);
            throw {
                ok: false,
                status_cod: 500,
                data: 'Ocurrió un error inesperado y el impuesto no ha sido creado'
            }
        });

    return { id_impuesto, id_impuestoxmunicipio };
}

/**
 * Método para listar todos los impuestos con su respectiva participación en municipios
 * @returns { Promise<{
 *          id_impuesto: number, 
 *          nombre_impuesto: string, 
 *          tipo_impuesto: string,
 *          id_municipio: number, 
 *          municipio: string,
 *          departamento: string 
 *          }[]> }
 */
async function listarImpuestos() {
    return fetchImpuesto();
}


/**
 * 
 * @param {number} id_impuestoxmunicipio 
 * @param {number} id_cliente 
 * @param {number | undefined} id_calendario 
 */
async function asignarImpuesto(id_impuestoxmunicipio, id_cliente, id_calendario) {
    if (!id_impuestoxmunicipio) throw {
        ok: false,
        status_cod: 400,
        data: 'No se ha proporcionado el identificador del impuesto'
    }

    if (!id_cliente) throw {
        ok: false,
        status_cod: 400,
        data: 'No se ha proporcionado el identificador del cliente'
    }

    if (!id_calendario) throw {
        ok: false,
        status_cod: 400,
        data: 'No se ha proporcionado el identificador del calendario'
    }


    return insertarRelImpuestoxCliente(id_impuestoxmunicipio, id_cliente, id_calendario)
        .catch(error => {
            if (error.status_cod) throw error;
            console.log(error);
            throw {
                ok: false,
                status_cod: 500,
                data: 'Ocurrió un error inesperado y el usuario no ha sido creado'
            }
        });
}

async function listarCalendarios() {
    return fetchCalendarios()
        .then(vencimientos => {
            let mapping = (item) => {
                const {
                    nombre_impuesto, id, id_impuestoxmunicipio, id_impuesto, periodicidad,
                    uvt, regimen, digito, vigencia, municipio, departamento
                } = item;

                return {
                    nombre_impuesto, id, id_impuestoxmunicipio, id_impuesto, periodicidad,
                    uvt, regimen, digito, vigencia, municipio, departamento
                };
            }

            return vencimientos
                .map(mapping)
                .filter((venc, index, array) => array.findIndex(
                    (item) => (JSON.stringify(venc) === JSON.stringify(item))
                ) === index)
                .map((venc) => ({
                    ...venc,
                    vencimientos: vencimientos
                        .filter((item) => (
                            JSON.stringify(venc) === JSON.stringify(mapping(item))
                        ))
                        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                        .map(item => {
                            const { fecha, periodo } = item;
                            return { fecha, periodo };
                        })
                }));
        });
}

module.exports = {
    crearImpuesto,
    listarImpuestos,
    asignarImpuesto,
    listarCalendarios,
}