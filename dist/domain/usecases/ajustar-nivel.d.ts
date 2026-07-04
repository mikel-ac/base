import type { Valoracion } from "../entities/tipos.js";
/**
 * El "cerebro" de la adaptación (§7). Señal ÚNICA: la valoración del usuario.
 * Regla clave: SUBIR DESPACIO (+0.15 por "fácil": hacen falta ~7 seguidas
 * para subir un nivel entero), BAJAR RÁPIDO (−0.40 por "dura": afloja de
 * verdad). Prudencia pensada para perfiles mayores.
 */
export declare const DELTA_POR_VALORACION: Record<Valoracion, number>;
export declare function ajustarNivel(nivel: number, valoracion: Valoracion): number;
