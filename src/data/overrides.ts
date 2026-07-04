import type { Ejercicio } from "../domain/entities/ejercicio.js";
import type { Patron, Tipo, ZonaTrabajo } from "../domain/entities/tipos.js";

/**
 * MODIFICACIONES DEL USUARIO ("overrides").
 * El catálogo base es semilla de solo lectura. Lo que el usuario edita en el
 * Gestor se guarda aparte (localStorage) y se aplica ENCIMA al cargar, sin
 * tocar la semilla. Así nunca se corrompe el catálogo y los cambios persisten.
 */
export interface OverrideEjercicio {
  nombre?: string;
  tipo?: Tipo;
  consejo?: string;
  notas?: string;
  zonaTrabajo?: ZonaTrabajo;
  parejaId?: string;
  porLados?: boolean;
  claves?: string[];
}

const CLAVE = "base.ejercicios_override";

export function leerOverrides(): Record<string, OverrideEjercicio> {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? "{}") as Record<string, OverrideEjercicio>;
  } catch {
    return {};
  }
}

export function guardarOverride(id: string, ov: OverrideEjercicio): void {
  const todos = leerOverrides();
  const combinado: OverrideEjercicio = { ...todos[id], ...ov };
  (Object.keys(combinado) as (keyof OverrideEjercicio)[]).forEach((k) => {
    const v = combinado[k];
    if (v === undefined || v === "" || v === null) delete combinado[k];
  });
  if (Object.keys(combinado).length === 0) delete todos[id];
  else todos[id] = combinado;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(todos));
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Aplica las modificaciones del usuario sobre el catálogo base. */
export function aplicarOverrides(ejercicios: Ejercicio[]): Ejercicio[] {
  const ov = leerOverrides();
  return ejercicios.map((e) => {
    const o = ov[e.id];
    if (!o) return e;
    return {
      ...e,
      ...(o.nombre ? { nombre: o.nombre } : {}),
      ...(o.consejo !== undefined ? { consejo: o.consejo } : {}),
      ...(o.notas !== undefined ? { notas: o.notas } : {}),
      ...(o.zonaTrabajo ? { zonaTrabajo: o.zonaTrabajo } : {}),
      ...(o.parejaId ? { parejaId: o.parejaId } : {}),
      ...(o.porLados !== undefined ? { porLados: o.porLados } : {}),
      ...(o.claves ? { claves: o.claves } : {}),
      ...(o.tipo ? { tipo: o.tipo } : {}),
    };
  });
}

const ZONA_DE_PATRON: Record<Patron, ZonaTrabajo> = {
  empuje: "tren_superior",
  tiron: "tren_superior",
  pierna: "pierna_gluteo",
  core: "core",
  cardio: "global",
  movilidad: "movilidad",
  calentamiento: "global",
};

/** Zona de trabajo efectiva: la que fijó el usuario, o la derivada del patrón. */
export function zonaTrabajoDe(e: Ejercicio): ZonaTrabajo {
  return e.zonaTrabajo ?? ZONA_DE_PATRON[e.patron];
}
