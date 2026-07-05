import type { ConfigSesion, EjercicioAsignado, PlanSesion } from "../entities/configuracion.js";
import type { Ejercicio } from "../entities/ejercicio.js";
import type { EntrenamientoFijo, LineaEntrenamiento } from "../entities/entrenamiento-fijo.js";
import type { Resultado } from "../../core/resultado.js";
import { fallo, ok } from "../../core/resultado.js";
import { varianteParaNivel } from "./filtros.js";

/**
 * EXPANSIÓN DE UN ENTRENAMIENTO FIJO A UN PlanSesion EJECUTABLE.
 *
 * Función pura. Convierte la lista guardada de referencias (ejercicioId por
 * línea) en un plan que el runner ejecuta igual que cualquier otra sesión.
 * Diferencias con el motor de generación:
 *  - NO elige ejercicios: usa exactamente los que el usuario diseñó, en orden.
 *  - SÍ elige la variante según el nivel ACTUAL (para no congelar el progreso).
 *  - SÍ expande unilaterales (porLados) a dos lados seguidos, como el motor.
 *
 * Robustez: si un ejercicio del entrenamiento ya no está en el catálogo
 * (se borró en el Gestor) o no tiene variante para el nivel/bajo-impacto de
 * hoy, esa línea se OMITE y se informa (omitidos), en vez de romper la sesión.
 */

export interface ExpansionEntrenamiento {
  plan: PlanSesion;
  /** Nombres de ejercicios que estaban guardados pero no se pudieron incluir. */
  omitidos: string[];
}

function expandirBloque(
  lineas: LineaEntrenamiento[],
  porId: Map<string, Ejercicio>,
  nivel: number,
  bajoImpacto: boolean,
  omitidos: string[]
): EjercicioAsignado[] {
  const salida: EjercicioAsignado[] = [];
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
    const asignado: EjercicioAsignado = { ejercicio: e, variante };
    // Unilateral: dos lados seguidos (mismo ejercicio, misma variante).
    if (e.porLados) salida.push(asignado, asignado);
    else salida.push(asignado);
  }
  return salida;
}

/**
 * Construye el plan a partir del entrenamiento fijo y el catálogo vivo.
 * `nivel` y `bajoImpacto` vienen del perfil ACTUAL del usuario.
 */
export function expandirEntrenamiento(
  fijo: EntrenamientoFijo,
  catalogo: Ejercicio[],
  nivel: number,
  bajoImpacto: boolean
): Resultado<ExpansionEntrenamiento> {
  const porId = new Map(catalogo.map((e) => [e.id, e]));
  const omitidos: string[] = [];

  const calentamiento = expandirBloque(fijo.calentamiento, porId, nivel, bajoImpacto, omitidos);
  const principal = expandirBloque(fijo.principal, porId, nivel, bajoImpacto, omitidos);

  if (principal.length === 0) {
    return fallo(
      "Este entrenamiento no tiene ejercicios utilizables hoy (puede que los borraras del catálogo). Edítalo para añadir alguno."
    );
  }

  // Config mínima coherente para que el runner y el registro del historial
  // funcionen: el bloque principal ya está fijado, así que aquí solo importan
  // los tiempos y unos valores neutros para el resto.
  const durAprox = Math.max(1, Math.round((principal.length * (fijo.workSec + fijo.restSec)) / 60));
  const cfg: ConfigSesion = {
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
