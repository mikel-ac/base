import type { ConfigSesion, PlanSesion } from "../entities/configuracion.js";
import type { Ejercicio } from "../entities/ejercicio.js";
import type { Patron } from "../entities/tipos.js";
import type { Resultado } from "../../core/resultado.js";
import { type Rng } from "../../core/util.js";
/**
 * MOTOR DE GENERACIÓN DE SESIONES (§6 del PRD).
 * Función pura: mismas entradas + mismo RNG → misma sesión.
 * No sabe nada de UI ni de bases de datos.
 */
/** Nº de ejercicios del bloque principal: cuántos intervalos caben (regla 6). */
export declare function numEjerciciosPara(durMin: number, workSec: number, restSec: number): number;
/**
 * Nº de ejercicios de calentamiento. SUPUESTO (no fijado por el PRD):
 * aproximadamente un movimiento por minuto, entre 2 y 5. Si más adelante el
 * prototipo dicta otra regla, solo hay que cambiar esta función.
 */
export declare function numCalentamientos(calentamientoMin: number): number;
/**
 * Selección balanceada (reglas 3 y 4 de §6):
 * - reparte entre los patrones disponibles, tirando siempre del patrón
 *   MENOS usado hasta el momento (equilibrio),
 * - nunca repite patrón en dos ejercicios consecutivos (salvo que sea
 *   literalmente imposible, p. ej. pool de un solo patrón),
 * - los ejercicios CON material no pasan de la mitad de la sesión
 *   (no monopolizan), siempre que haya alternativa a peso corporal,
 * - si la sesión pide más ejercicios de los que hay en el pool, se repite
 *   en modo circuito (vuelve a empezar la rotación),
 * - si llega un énfasis (sugerencia del día), ese patrón recibe ~1 hueco
 *   extra; nunca rompe las reglas anteriores.
 */
export declare function seleccionBalanceada(pool: Ejercicio[], n: number, rng: Rng, enfasis?: Patron): Ejercicio[];
/**
 * Entrada única del motor. Devuelve un Resultado:
 * - ok(PlanSesion) si se pudo generar,
 * - fallo(mensaje) con las dos guardas del PRD (regla 8).
 */
export declare function generarSesion(catalogo: Ejercicio[], cfg: ConfigSesion, rng?: Rng): Resultado<PlanSesion>;
