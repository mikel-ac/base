import { almacen, pedir } from "../datasources/indexeddb.js";
export class PlanGuardadoRepositoryIdb {
    db;
    constructor(db) {
        this.db = db;
    }
    async guardar(p) {
        await pedir(almacen(this.db, "planes", "readwrite").put(p));
    }
    async listarPorUsuario(usuarioId) {
        const indice = almacen(this.db, "planes", "readonly").index("porUsuario");
        const planes = await pedir(indice.getAll(usuarioId));
        return planes.sort((a, b) => a.creadoEn - b.creadoEn);
    }
    async eliminar(id) {
        await pedir(almacen(this.db, "planes", "readwrite").delete(id));
    }
}
