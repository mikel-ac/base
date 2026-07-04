import { crearApp, type App } from "../app.js";
import type { PlanSesion } from "../domain/entities/configuracion.js";
import type { RunnerState } from "../state/runner.js";
import type { Ejercicio } from "../domain/entities/ejercicio.js";
import { esc } from "./comunes.js";
import { aplicarTema, temaActual } from "./tema.js";
import { montarConfigurador } from "./vista-configurador.js";
import { montarHistorial } from "./vista-historial.js";
import { montarInicio } from "./vista-inicio.js";
import { montarPlanes } from "./vista-planes.js";
import { montarAjustes } from "./vista-ajustes.js";
import { montarProgreso } from "./vista-progreso.js";
import { montarRegistrar } from "./vista-registrar.js";
import { montarSesion } from "./vista-sesion.js";
import { montarGestor } from "./vista-gestor.js";

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
  aGestor(): void;
  aSesion(plan: PlanSesion, estado?: RunnerState): void;
  aRegistrar(plan: PlanSesion): void;
}

const raiz = document.getElementById("app")!;
let limpiar: (() => void) | null = null;

function cambiar(montar: () => () => void): void {
  limpiar?.();
  window.scrollTo(0, 0);
  limpiar = montar();
}

async function arrancar(): Promise<void> {
  aplicarTema(temaActual()); // por si el guion del index no pudo ejecutarse
  try {
    const app = await crearApp();
    const catalogo = await app.repos.ejercicios.todos();
    const ctx: Ctx = { app, catalogo, raiz };

    const nav: Nav = {
      aInicio: () => cambiar(() => montarInicio(ctx, nav)),
      aConfigurador: () => cambiar(() => montarConfigurador(ctx, nav)),
      aHistorial: () => cambiar(() => montarHistorial(ctx, nav)),
      aPlanes: () => cambiar(() => montarPlanes(ctx, nav)),
      aProgreso: () => cambiar(() => montarProgreso(ctx, nav)),
      aAjustes: () => cambiar(() => montarAjustes(ctx, nav)),
      aGestor: () => cambiar(() => montarGestor(ctx, nav)),
      aSesion: (plan, estado) => cambiar(() => montarSesion(ctx, nav, plan, estado)),
      aRegistrar: (plan) => cambiar(() => montarRegistrar(ctx, nav, plan)),
    };

    nav.aInicio();
  } catch (e) {
    raiz.innerHTML = `<p class="cargando">${esc(
      e instanceof Error ? e.message : "No se pudo arrancar la app."
    )}</p>`;
  }
}

void arrancar();
