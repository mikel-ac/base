import type { Sustituto } from "../domain/usecases/sustituir-ejercicio.js";
/**
 * SELECTOR DE SUSTITUCIÓN.
 *
 * Muestra 3 candidatos para reemplazar un ejercicio. Un botón "Ver otras 3"
 * avanza por la lista (y vuelve al principio al llegar al final). Al tocar
 * un candidato, se elige y se cierra. Los candidatos vienen ya ordenados por
 * cercanía (primero los del mismo patrón de movimiento).
 *
 * Se usa tanto en la previsualización de una sesión como en el diseñador a
 * medida, por eso vive en su propio módulo.
 */
export declare function abrirSelectorSustitucion(nombreActual: string, candidatos: Sustituto[], alElegir: (elegido: Sustituto) => void): void;
