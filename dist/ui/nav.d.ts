import type { Nav } from "./main.js";
/**
 * BARRA DE NAVEGACIÓN INFERIOR.
 * La pestaña activa se marca con color (oliva/acento) y el icono elevado.
 * Sin indicadores deslizantes: nada se superpone a nada (decisión de diseño).
 */
export type Pestana = "inicio" | "historial" | "planes" | "ajustes" | "progreso";
export declare function htmlNav(activa: Pestana): string;
/** Devuelve true si el toque era de navegación (y ya está gestionado). */
export declare function manejarNav(boton: HTMLElement, navegacion: Nav, activa: Pestana): boolean;
