import type { PlanSesion } from "../domain/entities/configuracion.js";
import type { Valoracion } from "../domain/entities/tipos.js";
export interface RegistroPendiente {
    plan: PlanSesion;
    valoracion: Valoracion | null;
    kcal: string;
    nota: string;
}
export declare function leerRegistroPendiente(): RegistroPendiente | null;
export declare function guardarRegistroPendiente(reg: RegistroPendiente): void;
export declare function borrarRegistroPendiente(): void;
