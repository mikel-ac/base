import type { Ejercicio } from "../entities/ejercicio.js";
import type { Media } from "../entities/tipos.js";
/**
 * RESOLUCIÓN DE MEDIOS (§10). Orden automático, sin tocar código:
 *   1) clip propio media/{id}.mp4
 *   2) clip propio media/{id}.gif
 *   3) galería del catálogo (svg embebidos o fotos de free-exercise-db)
 *   4) marcador con el nombre
 * La comprobación de "¿existe este archivo?" es cosa del mundo exterior,
 * así que se INYECTA como interfaz: en la web será un fetch HEAD; en las
 * pruebas, una función falsa. La lógica queda pura y probable.
 */
export interface SondaMedia {
    existe(url: string): Promise<boolean>;
}
export type MediaResuelta = {
    tipo: "clip";
    src: string;
} | {
    tipo: "galeria";
    medios: Media[];
} | {
    tipo: "marcador";
    label: string;
};
/** Rutas candidatas de clip propio, en orden de preferencia. */
export declare function candidatosClip(ejercicioId: string): string[];
export declare function resolverMedia(e: Ejercicio, sonda: SondaMedia): Promise<MediaResuelta>;
