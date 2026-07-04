import { clamp } from "../../core/util.js";
/**
 * FILTROS PUROS del motor de generación (§6 y §8 del PRD).
 * Cada función responde una sola pregunta y no toca nada externo,
 * así se pueden probar una a una.
 */
/**
 * ¿Es viable el ejercicio con el material disponible?
 * - materiales vacío → solo peso corporal → siempre viable.
 * - si lista varios, son alternativas: basta con TENER UNO (intersección).
 */
export function materialOk(e, disponibles) {
    if (e.materiales.length === 0)
        return true;
    return e.materiales.some((m) => disponibles.includes(m));
}
/** ¿El ejercicio evita todas las zonas con molestia? (joints ∩ molestias = ∅) */
export function sinMolestias(e, molestias) {
    if (molestias.length === 0)
        return true;
    return !e.joints.some((z) => molestias.includes(z));
}
/** Impacto efectivo de una variante: el suyo propio o, si no declara, el del ejercicio. */
export function impactoDeVariante(e, v) {
    return v.impacto ?? e.impacto;
}
/**
 * Variantes que se pueden usar según el modo bajo impacto.
 * Con bajo impacto activo se descartan las variantes de impacto ALTO
 * (así "burpees" sobrevive gracias a su variante suave sin salto,
 * y un ejercicio sin ninguna variante tranquila queda fuera).
 */
export function variantesPermitidas(e, bajoImpacto) {
    if (!bajoImpacto)
        return e.variantes;
    return e.variantes.filter((v) => impactoDeVariante(e, v) !== "alto");
}
/**
 * Variante para un nivel continuo (§7): se redondea el nivel a 1/2/3 y se
 * elige esa variante; si no existe, la MÁS CERCANA disponible. En caso de
 * empate a distancia, gana la más SUAVE (prudencia, perfiles mayores).
 * Devuelve null si no hay ninguna variante permitida.
 */
export function varianteParaNivel(e, nivel, bajoImpacto) {
    const permitidas = variantesPermitidas(e, bajoImpacto);
    if (permitidas.length === 0)
        return null;
    const objetivo = clamp(Math.round(nivel), 1, 3);
    let mejor = permitidas[0];
    for (const v of permitidas) {
        const dV = Math.abs(v.nivel - objetivo);
        const dM = Math.abs(mejor.nivel - objetivo);
        if (dV < dM || (dV === dM && v.nivel < mejor.nivel))
            mejor = v;
    }
    return mejor;
}
/** ¿Puede entrar el ejercicio en el pool con esta configuración? (regla 1 y 2 de §6) */
export function esViable(e, cfg) {
    return (materialOk(e, cfg.material) &&
        sinMolestias(e, cfg.molestias) &&
        varianteParaNivel(e, cfg.nivel, cfg.bajoImpacto) !== null);
}
/** Pool del bloque principal: tipo ∈ focus + dentro de la zona (si hay) + viable. */
export function filtrarPool(catalogo, cfg) {
    const enZona = (e) => cfg.patrones === undefined || cfg.patrones.length === 0 || cfg.patrones.includes(e.patron);
    return catalogo.filter((e) => e.tipo !== "calentamiento" && cfg.focus.includes(e.tipo) && enZona(e) && esViable(e, cfg));
}
/** Pool del calentamiento: tipo "calentamiento" + viable (mismas molestias/material). */
export function filtrarCalentamientos(catalogo, cfg) {
    return catalogo.filter((e) => e.tipo === "calentamiento" && esViable(e, cfg));
}
