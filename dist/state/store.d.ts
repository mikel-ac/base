/**
 * MINI-STORE OBSERVABLE, agnóstico de framework.
 * Patrón: la UI se SUSCRIBE al estado; cuando el estado cambia, se le avisa
 * y repinta. Es la misma idea que Redux/BLoC pero en ~30 líneas, suficiente
 * para esta escala. Funciona igual con HTML a mano, React, Vue o lo que sea:
 *
 *   const parar = store.suscribir((estado) => pintar(estado));
 */
export type Escucha<S> = (estado: S) => void;
export declare class Store<S> {
    private estado;
    private escuchas;
    constructor(estado: S);
    obtener(): S;
    /** Actualiza parte del estado (mezcla superficial) y avisa a los suscritos. */
    fijar(parcial: Partial<S>): void;
    /** Actualiza el estado SIN repintar (la UI ya refleja el cambio en el DOM,
        p. ej. un toggle/chip que anima en el sitio). Mantiene el estado como
        fuente de verdad para el siguiente repintado. */
    fijarSilencioso(parcial: Partial<S>): void;
    /** Sustituye el estado entero y avisa. */
    reemplazar(estado: S): void;
    /** Devuelve una función para darse de baja (llámala al cerrar la pantalla). */
    suscribir(fn: Escucha<S>): () => void;
    private emitir;
}
