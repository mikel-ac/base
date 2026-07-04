import { CalcularMetricas } from "../domain/usecases/calcular-metricas.js";
import { SugerirHoy } from "../domain/usecases/sugerir-hoy.js";
import { Store } from "./store.js";
const ESTADO_INICIAL = {
    cargando: true,
    usuario: null,
    metricas: null,
    sugerencia: null,
    ultimaSesion: null,
    error: null,
};
/** Orquesta los casos de uso de Inicio y expone el estado. Sin UI. */
export class InicioStore extends Store {
    usuarios;
    calcularMetricas;
    sugerirHoy;
    sesiones;
    constructor(usuarios, sesiones) {
        super(ESTADO_INICIAL);
        this.usuarios = usuarios;
        this.sesiones = sesiones;
        this.calcularMetricas = new CalcularMetricas(sesiones);
        this.sugerirHoy = new SugerirHoy(sesiones);
    }
    /** Llamar al entrar en Inicio y tras registrar una sesión. */
    async cargar() {
        this.fijar({ cargando: true, error: null });
        try {
            const usuario = await this.usuarios.obtenerActivo();
            const [metricas, sugerencia, ultimaSesion] = await Promise.all([
                this.calcularMetricas.ejecutar(usuario),
                this.sugerirHoy.ejecutar(usuario),
                this.sesiones.ultimaSesion(usuario.id),
            ]);
            this.fijar({ cargando: false, usuario, metricas, sugerencia, ultimaSesion });
        }
        catch (e) {
            this.fijar({ cargando: false, error: e instanceof Error ? e.message : "Error al cargar Inicio." });
        }
    }
}
