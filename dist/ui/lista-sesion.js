import { esc } from "./comunes.js";
import { mostrarDetalleEjercicio } from "./detalle-ejercicio.js";
/**
 * LISTA DE LA SESIÓN EN MARCHA: se abre desde el cronómetro para ver todo
 * el recorrido, con el ejercicio actual resaltado y una marca en los ya
 * hechos. Tocar cualquier ejercicio abre su detalle (encima de esta lista).
 */
export function mostrarListaSesion(pasos, indiceActual, alCerrar) {
    const item = (p, i) => {
        const clase = i === indiceActual ? "actual" : i < indiceActual ? "hecho" : "";
        const marca = i < indiceActual ? "✓ " : i === indiceActual ? "▸ " : "";
        return `<li class="${clase}" data-indice="${i}">${marca}${esc(p.asignado.ejercicio.nombre)} <span class="var">· ${esc(p.asignado.variante.nombre)}</span></li>`;
    };
    const bloque = (nombre) => pasos
        .map((p, i) => ({ p, i }))
        .filter((x) => x.p.bloque === nombre)
        .map(({ p, i }) => item(p, i))
        .join("");
    const htmlCalentamiento = bloque("calentamiento");
    const velo = document.createElement("div");
    velo.className = "velo";
    velo.innerHTML = `
    <div class="panel" role="dialog" aria-label="Sesión completa">
      <h2>Tu sesión</h2>
      <p class="sub">Toca un ejercicio para ver su detalle. El tiempo queda en pausa mientras miras.</p>
      ${htmlCalentamiento ? `<h3>Calentamiento</h3><ol class="lista-sesion">${htmlCalentamiento}</ol>` : ""}
      <h3>Entrenamiento</h3>
      <ol class="lista-sesion">${bloque("principal")}</ol>
      <div class="row">
        <button class="btn primary" data-accion="cerrar-lista">Cerrar</button>
      </div>
    </div>`;
    const cerrar = () => {
        velo.remove();
        alCerrar?.();
    };
    velo.addEventListener("click", (ev) => {
        const objetivo = ev.target;
        if (objetivo === velo || objetivo.closest("[data-accion='cerrar-lista']")) {
            cerrar();
            return;
        }
        const li = objetivo.closest("li[data-indice]");
        if (li) {
            const paso = pasos[Number(li.dataset["indice"])];
            if (paso)
                mostrarDetalleEjercicio(paso.asignado); // se abre encima; la lista sigue detrás
        }
    });
    document.body.appendChild(velo);
}
