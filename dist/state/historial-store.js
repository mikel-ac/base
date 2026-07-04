import { claveDia } from "../core/fechas.js";
import { Store } from "./store.js";
/** Agrupa las sesiones por día (§4: "historial por fechas"). Función pura. */
export function agruparPorDia(sesiones) {
    const mapa = new Map();
    for (const s of sesiones) {
        const clave = claveDia(s.ts);
        const lista = mapa.get(clave) ?? [];
        lista.push(s);
        mapa.set(clave, lista);
    }
    const dias = [];
    for (const [clave, lista] of mapa) {
        lista.sort((a, b) => a.ts - b.ts);
        const conKcal = lista.filter((s) => s.kcal !== null);
        dias.push({
            clave,
            sesiones: lista,
            minutosTotales: lista.reduce((suma, s) => suma + s.durMin + s.calentamientoMin, 0),
            kcalTotales: conKcal.length > 0 ? conKcal.reduce((suma, s) => suma + (s.kcal ?? 0), 0) : null,
        });
    }
    return dias.sort((a, b) => (a.clave < b.clave ? 1 : -1)); // reciente primero
}
export class HistorialStore extends Store {
    sesiones;
    constructor(sesiones) {
        super({ cargando: true, dias: [], error: null });
        this.sesiones = sesiones;
    }
    async cargar(usuarioId) {
        this.fijar({ cargando: true, error: null });
        try {
            const todas = await this.sesiones.listarPorUsuario(usuarioId);
            this.fijar({ cargando: false, dias: agruparPorDia(todas) });
        }
        catch (e) {
            this.fijar({ cargando: false, error: e instanceof Error ? e.message : "Error al cargar el historial." });
        }
    }
}
