import type { Impacto, Material, Media, Patron, Tipo, Zona, ZonaTrabajo } from "./tipos.js";
/** Una variante de dificultad de un ejercicio (1 suave · 2 media · 3 fuerte). */
export interface Variante {
    nivel: 1 | 2 | 3;
    nombre: string;
    /** Indicación breve de ejecución que el runner muestra durante el intervalo. */
    cue: string;
    /** Si la variante cambia el impacto del ejercicio (p. ej. versión sin salto). */
    impacto?: Impacto;
}
/** Ejercicio del catálogo. SOLO LECTURA en runtime: es dato semilla. */
export interface Ejercicio {
    id: string;
    nombre: string;
    tipo: Tipo;
    patron: Patron;
    musculos: string[];
    /**
     * Materiales con los que se puede hacer. Lista vacía = solo peso corporal.
     * Si hay varios, son ALTERNATIVAS: basta con tener uno (así está en el
     * catálogo real: "remo_goma" vale con goma_mangos O con banda).
     */
    materiales: Material[];
    impacto: Impacto;
    /** Preparado para mancuernas (función futura; hoy no se usa). */
    dumbbellReady: boolean;
    variantes: Variante[];
    /** Claves de técnica para hacerlo bien. */
    claves: string[];
    /** Error principal a evitar para no lesionarse. */
    evita: string;
    /** Consejo general adicional (campo "tip" del catálogo). */
    consejo: string;
    /** Zonas que carga: si el usuario marca molestia en una, el ejercicio se excluye. */
    joints: Zona[];
    /** Galería ordenada de posiciones/vistas. */
    images: Media[];
    /** Campos gestionables por el usuario (Gestor). Opcionales. */
    notas?: string;
    zonaTrabajo?: ZonaTrabajo;
    parejaId?: string;
    porLados?: boolean;
}
