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
 * Elige un sustituto. `rng` permite inyectar aleatoriedad determinista en
 * pruebas; por defecto usa Math.random.
 */
export declare function sustituirEjercicio(actual: Ejercicio, ctx: ContextoSustitucion, rng?: () => number): Sustituto | null;
