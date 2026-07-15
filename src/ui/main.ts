import { crearApp, type App } from "../app.js";
import type { PlanSesion } from "../domain/entities/configuracion.js";
import type { RunnerState } from "../state/runner.js";
import type { Ejercicio } from "../domain/entities/ejercicio.js";
import { cargarCatalogo } from "../data/seed/cargar-catalogo.js";
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
import { montarDisenador } from "./vista-disenador.js";
import type { PlanGuardado } from "../domain/entities/plan-guardado.js";
import { observarUsuario } from "../data/firebase/firebase-auth.js";
import { leerRegistroPendiente } from "./registro-pendiente.js";

/**
 * GESTOR DE PANTALLAS. La app es una sola página que cambia de "vista":
 * cada vista es una función que pinta dentro de #app y devuelve otra función
 * de limpieza (parar relojes, darse de baja de stores). Al navegar, primero
 * se limpia la vista anterior y luego se monta la nueva. Sin frameworks:
 * es todo lo que necesita una app de este tamaño.
 */

export interface Ctx {
  app: App;
  /**
   * Catálogo VIVO: se relee en cada acceso (getter), no es una foto del
   * arranque. Es importante: los ejercicios propios se crean en el Gestor y la
   * sincronización trae los de otros dispositivos DESPUÉS de arrancar la app.
   * Con una copia congelada, las vistas no veían esos ejercicios y llegaban a
   * descartarlos como "eliminados" (p. ej. al usar un entrenamiento a medida).
   * Cargarlo es barato (objeto embebido + overrides) y cada vista lo lee una
   * vez al montarse.
   */
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
  /** Diseñador de entrenamientos a medida. Sin plan = nuevo; con plan = editar. */
  aDisenador(plan?: PlanGuardado): void;
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
    // El catálogo se lee en vivo en cada acceso (ver Ctx): así las vistas ven
    // siempre los ejercicios propios y los que llegan por sincronización.
    const ctx: Ctx = {
      app,
      get catalogo(): Ejercicio[] {
        return cargarCatalogo();
      },
      raiz,
    };

    const nav: Nav = {
      aInicio: () => cambiar(() => montarInicio(ctx, nav)),
      aConfigurador: () => cambiar(() => montarConfigurador(ctx, nav)),
      aHistorial: () => cambiar(() => montarHistorial(ctx, nav)),
      aPlanes: () => cambiar(() => montarPlanes(ctx, nav)),
      aProgreso: () => cambiar(() => montarProgreso(ctx, nav)),
      aAjustes: () => cambiar(() => montarAjustes(ctx, nav)),
      aGestor: () => cambiar(() => montarGestor(ctx, nav)),
      aDisenador: (plan) => cambiar(() => montarDisenador(ctx, nav, plan)),
      aSesion: (plan, estado) => cambiar(() => montarSesion(ctx, nav, plan, estado)),
      aRegistrar: (plan) => cambiar(() => montarRegistrar(ctx, nav, plan)),
    };

    // Si quedó una sesión terminada sin registrar (p. ej. la app se recargó
    // mientras anotabas), vuelve a la pantalla de registro con lo que hubiera,
    // en vez de perderlo e ir a Inicio.
    const pendiente = leerRegistroPendiente();
    if (pendiente) nav.aRegistrar(pendiente.plan);
    else nav.aInicio();

    // Observador de sesión de Firebase: si ya había sesión (o el usuario entra
    // luego), el SyncService sincroniza. Es perezoso y no bloquea el arranque;
    // si Firebase no carga (sin conexión la 1ª vez, bloqueadores…), la app
    // sigue funcionando en local sin enterarse.
    void (async () => {
      try {
        await observarUsuario((user) => {
          void app.sync.fijarUsuario(user);
        });
      } catch {
        /* Firebase no disponible: modo local */
      }
    })();
  } catch (e) {
    raiz.innerHTML = `<p class="cargando">${esc(
      e instanceof Error ? e.message : "No se pudo arrancar la app."
    )}</p>`;
  }
}

void arrancar();
