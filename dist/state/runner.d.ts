import type { EjercicioAsignado, PlanSesion } from "../domain/entities/configuracion.js";
import { Store } from "./store.js";
/**
 * RUNNER DE SESIÓN (la lógica del cronómetro, sin cronómetro).
 *
 * Idea clave: esto es una MÁQUINA DE ESTADOS PURA. No tiene setInterval ni
 * sonidos: recibe eventos ("ha pasado un segundo", "pausa", "salta") y
 * devuelve el nuevo estado + una lista de EFECTOS que la UI debe ejecutar
 * (p. ej. "toca pitar"). Ventajas: se puede probar sin esperar tiempo real,
 * y la UI decide libremente cómo suena y cómo se ve.
 *
 * Secuencia: prep → [trabajo → descanso] × pasos → fin
 * (el descanso se salta tras el último paso, o si restSec = 0).
 */
export type FaseRunner = "prep" | "prep-principal" | "transicion-cal" | "trabajo" | "descanso" | "fin";
export interface PasoRunner {
    bloque: "calentamiento" | "principal";
    asignado: EjercicioAsignado;
}
export interface RunnerState {
    pasos: PasoRunner[];
    /** Índice del paso actual (en fase descanso, el paso que VIENE después). */
    indice: number;
    fase: FaseRunner;
    restanteSec: number;
    pausado: boolean;
    prepSec: number;
    /** Segundos de preparación al entrar en el bloque principal (tras calentar). */
    prepPrincipalSec: number;
    /** Segundos de transición entre dos ejercicios de calentamiento. */
    transCalSec: number;
    workSec: number;
    restSec: number;
}
export type EventoRunner = {
    tipo: "TICK";
} | {
    tipo: "PAUSAR";
} | {
    tipo: "REANUDAR";
} | {
    tipo: "SALTAR";
} | {
    tipo: "TERMINAR";
};
/** Avisos sonoros/visuales que la UI debe ejecutar (con su control de volumen). */
export type EfectoRunner = "AVISO_CUENTA" | "AVISO_TRABAJO" | "AVISO_DESCANSO" | "AVISO_PREP_PRINCIPAL" | "AVISO_TRANS_CAL" | "AVISO_FIN";
export interface PasoRunnerResultado {
    estado: RunnerState;
    efectos: EfectoRunner[];
}
/** Crea el estado inicial a partir de un plan generado. */
export declare function crearRunner(plan: PlanSesion, prepSec?: number, prepPrincipalSec?: number, transCalSec?: number): RunnerState;
/** Transición pura: estado + evento → nuevo estado + efectos. */
export declare function reducirRunner(s: RunnerState, ev: EventoRunner): PasoRunnerResultado;
/** Contrato de estado de la pantalla Sesión (§11.4), envuelto en un Store. */
export declare class RunnerStore extends Store<RunnerState> {
    constructor(plan: PlanSesion, prepSec?: number, estadoInicial?: RunnerState);
    /**
     * Despacha un evento y devuelve los efectos para que la UI los ejecute
     * (sonar el beep con SU volumen, vibrar, etc.).
     */
    despachar(ev: EventoRunner): EfectoRunner[];
}
