import type { Patron, Tipo, Valoracion } from "./tipos.js";

/** Un ejercicio tal como se realizó (referencia + nombre "congelado"). */
export interface EjercicioRealizado {
  id: string;       // referencia lógica a Ejercicio.id
  nombre: string;   // congelado para que el historial no dependa del catálogo
  variante: string; // nombre de la variante realizada
}

/** Una fila del Historial: una sesión realizada y registrada. */
export interface Sesion {
  id: string;
  usuarioId: string;
  /** Fecha/hora de realización (agrupable por día y por semana ISO). */
  ts: number;
  /** Enfoques activos al generarla. */
  focus: Tipo[];
  /** Patrones trabajados (derivados de los ejercicios del bloque principal). */
  patrones: Patron[];
  /** Minutos de entrenamiento, SIN contar el calentamiento. */
  durMin: number;
  calentamientoMin: number;
  workSec: number;
  restSec: number;
  numEjercicios: number;
  ejercicios: EjercicioRealizado[];
  /** Nivel del usuario en ese momento, para trazabilidad. */
  nivelEnSesion: number;
  valoracion: Valoracion | null;
  /** Calorías opcionales, introducidas a mano. */
  kcal: number | null;
  nota: string;
}
