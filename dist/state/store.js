export class Store {
    estado;
    escuchas = new Set();
    constructor(estado) {
        this.estado = estado;
    }
    obtener() {
        return this.estado;
    }
    /** Actualiza parte del estado (mezcla superficial) y avisa a los suscritos. */
    fijar(parcial) {
        this.estado = { ...this.estado, ...parcial };
        this.emitir();
    }
    /** Actualiza el estado SIN repintar (la UI ya refleja el cambio en el DOM,
        p. ej. un toggle/chip que anima en el sitio). Mantiene el estado como
        fuente de verdad para el siguiente repintado. */
    fijarSilencioso(parcial) {
        this.estado = { ...this.estado, ...parcial };
    }
    /** Sustituye el estado entero y avisa. */
    reemplazar(estado) {
        this.estado = estado;
        this.emitir();
    }
    /** Devuelve una función para darse de baja (llámala al cerrar la pantalla). */
    suscribir(fn) {
        this.escuchas.add(fn);
        fn(this.estado); // primer aviso inmediato con el estado actual
        return () => this.escuchas.delete(fn);
    }
    emitir() {
        for (const fn of this.escuchas)
            fn(this.estado);
    }
}
