import type { Ejercicio, Variante } from "./ejercicio.js";
import type { Material, Patron, Tipo, Zona } from "./tipos.js";
/**
 * Configuración con la que se genera una sesión: es la "entrada" del motor.
 * Sale del configurador ("montar a medida"), del arranque rápido o de la
 * sugerencia del día; el motor no sabe ni le importa de cuál.
 */
export interface ConfigSesion {
    nivel: number;
    /** Subconjunto no vacío de ["fuerza","cardio","movilidad"]. */
    focus: Tipo[];
    material: Material[];
    bajoImpacto: boolean;
    /** Unión de molestias permanentes del perfil + "hoy me molesta". */
    molestias: Zona[];
    calentamientoMin: number;
    /** Minutos de entrenamiento (sin calentamiento). */
    durMin: number;
    workSec: number;
    restSec: number;
    /**
     * Limitar la sesión a estos patrones (zona de trabajo: p. ej. ["core"]
     * para un entrenamiento de core, o ["empuje","tiron"] para tren superior).
     * Ausente o vacío = todo el cuerpo. Solo restringe el bloque principal;
     * el calentamiento sigue siendo general. Los filtros de seguridad
     * (molestias, material, nivel) se aplican igual dentro de la zona.
     */
    patrones?: Patron[];
    /**
     * Patrón al que dar un empujón (viene de la sugerencia del día, §9).
     * Es un SESGO, no una orden: el patrón con énfasis recibe aproximadamente
     * un hueco extra en el reparto, pero los filtros de seguridad (molestias,
     * material, nivel) mandan siempre; si el patrón no sobrevive a los
     * filtros, el énfasis simplemente no tiene efecto.
     */
    enfasis?: Patron;
}
/** Un ejercicio del plan con su variante ya elegida según el nivel. */
export interface EjercicioAsignado {
    ejercicio: Ejercicio;
    variante: Variante;
}
/**
 * Plan de sesión generado y aún NO realizado. Es lo que el runner ejecuta
 * y lo que la pantalla "editar sesión" reordena/cambia antes de empezar.
 * Solo al terminar y registrar se convierte en una Sesion del Historial.
 */
export interface PlanSesion {
    calentamiento: EjercicioAsignado[];
    principal: EjercicioAsignado[];
    cfg: ConfigSesion;
}
