import type { Nav } from "./main.js";

/**
 * BARRA DE NAVEGACIÓN INFERIOR (mockup: .tabs + .tab-ind).
 * El indicador es una barrita de 2px en el acento que SE DESLIZA hasta la
 * pestaña activa. Como cada pantalla pinta su propia barra, se recuerda la
 * pestaña anterior (módulo) para colocar el indicador allí y deslizarlo a
 * la nueva: el ojo ve el mismo movimiento que si la barra fuera persistente.
 */

export type Pestana = "inicio" | "historial" | "planes" | "progreso";

const PESTANAS: { clave: Pestana; texto: string; icono: string }[] = [
  { clave: "inicio", texto: "Inicio", icono: "▲" },
  { clave: "historial", texto: "Historial", icono: "≡" },
  { clave: "planes", texto: "Planes", icono: "◫" },
  { clave: "progreso", texto: "Progreso", icono: "◔" },
];

let pestanaAnterior: Pestana | null = null;

export function htmlNav(activa: Pestana): string {
  const botones = PESTANAS.map(
    (p) => `<button data-nav="${p.clave}" class="${p.clave === activa ? "on" : ""}"><span class="tab-ic">${p.icono}</span>${p.texto}</button>`
  ).join("");
  return `<nav class="tabs" aria-label="Navegación principal">${botones}</nav>`;
}

/** Llamar tras pintar una pantalla con nav: coloca y desliza el indicador. */
export function activarIndicador(raiz: HTMLElement, activa: Pestana): void {
  const tabs = raiz.querySelector<HTMLElement>(".tabs");
  const indicador = raiz.querySelector<HTMLElement>(".tab-ind");
  if (!tabs || !indicador) return;

  const mover = (clave: Pestana, animar: boolean): void => {
    const boton = tabs.querySelector<HTMLElement>(`[data-nav="${clave}"]`);
    if (!boton) return;
    if (!animar) indicador.style.transition = "none";
    indicador.style.left = `${boton.offsetLeft}px`;
    indicador.style.width = `${boton.offsetWidth}px`;
    if (!animar) {
      void indicador.offsetWidth; // forzar el repintado antes de reactivar
      indicador.style.transition = "";
    }
  };

  // Arrancar donde estaba la pestaña anterior y deslizar hasta la actual.
  const desde = pestanaAnterior ?? activa;
  requestAnimationFrame(() => {
    mover(desde, false);
    if (desde !== activa) requestAnimationFrame(() => mover(activa, true));
  });
  pestanaAnterior = activa;
}

/** Devuelve true si el toque era de navegación (y ya está gestionado). */
export function manejarNav(boton: HTMLElement, navegacion: Nav, activa: Pestana): boolean {
  const destino = boton.dataset["nav"] as Pestana | undefined;
  if (!destino) return false;
  if (destino === activa) return true;
  switch (destino) {
    case "inicio": navegacion.aInicio(); break;
    case "historial": navegacion.aHistorial(); break;
    case "planes": navegacion.aPlanes(); break;
    case "progreso": navegacion.aProgreso(); break;
  }
  return true;
}
