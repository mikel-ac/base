import type { PlanSesion } from "../entities/configuracion.js";
import type { Ejercicio } from "../entities/ejercicio.js";
import type { EntrenamientoFijo } from "../entities/entrenamiento-fijo.js";
import type { Resultado } from "../../core/resultado.js";
/**
 * EXPANSIÓN DE UN ENTRENAMIENTO FIJO A UN PlanSesion EJECUTABLE.
 *
 * Función pura. Convierte la lista guardada de referencias (ejercicioId por
 * línea) en un plan que el runner ejecuta igual que cualquier otra sesión.
 * Diferencias con el motor de generación:
 *  - NO elige ejercicios: usa exactamente los que el usuario diseñó, en orden.
 *  - SÍ elige la variante según el nivel ACTUAL (para no congelar el progreso).
 *  - SÍ expande unilaterales (porLados) a dos lados seguidos, como el motor.
 *
 * Robustez: si un ejercicio del entrenamiento ya no está en el catálogo
 * (se borró en el Gestor) o no tiene variante para el nivel/bajo-impacto de
 * hoy, esa línea se OMITE y se informa (omitidos), en vez de romper la sesión.
 */
export interface ExpansionEntrenamiento {
    plan: PlanSesion;
    /** Nombres de ejercicios que estaban guardados pero no se pudieron incluir. */
    omitidos: string[];
}
/**
 * Construye el plan a partir del entrenamiento fijo y el catálogo vivo.
 * `nivel` y `bajoImpacto` vienen del perfil ACTUAL del usuario.
 */
export declare function expandirEntrenamiento(fijo: EntrenamientoFijo, catalogo: Ejercicio[], nivel: number, bajoImpacto: boolean): Resultado<ExpansionEntrenamiento>;
