import type { Sesion } from "../../domain/entities/sesion.js";
import type { SesionRepository } from "../../domain/repositories/sesion-repository.js";
/**
 * Historial en IndexedDB. A la escala de Base (§12), traer todas las
 * sesiones del usuario con el índice y filtrar en memoria es la opción
 * más simple y perfectamente correcta: nada de paginación ni consultas
 * complejas que no aportan aquí.
 */
export declare class SesionRepositoryIdb implements SesionRepository {
    private readonly db;
    constructor(db: IDBDatabase);
    guardar(s: Sesion): Promise<void>;
    listarPorUsuario(usuarioId: string): Promise<Sesion[]>;
    listarPorSemana(usuarioId: string, semana: string): Promise<Sesion[]>;
    ultimaSesion(usuarioId: string): Promise<Sesion | null>;
    recientes(usuarioId: string, dias: number, max: number): Promise<Sesion[]>;
}
