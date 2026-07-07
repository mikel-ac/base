import type { Ejercicio } from "../domain/entities/ejercicio.js";
import type { Material, Patron, Tipo, ZonaTrabajo } from "../domain/entities/tipos.js";
/**
 * MODIFICACIONES DEL USUARIO ("overrides").
 * El catálogo base es semilla de solo lectura. Lo que el usuario edita en el
 * Gestor se guarda aparte (localStorage) y se aplica ENCIMA al cargar, sin
 * tocar la semilla. Así nunca se corrompe el catálogo y los cambios persisten.
 */
export interface OverrideEjercicio {
    nombre?: string;
    tipo?: Tipo;
    consejo?: string;
    notas?: string;
    zonaTrabajo?: ZonaTrabajo;
    parejaId?: string;
    porLados?: boolean;
    claves?: string[];
    /** Material necesario para el ejercicio (banda, tabla…). Filtra por disponibilidad. */
    materiales?: Material[];
    /**
     * URL de un medio (imagen/vídeo) servido por la propia web, p. ej.
     * "media/sentadilla.mp4". A diferencia de los medios subidos (que viven en
     * IndexedDB de un solo dispositivo), una URL SÍ se sincroniza a todos: es
     * texto. Se usa para tener vídeos comunes sin pagar Firebase Storage.
     */
    urlMedia?: string;
}
export declare function leerOverrides(): Record<string, OverrideEjercicio>;
export declare function guardarOverride(id: string, ov: OverrideEjercicio): void;
/** Aplica las modificaciones del usuario sobre el catálogo base. */
export declare function leerAnadidos(): Ejercicio[];
export declare function leerBorrados(): string[];
export declare function esAnadido(id: string): boolean;
export declare function patronDesde(tipo: Tipo, zona: ZonaTrabajo): Patron;
export declare function crearEjercicioUsuario(datos: {
    nombre: string;
    tipo: Tipo;
    zonaTrabajo: ZonaTrabajo;
    consejo?: string;
    claves?: string[];
    porLados?: boolean;
    materiales?: Material[];
}): Ejercicio;
export declare function actualizarAnadido(ej: Ejercicio): void;
export declare function eliminarEjercicio(id: string): void;
export declare function aplicarOverrides(ejercicios: Ejercicio[]): Ejercicio[];
/** Zona de trabajo efectiva: la que fijó el usuario, o la derivada del patrón. */
export declare function zonaTrabajoDe(e: Ejercicio): ZonaTrabajo;
export declare function exportarTextos(): {
    overrides: unknown;
    anadidos: unknown;
    borrados: unknown;
};
export declare function importarTextos(d: {
    overrides?: unknown;
    anadidos?: unknown;
    borrados?: unknown;
}): void;
