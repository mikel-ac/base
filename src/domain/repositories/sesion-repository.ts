import type { Sesion } from "../entities/sesion.js";

/** Contrato de acceso al Historial. */
export interface SesionRepository {
  guardar(s: Sesion): Promise<void>;
  /** Todas las sesiones del usuario, ordenadas por fecha ascendente. */
  listarPorUsuario(usuarioId: string): Promise<Sesion[]>;
  /** Sesiones de una semana ISO concreta (ej. "2026-W27"). */
  listarPorSemana(usuarioId: string, semanaISO: string): Promise<Sesion[]>;
  ultimaSesion(usuarioId: string): Promise<Sesion | null>;
  /**
   * Sesiones de los últimos `dias` días, las `max` más recientes,
   * ordenadas de más antigua a más reciente. Alimenta la sugerencia del día.
   */
  recientes(usuarioId: string, dias: number, max: number): Promise<Sesion[]>;
}
