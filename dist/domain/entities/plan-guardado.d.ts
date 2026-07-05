import type { ConfigSesion } from "./configuracion.js";
import type { EntrenamientoFijo } from "./entrenamiento-fijo.js";
/**
 * Un plan guardado con nombre, para recargarlo después (pantalla "Planes").
 * Hay DOS clases de plan, distinguidas por qué campo llevan:
 *
 *  1. Plan de CONFIGURACIÓN (cfg): guarda las opciones (enfoques, material,
 *     tiempos…) y genera una sesión FRESCA cada vez que se usa. Es el plan
 *     "clásico" del §4.
 *
 *  2. Entrenamiento FIJO "a medida" (fijo): guarda una lista concreta de
 *     ejercicios en un orden concreto, diseñada a mano. Al usarlo se ejecutan
 *     ESOS ejercicios, en ESE orden (ver expandir-entrenamiento.ts).
 *
 * Un plan lleva `cfg` O `fijo`, nunca ambos. Se mantienen en la MISMA entidad
 * y el mismo almacén a propósito: una sola pantalla de "Planes", un solo
 * repositorio, y —cuando llegue Firebase— una sola colección que sincroniza
 * los dos tipos sin código extra.
 */
export interface PlanGuardado {
    id: string;
    usuarioId: string;
    nombre: string;
    /** Presente en planes de configuración (tipo 1). */
    cfg?: ConfigSesion;
    /** Presente en entrenamientos fijos a medida (tipo 2). */
    fijo?: EntrenamientoFijo;
    creadoEn: number;
}
/** ¿Es un entrenamiento fijo (diseñado a mano) en vez de un plan de config? */
export declare function esEntrenamientoFijo(p: PlanGuardado): p is PlanGuardado & {
    fijo: EntrenamientoFijo;
};
