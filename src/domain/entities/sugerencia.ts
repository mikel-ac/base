import type { Patron, Tipo } from "./tipos.js";

/** Propuesta del día. El usuario puede usarla o ignorarla: su elección manda. */
export interface Sugerencia {
  /** Enfoques propuestos (equilibrado por defecto; más suave tras una "dura"). */
  focus: Tipo[];
  /** Patrón al que dar énfasis hoy (rotación), o null si no hay historial. */
  enfasis: Patron | null;
  nivelSugerido: number;
  /** Explicación corta y humana para mostrar junto a la sugerencia. */
  motivo: string;
}
