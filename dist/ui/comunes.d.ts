/** Utilidades compartidas por todas las pantallas. */
/** Escapa texto para meterlo en HTML (buen hábito aunque los datos sean locales). */
export declare function esc(texto: string): string;
/** Globo temporal de aviso en la parte inferior. */
export declare function aviso(texto: string): void;
/**
 * Entrada escalonada de pantalla (guía §6): añade la animación "rise" a los
 * hijos directos con retardo creciente. Llamar UNA vez por montaje, no en
 * cada repintado (para que la pantalla no "salte" con cada dato nuevo).
 */
export declare function animarEntrada(raiz: HTMLElement): void;
export declare const VALORACION_TEXTO: Record<string, string>;
