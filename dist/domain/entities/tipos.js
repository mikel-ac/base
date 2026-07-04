/**
 * Tipos básicos compartidos por todo el dominio.
 * Son la "lengua común" de la app: cualquier capa los entiende.
 *
 * NOTA: los valores de Material siguen el catálogo JSON real
 * ("tabla", "bici"), que manda sobre el texto del PRD
 * ("tabla_inclinada", "bici_estatica").
 */
/** Los tres enfoques que el usuario puede activar (el calentamiento va aparte). */
export const TIPOS_ENFOQUE = ["fuerza", "cardio", "movilidad"];
/** Patrones que participan en la rotación de la sugerencia del día. */
export const PATRONES_ROTABLES = [
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
/** Listas para validación en runtime (el seed las usa para comprobar el JSON). */
export const TODOS_TIPOS = ["fuerza", "cardio", "movilidad", "calentamiento"];
export const TODOS_PATRONES = ["empuje", "tiron", "pierna", "core", "cardio", "movilidad", "calentamiento"];
export const TODOS_MATERIALES = ["banda", "goma_mangos", "tabla", "esterilla", "eliptica", "bici"];
export const TODAS_ZONAS = ["hombro", "muneca", "codo", "rodilla", "tobillo", "gemelo", "lumbar", "cuello"];
export const TODOS_IMPACTOS = ["bajo", "medio", "alto"];
export const ZONAS_TRABAJO = ["tren_superior", "core", "pierna_gluteo", "movilidad", "global"];
export const ZONA_TRABAJO_ETIQUETA = {
    tren_superior: "Tren superior",
    core: "Core",
    pierna_gluteo: "Pierna y glúteo",
    movilidad: "Movilidad",
    global: "Global",
};
