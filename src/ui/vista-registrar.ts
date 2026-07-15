import type { PlanSesion } from "../domain/entities/configuracion.js";
import type { Valoracion } from "../domain/entities/tipos.js";
import { animarEntrada, aviso, esc } from "./comunes.js";
import {
  borrarRegistroPendiente,
  guardarRegistroPendiente,
  leerRegistroPendiente,
} from "./registro-pendiente.js";
import type { Ctx, Nav } from "./main.js";

/**
 * PANTALLA DE REGISTRO al terminar (capa Bloques): las tres opciones como
 * chips grandes, campos con borde suave y "Guardar en el historial" con
 * aire inferior. Aquí es donde el nivel sube o baja de verdad.
 */

export function montarRegistrar(ctx: Ctx, nav: Nav, plan: PlanSesion): () => void {
  const { raiz, app } = ctx;

  // Recupera lo que hubiera escrito antes de una recarga (registro pendiente).
  const previo = leerRegistroPendiente();
  let valoracion: Valoracion | null = previo?.valoracion ?? null;
  let kcalGuardado = previo?.kcal ?? "";
  let notaGuardada = previo?.nota ?? "";
  let guardando = false;

  raiz.classList.add("sin-nav");

  /** Persiste el estado actual del formulario, para que sobreviva a recargas. */
  function persistir(): void {
    guardarRegistroPendiente({ plan, valoracion, kcal: kcalGuardado, nota: notaGuardada });
  }

  /** Lee los campos del DOM a las variables (antes de repintar o guardar). */
  function capturarCampos(): void {
    const kcalEl = document.getElementById("kcal") as HTMLInputElement | null;
    const notaEl = document.getElementById("nota") as HTMLTextAreaElement | null;
    if (kcalEl) kcalGuardado = kcalEl.value;
    if (notaEl) notaGuardada = notaEl.value;
  }

  function pintar(): void {
    raiz.innerHTML = `
      <h1 class="scr-title">¿Qué tal la sesión?</h1>
      <p class="hint" style="margin:0;">${plan.cfg.durMin} min de entrenamiento · ${plan.principal.length} ejercicios</p>

      <div>
        <p class="lbl">Cómo la has sentido</p>
        <div class="big3">
          <button class="chip ${valoracion === "facil" ? "on" : ""}" data-valoracion="facil">Fácil</button>
          <button class="chip ${valoracion === "en_su_punto" ? "on" : ""}" data-valoracion="en_su_punto">En su punto</button>
          <button class="chip ${valoracion === "dura" ? "on" : ""}" data-valoracion="dura">Dura</button>
        </div>
        <p class="hint">Opcional: cómo lo has sentido queda en tu historial.</p>
      </div>

      <div>
        <p class="lbl">Calorías (opcional)</p>
        <input id="kcal" class="field" type="number" inputmode="numeric" min="0" placeholder="—" value="${esc(kcalGuardado)}" />
      </div>

      <div>
        <p class="lbl">Nota</p>
        <textarea id="nota" class="field" rows="3" placeholder="Escribe algo si quieres…">${esc(notaGuardada)}</textarea>
      </div>

      <button class="btn primary wide" data-accion="guardar" style="margin-top:auto;">Guardar en el historial</button>
      <button class="link" data-accion="descartar" style="align-self:center;">Descartar (no guardar)</button>
    `;
    animarEntrada(raiz);
  }

  async function guardar(): Promise<void> {
    if (guardando) return;
    guardando = true;
    try {
      capturarCampos();
      const kcalTexto = kcalGuardado.trim();
      const nota = notaGuardada.trim();
      const kcal = kcalTexto === "" ? null : Math.max(0, Math.round(Number(kcalTexto)));

      const usuario = await app.repos.usuarios.obtenerActivo();
      await app.usecases.registrarSesion.ejecutar(usuario, plan, {
        valoracion,
        kcal: Number.isFinite(kcal as number) ? kcal : null,
        nota,
      });

      borrarRegistroPendiente();
      // Sube el historial recién guardado a la nube si hay sesión iniciada.
      void app.sync.sincronizar();

      aviso("Sesión guardada.");
      nav.aInicio();
    } catch (e) {
      guardando = false;
      aviso(esc(e instanceof Error ? e.message : "No se pudo guardar la sesión."));
    }
  }

  function alPulsar(ev: Event): void {
    const boton = (ev.target as HTMLElement).closest<HTMLElement>("button");
    if (!boton) return;

    const v = boton.dataset["valoracion"] as Valoracion | undefined;
    if (v) {
      capturarCampos(); // no perder kcal/nota al repintar
      valoracion = valoracion === v ? null : v;
      persistir();
      pintar();
      return;
    }

    if (boton.dataset["accion"] === "guardar") void guardar();
    if (boton.dataset["accion"] === "descartar") {
      if (window.confirm("¿Salir sin guardar esta sesión?")) {
        borrarRegistroPendiente();
        nav.aInicio();
      }
    }
  }

  function alEscribir(): void {
    capturarCampos();
    persistir();
  }

  raiz.addEventListener("click", alPulsar);
  raiz.addEventListener("input", alEscribir);
  pintar();

  return () => {
    raiz.removeEventListener("click", alPulsar);
    raiz.removeEventListener("input", alEscribir);
    raiz.classList.remove("sin-nav");
  };
}
