/** Limita un número al rango [min, max]. */
export declare function clamp(n: number, min: number, max: number): number;
/** Redondea a 2 decimales (para que el nivel no acumule decimales infinitos). */
export declare function redondear2(n: number): number;
/** Identificador único local (no hace falta nada más sofisticado sin nube). */
export declare function uuid(): string;
/**
 * Generador de números aleatorios como FUNCIÓN INYECTABLE.
 * ¿Por qué? Porque así la generación de sesiones se puede probar de forma
 * repetible: con la misma semilla sale siempre la misma sesión.
 * En la app real se usa Math.random; en las pruebas, crearRngConSemilla.
 */
export type Rng = () => number;
export declare const rngPorDefecto: Rng;
/** RNG determinista (algoritmo mulberry32): misma semilla → misma secuencia. */
export declare function crearRngConSemilla(semilla: number): Rng;
/** Devuelve una copia barajada del array (Fisher–Yates). No modifica el original. */
export declare function barajar<T>(arr: readonly T[], rng: Rng): T[];
