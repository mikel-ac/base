import { Store } from "./store.js";
/** Crea el estado inicial a partir de un plan generado. */
export function crearRunner(plan, prepSec = 10) {
    const pasos = [
        ...plan.calentamiento.map((a) => ({ bloque: "calentamiento", asignado: a })),
        ...plan.principal.map((a) => ({ bloque: "principal", asignado: a })),
    ];
    return {
        pasos,
        indice: 0,
        fase: pasos.length === 0 ? "fin" : "prep",
        restanteSec: prepSec,
        pausado: false,
        prepSec,
        workSec: plan.cfg.workSec,
        restSec: plan.cfg.restSec,
    };
}
function aTrabajo(s, indice) {
    return {
        estado: { ...s, indice, fase: "trabajo", restanteSec: s.workSec },
        efectos: ["AVISO_TRABAJO"],
    };
}
function aFin(s) {
    return { estado: { ...s, fase: "fin", restanteSec: 0, pausado: false }, efectos: ["AVISO_FIN"] };
}
/** Qué toca al agotarse el tiempo de la fase actual. */
function siguienteFase(s) {
    const esUltimo = s.indice >= s.pasos.length - 1;
    switch (s.fase) {
        case "prep":
            return aTrabajo(s, 0);
        case "trabajo":
            if (esUltimo)
                return aFin(s);
            // Calentamiento seguido: sin descanso entre sus ejercicios.
            if (s.restSec <= 0 || s.pasos[s.indice]?.bloque === "calentamiento")
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
export function reducirRunner(s, ev) {
    if (s.fase === "fin")
        return { estado: s, efectos: [] };
    switch (ev.tipo) {
        case "PAUSAR":
            return { estado: { ...s, pausado: true }, efectos: [] };
        case "REANUDAR":
            return { estado: { ...s, pausado: false }, efectos: [] };
        case "TERMINAR":
            return aFin(s);
        case "SALTAR": {
            // Desde prep o trabajo: pasa al siguiente ejercicio (o fin).
            // Desde descanso: entra ya al ejercicio que esperaba.
            if (s.fase === "descanso")
                return aTrabajo(s, s.indice);
            const esUltimo = s.indice >= s.pasos.length - 1;
            if (s.fase === "trabajo" && esUltimo)
                return aFin(s);
            return aTrabajo(s, s.fase === "prep" ? 0 : s.indice + 1);
        }
        case "TICK": {
            if (s.pausado)
                return { estado: s, efectos: [] };
            const restante = s.restanteSec - 1;
            if (restante > 0) {
                // Cuenta atrás audible: tic en 3, 2 y 1, para seguir la sesión
                // sin mirar la pantalla. El cambio de fase ya suena distinto.
                const efectos = restante <= 3 ? ["AVISO_CUENTA"] : [];
                return { estado: { ...s, restanteSec: restante }, efectos };
            }
            return siguienteFase(s);
        }
    }
}
/** Contrato de estado de la pantalla Sesión (§11.4), envuelto en un Store. */
export class RunnerStore extends Store {
    constructor(plan, prepSec = 10, estadoInicial) {
        super(estadoInicial ?? crearRunner(plan, prepSec));
    }
    /**
     * Despacha un evento y devuelve los efectos para que la UI los ejecute
     * (sonar el beep con SU volumen, vibrar, etc.).
     */
    despachar(ev) {
        const { estado, efectos } = reducirRunner(this.obtener(), ev);
        this.reemplazar(estado);
        return efectos;
    }
}
