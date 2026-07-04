import type { PlanSesion } from "../domain/entities/configuracion.js";
import type { Ejercicio } from "../domain/entities/ejercicio.js";
/**
 * PANEL DE DETALLE de una sesión generada: listado completo con Regenerar
 * y Empezar. Lo comparten "Ver detalle" (inicio) y "Generar sesión"
 * (configurador). Tocar fuera del panel lo cierra.
 */
export declare function mostrarDetallePlan(catalogo: Ejercicio[], plan: PlanSesion, titulo: string, alEmpezar: (plan: PlanSesion) => void): void;
