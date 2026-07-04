import type { Sesion } from "../../domain/entities/sesion.js";
import type { SesionRepository } from "../../domain/repositories/sesion-repository.js";
import { semanaISO } from "../../core/fechas.js";
import { almacen, pedir } from "../datasources/indexeddb.js";

const MS_DIA = 24 * 60 * 60 * 1000;

/**
 * Historial en IndexedDB. A la escala de Base (§12), traer todas las
 * sesiones del usuario con el índice y filtrar en memoria es la opción
 * más simple y perfectamente correcta: nada de paginación ni consultas
 * complejas que no aportan aquí.
 */
export class SesionRepositoryIdb implements SesionRepository {
  constructor(private readonly db: IDBDatabase) {}

  async guardar(s: Sesion): Promise<void> {
    await pedir(almacen(this.db, "sesiones", "readwrite").put(s));
  }

  async listarPorUsuario(usuarioId: string): Promise<Sesion[]> {
    const indice = almacen(this.db, "sesiones", "readonly").index("porUsuario");
    const sesiones = await pedir<Sesion[]>(indice.getAll(usuarioId));
    return sesiones.sort((a, b) => a.ts - b.ts);
  }

  async listarPorSemana(usuarioId: string, semana: string): Promise<Sesion[]> {
    const todas = await this.listarPorUsuario(usuarioId);
    return todas.filter((s) => semanaISO(s.ts) === semana);
  }

  async ultimaSesion(usuarioId: string): Promise<Sesion | null> {
    const todas = await this.listarPorUsuario(usuarioId);
    return todas.length > 0 ? todas[todas.length - 1]! : null;
  }

  async recientes(usuarioId: string, dias: number, max: number): Promise<Sesion[]> {
    const desde = Date.now() - dias * MS_DIA;
    const todas = await this.listarPorUsuario(usuarioId);
    return todas.filter((s) => s.ts >= desde).slice(-max);
  }
}
