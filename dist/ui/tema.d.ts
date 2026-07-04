/**
 * TEMA CLARO/OSCURO. Tres opciones: "sistema" (por defecto, sigue
 * prefers-color-scheme), "claro" y "oscuro". La elección manual se guarda
 * en localStorage (local-first) y manda sobre el sistema. El index.html
 * aplica lo guardado antes de pintar para evitar el parpadeo inicial.
 */
export type Tema = "sistema" | "claro" | "oscuro";
export declare function temaActual(): Tema;
export declare function fijarTema(tema: Tema): void;
export declare function aplicarTema(tema: Tema): void;
