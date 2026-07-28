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

/**
 * Protege un modal de cerrarse por accidente al hacer scroll.
 *
 * En móvil, al arrastrar para desplazar el contenido, el dedo puede empezar o
 * terminar sobre el velo (el fondo alrededor del panel) y el navegador emite
 * un `click` en él: el modal se cerraba solo. Esta utilidad recuerda dónde
 * empezó el gesto y expone `fueArrastre` para que quien maneja el click ignore
 * los desplazamientos.
 *
 * Uso:
 *   const gesto = protegerDeArrastre(velo);
 *   velo.addEventListener("click", (ev) => {
 *     if (objetivo === velo) { if (gesto.fueArrastre(ev)) return; cerrar(); }
 *   });
 */
export function protegerDeArrastre(velo: HTMLElement, umbralPx = 10): { fueArrastre: (ev: MouseEvent) => boolean } {
  let inicio: { x: number; y: number } | null = null;
  velo.addEventListener("pointerdown", (ev) => {
    inicio = { x: ev.clientX, y: ev.clientY };
  });
  return {
    fueArrastre(ev: MouseEvent): boolean {
      if (!inicio) return false;
      return Math.abs(ev.clientX - inicio.x) > umbralPx || Math.abs(ev.clientY - inicio.y) > umbralPx;
    },
  };
}
