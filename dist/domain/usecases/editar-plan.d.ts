import type { PlanSesion } from "../entities/configuracion.js";
import type { Ejercicio } from "../entities/ejercicio.js";
import type { Resultado } from "../../core/resultado.js";
/**
 * EDICIÓN DE UNA SESIÓN GENERADA (§4: reordenar, cambiar o quitar ejercicios,
 * incluido el calentamiento). Funciones PURAS: nunca modifican el plan que
 * reciben; devuelven uno nuevo (así "deshacer" es trivial para la UI:
 * basta con quedarse el plan anterior).
 *
 * IMPORTANTE (principio del PRD): la elección manual del usuario SIEMPRE
 * prevalece. Por eso al editar NO se re-aplican las reglas de equilibrio
 * (patrones no consecutivos, tope de material): si el usuario quiere dos
 * ejercicios de core seguidos, está en su derecho. Lo único que sí se
 * comprueba al SUSTITUIR es la seguridad y la viabilidad: molestias,
 * material disponible y que exista variante para su nivel.
 */
export type Bloque = "calentamiento" | "principal";
/** Mueve un ejercicio dentro de su bloque (drag & drop de la UI). */
export declare function moverEjercicio(plan: PlanSesion, bloque: Bloque, desde: number, hasta: number): Resultado<PlanSesion>;
/** Quita un ejercicio del plan. Se permite dejar el calentamiento vacío. */
export declare function quitarEjercicio(plan: PlanSesion, bloque: Bloque, indice: number): Resultado<PlanSesion>;
/**
 * Sustituye un ejercicio por otro del catálogo. Comprueba SEGURIDAD y
 * VIABILIDAD (molestias, material, variante para el nivel) con la
 * configuración del plan; el equilibrio queda a criterio del usuario.
 */
export declare function sustituirEjercicio(plan: PlanSesion, bloque: Bloque, indice: number, nuevoEjercicio: Ejercicio): Resultado<PlanSesion>;
/**
 * Alternativas para el selector de "cambiar ejercicio": ejercicios viables
 * con la configuración del plan, del bloque adecuado (calentamientos para
 * el calentamiento; tipos del focus para el principal), excluyendo los que
 * ya están en el plan. Ordenadas con los del MISMO PATRÓN primero (lo más
 * probable es querer un sustituto equivalente).
 */
export declare function alternativasPara(catalogo: Ejercicio[], plan: PlanSesion, bloque: Bloque, indice: number): Ejercicio[];
