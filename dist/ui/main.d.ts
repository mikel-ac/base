import { type App } from "../app.js";
import type { PlanSesion } from "../domain/entities/configuracion.js";
import type { Ejercicio } from "../domain/entities/ejercicio.js";
/**
 * GESTOR DE PANTALLAS. La app es una sola página que cambia de "vista":
 * cada vista es una función que pinta dentro de #app y devuelve otra función
 * de limpieza (parar relojes, darse de baja de stores). Al navegar, primero
 * se limpia la vista anterior y luego se monta la nueva. Sin frameworks:
 * es todo lo que necesita una app de este tamaño.
 */
export interface Ctx {
    app: App;
    catalogo: Ejercicio[];
    raiz: HTMLElement;
}
export interface Nav {
    aInicio(): void;
    aConfigurador(): void;
    aHistorial(): void;
    aPlanes(): void;
    aProgreso(): void;
    aAjustes(): void;
    aSesion(plan: PlanSesion): void;
    aRegistrar(plan: PlanSesion): void;
}
