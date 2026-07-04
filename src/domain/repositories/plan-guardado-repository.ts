import type { PlanGuardado } from "../entities/plan-guardado.js";

/** Contrato de acceso a los planes guardados. */
export interface PlanGuardadoRepository {
  guardar(p: PlanGuardado): Promise<void>;
  listarPorUsuario(usuarioId: string): Promise<PlanGuardado[]>;
  eliminar(id: string): Promise<void>;
}
