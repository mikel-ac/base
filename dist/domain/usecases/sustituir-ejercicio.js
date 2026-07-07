import { materialOk, sinMolestias, varianteParaNivel } from "./filtros.js";
function candidatos(actual, ctx, mismoPatron) {
    const usados = new Set(ctx.usados);
    return ctx.catalogo.filter((e) => {
        if (e.id === actual.id)
            return false;
        if (usados.has(e.id))
            return false;
        if (e.tipo !== actual.tipo)
            return false;
        if (mismoPatron && e.patron !== actual.patron)
            return false;
        if (!materialOk(e, ctx.material))
            return false;
        if (!sinMolestias(e, ctx.molestias))
            return false;
        // Debe tener una variante utilizable para el nivel/impacto actual.
        return varianteParaNivel(e, ctx.nivel, ctx.bajoImpacto) !== null;
    });
}
/**
 * Elige un sustituto. `rng` permite inyectar aleatoriedad determinista en
 * pruebas; por defecto usa Math.random.
 */
export function sustituirEjercicio(actual, ctx, rng = Math.random) {
    // 1º intento: mismo patrón (equivalencia fuerte). 2º: mismo tipo (relajado).
    let opciones = candidatos(actual, ctx, true);
    if (opciones.length === 0)
        opciones = candidatos(actual, ctx, false);
    if (opciones.length === 0)
        return null;
    const elegido = opciones[Math.floor(rng() * opciones.length)];
    const variante = varianteParaNivel(elegido, ctx.nivel, ctx.bajoImpacto);
    return { ejercicio: elegido, variante };
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
    const lejanos = candidatos(actual, ctx, false).filter((e) => !cercanos.some((c) => c.id === e.id));
    const ordenados = [...cercanos, ...lejanos];
    return ordenados
        .map((e) => {
        const variante = varianteParaNivel(e, ctx.nivel, ctx.bajoImpacto);
        return variante ? { ejercicio: e, variante } : null;
    })
        .filter((x) => x !== null);
}
