import type { PlanSesion } from "../domain/entities/configuracion.js";
import type { Ctx, Nav } from "./main.js";
/**
 * PANTALLA DE REGISTRO al terminar (capa Bloques): las tres opciones como
 * chips grandes, campos con borde suave y "Guardar en el historial" con
 * aire inferior. Aquí es donde el nivel sube o baja de verdad.
 */
export declare function montarRegistrar(ctx: Ctx, nav: Nav, plan: PlanSesion): () => void;
