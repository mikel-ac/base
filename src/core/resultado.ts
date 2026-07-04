/**
 * Resultado de una operación que puede fallar de forma CONTROLADA
 * (p. ej. "elige al menos un enfoque"). No es un error de programación:
 * es un mensaje que la UI mostrará al usuario tal cual.
 */
export type Resultado<T> =
  | { ok: true; valor: T }
  | { ok: false; error: string };

export function ok<T>(valor: T): Resultado<T> {
  return { ok: true, valor };
}

export function fallo<T = never>(error: string): Resultado<T> {
  return { ok: false, error };
}
