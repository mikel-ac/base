/** Utilidades compartidas por todas las pantallas. */

/** Escapa texto para meterlo en HTML (buen hábito aunque los datos sean locales). */
export function esc(texto: string): string {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

let avisoTimer: number | undefined;

/** Globo temporal de aviso en la parte inferior. */
export function aviso(texto: string): void {
  document.querySelector(".aviso")?.remove();
  const el = document.createElement("div");
  el.className = "aviso";
  el.setAttribute("role", "status");
  el.textContent = texto;
  document.body.appendChild(el);
  window.clearTimeout(avisoTimer);
  avisoTimer = window.setTimeout(() => el.remove(), 2600);
}

/**
 * Entrada escalonada de pantalla (guía §6): añade la animación "rise" a los
 * hijos directos con retardo creciente. Llamar UNA vez por montaje, no en
 * cada repintado (para que la pantalla no "salte" con cada dato nuevo).
 */
export function animarEntrada(raiz: HTMLElement): void {
  let i = 0;
  for (const hijo of Array.from(raiz.children)) {
    if (!(hijo instanceof HTMLElement) || hijo.classList.contains("tabs")) continue;
    hijo.classList.add("rise");
    hijo.style.setProperty("--i", String(i++));
  }
}

export const VALORACION_TEXTO: Record<string, string> = {
  facil: "fácil",
  en_su_punto: "en su punto",
  dura: "dura",
};
