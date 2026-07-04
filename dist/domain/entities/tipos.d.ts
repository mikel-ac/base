/**
 * Tipos básicos compartidos por todo el dominio.
 * Son la "lengua común" de la app: cualquier capa los entiende.
 *
 * NOTA: los valores de Material siguen el catálogo JSON real
 * ("tabla", "bici"), que manda sobre el texto del PRD
 * ("tabla_inclinada", "bici_estatica").
 */
export type Tipo = "fuerza" | "cardio" | "movilidad" | "calentamiento";
export type Patron = "empuje" | "tiron" | "pierna" | "core" | "cardio" | "movilidad" | "calentamiento";
export type Material = "banda" | "goma_mangos" | "tabla" | "esterilla" | "eliptica" | "bici";
export type Zona = "hombro" | "muneca" | "codo" | "rodilla" | "tobillo" | "gemelo" | "lumbar" | "cuello";
export type Impacto = "bajo" | "medio" | "alto";
export type Valoracion = "facil" | "en_su_punto" | "dura";
/** Los tres enfoques que el usuario puede activar (el calentamiento va aparte). */
export declare const TIPOS_ENFOQUE: readonly Tipo[];
/** Patrones que participan en la rotación de la sugerencia del día. */
export declare const PATRONES_ROTABLES: readonly Patron[];
/** Límites del nivel continuo de intensidad (§7 del PRD). */
export declare const NIVEL_MIN = 1;
export declare const NIVEL_MAX = 3;
export declare const NIVEL_POR_DEFECTO = 2;
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
export declare const TODOS_TIPOS: readonly Tipo[];
export declare const TODOS_PATRONES: readonly Patron[];
export declare const TODOS_MATERIALES: readonly Material[];
export declare const TODAS_ZONAS: readonly Zona[];
export declare const TODOS_IMPACTOS: readonly Impacto[];
/** Zona de trabajo del ejercicio (para filtrar y para sustituir por zona).
 *  Es editable por el usuario en el Gestor; si no la fija, se deriva del patrón. */
export type ZonaTrabajo = "tren_superior" | "core" | "pierna_gluteo" | "global" | "movilidad";
export declare const ZONAS_TRABAJO: readonly ZonaTrabajo[];
export declare const ZONA_TRABAJO_ETIQUETA: Record<ZonaTrabajo, string>;
