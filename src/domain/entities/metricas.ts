import type { Valoracion } from "./tipos.js";

export interface VolumenSemana {
  semanaISO: string;
  sesiones: number;
  minutos: number;
}

export type Tendencia = "subiendo" | "estable" | "bajando";

/**
 * Métricas de progreso. NO se guardan: se CALCULAN a partir del Historial
 * cada vez que hacen falta. Con cientos de sesiones al año, recalcular es
 * instantáneo y evita el clásico bug de "caché desincronizada".
 */
export interface Metricas {
  sesionesEstaSemana: number;
  objetivoSemanal: number;
  /** Nº de semanas que alcanzaron el objetivo (informativo, sin castigos). */
  semanasCumplidas: number;
  nivelActual: number;
  /** Reparto de valoraciones sobre las últimas N sesiones valoradas. */
  distribucionValoracion: Record<Valoracion, number>;
  /** Últimas semanas, con ceros incluidos, listas para pintar una gráfica. */
  volumenPorSemana: VolumenSemana[];
  tendenciaSesiones: Tendencia;
}
