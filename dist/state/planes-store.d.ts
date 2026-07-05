import type { ConfigSesion } from "../domain/entities/configuracion.js";
import type { EntrenamientoFijo } from "../domain/entities/entrenamiento-fijo.js";
import type { PlanGuardado } from "../domain/entities/plan-guardado.js";
import type { PlanGuardadoRepository } from "../domain/repositories/plan-guardado-repository.js";
import { Store } from "./store.js";
/** Contrato de estado de la pantalla "Planes guardados". */
export interface PlanesState {
    cargando: boolean;
    planes: PlanGuardado[];
    error: string | null;
}
export declare class PlanesStore extends Store<PlanesState> {
    private readonly repo;
    constructor(repo: PlanGuardadoRepository);
    cargar(usuarioId: string): Promise<void>;
    /** Guarda la configuración actual con un nombre y refresca la lista. */
    guardar(usuarioId: string, nombre: string, cfg: ConfigSesion): Promise<void>;
    /**
     * Crea o actualiza un ENTRENAMIENTO FIJO (diseñado a mano).
     * Si se pasa `id`, actualiza ese plan conservando su fecha de creación;
     * si no, crea uno nuevo. Refresca la lista al terminar.
     */
    guardarFijo(usuarioId: string, nombre: string, fijo: EntrenamientoFijo, id?: string): Promise<void>;
    /** Busca un plan por id en el estado ya cargado (para editar/usar). */
    obtenerPlan(id: string): PlanGuardado | undefined;
    eliminar(usuarioId: string, planId: string): Promise<void>;
}
