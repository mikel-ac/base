import { ZONA_TRABAJO_ETIQUETA } from "../domain/entities/tipos.js";
import { zonaTrabajoDe } from "../data/overrides.js";
import { esc } from "./comunes.js";
/**
 * SELECTOR DE SUSTITUCIÓN.
 *
 * Muestra 3 candidatos para reemplazar un ejercicio. Un botón "Ver otras 3"
 * avanza por la lista (y vuelve al principio al llegar al final). Al tocar
 * un candidato, se elige y se cierra. Los candidatos vienen ya ordenados por
 * cercanía (primero los del mismo patrón de movimiento).
 *
 * Se usa tanto en la previsualización de una sesión como en el diseñador a
 * medida, por eso vive en su propio módulo.
 */
export function abrirSelectorSustitucion(nombreActual, candidatos, alElegir) {
    let inicio = 0;
    const PORPAGINA = 3;
    const velo = document.createElement("div");
    velo.className = "velo";
    function tarjeta(s, indiceGlobal) {
        const zona = ZONA_TRABAJO_ETIQUETA[zonaTrabajoDe(s.ejercicio)];
        const lados = s.ejercicio.porLados ? " · 2 lados" : "";
        return `
      <button class="sust-cand" data-elegir="${indiceGlobal}">
        <span class="sust-cand-main">
          <span class="sust-cand-n">${esc(s.ejercicio.nombre)}</span>
          <span class="sust-cand-s">${esc(zona)}${esc(lados)} · ${esc(s.variante.nombre)}</span>
        </span>
        <span class="sust-cand-add">＋</span>
      </button>`;
    }
    function render() {
        const pagina = candidatos.slice(inicio, inicio + PORPAGINA);
        const hayMas = candidatos.length > PORPAGINA;
        velo.innerHTML = `
      <div class="panel" role="dialog" aria-label="Sustituir ejercicio">
        <h2>Cambiar ejercicio</h2>
        <p class="sub">En lugar de "${esc(nombreActual)}", elige uno:</p>
        <div class="sust-lista">
          ${pagina.map((s, k) => tarjeta(s, inicio + k)).join("")}
        </div>
        <div class="row" style="margin-top:14px">
          ${hayMas ? `<button class="btn" data-accion="otras">Ver otras 3</button>` : ""}
          <button class="btn" data-accion="cancelar">Cancelar</button>
        </div>
      </div>`;
    }
    velo.addEventListener("click", (ev) => {
        const objetivo = ev.target;
        if (objetivo === velo || objetivo.closest("[data-accion='cancelar']")) {
            velo.remove();
            return;
        }
        if (objetivo.closest("[data-accion='otras']")) {
            inicio += PORPAGINA;
            if (inicio >= candidatos.length)
                inicio = 0; // vuelve al principio
            render();
            return;
        }
        const elegir = objetivo.closest("[data-elegir]");
        if (elegir) {
            const idx = Number(elegir.dataset["elegir"]);
            const elegido = candidatos[idx];
            if (elegido) {
                velo.remove();
                alElegir(elegido);
            }
        }
    });
    render();
    document.body.appendChild(velo);
}
