import { semanaISO } from "../../core/fechas.js";
import { almacen, pedir } from "../datasources/indexeddb.js";
const MS_DIA = 24 * 60 * 60 * 1000;
/**
 * Historial en IndexedDB. A la escala de Base (§12), traer todas las
 * sesiones del usuario con el índice y filtrar en memoria es la opción
 * más simple y perfectamente correcta: nada de paginación ni consultas
 * complejas que no aportan aquí.
 */
export class SesionRepositoryIdb {
    db;
    constructor(db) {
        this.db = db;
    }
    async guardar(s) {
        await pedir(almacen(this.db, "sesiones", "readwrite").put(s));
    }
    async listarPorUsuario(usuarioId) {
        const indice = almacen(this.db, "sesiones", "readonly").index("porUsuario");
        const sesiones = await pedir(indice.getAll(usuarioId));
        return sesiones.sort((a, b) => a.ts - b.ts);
    }
    async listarPorSemana(usuarioId, semana) {
        const todas = await this.listarPorUsuario(usuarioId);
        return todas.filter((s) => semanaISO(s.ts) === semana);
    }
    async ultimaSesion(usuarioId) {
        const todas = await this.listarPorUsuario(usuarioId);
        return todas.length > 0 ? todas[todas.length - 1] : null;
    }
    async recientes(usuarioId, dias, max) {
        const desde = Date.now() - dias * MS_DIA;
        const todas = await this.listarPorUsuario(usuarioId);
        return todas.filter((s) => s.ts >= desde).slice(-max);
    }
}
