import { uuid } from "../../core/util.js";
/** Convierte un plan ejecutado + el registro final en una fila del Historial. */
export function construirSesion(usuario, plan, registro, ts) {
    const patrones = plan.principal.map((a) => a.ejercicio.patron);
    const ejercicios = [...plan.calentamiento, ...plan.principal].map((a) => ({
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
    usuarios;
    sesiones;
    constructor(usuarios, sesiones) {
        this.usuarios = usuarios;
        this.sesiones = sesiones;
    }
    async ejecutar(usuario, plan, registro, ts = Date.now()) {
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
