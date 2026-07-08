/**
 * COLORES DE GOMA configurables.
 *
 * Lista editable por el usuario desde Ajustes (añadir, borrar, renombrar,
 * reordenar). Cada ejercicio que use gomas puede apuntar a uno de estos
 * colores como "el que mejor me va". El orden es de MENOS a MÁS resistente.
 *
 * Se guarda en localStorage (como el resto de la config del Gestor) y viaja
 * en el catálogo compartido cuando hay sincronización, porque es información
 * común, no personal por dispositivo.
 *
 * Cada color tiene un id estable (para que un ejercicio lo referencie aunque
 * se renombre), un nombre visible y un valor CSS para pintar la muestra real.
 */

export interface ColorGoma {
  id: string;
  nombre: string;
  /** Color CSS para la muestra visual (círculo). */
  css: string;
}

const CLAVE = "base.colores_goma";

/** Lista por defecto: de menos a más resistente (definida por el usuario). */
export const COLORES_GOMA_DEFECTO: ColorGoma[] = [
  { id: "amarillo", nombre: "Amarillo", css: "#E8C020" },
  { id: "rojo", nombre: "Rojo", css: "#C4321A" },
  { id: "negro", nombre: "Negro", css: "#1A1A1A" },
  { id: "morado", nombre: "Morado", css: "#7A3F9E" },
  { id: "verde", nombre: "Verde", css: "#3E9E52" },
];

export function leerColoresGoma(): ColorGoma[] {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return [...COLORES_GOMA_DEFECTO];
    const lista = JSON.parse(raw) as ColorGoma[];
    if (!Array.isArray(lista) || lista.length === 0) return [...COLORES_GOMA_DEFECTO];
    return lista;
  } catch {
    return [...COLORES_GOMA_DEFECTO];
  }
}

export function guardarColoresGoma(lista: ColorGoma[]): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
    localStorage.setItem("base.catalogo_ts", String(Date.now()));
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Busca un color por id (para mostrarlo en la sesión/detalle). */
export function colorGomaPorId(id: string | undefined): ColorGoma | undefined {
  if (!id) return undefined;
  return leerColoresGoma().find((c) => c.id === id);
}

/** Genera un id estable a partir de un nombre nuevo (para colores añadidos). */
export function idDesdeNombre(nombre: string): string {
  const base = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || "color_" + Date.now().toString(36);
}
