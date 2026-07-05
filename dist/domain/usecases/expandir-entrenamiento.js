import { fallo, ok } from "../../core/resultado.js";
import { varianteParaNivel } from "./filtros.js";
function expandirBloque(lineas, porId, nivel, bajoImpacto, omitidos) {
    const salida = [];
    for (const linea of lineas) {
        const e = porId.get(linea.ejercicioId);
        if (!e) {
            omitidos.push("(ejercicio eliminado)");
            continue;
        }
        const variante = varianteParaNivel(e, nivel, bajoImpacto);
        if (!variante) {
            omitidos.push(e.nombre);
            continue;
        }
        const asignado = { ejercicio: e, variante };
        // Unilateral: dos lados seguidos (mismo ejercicio, misma variante).
        if (e.porLados)
            salida.push(asignado, asignado);
        else
            salida.push(asignado);
    }
    return salida;
}
/**
 * Construye el plan a partir del entrenamiento fijo y el catálogo vivo.
 * `nivel` y `bajoImpacto` vienen del perfil ACTUAL del usuario.
 */
export function expandirEntrenamiento(fijo, catalogo, nivel, bajoImpacto) {
    const porId = new Map(catalogo.map((e) => [e.id, e]));
    const omitidos = [];
    const calentamiento = expandirBloque(fijo.calentamiento, porId, nivel, bajoImpacto, omitidos);
    const principal = expandirBloque(fijo.principal, porId, nivel, bajoImpacto, omitidos);
    if (principal.length === 0) {
        return fallo("Este entrenamiento no tiene ejercicios utilizables hoy (puede que los borraras del catálogo). Edítalo para añadir alguno.");
    }
    // Config mínima coherente para que el runner y el registro del historial
    // funcionen: el bloque principal ya está fijado, así que aquí solo importan
    // los tiempos y unos valores neutros para el resto.
    const durAprox = Math.max(1, Math.round((principal.length * (fijo.workSec + fijo.restSec)) / 60));
    const cfg = {
        nivel,
        focus: ["fuerza", "cardio", "movilidad"],
        material: [],
        bajoImpacto,
        molestias: [],
        calentamientoMin: calentamiento.length,
        durMin: durAprox,
        workSec: fijo.workSec,
        restSec: fijo.restSec,
    };
    return ok({ plan: { calentamiento, principal, cfg }, omitidos });
}
