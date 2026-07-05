/**
 * ENTRENAMIENTO FIJO ("a medida").
 *
 * A diferencia de un PlanGuardado normal (que guarda una CONFIGURACIÓN y
 * genera una sesión fresca cada vez), un entrenamiento fijo guarda una LISTA
 * CONCRETA de ejercicios en un ORDEN concreto, diseñada a mano por el usuario
 * en el Diseñador (§ pendiente de la lista).
 *
 * Decisiones de diseño:
 *  - Se guardan REFERENCIAS al catálogo (ejercicioId), no copias del ejercicio.
 *    Así, si luego editas un ejercicio en el Gestor (nombre, vídeo, consejo),
 *    el entrenamiento lo refleja solo. La variante concreta se elige al usar,
 *    con tu nivel ACTUAL (igual que los planes normales, para no congelar el
 *    progreso).
 *  - Cada LÍNEA tiene su propio id (lineaId), independiente del ejercicioId.
 *    Esto permite que el MISMO ejercicio aparezca varias veces (p. ej. plancha
 *    al principio y al final) y que reordenar/quitar funcione por línea aunque
 *    haya duplicados.
 *  - Los unilaterales (porLados) se expanden a dos lados AL USAR, no se guardan
 *    dos líneas: una línea = una elección del usuario. Coherente con el motor.
 */

export interface LineaEntrenamiento {
  /** Identidad propia de la línea (permite duplicados del mismo ejercicio). */
  lineaId: string;
  /** Referencia lógica al Ejercicio.id del catálogo. */
  ejercicioId: string;
}

export interface EntrenamientoFijo {
  workSec: number;
  restSec: number;
  calentamiento: LineaEntrenamiento[];
  principal: LineaEntrenamiento[];
}
