import { leerColoresGoma, guardarColoresGoma, idDesdeNombre } from "../data/colores-goma.js";
import { aviso, esc } from "./comunes.js";
/**
 * EDITOR DE COLORES DE GOMA (desde Ajustes).
 *
 * Renombrar, cambiar color, borrar, añadir y REORDENAR arrastrando por el asa.
 * Orden = de menos a más resistente. Guarda al pulsar "Guardar" y viaja con el
 * catálogo compartido si hay sync.
 *
 * Reordenación robusta: cada fila tiene una clave estable (`data-key`). Durante
 * el arrastre se mueve un fantasma flotante y se recolocan los NODOS existentes
 * por su clave (sin recrear el DOM), evitando el "temblor" de re-renderizar en
 * cada movimiento del dedo.
 */
export function mostrarEditorGomas(alGuardar) {
    // Clave interna estable por fila (independiente del nombre/id visible).
    let lista = leerColoresGoma().map((c, i) => ({ ...c, _k: `k${i}_${Math.random().toString(36).slice(2, 7)}` }));
    const velo = document.createElement("div");
    velo.className = "velo";
    function fila(c) {
        return `
      <div class="goma-edit-fila" data-key="${c._k}">
        <button class="goma-edit-asa" data-asa aria-label="Arrastrar para reordenar">⠿</button>
        <input type="color" class="goma-edit-color" data-campo="css" value="${esc(c.css)}" aria-label="Color" />
        <input type="text" class="field goma-edit-nombre" data-campo="nombre" value="${esc(c.nombre)}" aria-label="Nombre" />
        <button class="goma-edit-borrar" data-borrar aria-label="Borrar">✕</button>
      </div>`;
    }
    function render() {
        velo.innerHTML = `
      <div class="panel" role="dialog" aria-label="Colores de goma">
        <h2>Colores de goma</h2>
        <p class="sub">De menos a más resistente. Arrastra ⠿ para reordenar.</p>
        <div id="goma-lista">${lista.map(fila).join("")}</div>
        <button class="btn wide" data-accion="anadir" style="margin-top:10px">＋ Añadir color</button>
        <div class="row" style="margin-top:14px">
          <button class="btn" data-accion="cancelar">Cancelar</button>
          <button class="btn primary" data-accion="guardar">Guardar</button>
        </div>
      </div>`;
    }
    /** Vuelca los inputs del DOM a `lista` (por clave), sin cambiar el orden. */
    function capturar() {
        velo.querySelectorAll(".goma-edit-fila").forEach((f) => {
            const key = f.dataset["key"];
            const item = lista.find((c) => c._k === key);
            if (!item)
                return;
            const css = f.querySelector('[data-campo="css"]')?.value;
            const nombre = f.querySelector('[data-campo="nombre"]')?.value;
            if (css)
                item.css = css;
            if (nombre !== undefined)
                item.nombre = nombre;
        });
    }
    // ---- Arrastre por Pointer Events ----
    let dragKey = null;
    let ghost = null;
    let offsetY = 0;
    function alPointerDown(ev) {
        const asa = ev.target.closest("[data-asa]");
        if (!asa)
            return;
        const filaEl = asa.closest(".goma-edit-fila");
        if (!filaEl)
            return;
        ev.preventDefault();
        capturar();
        dragKey = filaEl.dataset["key"] ?? null;
        const r = filaEl.getBoundingClientRect();
        offsetY = ev.clientY - r.top;
        ghost = filaEl.cloneNode(true);
        ghost.classList.add("goma-ghost");
        ghost.style.width = `${r.width}px`;
        ghost.style.left = `${r.left}px`;
        ghost.style.top = `${r.top}px`;
        document.body.appendChild(ghost);
        filaEl.classList.add("arrastrando");
        asa.setPointerCapture(ev.pointerId);
    }
    function alPointerMove(ev) {
        if (!dragKey || !ghost)
            return;
        ev.preventDefault();
        ghost.style.top = `${ev.clientY - offsetY}px`;
        const cont = velo.querySelector("#goma-lista");
        if (!cont)
            return;
        const filas = [...cont.querySelectorAll(".goma-edit-fila")];
        const iActual = lista.findIndex((c) => c._k === dragKey);
        for (let k = 0; k < filas.length; k++) {
            const key = filas[k].dataset["key"];
            if (key === dragKey)
                continue;
            const r = filas[k].getBoundingClientRect();
            const centro = r.top + r.height / 2;
            const iOtro = lista.findIndex((c) => c._k === key);
            if ((iActual < iOtro && ev.clientY > centro) || (iActual > iOtro && ev.clientY < centro)) {
                // Intercambia en el array y mueve el nodo real (sin recrear).
                const tmp = lista[iActual];
                lista[iActual] = lista[iOtro];
                lista[iOtro] = tmp;
                const nodoArr = cont.querySelector(`.goma-edit-fila[data-key="${dragKey}"]`);
                const nodoOtro = filas[k];
                if (nodoArr) {
                    if (iActual < iOtro)
                        nodoOtro.after(nodoArr);
                    else
                        nodoOtro.before(nodoArr);
                }
                break;
            }
        }
    }
    function alPointerUp() {
        if (ghost) {
            ghost.remove();
            ghost = null;
        }
        velo.querySelectorAll(".goma-edit-fila").forEach((f) => f.classList.remove("arrastrando"));
        dragKey = null;
    }
    velo.addEventListener("pointerdown", alPointerDown);
    velo.addEventListener("pointermove", alPointerMove);
    velo.addEventListener("pointerup", alPointerUp);
    velo.addEventListener("pointercancel", alPointerUp);
    velo.addEventListener("click", (ev) => {
        const objetivo = ev.target;
        if (objetivo === velo || objetivo.closest("[data-accion='cancelar']")) {
            velo.remove();
            return;
        }
        if (objetivo.closest("[data-accion='anadir']")) {
            capturar();
            lista.push({ id: "", nombre: "Nuevo", css: "#888888", _k: `k${Date.now()}` });
            render();
            return;
        }
        const borrar = objetivo.closest("[data-borrar]");
        if (borrar) {
            capturar();
            const key = borrar.closest(".goma-edit-fila")?.dataset["key"];
            lista = lista.filter((c) => c._k !== key);
            render();
            return;
        }
        if (objetivo.closest("[data-accion='guardar']")) {
            capturar();
            const limpia = lista.map(({ _k, ...c }) => c);
            const usados = new Set();
            for (const c of limpia) {
                if (!c.id)
                    c.id = idDesdeNombre(c.nombre);
                const base = c.id;
                let n = 2;
                while (usados.has(c.id))
                    c.id = `${base}_${n++}`;
                usados.add(c.id);
            }
            if (limpia.length === 0) {
                aviso("Deja al menos un color, o cancela.");
                return;
            }
            guardarColoresGoma(limpia);
            aviso("Colores guardados.");
            velo.remove();
            alGuardar?.();
        }
    });
    render();
    document.body.appendChild(velo);
}
