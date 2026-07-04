/**
 * Tipos básicos compartidos por todo el dominio.
 * Son la "lengua común" de la app: cualquier capa los entiende.
 *
 * NOTA: los valores de Material siguen el catálogo JSON real
 * ("tabla", "bici"), que manda sobre el texto del PRD
 * ("tabla_inclinada", "bici_estatica").
 */

export type Tipo = "fuerza" | "cardio" | "movilidad" | "calentamiento";

export type Patron =
  | "empuje"
  | "tiron"
  | "pierna"
  | "core"
  | "cardio"
  | "movilidad"
  | "calentamiento";

export type Material =
  | "banda"
  | "goma_mangos"
  | "tabla"
  | "esterilla"
  | "eliptica"
  | "bici";

export type Zona =
  | "hombro"
  | "muneca"
  | "codo"
  | "rodilla"
  | "tobillo"
  | "gemelo"
  | "lumbar"
  | "cuello";

export type Impacto = "bajo" | "medio" | "alto";

export type Valoracion = "facil" | "en_su_punto" | "dura";

/** Los tres enfoques que el usuario puede activar (el calentamiento va aparte). */
export const TIPOS_ENFOQUE: readonly Tipo[] = ["fuerza", "cardio", "movilidad"];

/** Patrones que participan en la rotación de la sugerencia del día. */
export const PATRONES_ROTABLES: readonly Patron[] = [
  "empuje",
  "tiron",
  "pierna",
  "core",
  "cardio",
  "movilidad",
];

/** Límites del nivel continuo de intensidad (§7 del PRD). */
export const NIVEL_MIN = 1.0;
export const NIVEL_MAX = 3.0;
export const NIVEL_POR_DEFECTO = 2.0;

/**
 * Un medio de la galería de un ejercicio: o una imagen externa (src),
 * o un dibujo SVG embebido, o solo una etiqueta (marcador).
 */
export interface Media {
  label: string;
  src?: string;
  svg?: string;
  credit?: string;
}

/** Listas para validación en runtime (el seed las usa para comprobar el JSON). */
export const TODOS_TIPOS: readonly Tipo[] = ["fuerza", "cardio", "movilidad", "calentamiento"];
export const TODOS_PATRONES: readonly Patron[] = ["empuje", "tiron", "pierna", "core", "cardio", "movilidad", "calentamiento"];
export const TODOS_MATERIALES: readonly Material[] = ["banda", "goma_mangos", "tabla", "esterilla", "eliptica", "bici"];
export const TODAS_ZONAS: readonly Zona[] = ["hombro", "muneca", "codo", "rodilla", "tobillo", "gemelo", "lumbar", "cuello"];
export const TODOS_IMPACTOS: readonly Impacto[] = ["bajo", "medio", "alto"];

/** Zona de trabajo del ejercicio (para filtrar y para sustituir por zona).
 *  Es editable por el usuario en el Gestor; si no la fija, se deriva del patrón. */
export type ZonaTrabajo = "tren_superior" | "core" | "pierna_gluteo" | "global" | "movilidad";
export const ZONAS_TRABAJO: readonly ZonaTrabajo[] = ["tren_superior", "core", "pierna_gluteo", "movilidad", "global"];
export const ZONA_TRABAJO_ETIQUETA: Record<ZonaTrabajo, string> = {
  tren_superior: "Tren superior",
  core: "Core",
  pierna_gluteo: "Pierna y glúteo",
  movilidad: "Movilidad",
  global: "Global",
};
