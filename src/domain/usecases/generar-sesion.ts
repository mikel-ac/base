import type { ConfigSesion, EjercicioAsignado, PlanSesion } from "../entities/configuracion.js";
import type { Ejercicio } from "../entities/ejercicio.js";
import type { Patron } from "../entities/tipos.js";
import type { Resultado } from "../../core/resultado.js";
import { fallo, ok } from "../../core/resultado.js";
import { barajar, clamp, type Rng, rngPorDefecto } from "../../core/util.js";
import { filtrarCalentamientos, filtrarPool, varianteParaNivel } from "./filtros.js";

/**
 * MOTOR DE GENERACIÓN DE SESIONES (§6 del PRD).
 * Función pura: mismas entradas + mismo RNG → misma sesión.
 * No sabe nada de UI ni de bases de datos.
 */

/** Nº de ejercicios del bloque principal: cuántos intervalos caben (regla 6). */
export function numEjerciciosPara(durMin: number, workSec: number, restSec: number): number {
  const intervalo = workSec + restSec;
  if (intervalo <= 0 || durMin <= 0) return 0;
  return Math.max(1, Math.floor((durMin * 60) / intervalo));
}

/**
 * Nº de ejercicios de calentamiento. SUPUESTO (no fijado por el PRD):
 * aproximadamente un movimiento por minuto, entre 2 y 5. Si más adelante el
 * prototipo dicta otra regla, solo hay que cambiar esta función.
 */
export function numCalentamientos(calentamientoMin: number): number {
  if (calentamientoMin <= 0) return 0;
  return clamp(Math.round(calentamientoMin), 2, 5);
}

/**
 * Selección balanceada (reglas 3 y 4 de §6):
 * - reparte entre los patrones disponibles, tirando siempre del patrón
 *   MENOS usado hasta el momento (equilibrio),
 * - nunca repite patrón en dos ejercicios consecutivos (salvo que sea
 *   literalmente imposible, p. ej. pool de un solo patrón),
 * - los ejercicios CON material no pasan de la mitad de la sesión
 *   (no monopolizan), siempre que haya alternativa a peso corporal,
 * - si la sesión pide más ejercicios de los que hay en el pool, se repite
 *   en modo circuito (vuelve a empezar la rotación),
 * - si llega un énfasis (sugerencia del día), ese patrón recibe ~1 hueco
 *   extra; nunca rompe las reglas anteriores.
 */
