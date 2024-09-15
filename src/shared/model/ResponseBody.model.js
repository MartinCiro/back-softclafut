class ResponseBody {
    /**
     * @constructor
     * @param { boolean } ok Estado de petición
     * @param { int } cod_status Código de status HTTP
     * @param { any } result Objeto del resultado de la petición
     */
    constructor(ok, status_cod, result){
        this.result = result;
        this.ok = ok;
        this.status_cod = status_cod;
    }
}

module.exports = ResponseBody;