import { NIVEL_MAX, NIVEL_MIN } from "../entities/tipos.js";
import { clamp, redondear2 } from "../../core/util.js";
/**
 * El "cerebro" de la adaptación (§7). Señal ÚNICA: la valoración del usuario.
 * Regla clave: SUBIR DESPACIO (+0.15 por "fácil": hacen falta ~7 seguidas
 * para subir un nivel entero), BAJAR RÁPIDO (−0.40 por "dura": afloja de
 * verdad). Prudencia pensada para perfiles mayores.
 */
export const DELTA_POR_VALORACION = {
    en_su_punto: 0.0,
    facil: +0.15,
    dura: -0.4,
};
export function ajustarNivel(nivel, valoracion) {
    const delta = DELTA_POR_VALORACION[valoracion];
    return redondear2(clamp(nivel + delta, NIVEL_MIN, NIVEL_MAX));
}