export function seleccionBalanceada(
  pool: Ejercicio[],
  n: number,
  rng: Rng,
  enfasis?: Patron
): Ejercicio[] {
  if (pool.length === 0 || n <= 0) return [];

  // Agrupar por patrón, con cada grupo barajado (variedad entre sesiones).
  const grupos = new Map<Patron, Ejercicio[]>();
  for (const e of barajar(pool, rng)) {
    const lista = grupos.get(e.patron) ?? [];
    lista.push(e);
    grupos.set(e.patron, lista);
  }

  const restantes = new Map<Patron, Ejercicio[]>();
  const recargar = () => {
    for (const [p, lista] of grupos) restantes.set(p, [...lista]);
  };
  recargar();

  const resultado: Ejercicio[] = [];
  const usosPorPatron = new Map<Patron, number>();
  // Énfasis (§9): el patrón sugerido arranca con un "uso" de ventaja (-1),
  // así el reparto por menos-usado le da aproximadamente un hueco extra.
  if (enfasis && grupos.has(enfasis)) usosPorPatron.set(enfasis, -1);
  const capMaterial = Math.ceil(n / 2);
  const hayPesoCorporal = pool.some((e) => e.materiales.length === 0);
  let conMaterial = 0;
  let ultimoPatron: Patron | null = null;

  /** Patrones elegibles ahora mismo: con ejercicios y, si se puede, sin repetir el anterior. */
  const calcularCandidatos = (): Patron[] => {
    const patrones = [...restantes.keys()].filter((p) => restantes.get(p)!.length > 0);
    const sinRepetir = patrones.filter((p) => p !== ultimoPatron);
    return sinRepetir.length > 0 ? sinRepetir : patrones;
  };

  while (resultado.length < n) {
    let candidatos = calcularCandidatos();
    // Recargar (modo circuito, se permiten repetir ejercicios) si no queda nada
    // o si lo ÚNICO que queda es el patrón que acabamos de usar y el pool
    // tiene más patrones: mejor reiniciar la rotación que repetir patrón.
    const soloQuedaElUltimo =
      candidatos.length === 1 && candidatos[0] === ultimoPatron && grupos.size > 1;
    if (candidatos.length === 0 || soloQuedaElUltimo) {
      recargar();
      candidatos = calcularCandidatos();
    }

    // Con el tope de material alcanzado, preferir patrones que aún tengan
    // ejercicios a peso corporal; si el circuito los agotó pero el pool los
    // tiene, se recarga para recuperarlos. La regla dura de no repetir patrón
    // manda más: solo se cede en el material si no queda otra.
    if (conMaterial >= capMaterial && hayPesoCorporal) {
      const soloPesoCorporal = (lista: Patron[]) =>
        lista.filter((p) => restantes.get(p)!.some((e) => e.materiales.length === 0));
      let conPC = soloPesoCorporal(candidatos);
      if (conPC.length === 0) {
        recargar();
        candidatos = calcularCandidatos();
        conPC = soloPesoCorporal(candidatos);
      }
      if (conPC.length > 0) candidatos = conPC;
    }

    // Preferir el patrón menos usado; empates se resuelven al azar.
    const uso = (p: Patron) => usosPorPatron.get(p) ?? 0;
    const minUso = Math.min(...candidatos.map(uso));
    const empatados = candidatos.filter((p) => uso(p) === minUso);
    const patron = empatados[Math.floor(rng() * empatados.length)]!;

    // Dentro del patrón, respetar el tope de material si se puede.
    const lista = restantes.get(patron)!;
    let idx = 0;
    if (conMaterial >= capMaterial) {
      const i = lista.findIndex((e) => e.materiales.length === 0);
      if (i >= 0) idx = i;
    }
    const elegido = lista.splice(idx, 1)[0]!;

    if (elegido.materiales.length > 0) conMaterial++;
    usosPorPatron.set(patron, uso(patron) + 1);
    ultimoPatron = patron;
    resultado.push(elegido);
  }
  return resultado;
}

/** Bloque de calentamiento: muestreo simple sin repetir (regla 5: fase propia). */
function elegirCalentamiento(catalogo: Ejercicio[], cfg: ConfigSesion, rng: Rng): Ejercicio[] {
  const pool = filtrarCalentamientos(catalogo, cfg);
  const n = Math.min(numCalentamientos(cfg.calentamientoMin), pool.length);
  return barajar(pool, rng).slice(0, n);
}

function asignar(e: Ejercicio, cfg: ConfigSesion): EjercicioAsignado {
  // El filtro del pool garantiza que existe variante (regla 7): el "!" es seguro.
  return { ejercicio: e, variante: varianteParaNivel(e, cfg.nivel, cfg.bajoImpacto)! };
}

/**
 * Entrada única del motor. Devuelve un Resultado:
 * - ok(PlanSesion) si se pudo generar,
 * - fallo(mensaje) con las dos guardas del PRD (regla 8).
 */
export function generarSesion(
  catalogo: Ejercicio[],
  cfg: ConfigSesion,
  rng: Rng = rngPorDefecto
): Resultado<PlanSesion> {
  const focus = cfg.focus.filter((f) => f !== "calentamiento");
  if (focus.length === 0) {
    return fallo("Elige al menos un enfoque.");
  }
  const cfgLimpia: ConfigSesion = { ...cfg, focus };

  const pool = filtrarPool(catalogo, cfgLimpia);
  if (pool.length === 0) {
    return fallo("No queda ningún ejercicio con esos filtros: afloja molestias, material, zona o enfoque.");
  }

  const calentamiento = elegirCalentamiento(catalogo, cfgLimpia, rng).map((e) => asignar(e, cfgLimpia));
  const n = numEjerciciosPara(cfgLimpia.durMin, cfgLimpia.workSec, cfgLimpia.restSec);
  const principal = seleccionBalanceada(pool, n, rng, cfgLimpia.enfasis).map((e) => asignar(e, cfgLimpia));

  return ok({ calentamiento, principal, cfg: cfgLimpia });
}
