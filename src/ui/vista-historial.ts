import type { Sesion } from "../domain/entities/sesion.js";
import { claveDia } from "../core/fechas.js";
import type { HistorialState } from "../state/historial-store.js";
import { animarEntrada, esc, VALORACION_TEXTO } from "./comunes.js";
import { mostrarDetalleEjercicio } from "./detalle-ejercicio.js";
import type { Ctx, Nav } from "./main.js";
import { activarIndicador, htmlNav, manejarNav } from "./nav.js";

/**
 * PANTALLA DE HISTORIAL (§4): sesiones agrupadas por día, de la más
 * reciente a la más antigua, con los totales del día. Tocar una sesión
 * abre su detalle: ejercicios realizados, valoración, kcal y nota.
 * Los datos vienen agrupados de HistorialStore; aquí solo se pintan.
 */

function tituloDia(clave: string): string {
  const hoy = claveDia(Date.now());
  const ayer = claveDia(Date.now() - 24 * 60 * 60 * 1000);
  const fecha = new Date(`${clave}T12:00:00`);
  const texto = fecha.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const bonito = texto.charAt(0).toUpperCase() + texto.slice(1);
  if (clave === hoy) return `Hoy, ${texto}`;
  if (clave === ayer) return `Ayer, ${texto}`;
  return bonito;
}

function hora(ts: number): string {
  return new Date(ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export function montarHistorial(ctx: Ctx, nav: Nav): () => void {
  const { raiz, app, catalogo } = ctx;
  let sesionesPorId = new Map<string, Sesion>();
  let animado = false;

  function pintar(estado: HistorialState): void {
    if (estado.cargando) {
      raiz.innerHTML = `<p class="cargando">Cargando…</p>`;
      return;
    }
    if (estado.error) {
      raiz.innerHTML = `<p class="cargando">${esc(estado.error)}</p>`;
      return;
    }

    sesionesPorId = new Map(estado.dias.flatMap((d) => d.sesiones.map((s) => [s.id, s])));

    const totalSesiones = estado.dias.reduce((n, d) => n + d.sesiones.length, 0);
    const cuerpo =
      estado.dias.length === 0
        ? `<div class="vacio">
             <p>Aún no hay sesiones registradas.</p>
             <p class="hint">Cuando termines y guardes tu primer entrenamiento, aparecerá aquí.</p>
           </div>`
        : estado.dias
            .map((dia) => {
              const totales = `${dia.minutosTotales} min${dia.kcalTotales !== null ? ` · ${dia.kcalTotales} kcal` : ""}`;
              const filas = dia.sesiones
                .map((s) => {
                  const enfoque = s.focus.join(" + ");
                  const linea2 = [
                    `${s.durMin} min`,
                    s.valoracion ? VALORACION_TEXTO[s.valoracion] : "sin valorar",
                    ...(s.kcal !== null ? [`${s.kcal} kcal`] : []),
                  ].join(" · ");
                  return `
                    <button class="histrow" data-sesion="${esc(s.id)}">
                      <span class="hr-main">
                        <span class="hr-f">${esc(enfoque.charAt(0).toUpperCase() + enfoque.slice(1))}</span>
                        <span class="hr-s" style="display:block;">${esc(linea2)}</span>
                      </span>
                      <span class="chev">›</span>
                    </button>`;
                })
                .join("");
              return `
                <section>
                  <div class="dayh"><span>${esc(tituloDia(dia.clave))}</span><span>${esc(totales)}</span></div>
                  ${filas}
                </section>`;
            })
            .join("");

    raiz.innerHTML = `
      <h1 class="scr-title">Historial</h1>
      ${totalSesiones > 0 ? `<p class="lbl" style="margin:0;">${totalSesiones} ${totalSesiones === 1 ? "sesión registrada" : "sesiones registradas"}</p>` : ""}
      ${cuerpo}
      ${htmlNav("historial")}
    `;
    activarIndicador(raiz, "historial");
    if (!animado) {
      animado = true;
      animarEntrada(raiz);
    }
  }

  function mostrarDetalleSesion(s: Sesion): void {
    const item = (e: Sesion["ejercicios"][number], i: number) =>
      `<li data-indice="${i}">${esc(e.nombre)} <span class="var">· ${esc(e.variante)}</span></li>`;
    const datos = [
      `${s.durMin} min + ${s.calentamientoMin} de calentamiento`,
      s.valoracion ? VALORACION_TEXTO[s.valoracion] : "sin valorar",
      s.kcal !== null ? `${s.kcal} kcal` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const velo = document.createElement("div");
    velo.className = "velo";
    velo.innerHTML = `
      <div class="panel" role="dialog" aria-label="Detalle de la sesión">
        <h2>${esc(tituloDia(claveDia(s.ts)))} · ${esc(hora(s.ts))}</h2>
        <p class="sub">${esc(datos)}</p>
        ${s.nota ? `<p class="nota-caja">${esc(s.nota)}</p>` : ""}
        <h3>Ejercicios (${s.ejercicios.length})</h3>
        <ol class="lista-sesion">${s.ejercicios.map(item).join("")}</ol>
        <p class="sub" style="margin-top: 8px;">Toca un ejercicio para ver su ficha.</p>
        <div class="row">
          <button class="btn primary" data-accion="cerrar-sesion">Cerrar</button>
        </div>
      </div>`;
    velo.addEventListener("click", (ev) => {
      const objetivo = ev.target as HTMLElement;
      if (objetivo === velo || objetivo.closest("[data-accion='cerrar-sesion']")) {
        velo.remove();
        return;
      }
      const li = objetivo.closest<HTMLElement>("li[data-indice]");
      if (!li) return;
      // La ficha completa sale del catálogo actual; si el ejercicio o la
      // variante ya no existieran en una versión futura, simplemente no se abre.
      const realizado = s.ejercicios[Number(li.dataset["indice"])];
      const ejercicio = realizado ? catalogo.find((e) => e.id === realizado.id) : undefined;
      const variante = ejercicio?.variantes.find((v) => v.nombre === realizado?.variante) ?? ejercicio?.variantes[0];
      if (ejercicio && variante) mostrarDetalleEjercicio({ ejercicio, variante });
    });
    document.body.appendChild(velo);
  }

  function alPulsar(ev: Event): void {
    const boton = (ev.target as HTMLElement).closest<HTMLElement>("button");
    if (!boton) return;
    if (manejarNav(boton, nav, "historial")) return;
    const idSesion = boton.dataset["sesion"];
    if (idSesion) {
      const sesion = sesionesPorId.get(idSesion);
      if (sesion) mostrarDetalleSesion(sesion);
    }
  }

  async function preparar(): Promise<void> {
    const usuario = await app.repos.usuarios.obtenerActivo();
    await app.stores.historial.cargar(usuario.id);
  }

  raiz.addEventListener("click", alPulsar);
  const desuscribir = app.stores.historial.suscribir(pintar);
  void preparar();

  return () => {
    desuscribir();
    raiz.removeEventListener("click", alPulsar);
    document.querySelector(".velo")?.remove();
  };
}
