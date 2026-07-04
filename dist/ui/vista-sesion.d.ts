import type { PlanSesion } from "../domain/entities/configuracion.js";
import { type RunnerState } from "../state/runner.js";
import type { Ctx, Nav } from "./main.js";
export declare function leerSesionActiva(): {
    plan: PlanSesion;
    estado: RunnerState;
} | null;
export declare function borrarSesionActiva(): void;
export declare function montarSesion(ctx: Ctx, nav: Nav, plan: PlanSesion, estadoInicial?: RunnerState): () => void;
