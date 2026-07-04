import type { Ejercicio } from "../domain/entities/ejercicio.js";
import type { Tipo, ZonaTrabajo } from "../domain/entities/tipos.js";
/**
 * MODIFICACIONES DEL USUARIO ("overrides").
 * El catálogo base es semilla de solo lectura. Lo que el usuario edita en el
 * Gestor se guarda aparte (localStorage) y se aplica ENCIMA al cargar, sin
 * tocar la semilla. Así nunca se corrompe el catálogo y los cambios persisten.
 */
export interface OverrideEjercicio {
    nombre?: string;
    tipo?: Tipo;
    consejo?: string;
    notas?: string;
    zonaTrabajo?: ZonaTrabajo;
    parejaId?: string;
    porLados?: boolean;
    claves?: string[];
}
export declare function leerOverrides(): Record<string, OverrideEjercicio>;
export declare function guardarOverride(id: string, ov: OverrideEjercicio): void;
/** Aplica las modificaciones del usuario sobre el catálogo base. */
export declare function aplicarOverrides(ejercicios: Ejercicio[]): Ejercicio[];
/** Zona de trabajo efectiva: la que fijó el usuario, o la derivada del patrón. */
export declare function zonaTrabajoDe(e: Ejercicio): ZonaTrabajo;
