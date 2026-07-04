import type { PlanSesion } from "../entities/configuracion.js";
import type { Sesion } from "../entities/sesion.js";
import type { Usuario } from "../entities/usuario.js";
import type { Valoracion } from "../entities/tipos.js";
import type { SesionRepository } from "../repositories/sesion-repository.js";
import type { UsuarioRepository } from "../repositories/usuario-repository.js";
/** Lo que el usuario rellena en la pantalla "registrar al terminar". */
export interface RegistroFinal {
    valoracion: Valoracion | null;
    kcal: number | null;
    nota: string;
}
export interface ResultadoRegistro {
    sesion: Sesion;
    nivelAnterior: number;
    nivelNuevo: number;
}
/** Convierte un plan ejecutado + el registro final en una fila del Historial. */
export declare function construirSesion(usuario: Usuario, plan: PlanSesion, registro: RegistroFinal, ts: number): Sesion;
/**
 * CASO DE USO "terminar y registrar": guarda la sesión en el Historial y,
 * si hay valoración, ajusta el nivel del usuario (§7) y lo persiste.
 * Es el ÚNICO sitio donde el nivel cambia: fácil de razonar y de depurar.
 */
export declare class RegistrarSesion {
    private readonly usuarios;
    private readonly sesiones;
    constructor(usuarios: UsuarioRepository, sesiones: SesionRepository);
    ejecutar(usuario: Usuario, plan: PlanSesion, registro: RegistroFinal, ts?: number): Promise<ResultadoRegistro>;
}
