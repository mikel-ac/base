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
