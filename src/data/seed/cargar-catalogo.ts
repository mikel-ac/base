import type { Ejercicio, Variante } from "../../domain/entities/ejercicio.js";
import type { Impacto, Material, Media, Patron, Tipo, Zona } from "../../domain/entities/tipos.js";
import {
  TODAS_ZONAS,
  TODOS_IMPACTOS,
  TODOS_MATERIALES,
  TODOS_PATRONES,
  TODOS_TIPOS,
} from "../../domain/entities/tipos.js";
import { CATALOGO_RAW } from "./catalogo.js";
import { aplicarOverrides } from "../overrides.js";

/**
 * CARGA Y VALIDACIÓN DEL SEED.
 * El JSON del catálogo usa nombres en inglés (name, type, pattern, keys,
 * avoid, tip…); el dominio habla en español (nombre, tipo, patron, claves,
 * evita, consejo…). Esta capa TRADUCE y, sobre todo, VALIDA: si el catálogo
 * trae un valor fuera de los permitidos (una zona mal escrita, un nivel 4…),
 * la app falla al arrancar con un mensaje claro en vez de comportarse raro
 * semanas después. Un seed roto es un error de programación/edición, no del
 * usuario: por eso aquí se lanza Error en vez de devolver Resultado.
 */

// ---- forma del JSON crudo (solo lo que usamos) ----
interface VarianteRaw {
  level: number;
  name: string;
  cue: string;
  impact?: string;
}
interface EjercicioRaw {
  id: string;
  name: string;
  type: string;
  pattern: string;
  muscles: string[];
  materials: string[];
  impact: string;
  dumbbellReady: boolean;
  variants: VarianteRaw[];
  tip: string;
  keys: string[];
  avoid: string;
  joints: string[];
  images: { label: string; src?: string; svg?: string; credit?: string }[];
}
interface CatalogoRaw {
  schemaVersion: number;
  exercises: EjercicioRaw[];
}

function validarEnum<T extends string>(
  valor: string,
  permitidos: readonly T[],
  contexto: string
): T {
  if (!(permitidos as readonly string[]).includes(valor)) {
    throw new Error(`Catálogo inválido: "${valor}" no es válido en ${contexto}. Permitidos: ${permitidos.join(", ")}`);
  }
  return valor as T;
}

function normalizarVariante(v: VarianteRaw, idEjercicio: string): Variante {
  if (v.level !== 1 && v.level !== 2 && v.level !== 3) {
    throw new Error(`Catálogo inválido: nivel ${v.level} en variante de "${idEjercicio}" (debe ser 1, 2 o 3).`);
  }
  const variante: Variante = { nivel: v.level, nombre: v.name, cue: v.cue };
  if (v.impact !== undefined) {
    variante.impacto = validarEnum<Impacto>(v.impact, TODOS_IMPACTOS, `variante de "${idEjercicio}"`);
  }
  return variante;
}

function normalizarEjercicio(e: EjercicioRaw): Ejercicio {
  if (!e.variants || e.variants.length === 0) {
    throw new Error(`Catálogo inválido: "${e.id}" no tiene variantes.`);
  }
  return {
    id: e.id,
    nombre: e.name,
    tipo: validarEnum<Tipo>(e.type, TODOS_TIPOS, `tipo de "${e.id}"`),
    patron: validarEnum<Patron>(e.pattern, TODOS_PATRONES, `patrón de "${e.id}"`),
    musculos: e.muscles ?? [],
    materiales: (e.materials ?? []).map((m) => validarEnum<Material>(m, TODOS_MATERIALES, `material de "${e.id}"`)),
    impacto: validarEnum<Impacto>(e.impact, TODOS_IMPACTOS, `impacto de "${e.id}"`),
    dumbbellReady: !!e.dumbbellReady,
    variantes: e.variants.map((v) => normalizarVariante(v, e.id)),
    claves: e.keys ?? [],
    evita: e.avoid ?? "",
    consejo: e.tip ?? "",
    joints: (e.joints ?? []).map((z) => validarEnum<Zona>(z, TODAS_ZONAS, `joints de "${e.id}"`)),
    images: (e.images ?? []) as Media[],
  };
}

/** Carga el catálogo embebido, validado y traducido al dominio. */
export function cargarCatalogo(): Ejercicio[] {
  const raw = CATALOGO_RAW as CatalogoRaw;
  if (!raw || !Array.isArray(raw.exercises)) {
    throw new Error("Catálogo inválido: falta la lista 'exercises'.");
  }
  const ejercicios = raw.exercises.map(normalizarEjercicio);
  const ids = new Set<string>();
  for (const e of ejercicios) {
    if (ids.has(e.id)) throw new Error(`Catálogo inválido: id duplicado "${e.id}".`);
    ids.add(e.id);
  }
  return aplicarOverrides(ejercicios);
}
