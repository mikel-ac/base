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
  /**
   * URL de un medio (imagen/vídeo) servido por la propia web, p. ej.
   * "media/sentadilla.mp4". A diferencia de los medios subidos (que viven en
   * IndexedDB de un solo dispositivo), una URL SÍ se sincroniza a todos: es
   * texto. Se usa para tener vídeos comunes sin pagar Firebase Storage.
   */
  urlMedia?: string;
}

const CLAVE = "base.ejercicios_override";
const CLAVE_ANADIDOS = "base.ejercicios_anadidos";
const CLAVE_BORRADOS = "base.ejercicios_borrados";

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
export function leerAnadidos(): Ejercicio[] {
  try { return JSON.parse(localStorage.getItem(CLAVE_ANADIDOS) ?? "[]") as Ejercicio[]; } catch { return []; }
}
function guardarAnadidos(lista: Ejercicio[]): void {
  try { localStorage.setItem(CLAVE_ANADIDOS, JSON.stringify(lista)); } catch { /* nada */ }
}
export function leerBorrados(): string[] {
  try { return JSON.parse(localStorage.getItem(CLAVE_BORRADOS) ?? "[]") as string[]; } catch { return []; }
}
export function esAnadido(id: string): boolean {
  return leerAnadidos().some((e) => e.id === id);
}
export function patronDesde(tipo: Tipo, zona: ZonaTrabajo): Patron {
  if (tipo === "calentamiento") return "calentamiento";
  if (tipo === "cardio") return "cardio";
  if (tipo === "movilidad") return "movilidad";
  if (zona === "core") return "core";
  if (zona === "pierna_gluteo") return "pierna";
  if (zona === "tren_superior") return "empuje";
  return "core";
}
export function crearEjercicioUsuario(datos: {
  nombre: string; tipo: Tipo; zonaTrabajo: ZonaTrabajo; consejo?: string; claves?: string[]; porLados?: boolean;
}): Ejercicio {
  const id = "user_" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  const ej: Ejercicio = {
    id,
    nombre: datos.nombre,
    tipo: datos.tipo,
    patron: patronDesde(datos.tipo, datos.zonaTrabajo),
    musculos: [],
    materiales: [],
    impacto: "bajo",
    dumbbellReady: false,
    variantes: [{ nivel: 2, nombre: "Estándar", cue: datos.consejo ?? "" }],
    claves: datos.claves ?? [],
    evita: "",
    consejo: datos.consejo ?? "",
    joints: [],
    images: [],
    zonaTrabajo: datos.zonaTrabajo,
    porLados: datos.porLados ?? false,
  };
  const lista = leerAnadidos();
  lista.push(ej);
  guardarAnadidos(lista);
  return ej;
}
export function actualizarAnadido(ej: Ejercicio): void {
  guardarAnadidos(leerAnadidos().map((x) => (x.id === ej.id ? ej : x)));
}
export function eliminarEjercicio(id: string): void {
  if (esAnadido(id)) {
    guardarAnadidos(leerAnadidos().filter((e) => e.id !== id));
  } else {
    const b = new Set(leerBorrados());
    b.add(id);
    try { localStorage.setItem(CLAVE_BORRADOS, JSON.stringify([...b])); } catch { /* nada */ }
  }
  const ov = leerOverrides();
  if (ov[id]) { delete ov[id]; try { localStorage.setItem(CLAVE, JSON.stringify(ov)); } catch { /* nada */ } }
}

export function aplicarOverrides(ejercicios: Ejercicio[]): Ejercicio[] {
  const ov = leerOverrides();
  const borrados = new Set(leerBorrados());
  const anadidos = leerAnadidos();
  const todos = [...ejercicios, ...anadidos].filter((e) => !borrados.has(e.id));
  return todos.map((e) => {
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
      ...(o.urlMedia !== undefined ? { urlMedia: o.urlMedia } : {}),
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

export function exportarTextos(): { overrides: unknown; anadidos: unknown; borrados: unknown } {
  return { overrides: leerOverrides(), anadidos: leerAnadidos(), borrados: leerBorrados() };
}
export function importarTextos(d: { overrides?: unknown; anadidos?: unknown; borrados?: unknown }): void {
  if (d.overrides) try { localStorage.setItem(CLAVE, JSON.stringify(d.overrides)); } catch { /* nada */ }
  if (d.anadidos) try { localStorage.setItem(CLAVE_ANADIDOS, JSON.stringify(d.anadidos)); } catch { /* nada */ }
  if (d.borrados) try { localStorage.setItem(CLAVE_BORRADOS, JSON.stringify(d.borrados)); } catch { /* nada */ }
}
