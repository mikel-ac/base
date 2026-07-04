import type { Sesion } from "../domain/entities/sesion.js";
import type { SesionRepository } from "../domain/repositories/sesion-repository.js";
import { claveDia } from "../core/fechas.js";
import { Store } from "./store.js";

/** Un día del historial, con sus sesiones y totales listos para pintar. */
export interface DiaHistorial {
  clave: string; // "2026-07-02"
  sesiones: Sesion[];
  minutosTotales: number;
  kcalTotales: number | null; // null si ninguna sesión registró kcal
}

export interface HistorialState {
  cargando: boolean;
  dias: DiaHistorial[]; // de más reciente a más antiguo
  error: string | null;
}

/** Agrupa las sesiones por día (§4: "historial por fechas"). Función pura. */
export function agruparPorDia(sesiones: Sesion[]): DiaHistorial[] {
  const mapa = new Map<string, Sesion[]>();
  for (const s of sesiones) {
    const clave = claveDia(s.ts);
    const lista = mapa.get(clave) ?? [];
    lista.push(s);
    mapa.set(clave, lista);
  }
  const dias: DiaHistorial[] = [];
  for (const [clave, lista] of mapa) {
    lista.sort((a, b) => a.ts - b.ts);
    const conKcal = lista.filter((s) => s.kcal !== null);
    dias.push({
      clave,
      sesiones: lista,
      minutosTotales: lista.reduce((suma, s) => suma + s.durMin + s.calentamientoMin, 0),
      kcalTotales: conKcal.length > 0 ? conKcal.reduce((suma, s) => suma + (s.kcal ?? 0), 0) : null,
    });
  }
  return dias.sort((a, b) => (a.clave < b.clave ? 1 : -1)); // reciente primero
}

export class HistorialStore extends Store<HistorialState> {
  constructor(private readonly sesiones: SesionRepository) {
    super({ cargando: true, dias: [], error: null });
  }

  async cargar(usuarioId: string): Promise<void> {
    this.fijar({ cargando: true, error: null });
    try {
      const todas = await this.sesiones.listarPorUsuario(usuarioId);
      this.fijar({ cargando: false, dias: agruparPorDia(todas) });
    } catch (e) {
      this.fijar({ cargando: false, error: e instanceof Error ? e.message : "Error al cargar el historial." });
    }
  }
}
