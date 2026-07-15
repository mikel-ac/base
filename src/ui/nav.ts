import type { Nav } from "./main.js";

/**
 * BARRA DE NAVEGACIÓN INFERIOR.
 * La pestaña activa se marca con color (oliva/acento) y el icono elevado.
 * Sin indicadores deslizantes: nada se superpone a nada (decisión de diseño).
 */

export type Pestana = "inicio" | "historial" | "planes" | "ajustes" | "progreso";

const PESTANAS: { clave: Pestana; texto: string; icono: string }[] = [
  { clave: "inicio", texto: "Inicio", icono: "▲" },
  { clave: "historial", texto: "Historial", icono: "≡" },
  { clave: "planes", texto: "Planes", icono: "◫" },
  { clave: "ajustes", texto: "Ajustes", icono: "⚙︎" },
];

export function htmlNav(activa: Pestana): string {
  const botones = PESTANAS.map(
    (p) => `<button data-nav="${p.clave}" class="${p.clave === activa ? "on" : ""}"><span class="tab-ic">${p.icono}</span>${p.texto}</button>`
  ).join("");
  return `<nav class="tabs" aria-label="Navegación principal">${botones}</nav>`;
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
    case "ajustes": navegacion.aAjustes(); break;
    case "progreso": navegacion.aProgreso(); break;
  }
  return true;
}
