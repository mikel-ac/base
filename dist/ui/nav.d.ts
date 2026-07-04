import type { Nav } from "./main.js";
/**
 * BARRA DE NAVEGACIÓN INFERIOR (mockup: .tabs + .tab-ind).
 * El indicador es una barrita de 2px en el acento que SE DESLIZA hasta la
 * pestaña activa. Como cada pantalla pinta su propia barra, se recuerda la
 * pestaña anterior (módulo) para colocar el indicador allí y deslizarlo a
 * la nueva: el ojo ve el mismo movimiento que si la barra fuera persistente.
 */
export type Pestana = "inicio" | "historial" | "planes" | "progreso";
export declare function htmlNav(activa: Pestana): string;
/** Llamar tras pintar una pantalla con nav: coloca y desliza el indicador. */
export declare function activarIndicador(raiz: HTMLElement, activa: Pestana): void;
/** Devuelve true si el toque era de navegación (y ya está gestionado). */
export declare function manejarNav(boton: HTMLElement, navegacion: Nav, activa: Pestana): boolean;
