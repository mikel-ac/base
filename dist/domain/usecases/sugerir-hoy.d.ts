import type { Sesion } from "../entities/sesion.js";
import type { Sugerencia } from "../entities/sugerencia.js";
import type { Usuario } from "../entities/usuario.js";
import type { Patron } from "../entities/tipos.js";
import type { SesionRepository } from "../repositories/sesion-repository.js";
/**
 * SUGERENCIA DEL DÍA (§9): plan global híbrido.
 * Cada sesión sugerida es completa y equilibrada por sí misma, pero rota el
 * énfasis según lo hecho recientemente. La elección manual SIEMPRE gana:
 * esta función solo propone; nunca se aplica sola.
 */
/** Patrón más frecuente del bloque principal de una sesión (empates: el primero). */
export declare function patronDominante(s: Sesion): Patron | null;
/**
 * Patrón MENOS trabajado en el historial reciente, excluyendo `excepto`.
 * Empates: orden fijo de PATRONES_ROTABLES (determinista y fácil de razonar).
 */
export declare function patronMenosTrabajado(historial: Sesion[], excepto: Patron | null): Patron;
/** Núcleo puro, tal cual el pseudocódigo del §9. */
export declare function sugerirHoy(usuario: Usuario, historialReciente: Sesion[]): Sugerencia;
/**
 * Caso de uso con acceso a datos: trae las últimas ~3 sesiones de 7 días
 * y delega en el núcleo puro. Es lo que llamará la pantalla de Inicio.
 */
export declare class SugerirHoy {
    private readonly sesiones;
    constructor(sesiones: SesionRepository);
    ejecutar(usuario: Usuario): Promise<Sugerencia>;
}
