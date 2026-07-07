import type { Ejercicio, Variante } from "../entities/ejercicio.js";
import type { Material, Zona } from "../entities/tipos.js";
import { materialOk, sinMolestias, varianteParaNivel } from "./filtros.js";

/**
 * SUSTITUCIÓN AUTOMÁTICA DE UN EJERCICIO.
 *
 * Dado un ejercicio que el usuario quiere cambiar en la previsualización,
 * elige otro EQUIVALENTE al toque (sin abrir lista). "Equivalente" =
 * mismo patrón de movimiento (empuje, tirón, pierna, core…) para que el
 * entrenamiento conserve su intención, viable con el material disponible,
 * que respete las molestias, que tenga una variante para el nivel actual, y
 * que NO esté ya en la sesión (para no duplicar sin querer).
 *
 * Si no hay ningún candidato del mismo patrón, se relaja a mismo TIPO
 * (fuerza/cardio/movilidad). Si aun así no hay nada, devuelve null y quien
 * llama avisa de que no encontró alternativa.
 *
 * Es una función pura: recibe todo lo que necesita y no toca estado externo.
 */

export interface ContextoSustitucion {
  catalogo: Ejercicio[];
  /** IDs de ejercicios ya presentes en la sesión (para no repetir). */
  usados: string[];
  nivel: number;
  material: Material[];
  molestias: Zona[];
  bajoImpacto: boolean;
}

export interface Sustituto {
  ejercicio: Ejercicio;
  variante: Variante;
}

function candidatos(
  actual: Ejercicio,
  ctx: ContextoSustitucion,
  mismoPatron: boolean
): Ejercicio[] {
  const usados = new Set(ctx.usados);
  return ctx.catalogo.filter((e) => {
    if (e.id === actual.id) return false;
    if (usados.has(e.id)) return false;
    if (e.tipo !== actual.tipo) return false;
    if (mismoPatron && e.patron !== actual.patron) return false;
    if (!materialOk(e, ctx.material)) return false;
    if (!sinMolestias(e, ctx.molestias)) return false;
    // Debe tener una variante utilizable para el nivel/impacto actual.
    return varianteParaNivel(e, ctx.nivel, ctx.bajoImpacto) !== null;
  });
}

/**
 * Elige un sustituto. `rng` permite inyectar aleatoriedad determinista en
 * pruebas; por defecto usa Math.random.
 */
export function sustituirEjercicio(
  actual: Ejercicio,
  ctx: ContextoSustitucion,
  rng: () => number = Math.random
): Sustituto | null {
  // 1º intento: mismo patrón (equivalencia fuerte). 2º: mismo tipo (relajado).
  let opciones = candidatos(actual, ctx, true);
  if (opciones.length === 0) opciones = candidatos(actual, ctx, false);
  if (opciones.length === 0) return null;

  const elegido = opciones[Math.floor(rng() * opciones.length)]!;
  const variante = varianteParaNivel(elegido, ctx.nivel, ctx.bajoImpacto)!;
  return { ejercicio: elegido, variante };
}
