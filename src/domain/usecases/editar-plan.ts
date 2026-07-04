import type { EjercicioAsignado, PlanSesion } from "../entities/configuracion.js";
import type { Ejercicio } from "../entities/ejercicio.js";
import type { Resultado } from "../../core/resultado.js";
import { fallo, ok } from "../../core/resultado.js";
import { esViable, varianteParaNivel } from "./filtros.js";

/**
 * EDICIÓN DE UNA SESIÓN GENERADA (§4: reordenar, cambiar o quitar ejercicios,
 * incluido el calentamiento). Funciones PURAS: nunca modifican el plan que
 * reciben; devuelven uno nuevo (así "deshacer" es trivial para la UI:
 * basta con quedarse el plan anterior).
 *
 * IMPORTANTE (principio del PRD): la elección manual del usuario SIEMPRE
 * prevalece. Por eso al editar NO se re-aplican las reglas de equilibrio
 * (patrones no consecutivos, tope de material): si el usuario quiere dos
 * ejercicios de core seguidos, está en su derecho. Lo único que sí se
 * comprueba al SUSTITUIR es la seguridad y la viabilidad: molestias,
 * material disponible y que exista variante para su nivel.
 */

export type Bloque = "calentamiento" | "principal";

function clonar(plan: PlanSesion): PlanSesion {
  return {
    calentamiento: [...plan.calentamiento],
    principal: [...plan.principal],
    cfg: plan.cfg,
  };
}

function lista(plan: PlanSesion, bloque: Bloque): EjercicioAsignado[] {
  return bloque === "calentamiento" ? plan.calentamiento : plan.principal;
}

/** Mueve un ejercicio dentro de su bloque (drag & drop de la UI). */
export function moverEjercicio(
  plan: PlanSesion,
  bloque: Bloque,
  desde: number,
  hasta: number
): Resultado<PlanSesion> {
  const nuevo = clonar(plan);
  const items = lista(nuevo, bloque);
  if (desde < 0 || desde >= items.length || hasta < 0 || hasta >= items.length) {
    return fallo("Posición fuera de rango.");
  }
  const [movido] = items.splice(desde, 1);
  items.splice(hasta, 0, movido!);
  return ok(nuevo);
}

/** Quita un ejercicio del plan. Se permite dejar el calentamiento vacío. */
export function quitarEjercicio(
  plan: PlanSesion,
  bloque: Bloque,
  indice: number
): Resultado<PlanSesion> {
  const nuevo = clonar(plan);
  const items = lista(nuevo, bloque);
  if (indice < 0 || indice >= items.length) return fallo("Posición fuera de rango.");
  if (bloque === "principal" && items.length === 1) {
    return fallo("La sesión necesita al menos un ejercicio.");
  }
  items.splice(indice, 1);
  return ok(nuevo);
}

/**
 * Sustituye un ejercicio por otro del catálogo. Comprueba SEGURIDAD y
 * VIABILIDAD (molestias, material, variante para el nivel) con la
 * configuración del plan; el equilibrio queda a criterio del usuario.
 */
export function sustituirEjercicio(
  plan: PlanSesion,
  bloque: Bloque,
  indice: number,
  nuevoEjercicio: Ejercicio
): Resultado<PlanSesion> {
  const nuevo = clonar(plan);
  const items = lista(nuevo, bloque);
  if (indice < 0 || indice >= items.length) return fallo("Posición fuera de rango.");
  if (!esViable(nuevoEjercicio, plan.cfg)) {
    return fallo("Ese ejercicio no encaja con tus molestias, material o nivel de hoy.");
  }
  const variante = varianteParaNivel(nuevoEjercicio, plan.cfg.nivel, plan.cfg.bajoImpacto)!;
  items[indice] = { ejercicio: nuevoEjercicio, variante };
  return ok(nuevo);
}

/**
 * Alternativas para el selector de "cambiar ejercicio": ejercicios viables
 * con la configuración del plan, del bloque adecuado (calentamientos para
 * el calentamiento; tipos del focus para el principal), excluyendo los que
 * ya están en el plan. Ordenadas con los del MISMO PATRÓN primero (lo más
 * probable es querer un sustituto equivalente).
 */
export function alternativasPara(
  catalogo: Ejercicio[],
  plan: PlanSesion,
  bloque: Bloque,
  indice: number
): Ejercicio[] {
  const items = lista(plan, bloque);
  const actual = items[indice];
  if (!actual) return [];
  const enPlan = new Set(
    [...plan.calentamiento, ...plan.principal].map((a) => a.ejercicio.id)
  );
  const delBloque = (e: Ejercicio) =>
    bloque === "calentamiento"
      ? e.tipo === "calentamiento"
      : e.tipo !== "calentamiento" && plan.cfg.focus.includes(e.tipo);
  const candidatos = catalogo.filter(
    (e) => !enPlan.has(e.id) && delBloque(e) && esViable(e, plan.cfg)
  );
  const patronActual = actual.ejercicio.patron;
  return candidatos.sort((a, b) => {
    const pa = a.patron === patronActual ? 0 : 1;
    const pb = b.patron === patronActual ? 0 : 1;
    return pa - pb || a.nombre.localeCompare(b.nombre);
  });
}
