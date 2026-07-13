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

export type EventoRunner =
  | { tipo: "TICK" }      // ha pasado 1 segundo (lo dispara la UI con su reloj)
  | { tipo: "PAUSAR" }
  | { tipo: "REANUDAR" }
  | { tipo: "SALTAR" }    // saltar al siguiente ejercicio
  | { tipo: "TERMINAR" }; // terminar la sesión ya

/** Avisos sonoros/visuales que la UI debe ejecutar (con su control de volumen). */
export type EfectoRunner =
  | "AVISO_CUENTA"    // tic corto en los últimos 3 segundos de cada fase
  | "AVISO_TRABAJO"   // empieza un intervalo de trabajo
  | "AVISO_DESCANSO"  // empieza un descanso
  | "AVISO_PREP_PRINCIPAL" // arranca la preparación previa al bloque principal
  | "AVISO_TRANS_CAL" // arranca la transición entre ejercicios de calentamiento
  | "AVISO_FIN";      // fin de la sesión

export interface PasoRunnerResultado {
  estado: RunnerState;
  efectos: EfectoRunner[];
}

/** Crea el estado inicial a partir de un plan generado. */
export function crearRunner(plan: PlanSesion, prepSec = 10, prepPrincipalSec = 15, transCalSec = 5): RunnerState {
  const pasos: PasoRunner[] = [
    ...plan.calentamiento.map((a): PasoRunner => ({ bloque: "calentamiento", asignado: a })),
    ...plan.principal.map((a): PasoRunner => ({ bloque: "principal", asignado: a })),
  ];
  return {
    pasos,
    indice: 0,
    fase: pasos.length === 0 ? "fin" : "prep",
    restanteSec: prepSec,
    pausado: false,
    prepSec,
    prepPrincipalSec,
    transCalSec,
    workSec: plan.cfg.workSec,
    restSec: plan.cfg.restSec,
  };
}

function aTrabajo(s: RunnerState, indice: number): PasoRunnerResultado {
  return {
    estado: { ...s, indice, fase: "trabajo", restanteSec: s.workSec },
    efectos: ["AVISO_TRABAJO"],
  };
}

/** Preparación (cuenta atrás) al entrar en el bloque principal tras calentar. */
function aPrepPrincipal(s: RunnerState, indice: number): PasoRunnerResultado {
  // Si no hay preparación configurada, saltamos directos al trabajo.
  if (s.prepPrincipalSec <= 0) return aTrabajo(s, indice);
  return {
    estado: { ...s, indice, fase: "prep-principal", restanteSec: s.prepPrincipalSec },
    efectos: ["AVISO_PREP_PRINCIPAL"],
  };
}

/** Transición breve (cuenta atrás) entre dos ejercicios de calentamiento. */
function aTransCal(s: RunnerState, indice: number): PasoRunnerResultado {
  // Si no hay transición configurada, saltamos directos al siguiente.
  if (s.transCalSec <= 0) return aTrabajo(s, indice);
  return {
    estado: { ...s, indice, fase: "transicion-cal", restanteSec: s.transCalSec },
    efectos: ["AVISO_TRANS_CAL"],
  };
}

/** ¿El paso `indice` inaugura el bloque principal viniendo de calentamiento? */
function entraEnPrincipal(s: RunnerState, indice: number): boolean {
  const previo = s.pasos[indice - 1];
  const actual = s.pasos[indice];
  return !!previo && previo.bloque === "calentamiento" && !!actual && actual.bloque === "principal";
}

function aFin(s: RunnerState): PasoRunnerResultado {
  return { estado: { ...s, fase: "fin", restanteSec: 0, pausado: false }, efectos: ["AVISO_FIN"] };
}

/** Qué toca al agotarse el tiempo de la fase actual. */
function siguienteFase(s: RunnerState): PasoRunnerResultado {
  const esUltimo = s.indice >= s.pasos.length - 1;
  switch (s.fase) {
    case "prep":
      return aTrabajo(s, 0);
    case "prep-principal":
      return aTrabajo(s, s.indice);
    case "transicion-cal":
      return aTrabajo(s, s.indice);
    case "trabajo":
      if (esUltimo) return aFin(s);
      // Al cruzar al bloque principal se intercala la preparación larga.
      if (entraEnPrincipal(s, s.indice + 1)) return aPrepPrincipal(s, s.indice + 1);
      // Entre dos ejercicios de calentamiento: transición breve (cuenta atrás).
      if (s.pasos[s.indice]?.bloque === "calentamiento")
        return aTransCal(s, s.indice + 1);
      if (s.restSec <= 0)
        return aTrabajo(s, s.indice + 1);
      return {
        estado: { ...s, fase: "descanso", restanteSec: s.restSec, indice: s.indice + 1 },
        efectos: ["AVISO_DESCANSO"],
      };
    case "descanso":
      return aTrabajo(s, s.indice);
    case "fin":
      return { estado: s, efectos: [] };
  }
}

/** Transición pura: estado + evento → nuevo estado + efectos. */
export function reducirRunner(s: RunnerState, ev: EventoRunner): PasoRunnerResultado {
  if (s.fase === "fin") return { estado: s, efectos: [] };
  switch (ev.tipo) {
    case "PAUSAR":
      return { estado: { ...s, pausado: true }, efectos: [] };
    case "REANUDAR":
      return { estado: { ...s, pausado: false }, efectos: [] };
    case "TERMINAR":
      return aFin(s);
    case "SALTAR": {
      // Desde prep o trabajo: pasa al siguiente ejercicio (o fin).
      // Desde descanso, prep-principal o transición: entra ya al que esperaba.
      if (s.fase === "descanso" || s.fase === "prep-principal" || s.fase === "transicion-cal") return aTrabajo(s, s.indice);
      const esUltimo = s.indice >= s.pasos.length - 1;
      if (s.fase === "trabajo" && esUltimo) return aFin(s);
      const proximo = s.fase === "prep" ? 0 : s.indice + 1;
      // Si al saltar cruzamos al bloque principal, respeta la preparación.
      if (entraEnPrincipal(s, proximo)) return aPrepPrincipal(s, proximo);
      return aTrabajo(s, proximo);
    }
    case "TICK": {
      if (s.pausado) return { estado: s, efectos: [] };
      const restante = s.restanteSec - 1;
      if (restante > 0) {
        // Cuenta atrás audible: tic en 3, 2 y 1, para seguir la sesión
        // sin mirar la pantalla. El cambio de fase ya suena distinto.
        const efectos: EfectoRunner[] = restante <= 3 ? ["AVISO_CUENTA"] : [];
        return { estado: { ...s, restanteSec: restante }, efectos };
      }
      return siguienteFase(s);
    }
  }
}

/** Contrato de estado de la pantalla Sesión (§11.4), envuelto en un Store. */
export class RunnerStore extends Store<RunnerState> {
  constructor(plan: PlanSesion, prepSec = 10, estadoInicial?: RunnerState) {
    super(estadoInicial ?? crearRunner(plan, prepSec));
  }

  /**
   * Despacha un evento y devuelve los efectos para que la UI los ejecute
   * (sonar el beep con SU volumen, vibrar, etc.).
   */
  despachar(ev: EventoRunner): EfectoRunner[] {
    const { estado, efectos } = reducirRunner(this.obtener(), ev);
    this.reemplazar(estado);
    return efectos;
  }
}
