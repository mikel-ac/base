/**
 * TEMA CLARO/OSCURO. Tres opciones: "sistema" (por defecto, sigue
 * prefers-color-scheme), "claro" y "oscuro". La elección manual se guarda
 * en localStorage (local-first) y manda sobre el sistema. El index.html
 * aplica lo guardado antes de pintar para evitar el parpadeo inicial.
 */

export type Tema = "sistema" | "claro" | "oscuro";

const CLAVE = "base-tema";

export function temaActual(): Tema {
  try {
    const t = localStorage.getItem(CLAVE);
    if (t === "claro" || t === "oscuro") return t;
  } catch { /* almacenamiento no disponible: se queda en sistema */ }
  return "sistema";
}

export function fijarTema(tema: Tema): void {
  try {
    if (tema === "sistema") localStorage.removeItem(CLAVE);
    else localStorage.setItem(CLAVE, tema);
  } catch { /* sin almacenamiento: al menos se aplica en esta visita */ }
  aplicarTema(tema);
}

export function aplicarTema(tema: Tema): void {
  const raiz = document.documentElement;
  if (tema === "sistema") raiz.removeAttribute("data-theme");
  else raiz.setAttribute("data-theme", tema === "oscuro" ? "dark" : "light");
}
