import type { Ejercicio } from "../entities/ejercicio.js";
/** Contrato de acceso al catálogo (solo lectura en runtime). */
export interface EjercicioRepository {
    todos(): Promise<Ejercicio[]>;
    porId(id: string): Promise<Ejercicio | null>;
}
