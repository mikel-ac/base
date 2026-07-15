import { marcarCatalogoModificado } from "./overrides.js";
const CLAVE = "base.colores_goma";
/** Lista por defecto: de menos a más resistente (definida por el usuario). */
export const COLORES_GOMA_DEFECTO = [
    { id: "amarillo", nombre: "Amarillo", css: "#E8C020" },
    { id: "rojo", nombre: "Rojo", css: "#C4321A" },
    { id: "negro", nombre: "Negro", css: "#1A1A1A" },
    { id: "morado", nombre: "Morado", css: "#7A3F9E" },
    { id: "verde", nombre: "Verde", css: "#3E9E52" },
];
export function leerColoresGoma() {
    try {
        const raw = localStorage.getItem(CLAVE);
        if (!raw)
            return [...COLORES_GOMA_DEFECTO];
        const lista = JSON.parse(raw);
        if (!Array.isArray(lista) || lista.length === 0)
            return [...COLORES_GOMA_DEFECTO];
        return lista;
    }
    catch {
        return [...COLORES_GOMA_DEFECTO];
    }
}
export function guardarColoresGoma(lista) {
    try {
        localStorage.setItem(CLAVE, JSON.stringify(lista));
        marcarCatalogoModificado(); // los colores viajan en el catálogo compartido
    }
    catch {
        /* almacenamiento no disponible */
    }
}
/** Busca un color por id (para mostrarlo en la sesión/detalle). */
export function colorGomaPorId(id) {
    if (!id)
        return undefined;
    return leerColoresGoma().find((c) => c.id === id);
}
/** Genera un id estable a partir de un nombre nuevo (para colores añadidos). */
export function idDesdeNombre(nombre) {
    const base = nombre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    return base || "color_" + Date.now().toString(36);
}
