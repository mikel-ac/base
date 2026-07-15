import { materialOk, sinMolestias, varianteParaNivel } from "./filtros.js";
function candidatos(actual, ctx, mismoPatron) {
    const usados = new Set(ctx.usados);
    // Preferimos NO repetir lo que ya está en la sesión, pero como una sesión
    // puede repetir los mismos ejercicios varias veces (el catálogo viable para
    // un foco es pequeño), no podemos excluirlos todos o no quedaría ninguno.
    // Estrategia: primero probamos con candidatos "frescos" (no usados); si no
    // hay, permitimos también los ya presentes. Lo único que nunca ofrecemos es
    // el ejercicio idéntico al que se está sustituyendo.
    const base = ctx.catalogo.filter((e) => {
        if (e.id === actual.id)
            return false;
        if (e.tipo !== actual.tipo)
            return false;
        if (mismoPatron && e.patron !== actual.patron)
            return false;
        if (!materialOk(e, ctx.material))
            return false;
        if (!sinMolestias(e, ctx.molestias))
            return false;
        return varianteParaNivel(e, ctx.nivel, ctx.bajoImpacto) !== null;
    });
    const frescos = base.filter((e) => !usados.has(e.id));
    const repetidos = base.filter((e) => usados.has(e.id));
    // Frescos primero (no repiten sesión), luego los ya presentes como relleno.
    // Así siempre hay variedad para ofrecer 3, sin quedarnos en seco.
    return [...frescos, ...repetidos];
}
/**
 * CANDIDATOS ORDENADOS para sustituir (para la UI de "elige uno de 3").
 *
 * Devuelve TODOS los candidatos viables, ordenados por cercanía:
 *   1º los del mismo patrón de movimiento (equivalencia fuerte),
 *   2º los del mismo tipo pero distinto patrón (algo más lejanos).
 * Nunca falla salvo catálogo casi vacío: si no hay equivalentes exactos,
 * ofrece los "no muy lejanos". Quien llama enseña de 3 en 3 y pagina.
 */
export function candidatosSustitucion(actual, ctx) {
    const cercanos = candidatos(actual, ctx, true);
    const lejanos = candidatos(actual, ctx, false);
    // Une cercanos (mismo patrón) primero y luego los del mismo tipo, sin repetir.
    const vistos = new Set();
    const ordenados = [];
    for (const e of [...cercanos, ...lejanos]) {
        if (vistos.has(e.id))
            continue;
        vistos.add(e.id);
        ordenados.push(e);
    }
    return ordenados
        .map((e) => {
        const variante = varianteParaNivel(e, ctx.nivel, ctx.bajoImpacto);
        return variante ? { ejercicio: e, variante } : null;
    })
        .filter((x) => x !== null);
}
