import type { PlanGuardado } from "../../domain/entities/plan-guardado.js";
import type { PlanGuardadoRepository } from "../../domain/repositories/plan-guardado-repository.js";
import { almacen, pedir } from "../datasources/indexeddb.js";

export class PlanGuardadoRepositoryIdb implements PlanGuardadoRepository {
  constructor(private readonly db: IDBDatabase) {}

  async guardar(p: PlanGuardado): Promise<void> {
    await pedir(almacen(this.db, "planes", "readwrite").put(p));
  }

  async listarPorUsuario(usuarioId: string): Promise<PlanGuardado[]> {
    const indice = almacen(this.db, "planes", "readonly").index("porUsuario");
    const planes = await pedir<PlanGuardado[]>(indice.getAll(usuarioId));
    return planes.sort((a, b) => a.creadoEn - b.creadoEn);
  }

  async eliminar(id: string): Promise<void> {
    await pedir(almacen(this.db, "planes", "readwrite").delete(id));
  }
}
