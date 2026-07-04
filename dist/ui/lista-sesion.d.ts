import type { PasoRunner } from "../state/runner.js";
/**
 * LISTA DE LA SESIÓN EN MARCHA: se abre desde el cronómetro para ver todo
 * el recorrido, con el ejercicio actual resaltado y una marca en los ya
 * hechos. Tocar cualquier ejercicio abre su detalle (encima de esta lista).
 */
export declare function mostrarListaSesion(pasos: PasoRunner[], indiceActual: number, alCerrar?: () => void): void;
