import { TODAS_ZONAS, TODOS_IMPACTOS, TODOS_MATERIALES, TODOS_PATRONES, TODOS_TIPOS, } from "../../domain/entities/tipos.js";
import { CATALOGO_RAW } from "./catalogo.js";
import { aplicarOverrides } from "../overrides.js";
function validarEnum(valor, permitidos, contexto) {
    if (!permitidos.includes(valor)) {
        throw new Error(`Catálogo inválido: "${valor}" no es válido en ${contexto}. Permitidos: ${permitidos.join(", ")}`);
    }
    return valor;
}
function normalizarVariante(v, idEjercicio) {
    if (v.level !== 1 && v.level !== 2 && v.level !== 3) {
        throw new Error(`Catálogo inválido: nivel ${v.level} en variante de "${idEjercicio}" (debe ser 1, 2 o 3).`);
    }
    const variante = { nivel: v.level, nombre: v.name, cue: v.cue };
    if (v.impact !== undefined) {
        variante.impacto = validarEnum(v.impact, TODOS_IMPACTOS, `variante de "${idEjercicio}"`);
    }
    return variante;
}
function normalizarEjercicio(e) {
    if (!e.variants || e.variants.length === 0) {
        throw new Error(`Catálogo inválido: "${e.id}" no tiene variantes.`);
    }
    return {
        id: e.id,
        nombre: e.name,
        tipo: validarEnum(e.type, TODOS_TIPOS, `tipo de "${e.id}"`),
        patron: validarEnum(e.pattern, TODOS_PATRONES, `patrón de "${e.id}"`),
        musculos: e.muscles ?? [],
        materiales: (e.materials ?? []).map((m) => validarEnum(m, TODOS_MATERIALES, `material de "${e.id}"`)),
        impacto: validarEnum(e.impact, TODOS_IMPACTOS, `impacto de "${e.id}"`),
        dumbbellReady: !!e.dumbbellReady,
        variantes: e.variants.map((v) => normalizarVariante(v, e.id)),
        claves: e.keys ?? [],
        evita: e.avoid ?? "",
        consejo: e.tip ?? "",
        joints: (e.joints ?? []).map((z) => validarEnum(z, TODAS_ZONAS, `joints de "${e.id}"`)),
        images: (e.images ?? []),
    };
}
/** Carga el catálogo embebido, validado y traducido al dominio. */
export function cargarCatalogo() {
    const raw = CATALOGO_RAW;
    if (!raw || !Array.isArray(raw.exercises)) {
        throw new Error("Catálogo inválido: falta la lista 'exercises'.");
    }
    const ejercicios = raw.exercises.map(normalizarEjercicio);
    const ids = new Set();
    for (const e of ejercicios) {
        if (ids.has(e.id))
            throw new Error(`Catálogo inválido: id duplicado "${e.id}".`);
        ids.add(e.id);
    }
    return aplicarOverrides(ejercicios);
}
