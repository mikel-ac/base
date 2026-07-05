import { uuid } from "../core/util.js";
import { Store } from "./store.js";
export class PlanesStore extends Store {
    repo;
    constructor(repo) {
        super({ cargando: true, planes: [], error: null });
        this.repo = repo;
    }
    async cargar(usuarioId) {
        this.fijar({ cargando: true, error: null });
        try {
            const planes = await this.repo.listarPorUsuario(usuarioId);
            this.fijar({ cargando: false, planes });
        }
        catch (e) {
            this.fijar({ cargando: false, error: e instanceof Error ? e.message : "Error al cargar los planes." });
        }
    }
    /** Guarda la configuración actual con un nombre y refresca la lista. */
    async guardar(usuarioId, nombre, cfg) {
        const plan = {
            id: uuid(),
            usuarioId,
            nombre: nombre.trim() === "" ? "Mi plan" : nombre.trim(),
            cfg,
            creadoEn: Date.now(),
        };
        await this.repo.guardar(plan);
        await this.cargar(usuarioId);
    }
    /**
     * Crea o actualiza un ENTRENAMIENTO FIJO (diseñado a mano).
     * Si se pasa `id`, actualiza ese plan conservando su fecha de creación;
     * si no, crea uno nuevo. Refresca la lista al terminar.
     */
    async guardarFijo(usuarioId, nombre, fijo, id) {
        const existente = id ? this.obtener().planes.find((p) => p.id === id) : undefined;
        const plan = {
            id: id ?? uuid(),
            usuarioId,
            nombre: nombre.trim() === "" ? "Mi entrenamiento" : nombre.trim(),
            fijo,
            creadoEn: existente?.creadoEn ?? Date.now(),
        };
        await this.repo.guardar(plan);
        await this.cargar(usuarioId);
    }
    /** Busca un plan por id en el estado ya cargado (para editar/usar). */
    obtenerPlan(id) {
        return this.obtener().planes.find((p) => p.id === id);
    }
    async eliminar(usuarioId, planId) {
        await this.repo.eliminar(planId);
        await this.cargar(usuarioId);
    }
}
