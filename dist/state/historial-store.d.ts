import type { Sesion } from "../domain/entities/sesion.js";
import type { SesionRepository } from "../domain/repositories/sesion-repository.js";
import { Store } from "./store.js";
/** Un día del historial, con sus sesiones y totales listos para pintar. */
export interface DiaHistorial {
    clave: string;
    sesiones: Sesion[];
    minutosTotales: number;
    kcalTotales: number | null;
}
export interface HistorialState {
    cargando: boolean;
    dias: DiaHistorial[];
    error: string | null;
}
/** Agrupa las sesiones por día (§4: "historial por fechas"). Función pura. */
export declare function agruparPorDia(sesiones: Sesion[]): DiaHistorial[];
export declare class HistorialStore extends Store<HistorialState> {
    private readonly sesiones;
    constructor(sesiones: SesionRepository);
    cargar(usuarioId: string): Promise<void>;
}
