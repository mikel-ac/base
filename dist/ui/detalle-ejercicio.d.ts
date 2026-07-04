import type { EjercicioAsignado } from "../domain/entities/configuracion.js";
import { type SondaMedia } from "../domain/usecases/resolver-media.js";
/**
 * DETALLE DE EJERCICIO (§4 del PRD): la variante que toca, la demostración
 * visual, las claves de técnica, el "evita" y el consejo general.
 *
 * La demostración sigue el orden automático del §10 (resolverMedia):
 *   1) clip propio media/{id}.mp4   2) media/{id}.gif
 *   3) galería del catálogo (dibujos svg o fotos)   4) marcador con el nombre.
 * Para saber si existe un clip propio se pregunta al servidor con una
 * petición ligera (HEAD): si algún día grabas tus clips y los dejas en la
 * carpeta media/ con el id del ejercicio, aparecerán solos, sin tocar código.
 */
export declare const sondaFetch: SondaMedia;
export declare function mostrarDetalleEjercicio(asignado: EjercicioAsignado, alCerrar?: () => void): void;
