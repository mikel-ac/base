import type { Metricas } from "../domain/entities/metricas.js";
import type { Sesion } from "../domain/entities/sesion.js";
import type { Sugerencia } from "../domain/entities/sugerencia.js";
import type { Usuario } from "../domain/entities/usuario.js";
import type { SesionRepository } from "../domain/repositories/sesion-repository.js";
import type { UsuarioRepository } from "../domain/repositories/usuario-repository.js";
import { Store } from "./store.js";
/** Contrato de estado de la pantalla de Inicio (§11.4). */
export interface InicioState {
    cargando: boolean;
    usuario: Usuario | null;
    metricas: Metricas | null;
    sugerencia: Sugerencia | null;
    ultimaSesion: Sesion | null;
    error: string | null;
}
/** Orquesta los casos de uso de Inicio y expone el estado. Sin UI. */
export declare class InicioStore extends Store<InicioState> {
    private readonly usuarios;
    private readonly calcularMetricas;
    private readonly sugerirHoy;
    private readonly sesiones;
    constructor(usuarios: UsuarioRepository, sesiones: SesionRepository);
    /** Llamar al entrar en Inicio y tras registrar una sesión. */
    cargar(): Promise<void>;
}
