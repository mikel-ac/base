import type { PlanSesion } from "../domain/entities/configuracion.js";
import type { Ctx, Nav } from "./main.js";
export declare function montarSesion(ctx: Ctx, nav: Nav, plan: PlanSesion): () => void;
