/**
 * COLORES DE GOMA configurables.
 *
 * Lista editable por el usuario desde Ajustes (añadir, borrar, renombrar,
 * reordenar). Cada ejercicio que use gomas puede apuntar a uno de estos
 * colores como "el que mejor me va". El orden es de MENOS a MÁS resistente.
 *
 * Se guarda en localStorage (como el resto de la config del Gestor) y viaja
 * en el catálogo compartido cuando hay sincronización, porque es información
 * común, no personal por dispositivo.
 *
 * Cada color tiene un id estable (para que un ejercicio lo referencie aunque
 * se renombre), un nombre visible y un valor CSS para pintar la muestra real.
 */
export interface ColorGoma {
    id: string;
    nombre: string;
    /** Color CSS para la muestra visual (círculo). */
    css: string;
}
/** Lista por defecto: de menos a más resistente (definida por el usuario). */
export declare const COLORES_GOMA_DEFECTO: ColorGoma[];
export declare function leerColoresGoma(): ColorGoma[];
export declare function guardarColoresGoma(lista: ColorGoma[]): void;
/** Busca un color por id (para mostrarlo en la sesión/detalle). */
export declare function colorGomaPorId(id: string | undefined): ColorGoma | undefined;
/** Genera un id estable a partir de un nombre nuevo (para colores añadidos). */
export declare function idDesdeNombre(nombre: string): string;
