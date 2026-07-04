import type { PlanSesion } from "../domain/entities/configuracion.js";
import type { Sugerencia } from "../domain/entities/sugerencia.js";
import { generarSesion } from "../domain/usecases/generar-sesion.js";
import { ConfiguradorStore } from "../state/configurador-store.js";
import type { InicioState } from "../state/inicio-store.js";
import { animarEntrada, aviso, esc, VALORACION_TEXTO } from "./comunes.js";
import type { Ctx, Nav } from "./main.js";
import { activarIndicador, htmlNav, manejarNav } from "./nav.js";
import { mostrarDetallePlan } from "./panel-detalle.js";

/**
 * PANTALLA DE INICIO, con la capa visual "Bloques":
 * marca + fecha + chip de nivel + Ajustes · objetivo semanal (puntitos que
 * se rellenan escalonados) · "Hoy te sugiero" (tarjeta de acento suave) ·
 * empezar rápido (segmentado 15/20/30 + Empezar) · montar a medida ·
 * última sesión · nav inferior con indicador deslizante.
 */

function fechaDeHoy(): string {
  return new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" }).replace(",", " ·");
}

function diaCorto(ts: number): string {
  return new Date(ts).toLocaleDateString("es-ES", { weekday: "short" });
}

function textoObjetivo(hechas: number, objetivo: number): string {
  if (hechas === 0) return "Cuando quieras. Mejor algo que nada.";
  if (hechas < objetivo) return "Vas bien. Una más y semana cumplida.";
  return "Semana cumplida. Lo que hagas de más, regalo.";
}

function tituloSugerencia(s: Sugerencia): string {
  if (s.focus.length >= 3) return "Sesión equilibrada";
  const texto = s.focus.join(" + ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function montarInicio(ctx: Ctx, nav: Nav): () => void {
  const { raiz, app, catalogo } = ctx;
  let minutosRapido = 20;
  let animado = false;

  function pintar(estado: InicioState): void {
    if (estado.cargando) {
      raiz.innerHTML = `<p class="cargando">Cargando…</p>`;
      return;
    }
    if (estado.error) {
      raiz.innerHTML = `<p class="cargando">${esc(estado.error)}</p>`;
      return;
    }
    const u = estado.usuario!;
    const m = estado.metricas!;
    const s = estado.sugerencia!;
    const ultima = estado.ultimaSesion;

    const puntos = Array.from({ length: m.objetivoSemanal }, () => `<i></i>`).join("");

    const lineaUltima = ultima
      ? `Última · ${esc(diaCorto(ultima.ts))} · ${esc(ultima.focus.join(" + "))} · ${ultima.durMin} min${
          ultima.valoracion ? ` · ${VALORACION_TEXTO[ultima.valoracion]}` : ""
        }`
      : "Aún sin sesiones: la primera marca el comienzo.";

    raiz.innerHTML = `
      <header class="hd">
        <div>
          <div class="brand">Base</div>
          <p class="date">${esc(fechaDeHoy())}</p>
        </div>
        <div class="hd-derecha">
          <span class="lvl">Nivel ${u.nivel.toFixed(1)}</span>
          <button class="link" data-accion="ajustes" aria-label="Ajustes">Ajustes</button>
        </div>
      </header>

      <section class="card" aria-label="Objetivo de la semana">
        <p class="lbl">Objetivo de la semana</p>
        <div class="dots">${puntos}</div>
        <p class="goal-txt">${m.sesionesEstaSemana} de ${m.objetivoSemanal} esta semana · ${textoObjetivo(m.sesionesEstaSemana, m.objetivoSemanal)}</p>
      </section>

      <section class="card sug" aria-label="Hoy te sugiero">
        <p class="lbl">Hoy te sugiero</p>
        <div class="sug-t">${esc(tituloSugerencia(s))}</div>
        <div class="sug-s">${esc(s.motivo)}</div>
        <div class="row">
          <button class="btn primary" data-accion="usar-sugerencia">Usar</button>
          <button class="btn" data-accion="detalle-sugerencia">Ver detalle</button>
        </div>
      </section>

      <section class="card" aria-label="Empezar rápido">
        <p class="lbl">Empezar rápido</p>
        <div class="seg" style="margin-bottom: 12px;">
          ${[15, 20, 30]
            .map((min) => `<button data-min="${min}" class="${min === minutosRapido ? "on" : ""}">${min} min</button>`)
            .join("")}
        </div>
        <button class="btn primary wide" data-accion="empezar-rapido">Empezar</button>
      </section>

      <button class="btn wide" data-accion="montar">Montar a medida</button>

      <p class="goal-txt" style="margin-top: auto;">${lineaUltima}</p>

      ${htmlNav("inicio")}
    `;

    activarIndicador(raiz, "inicio");

    if (!animado) {
      animado = true;
      animarEntrada(raiz);
    }
    // Puntitos del objetivo: se rellenan escalonados (guía §6).
    const puntitos = raiz.querySelectorAll<HTMLElement>(".dots i");
    puntitos.forEach((punto, i) => {
      if (i < m.sesionesEstaSemana) window.setTimeout(() => punto.classList.add("f"), 350 + i * 140);
    });
  }

  function generarDesdeSugerencia(): PlanSesion | null {
    const estado = app.stores.inicio.obtener();
    app.stores.configurador.desdeSugerencia(estado.sugerencia!);
    const res = app.stores.configurador.generar(catalogo, estado.usuario!);
    if (!res.ok) {
      aviso(res.error);
      return null;
    }
    return res.valor;
  }

  function alPulsar(ev: Event): void {
    const boton = (ev.target as HTMLElement).closest<HTMLElement>("button");
    if (!boton) return;
    if (manejarNav(boton, nav, "inicio")) return;

    // Segmentado de minutos: cambia la selección sin repintar la pantalla.
    if (boton.dataset["min"]) {
      minutosRapido = Number(boton.dataset["min"]);
      raiz.querySelectorAll(".seg [data-min]").forEach((b) => b.classList.toggle("on", b === boton));
      return;
    }

    const estado = app.stores.inicio.obtener();
    const usuario = estado.usuario;
    if (!usuario) return;

    switch (boton.dataset["accion"]) {
      case "usar-sugerencia": {
        const plan = generarDesdeSugerencia();
        if (plan) nav.aSesion(plan);
        break;
      }
      case "detalle-sugerencia": {
        const plan = generarDesdeSugerencia();
        if (plan) mostrarDetallePlan(catalogo, plan, "Sugerencia de hoy", (p) => nav.aSesion(p));
        break;
      }
      case "empezar-rapido": {
        const cfg = ConfiguradorStore.configRapida(usuario, minutosRapido);
        const res = generarSesion(catalogo, cfg);
        if (res.ok) nav.aSesion(res.valor);
        else aviso(res.error);
        break;
      }
      case "montar":
        nav.aConfigurador();
        break;
      case "ajustes":
        nav.aAjustes();
        break;
    }
  }

  raiz.addEventListener("click", alPulsar);
  const desuscribir = app.stores.inicio.suscribir(pintar);
  void app.stores.inicio.cargar();

  return () => {
    desuscribir();
    raiz.removeEventListener("click", alPulsar);
    document.querySelector(".velo")?.remove();
  };
}
