import type { PlanGuardado } from "../domain/entities/plan-guardado.js";
import type { Ctx, Nav } from "./main.js";
export declare function montarDisenador(ctx: Ctx, nav: Nav, planExistente?: PlanGuardado): () => void;
