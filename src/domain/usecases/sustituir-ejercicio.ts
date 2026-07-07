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
  // Preferimos NO repetir lo que ya está en la sesión, pero como una sesión
  // puede repetir los mismos ejercicios varias veces (el catálogo viable para
  // un foco es pequeño), no podemos excluirlos todos o no quedaría ninguno.
  // Estrategia: primero probamos con candidatos "frescos" (no usados); si no
  // hay, permitimos también los ya presentes. Lo único que nunca ofrecemos es
  // el ejercicio idéntico al que se está sustituyendo.
  const base = ctx.catalogo.filter((e) => {
    if (e.id === actual.id) return false;
    if (e.tipo !== actual.tipo) return false;
    if (mismoPatron && e.patron !== actual.patron) return false;
    if (!materialOk(e, ctx.material)) return false;
    if (!sinMolestias(e, ctx.molestias)) return false;
    return varianteParaNivel(e, ctx.nivel, ctx.bajoImpacto) !== null;
  });
  const frescos = base.filter((e) => !usados.has(e.id));
  const repetidos = base.filter((e) => usados.has(e.id));
  // Frescos primero (no repiten sesión), luego los ya presentes como relleno.
  // Así siempre hay variedad para ofrecer 3, sin quedarnos en seco.
  return [...frescos, ...repetidos];
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

/**
 * CANDIDATOS ORDENADOS para sustituir (para la UI de "elige uno de 3").
 *
 * Devuelve TODOS los candidatos viables, ordenados por cercanía:
 *   1º los del mismo patrón de movimiento (equivalencia fuerte),
 *   2º los del mismo tipo pero distinto patrón (algo más lejanos).
 * Nunca falla salvo catálogo casi vacío: si no hay equivalentes exactos,
 * ofrece los "no muy lejanos". Quien llama enseña de 3 en 3 y pagina.
 */
export function candidatosSustitucion(
  actual: Ejercicio,
  ctx: ContextoSustitucion
): Sustituto[] {
  const cercanos = candidatos(actual, ctx, true);
  const lejanos = candidatos(actual, ctx, false);
  // Une cercanos (mismo patrón) primero y luego los del mismo tipo, sin repetir.
  const vistos = new Set<string>();
  const ordenados: Ejercicio[] = [];
  for (const e of [...cercanos, ...lejanos]) {
    if (vistos.has(e.id)) continue;
    vistos.add(e.id);
    ordenados.push(e);
  }
  return ordenados
    .map((e) => {
      const variante = varianteParaNivel(e, ctx.nivel, ctx.bajoImpacto);
      return variante ? { ejercicio: e, variante } : null;
    })
    .filter((x): x is Sustituto => x !== null);
}
