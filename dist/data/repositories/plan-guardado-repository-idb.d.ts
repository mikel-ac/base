import type { PlanGuardado } from "../../domain/entities/plan-guardado.js";
import type { PlanGuardadoRepository } from "../../domain/repositories/plan-guardado-repository.js";
export declare class PlanGuardadoRepositoryIdb implements PlanGuardadoRepository {
    private readonly db;
    constructor(db: IDBDatabase);
    guardar(p: PlanGuardado): Promise<void>;
    listarPorUsuario(usuarioId: string): Promise<PlanGuardado[]>;
    eliminar(id: string): Promise<void>;
}
