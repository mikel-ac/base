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
/**
 * Protege un modal de cerrarse por accidente al hacer scroll.
 *
 * En móvil, al arrastrar para desplazar el contenido, el dedo puede empezar o
 * terminar sobre el velo (el fondo alrededor del panel) y el navegador emite
 * un `click` en él: el modal se cerraba solo. Esta utilidad recuerda dónde
 * empezó el gesto y expone `fueArrastre` para que quien maneja el click ignore
 * los desplazamientos.
 *
 * Uso:
 *   const gesto = protegerDeArrastre(velo);
 *   velo.addEventListener("click", (ev) => {
 *     if (objetivo === velo) { if (gesto.fueArrastre(ev)) return; cerrar(); }
 *   });
 */
export declare function protegerDeArrastre(velo: HTMLElement, umbralPx?: number): {
    fueArrastre: (ev: MouseEvent) => boolean;
};
