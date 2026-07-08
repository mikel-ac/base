import type { Sesion } from "../domain/entities/sesion.js";
import type { Valoracion } from "../domain/entities/tipos.js";
import { claveDia } from "../core/fechas.js";
import type { HistorialState } from "../state/historial-store.js";
import { animarEntrada, aviso, esc, VALORACION_TEXTO } from "./comunes.js";
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
                    ...(s.kcal !== null ? [`${s.kcal} kcal`] : []),
                  ].join(" · ");
                  // Color por valoración: en su punto = lima, fácil = oliva, dura = rojo.
                  const claseVal = s.valoracion === "dura" ? "dura" : s.valoracion === "facil" ? "facil" : s.valoracion === "en_su_punto" ? "punto" : "";
                  const pill = s.valoracion
                    ? `<span class="hr-val ${claseVal}">${esc(VALORACION_TEXTO[s.valoracion] ?? "")}</span>`
                    : "";
                  return `
                    <button class="histrow" data-sesion="${esc(s.id)}">
                      <span class="hr-barra ${claseVal}"></span>
                      <span class="hr-main">
                        <span class="hr-f">${esc(enfoque.charAt(0).toUpperCase() + enfoque.slice(1))}</span>
                        <span class="hr-s">${esc(linea2)}</span>
                      </span>
                      ${pill}
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
    let editando = false;
    // Borrador de edición (no toca la sesión hasta Guardar).
    let valEdit: Valoracion | null = s.valoracion;
    let kcalEdit = s.kcal !== null ? String(s.kcal) : "";
    let notaEdit = s.nota ?? "";

    const velo = document.createElement("div");
    velo.className = "velo";

    const item = (e: Sesion["ejercicios"][number], i: number) =>
      `<li data-indice="${i}">${esc(e.nombre)} <span class="var">· ${esc(e.variante)}</span></li>`;

    function htmlLectura(): string {
      const datos = [
        `${s.durMin} min + ${s.calentamientoMin} de calentamiento`,
        s.valoracion ? VALORACION_TEXTO[s.valoracion] : "sin valorar",
        s.kcal !== null ? `${s.kcal} kcal` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      return `
        <div class="panel" role="dialog" aria-label="Detalle de la sesión">
          <h2>${esc(tituloDia(claveDia(s.ts)))} · ${esc(hora(s.ts))}</h2>
          <p class="sub">${esc(datos)}</p>
          ${s.nota ? `<p class="nota-caja">${esc(s.nota)}</p>` : ""}
          <button class="link" data-accion="editar" style="padding-left:0">✎ Editar valoración y nota</button>
          <h3>Ejercicios (${s.ejercicios.length})</h3>
          <ol class="lista-sesion">${s.ejercicios.map(item).join("")}</ol>
          <p class="sub" style="margin-top: 8px;">Toca un ejercicio para ver su ficha.</p>
          <div class="row">
            <button class="btn primary" data-accion="cerrar-sesion">Cerrar</button>
          </div>
        </div>`;
    }

    function htmlEdicion(): string {
      const chip = (v: Valoracion, txt: string) =>
        `<button class="chip ${valEdit === v ? "on" : ""}" data-valedit="${v}">${txt}</button>`;
      return `
        <div class="panel" role="dialog" aria-label="Editar la sesión">
          <h2>Editar sesión</h2>
          <p class="sub">${esc(tituloDia(claveDia(s.ts)))} · ${esc(hora(s.ts))}</p>
          <p class="lbl">Cómo la sentiste</p>
          <div class="big3">
            ${chip("facil", "Fácil")}
            ${chip("en_su_punto", "En su punto")}
            ${chip("dura", "Dura")}
          </div>
          <p class="hint">Cambiar la valoración aquí no recalcula tu nivel (eso solo pasa al terminar la sesión).</p>
          <p class="lbl">Calorías (opcional)</p>
          <input id="h-kcal" class="field" type="number" inputmode="numeric" min="0" placeholder="—" value="${esc(kcalEdit)}" />
          <p class="lbl">Nota</p>
          <textarea id="h-nota" class="field" rows="3" placeholder="Escribe algo si quieres…">${esc(notaEdit)}</textarea>
          <div class="row">
            <button class="btn" data-accion="cancelar-edicion">Cancelar</button>
            <button class="btn primary" data-accion="guardar-edicion">Guardar cambios</button>
          </div>
        </div>`;
    }

    function pintarPanel(): void {
      velo.innerHTML = editando ? htmlEdicion() : htmlLectura();
    }

    function capturarEdicion(): void {
      const kcalEl = velo.querySelector<HTMLInputElement>("#h-kcal");
      const notaEl = velo.querySelector<HTMLTextAreaElement>("#h-nota");
      if (kcalEl) kcalEdit = kcalEl.value;
      if (notaEl) notaEdit = notaEl.value;
    }

    async function guardarEdicion(): Promise<void> {
      capturarEdicion();
      const kcalTexto = kcalEdit.trim();
      const kcalNum = kcalTexto === "" ? null : Math.max(0, Math.round(Number(kcalTexto)));
      const actualizada: Sesion = {
        ...s,
        valoracion: valEdit,
        kcal: Number.isFinite(kcalNum as number) ? kcalNum : null,
        nota: notaEdit.trim(),
      };
      try {
        await app.repos.sesiones.guardar(actualizada);
        void app.sync.sincronizar(); // propaga el cambio a tus otros dispositivos
        aviso("Cambios guardados.");
        velo.remove();
        await preparar(); // recarga el historial con los datos nuevos
      } catch {
        aviso("No se pudieron guardar los cambios.");
      }
    }

    velo.addEventListener("click", (ev) => {
      const objetivo = ev.target as HTMLElement;
      if (objetivo === velo || objetivo.closest("[data-accion='cerrar-sesion']")) {
        velo.remove();
        return;
      }
      if (objetivo.closest("[data-accion='editar']")) {
        editando = true;
        pintarPanel();
        return;
      }
      if (objetivo.closest("[data-accion='cancelar-edicion']")) {
        capturarEdicion(); // no molesta, pero conserva coherencia
        editando = false;
        // Restaura el borrador a los valores reales por si vuelve a editar.
        valEdit = s.valoracion;
        kcalEdit = s.kcal !== null ? String(s.kcal) : "";
        notaEdit = s.nota ?? "";
        pintarPanel();
        return;
      }
      const chipVal = objetivo.closest<HTMLElement>("[data-valedit]");
      if (chipVal) {
        capturarEdicion(); // no perder kcal/nota al repintar los chips
        const v = chipVal.dataset["valedit"] as Valoracion;
        valEdit = valEdit === v ? null : v;
        pintarPanel();
        return;
      }
      if (objetivo.closest("[data-accion='guardar-edicion']")) {
        void guardarEdicion();
        return;
      }
      // Modo lectura: tocar un ejercicio abre su ficha.
      const li = objetivo.closest<HTMLElement>("li[data-indice]");
      if (!li || editando) return;
      const realizado = s.ejercicios[Number(li.dataset["indice"])];
      const ejercicio = realizado ? catalogo.find((e) => e.id === realizado.id) : undefined;
      const variante = ejercicio?.variantes.find((v) => v.nombre === realizado?.variante) ?? ejercicio?.variantes[0];
      if (ejercicio && variante) mostrarDetalleEjercicio({ ejercicio, variante });
    });

    pintarPanel();
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
