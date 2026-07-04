import type { Metricas } from "../entities/metricas.js";
import type { Sesion } from "../entities/sesion.js";
import type { Usuario } from "../entities/usuario.js";
import type { SesionRepository } from "../repositories/sesion-repository.js";
export declare function calcularMetricas(usuario: Usuario, sesiones: Sesion[], ahora: number): Metricas;
/** Caso de uso con acceso a datos, para la pantalla de Inicio/Progreso. */
export declare class CalcularMetricas {
    private readonly sesiones;
    constructor(sesiones: SesionRepository);
    ejecutar(usuario: Usuario, ahora?: number): Promise<Metricas>;
}
