/**
 * Resultado de una operación que puede fallar de forma CONTROLADA
 * (p. ej. "elige al menos un enfoque"). No es un error de programación:
 * es un mensaje que la UI mostrará al usuario tal cual.
 */
export type Resultado<T> = {
    ok: true;
    valor: T;
} | {
    ok: false;
    error: string;
};
export declare function ok<T>(valor: T): Resultado<T>;
export declare function fallo<T = never>(error: string): Resultado<T>;
