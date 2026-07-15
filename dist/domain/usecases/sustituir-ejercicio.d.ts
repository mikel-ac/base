import type { Ejercicio, Variante } from "../entities/ejercicio.js";
import type { Material, Zona } from "../entities/tipos.js";
/**
 * SUSTITUCIÓN AUTOMÁTICA DE UN EJERCICIO.
 *
 * Dado un ejercicio que el usuario quiere cambiar en la previsualización,
 * elige otro EQUIVALENTE al toque (sin abrir lista). "Equivalente" =
 * mismo patrón de movimiento (empuje, tirón, pierna, core…) para que el
 * entrenamiento conserve su intención, viable con el material disponible,
 * que respete las molestias, que tenga una variante para el nivel actual, y
 * que NO esté ya en la sesión (para no duplicar sin querer).
 *
 * Si no hay ningún candidato del mismo patrón, se relaja a mismo TIPO
 * (fuerza/cardio/movilidad). Si aun así no hay nada, devuelve null y quien
 * llama avisa de que no encontró alternativa.
 *
 * Es una función pura: recibe todo lo que necesita y no toca estado externo.
 */
export interface ContextoSustitucion {
    catalogo: Ejercicio[];
    /** IDs de ejercicios ya presentes en la sesión (para no repetir). */
    usados: string[];
    nivel: number;
    material: Material[];
    molestias: Zona[];
    bajoImpacto: boolean;
}
export interface Sustituto {
    ejercicio: Ejercicio;
    variante: Variante;
}
/**
 * CANDIDATOS ORDENADOS para sustituir (para la UI de "elige uno de 3").
 *
 * Devuelve TODOS los candidatos viables, ordenados por cercanía:
 *   1º los del mismo patrón de movimiento (equivalencia fuerte),
 *   2º los del mismo tipo pero distinto patrón (algo más lejanos).
 * Nunca falla salvo catálogo casi vacío: si no hay equivalentes exactos,
 * ofrece los "no muy lejanos". Quien llama enseña de 3 en 3 y pagina.
 */
export declare function candidatosSustitucion(actual: Ejercicio, ctx: ContextoSustitucion): Sustituto[];
