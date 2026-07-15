import { animarEntrada, esc } from "./comunes.js";
import { htmlNav, manejarNav } from "./nav.js";
/**
 * PANTALLA DE PROGRESO (§4): las métricas derivadas, sin editar nada.
 * Todo sale de CalcularMetricas (lógica probada); aquí solo se pinta.
 * Filosofía del PRD: informar sin presionar — nada de rachas ni medallas.
 */
const TENDENCIA_TEXTO = {
    subiendo: "↑ Subiendo",
    estable: "→ Estable",
    bajando: "↓ Bajando",
};
/** Etiqueta corta de una semana ISO ("2026-W27" → "S27"). */
function etiquetaSemana(semanaISO) {
    return "S" + semanaISO.split("-W")[1];
}
export function montarProgreso(ctx, nav) {
    const { raiz, app } = ctx;
    function pintar(_usuario, m) {
        // --- gráfica de volumen: altura = minutos; semanas a cero = línea fina ---
        const maxMinutos = Math.max(...m.volumenPorSemana.map((v) => v.minutos), 1);
        const hayVolumen = m.volumenPorSemana.some((v) => v.sesiones > 0);
        const barras = m.volumenPorSemana
            .map((v) => {
            const altura = Math.max(6, Math.round((v.minutos / maxMinutos) * 100));
            const cumplida = v.sesiones >= m.objetivoSemanal;
            const vacia = v.sesiones === 0;
            return `
          <div class="col-barra" title="${esc(etiquetaSemana(v.semanaISO))}: ${v.sesiones} sesiones, ${v.minutos} min">
            <span class="barra-numero ${vacia ? "cero" : ""}">${v.sesiones}</span>
            <div class="bar ${vacia ? "vacia" : cumplida ? "" : "soft"}" style="height: ${vacia ? 3 : altura}%;"></div>
            <span class="barra-lb">${esc(etiquetaSemana(v.semanaISO))}</span>
          </div>`;
        })
            .join("");
        // --- distribución de valoraciones (últimas 10 valoradas) ---
        const d = m.distribucionValoracion;
        const totalValoradas = d.facil + d.en_su_punto + d.dura;
        const anchura = (n) => (totalValoradas === 0 ? 0 : Math.round((n / totalValoradas) * 100));
        const distribucionHtml = totalValoradas === 0
            ? `<p class="hint" style="margin:0;">Aún no hay sesiones valoradas. Al terminar un entrenamiento puedes contar cómo ha ido.</p>`
            : `
          <div class="sensb">
            ${d.facil > 0 ? `<div class="s-facil" style="width: ${anchura(d.facil)}%;"></div>` : ""}
            ${d.en_su_punto > 0 ? `<div class="s-punto" style="width: ${anchura(d.en_su_punto)}%;"></div>` : ""}
            ${d.dura > 0 ? `<div class="s-dura" style="width: ${anchura(d.dura)}%;"></div>` : ""}
          </div>
          <div class="sens-leg">
            <span class="f"><i></i>Fácil · ${d.facil}</span>
            <span class="p"><i></i>En su punto · ${d.en_su_punto}</span>
            <span class="d"><i></i>Dura · ${d.dura}</span>
          </div>`;
        const semanasTexto = m.semanasCumplidas === 0
            ? "la primera semana cumplida está al caer."
            : m.semanasCumplidas === 1
                ? "1 semana cumplida hasta ahora."
                : `${m.semanasCumplidas} semanas cumplidas hasta ahora.`;
        // Dots de la semana (objetivo semanal)
        const dots = Array.from({ length: m.objetivoSemanal }, (_, i) => `<i class="${i < m.sesionesEstaSemana ? "on" : ""}"></i>`).join("");
        raiz.innerHTML = `
      <h1 class="scr-title">Progreso</h1>

      <div class="pcard">
        <div class="pcard-head"><span class="k">Esta semana</span><span class="v">${TENDENCIA_TEXTO[m.tendenciaSesiones]}</span></div>
        <div class="wk-dots">${dots}</div>
        <p class="wk-txt"><span class="wk-big">${m.sesionesEstaSemana} de ${m.objetivoSemanal}</span> · ${esc(semanasTexto)}</p>
      </div>

      <div class="pcard">
        <div class="pcard-head"><span class="k">Volumen · últimas ${m.volumenPorSemana.length} semanas</span></div>
        ${hayVolumen
            ? `<div class="bars">${barras}</div>
               <p class="hint" style="margin-bottom:0;">Altura = minutos · número = sesiones.</p>`
            : `<p class="hint" style="margin:0;">Aún no hay volumen que enseñar. La gráfica se irá llenando con tus sesiones.</p>`}
      </div>

      <div class="pcard">
        <div class="pcard-head"><span class="k">Cómo lo has sentido · últimas 10</span></div>
        ${distribucionHtml}
      </div>

      ${htmlNav("progreso")}
    `;
        animarEntrada(raiz);
    }
    function alPulsar(ev) {
        const boton = ev.target.closest("button");
        if (!boton)
            return;
        manejarNav(boton, nav, "progreso");
    }
    async function preparar() {
        try {
            const usuario = await app.repos.usuarios.obtenerActivo();
            const metricas = await app.usecases.calcularMetricas.ejecutar(usuario);
            pintar(usuario, metricas);
        }
        catch (e) {
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
