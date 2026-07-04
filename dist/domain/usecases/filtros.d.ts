import type { ConfigSesion } from "../entities/configuracion.js";
import type { Ejercicio, Variante } from "../entities/ejercicio.js";
import type { Impacto, Material, Zona } from "../entities/tipos.js";
/**
 * FILTROS PUROS del motor de generación (§6 y §8 del PRD).
 * Cada función responde una sola pregunta y no toca nada externo,
 * así se pueden probar una a una.
 */
/**
 * ¿Es viable el ejercicio con el material disponible?
 * - materiales vacío → solo peso corporal → siempre viable.
 * - si lista varios, son alternativas: basta con TENER UNO (intersección).
 */
export declare function materialOk(e: Ejercicio, disponibles: Material[]): boolean;
/** ¿El ejercicio evita todas las zonas con molestia? (joints ∩ molestias = ∅) */
export declare function sinMolestias(e: Ejercicio, molestias: Zona[]): boolean;
/** Impacto efectivo de una variante: el suyo propio o, si no declara, el del ejercicio. */
export declare function impactoDeVariante(e: Ejercicio, v: Variante): Impacto;
/**
 * Variantes que se pueden usar según el modo bajo impacto.
 * Con bajo impacto activo se descartan las variantes de impacto ALTO
 * (así "burpees" sobrevive gracias a su variante suave sin salto,
 * y un ejercicio sin ninguna variante tranquila queda fuera).
 */
export declare function variantesPermitidas(e: Ejercicio, bajoImpacto: boolean): Variante[];
/**
 * Variante para un nivel continuo (§7): se redondea el nivel a 1/2/3 y se
 * elige esa variante; si no existe, la MÁS CERCANA disponible. En caso de
 * empate a distancia, gana la más SUAVE (prudencia, perfiles mayores).
 * Devuelve null si no hay ninguna variante permitida.
 */
export declare function varianteParaNivel(e: Ejercicio, nivel: number, bajoImpacto: boolean): Variante | null;
/** ¿Puede entrar el ejercicio en el pool con esta configuración? (regla 1 y 2 de §6) */
export declare function esViable(e: Ejercicio, cfg: ConfigSesion): boolean;
/** Pool del bloque principal: tipo ∈ focus + dentro de la zona (si hay) + viable. */
export declare function filtrarPool(catalogo: Ejercicio[], cfg: ConfigSesion): Ejercicio[];
/** Pool del calentamiento: tipo "calentamiento" + viable (mismas molestias/material). */
export declare function filtrarCalentamientos(catalogo: Ejercicio[], cfg: ConfigSesion): Ejercicio[];
