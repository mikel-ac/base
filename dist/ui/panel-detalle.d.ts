import type { PlanSesion } from "../domain/entities/configuracion.js";
import type { Ejercicio } from "../domain/entities/ejercicio.js";
/**
 * PANEL DE DETALLE de una sesión generada: listado completo con Regenerar,
 * Empezar y SUSTITUCIÓN por ejercicio. Lo comparten "Ver detalle" (inicio),
 * "Generar sesión" (configurador) y los planes (config + a medida).
 *
 * Sustituir: cada ejercicio tiene un botón que lo cambia por otro equivalente
 * al toque (mismo patrón, viable con el material/molestias/nivel del plan, sin
 * repetir). Es una edición EN MEMORIA sobre este plan; si el usuario cierra sin
 * empezar, no persiste nada. Al empezar, se usa el plan ya con las sustituciones.
 */
export declare function mostrarDetallePlan(catalogo: Ejercicio[], planInicial: PlanSesion, titulo: string, alEmpezar: (plan: PlanSesion) => void): void;
