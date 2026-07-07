import { leerColoresGoma, guardarColoresGoma, idDesdeNombre } from "../data/colores-goma.js";
import { aviso, esc } from "./comunes.js";
/**
 * EDITOR DE COLORES DE GOMA (desde Ajustes).
 *
 * Lista editable: renombrar, cambiar el color CSS, borrar, añadir y reordenar
 * (subir/bajar). El orden importa: es de menos a más resistente. Los cambios
 * se guardan al pulsar "Guardar" y, si hay sincronización, viajan con el
 * catálogo compartido (los colores viven en la config común).
 *
 * `alGuardar` permite a quien abre el panel refrescar lo que dependa de los
 * colores (por ejemplo, un selector abierto).
 */
export function mostrarEditorGomas(alGuardar) {
    let lista = leerColoresGoma().map((c) => ({ ...c }));
    const velo = document.createElement("div");
    velo.className = "velo";
    function fila(c, i) {
        return `
      <div class="goma-edit-fila" data-i="${i}">
        <input type="color" class="goma-edit-color" data-campo="css" value="${esc(c.css)}" aria-label="Color" />
        <input type="text" class="field goma-edit-nombre" data-campo="nombre" value="${esc(c.nombre)}" aria-label="Nombre" />
        <div class="goma-edit-orden">
          <button data-mover="-1" ${i === 0 ? "disabled" : ""} aria-label="Subir">▲</button>
          <button data-mover="1" ${i === lista.length - 1 ? "disabled" : ""} aria-label="Bajar">▼</button>
        </div>
        <button class="goma-edit-borrar" data-borrar aria-label="Borrar">✕</button>
      </div>`;
    }
    function render() {
        velo.innerHTML = `
      <div class="panel" role="dialog" aria-label="Colores de goma">
        <h2>Colores de goma</h2>
        <p class="sub">De menos a más resistente. Arrástralos con las flechas.</p>
        <div id="goma-lista">${lista.map(fila).join("")}</div>
        <button class="btn wide" data-accion="anadir" style="margin-top:10px">＋ Añadir color</button>
        <div class="row" style="margin-top:14px">
          <button class="btn" data-accion="cancelar">Cancelar</button>
          <button class="btn primary" data-accion="guardar">Guardar</button>
        </div>
      </div>`;
    }
    /** Vuelca los inputs del DOM a `lista` antes de reordenar/guardar. */
    function capturar() {
        velo.querySelectorAll(".goma-edit-fila").forEach((f) => {
            const i = Number(f.dataset["i"]);
            const css = f.querySelector('[data-campo="css"]')?.value;
            const nombre = f.querySelector('[data-campo="nombre"]')?.value;
            if (lista[i]) {
                if (css)
                    lista[i].css = css;
                if (nombre !== undefined)
                    lista[i].nombre = nombre;
            }
        });
    }
    velo.addEventListener("click", (ev) => {
        const objetivo = ev.target;
        if (objetivo === velo || objetivo.closest("[data-accion='cancelar']")) {
            velo.remove();
            return;
        }
        if (objetivo.closest("[data-accion='anadir']")) {
            capturar();
            lista.push({ id: "", nombre: "Nuevo", css: "#888888" });
            render();
            return;
        }
        const mover = objetivo.closest("[data-mover]");
        if (mover) {
            capturar();
            const fila = mover.closest(".goma-edit-fila");
            const i = Number(fila.dataset["i"]);
            const dir = Number(mover.dataset["mover"]);
            const j = i + dir;
            if (j >= 0 && j < lista.length) {
                [lista[i], lista[j]] = [lista[j], lista[i]];
                render();
            }
            return;
        }
        const borrar = objetivo.closest("[data-borrar]");
        if (borrar) {
            capturar();
            const fila = borrar.closest(".goma-edit-fila");
            const i = Number(fila.dataset["i"]);
            lista.splice(i, 1);
            render();
            return;
        }
        if (objetivo.closest("[data-accion='guardar']")) {
            capturar();
            // Asignar ids estables a los nuevos (a partir del nombre), evitando choques.
            const usados = new Set();
            for (const c of lista) {
                if (!c.id)
                    c.id = idDesdeNombre(c.nombre);
                let base = c.id, n = 2;
                while (usados.has(c.id))
                    c.id = `${base}_${n++}`;
                usados.add(c.id);
            }
            if (lista.length === 0) {
                aviso("Deja al menos un color, o cancela.");
                return;
            }
            guardarColoresGoma(lista);
            aviso("Colores guardados.");
            velo.remove();
            alGuardar?.();
        }
    });
    render();
    document.body.appendChild(velo);
}
