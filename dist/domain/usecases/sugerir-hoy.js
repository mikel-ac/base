import { NIVEL_MIN, PATRONES_ROTABLES } from "../entities/tipos.js";
import { redondear2 } from "../../core/util.js";
/**
 * SUGERENCIA DEL DÍA (§9): plan global híbrido.
 * Cada sesión sugerida es completa y equilibrada por sí misma, pero rota el
 * énfasis según lo hecho recientemente. La elección manual SIEMPRE gana:
 * esta función solo propone; nunca se aplica sola.
 */
/** Patrón más frecuente del bloque principal de una sesión (empates: el primero). */
export function patronDominante(s) {
    const cuenta = new Map();
    for (const p of s.patrones) {
        if (p === "calentamiento")
            continue;
        cuenta.set(p, (cuenta.get(p) ?? 0) + 1);
    }
    let dominante = null;
    let max = 0;
    for (const [p, c] of cuenta) {
        if (c > max) {
            max = c;
            dominante = p;
        }
    }
    return dominante;
}
/**
 * Patrón MENOS trabajado en el historial reciente, excluyendo `excepto`.
 * Empates: orden fijo de PATRONES_ROTABLES (determinista y fácil de razonar).
 */
export function patronMenosTrabajado(historial, excepto) {
    const cuenta = new Map();
    for (const p of PATRONES_ROTABLES)
        cuenta.set(p, 0);
    for (const s of historial) {
        for (const p of s.patrones) {
            if (cuenta.has(p))
                cuenta.set(p, (cuenta.get(p) ?? 0) + 1);
        }
    }
    let elegido = PATRONES_ROTABLES[0];
    let min = Infinity;
    for (const p of PATRONES_ROTABLES) {
        if (p === excepto)
            continue;
        const c = cuenta.get(p);
        if (c < min) {
            min = c;
            elegido = p;
        }
    }
    return elegido;
}
/** Núcleo puro, tal cual el pseudocódigo del §9. */
export function sugerirHoy(usuario, historialReciente) {
    // Arranque en frío: sin historial, sesión equilibrada al nivel actual.
    if (historialReciente.length === 0) {
        return {
            focus: ["fuerza", "cardio", "movilidad"],
            enfasis: null,
            nivelSugerido: usuario.nivel,
            motivo: "Sesión equilibrada para empezar. Se irá afinando con el uso.",
        };
    }
    const ultimo = historialReciente[historialReciente.length - 1];
    const enfasisEvitar = patronDominante(ultimo); // recuperación
    const enfasis = patronMenosTrabajado(historialReciente, enfasisEvitar); // rotación
    // Si la última fue "dura", día más suave y nivel rebajado (sin bajar de 1.0).
    if (ultimo.valoracion === "dura") {
        return {
            focus: ["movilidad", "cardio"],
            enfasis,
            nivelSugerido: redondear2(Math.max(NIVEL_MIN, usuario.nivel - 0.3)),
            motivo: "La última sesión fue dura: hoy toca un día más suave para recuperar.",
        };
    }
    return {
        focus: ["fuerza", "cardio", "movilidad"],
        enfasis,
        nivelSugerido: usuario.nivel,
        motivo: `Sesión equilibrada con un toque extra de ${enfasis}, que es lo menos trabajado últimamente.`,
    };
}
/**
 * Caso de uso con acceso a datos: trae las últimas ~3 sesiones de 7 días
 * y delega en el núcleo puro. Es lo que llamará la pantalla de Inicio.
 */
export class SugerirHoy {
    sesiones;
    constructor(sesiones) {
        this.sesiones = sesiones;
    }
    async ejecutar(usuario) {
        const recientes = await this.sesiones.recientes(usuario.id, 7, 3);
        return sugerirHoy(usuario, recientes);
    }
}
