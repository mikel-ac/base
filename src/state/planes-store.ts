import type { ConfigSesion } from "../domain/entities/configuracion.js";
import type { PlanGuardado } from "../domain/entities/plan-guardado.js";
import type { PlanGuardadoRepository } from "../domain/repositories/plan-guardado-repository.js";
import { uuid } from "../core/util.js";
import { Store } from "./store.js";

/** Contrato de estado de la pantalla "Planes guardados". */
export interface PlanesState {
  cargando: boolean;
  planes: PlanGuardado[];
  error: string | null;
}

export class PlanesStore extends Store<PlanesState> {
  constructor(private readonly repo: PlanGuardadoRepository) {
    super({ cargando: true, planes: [], error: null });
  }

  async cargar(usuarioId: string): Promise<void> {
    this.fijar({ cargando: true, error: null });
    try {
      const planes = await this.repo.listarPorUsuario(usuarioId);
      this.fijar({ cargando: false, planes });
    } catch (e) {
      this.fijar({ cargando: false, error: e instanceof Error ? e.message : "Error al cargar los planes." });
    }
  }

  /** Guarda la configuración actual con un nombre y refresca la lista. */
  async guardar(usuarioId: string, nombre: string, cfg: ConfigSesion): Promise<void> {
    const plan: PlanGuardado = {
      id: uuid(),
      usuarioId,
      nombre: nombre.trim() === "" ? "Mi plan" : nombre.trim(),
      cfg,
      creadoEn: Date.now(),
    };
    await this.repo.guardar(plan);
    await this.cargar(usuarioId);
  }

  async eliminar(usuarioId: string, planId: string): Promise<void> {
    await this.repo.eliminar(planId);
    await this.cargar(usuarioId);
  }
}
