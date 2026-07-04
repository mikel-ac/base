import type { Metricas } from "../domain/entities/metricas.js";
import type { Usuario } from "../domain/entities/usuario.js";
import { NIVEL_MAX, NIVEL_MIN } from "../domain/entities/tipos.js";
import { animarEntrada, esc } from "./comunes.js";
import type { Ctx, Nav } from "./main.js";
import { activarIndicador, htmlNav, manejarNav } from "./nav.js";

/**
 * PANTALLA DE PROGRESO (§4): las métricas derivadas, sin editar nada.
 * Todo sale de CalcularMetricas (lógica probada); aquí solo se pinta.
 * Filosofía del PRD: informar sin presionar — nada de rachas ni medallas.
 */

const TENDENCIA_TEXTO: Record<Metricas["tendenciaSesiones"], string> = {
  subiendo: "tendencia subiendo",
  estable: "tendencia estable",
  bajando: "tendencia bajando",
};

/** Etiqueta corta de una semana ISO ("2026-W27" → "S27"). */
function etiquetaSemana(semanaISO: string): string {
  return "S" + semanaISO.split("-W")[1];
}

export function montarProgreso(ctx: Ctx, nav: Nav): () => void {
  const { raiz, app } = ctx;

  function pintar(usuario: Usuario, m: Metricas): void {
    // --- nivel: posición del marcador en la barra 1.0–3.0 ---
    const porcentajeNivel = ((m.nivelActual - NIVEL_MIN) / (NIVEL_MAX - NIVEL_MIN)) * 100;

    // --- gráfica de volumen: altura = minutos, número = sesiones ---
    const maxMinutos = Math.max(...m.volumenPorSemana.map((v) => v.minutos), 1);
    const hayVolumen = m.volumenPorSemana.some((v) => v.sesiones > 0);
    const barras = m.volumenPorSemana
      .map((v) => {
        const altura = Math.max(4, Math.round((v.minutos / maxMinutos) * 100));
        const cumplida = v.sesiones >= m.objetivoSemanal;
        return `
          <div class="col-barra" title="${esc(etiquetaSemana(v.semanaISO))}: ${v.sesiones} sesiones, ${v.minutos} min">
            <span class="barra-numero">${v.sesiones}</span>
            <div class="bar ${cumplida ? "" : "soft"}" style="height: ${v.sesiones > 0 ? altura : 3}%;"></div>
          </div>`;
      })
      .join("");
    const etiquetas = m.volumenPorSemana.map((v) => `<span>${esc(etiquetaSemana(v.semanaISO))}</span>`).join("");

    // --- distribución de valoraciones (últimas 10 valoradas) ---
    const d = m.distribucionValoracion;
    const totalValoradas = d.facil + d.en_su_punto + d.dura;
    const anchura = (n: number) => (totalValoradas === 0 ? 0 : Math.round((n / totalValoradas) * 100));
    const distribucionHtml =
      totalValoradas === 0
        ? `<p class="hint">Aún no hay sesiones valoradas. Al terminar un entrenamiento puedes contar cómo ha ido.</p>`
        : `
          <div class="stackb">
            <div class="facil" style="width: ${anchura(d.facil)}%;"></div>
            <div class="punto" style="width: ${anchura(d.en_su_punto)}%;"></div>
            <div class="dura" style="width: ${anchura(d.dura)}%;"></div>
          </div>
          <div class="leyenda">
            <span>fácil · ${d.facil}</span>
            <span>en su punto · ${d.en_su_punto}</span>
            <span>dura · ${d.dura}</span>
          </div>`;

    const semanasTexto =
      m.semanasCumplidas === 0
        ? "Todavía ninguna semana cumplida: la primera está al caer."
        : m.semanasCumplidas === 1
          ? "1 semana cumplida hasta ahora."
          : `${m.semanasCumplidas} semanas cumplidas hasta ahora.`;

    raiz.innerHTML = `
      <h1 class="scr-title">Progreso</h1>

      <div>
        <p class="lbl">Tu nivel · ${m.nivelActual.toFixed(1)}</p>
        <div class="lvlbar"><span class="k" style="left: ${porcentajeNivel}%;"></span></div>
        <div class="extremos"><span>Suave</span><span>Medio</span><span>Fuerte</span></div>
        <p class="hint">Se ajusta solo con tus valoraciones: sube despacio, baja rápido.</p>
      </div>

      <div>
        <p class="lbl">Esta semana · ${m.sesionesEstaSemana} de ${m.objetivoSemanal} · ${TENDENCIA_TEXTO[m.tendenciaSesiones]}</p>
        <p class="hint" style="margin:0;">${esc(semanasTexto)}</p>
      </div>

      <div>
        <p class="lbl">Volumen · últimas 8 semanas</p>
        ${
          hayVolumen
            ? `<div class="bars">${barras}</div>
               <div class="blabels">${etiquetas}</div>
               <p class="hint">Altura = minutos · número = sesiones · barra llena = objetivo cumplido.</p>`
            : `<p class="hint">Aún no hay volumen que enseñar. La gráfica se irá llenando con tus sesiones.</p>`
        }
      </div>

      <div>
        <p class="lbl">Cómo lo has sentido · últimas 10</p>
        ${distribucionHtml}
      </div>

      ${htmlNav("progreso")}
    `;
    activarIndicador(raiz, "progreso");
    animarEntrada(raiz);
  }

  function alPulsar(ev: Event): void {
    const boton = (ev.target as HTMLElement).closest<HTMLElement>("button");
    if (!boton) return;
    manejarNav(boton, nav, "progreso");
  }

  async function preparar(): Promise<void> {
    try {
      const usuario = await app.repos.usuarios.obtenerActivo();
      const metricas = await app.usecases.calcularMetricas.ejecutar(usuario);
      pintar(usuario, metricas);
    } catch (e) {
      raiz.innerHTML = `<p class="cargando">${esc(e instanceof Error ? e.message : "No se pudo cargar Progreso.")}</p>`;
    }
  }

  raiz.addEventListener("click", alPulsar);
  raiz.innerHTML = `<p class="cargando">Cargando…</p>`;
  void preparar();

  return () => {
    raiz.removeEventListener("click", alPulsar);
  };
}
