import type { PlanSesion } from "../entities/configuracion.js";
import type { EjercicioRealizado, Sesion } from "../entities/sesion.js";
import type { Usuario } from "../entities/usuario.js";
import type { Patron, Valoracion } from "../entities/tipos.js";
import { uuid } from "../../core/util.js";
import type { SesionRepository } from "../repositories/sesion-repository.js";
import type { UsuarioRepository } from "../repositories/usuario-repository.js";

/** Lo que el usuario rellena en la pantalla "registrar al terminar". */
export interface RegistroFinal {
  valoracion: Valoracion | null; // puede saltárselo
  kcal: number | null;           // opcional, a mano
  nota: string;
}

export interface ResultadoRegistro {
  sesion: Sesion;
  nivelAnterior: number;
  nivelNuevo: number;
}

/** Convierte un plan ejecutado + el registro final en una fila del Historial. */
export function construirSesion(
  usuario: Usuario,
  plan: PlanSesion,
  registro: RegistroFinal,
  ts: number
): Sesion {
  const patrones: Patron[] = plan.principal.map((a) => a.ejercicio.patron);
  const ejercicios: EjercicioRealizado[] = [...plan.calentamiento, ...plan.principal].map((a) => ({
    id: a.ejercicio.id,
    nombre: a.ejercicio.nombre,
    variante: a.variante.nombre,
  }));
  return {
    id: uuid(),
    usuarioId: usuario.id,
    ts,
    focus: plan.cfg.focus,
    patrones,
    durMin: plan.cfg.durMin,
    calentamientoMin: plan.cfg.calentamientoMin,
    workSec: plan.cfg.workSec,
    restSec: plan.cfg.restSec,
    numEjercicios: plan.principal.length,
    ejercicios,
    nivelEnSesion: usuario.nivel,
    valoracion: registro.valoracion,
    kcal: registro.kcal,
    nota: registro.nota,
  };
}

/**
 * CASO DE USO "terminar y registrar": guarda la sesión en el Historial y,
 * si hay valoración, ajusta el nivel del usuario (§7) y lo persiste.
 * Es el ÚNICO sitio donde el nivel cambia: fácil de razonar y de depurar.
 */
export class RegistrarSesion {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly sesiones: SesionRepository
  ) {}

  async ejecutar(
    usuario: Usuario,
    plan: PlanSesion,
    registro: RegistroFinal,
    ts: number = Date.now()
  ): Promise<ResultadoRegistro> {
    const sesion = construirSesion(usuario, plan, registro, ts);
    await this.sesiones.guardar(sesion);

    // NIVEL CONGELADO a 2.0 (variante "Estándar"): decisión de producto.
    // La app ya no ajusta la dificultad con las valoraciones; el usuario
    // controla sus entrenamientos. Si un dispositivo arrastra un nivel
    // distinto de una versión anterior, se auto-repara aquí a 2.
    const NIVEL_FIJO = 2;
    if (usuario.nivel !== NIVEL_FIJO) {
      await this.usuarios.guardar({ ...usuario, nivel: NIVEL_FIJO });
    }
    return { sesion, nivelAnterior: usuario.nivel, nivelNuevo: NIVEL_FIJO };
  }
}
