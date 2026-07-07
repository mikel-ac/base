import type { ColorGoma } from "../data/colores-goma.js";
import { leerColoresGoma, guardarColoresGoma, idDesdeNombre } from "../data/colores-goma.js";
import { aviso, esc } from "./comunes.js";

/**
 * EDITOR DE COLORES DE GOMA (desde Ajustes).
 *
 * Lista editable: renombrar, cambiar el color, borrar, añadir y REORDENAR
 * arrastrando por el asa (⠿). El orden importa: de menos a más resistente.
 * Se guarda al pulsar "Guardar" y viaja con el catálogo compartido si hay
 * sincronización.
 */
export function mostrarEditorGomas(alGuardar?: () => void): void {
  let lista: ColorGoma[] = leerColoresGoma().map((c) => ({ ...c }));

  const velo = document.createElement("div");
  velo.className = "velo";

  function fila(c: ColorGoma, i: number): string {
    return `
      <div class="goma-edit-fila" data-i="${i}">
        <button class="goma-edit-asa" data-asa aria-label="Arrastrar para reordenar">⠿</button>
        <input type="color" class="goma-edit-color" data-campo="css" value="${esc(c.css)}" aria-label="Color" />
        <input type="text" class="field goma-edit-nombre" data-campo="nombre" value="${esc(c.nombre)}" aria-label="Nombre" />
        <button class="goma-edit-borrar" data-borrar aria-label="Borrar">✕</button>
      </div>`;
  }

  function render(): void {
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

  /** Vuelca los inputs del DOM a `lista` antes de reordenar/guardar. */
  function capturar(): void {
    velo.querySelectorAll<HTMLElement>(".goma-edit-fila").forEach((f) => {
      const i = Number(f.dataset["i"]);
      const css = f.querySelector<HTMLInputElement>('[data-campo="css"]')?.value;
      const nombre = f.querySelector<HTMLInputElement>('[data-campo="nombre"]')?.value;
      if (lista[i]) {
        if (css) lista[i].css = css;
        if (nombre !== undefined) lista[i].nombre = nombre;
      }
    });
  }

  // ---- Arrastre por Pointer Events ----
  let arrastrando = -1;
  let filaEl: HTMLElement | null = null;

  function alPointerDown(ev: PointerEvent): void {
    const asa = (ev.target as HTMLElement).closest<HTMLElement>("[data-asa]");
    if (!asa) return;
    ev.preventDefault();
    filaEl = asa.closest<HTMLElement>(".goma-edit-fila");
    if (!filaEl) return;
    arrastrando = Number(filaEl.dataset["i"]);
    capturar();
    filaEl.classList.add("arrastrando");
    asa.setPointerCapture(ev.pointerId);
  }

  function alPointerMove(ev: PointerEvent): void {
    if (arrastrando < 0 || !filaEl) return;
    const cont = velo.querySelector<HTMLElement>("#goma-lista");
    if (!cont) return;
    const filas = [...cont.querySelectorAll<HTMLElement>(".goma-edit-fila")];
    // Encuentra sobre qué fila está el puntero
    const y = ev.clientY;
    let destino = arrastrando;
    for (let k = 0; k < filas.length; k++) {
      const r = filas[k]!.getBoundingClientRect();
      if (y >= r.top && y <= r.bottom) { destino = k; break; }
      if (y < r.top) { destino = k; break; }
      if (y > r.bottom) destino = k;
    }
    if (destino !== arrastrando && destino >= 0 && destino < lista.length) {
      const [m] = lista.splice(arrastrando, 1);
      lista.splice(destino, 0, m!);
      arrastrando = destino;
      render();
      // reengancha la clase de arrastre a la nueva posición
      filaEl = velo.querySelector<HTMLElement>(`.goma-edit-fila[data-i="${destino}"]`);
      filaEl?.classList.add("arrastrando");
    }
  }

  function alPointerUp(): void {
    if (filaEl) filaEl.classList.remove("arrastrando");
    arrastrando = -1;
    filaEl = null;
  }

  velo.addEventListener("pointerdown", alPointerDown);
  velo.addEventListener("pointermove", alPointerMove);
  velo.addEventListener("pointerup", alPointerUp);

  velo.addEventListener("click", (ev) => {
    const objetivo = ev.target as HTMLElement;
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
    const borrar = objetivo.closest<HTMLElement>("[data-borrar]");
    if (borrar) {
      capturar();
      const f = borrar.closest<HTMLElement>(".goma-edit-fila")!;
      lista.splice(Number(f.dataset["i"]), 1);
      render();
      return;
    }
    if (objetivo.closest("[data-accion='guardar']")) {
      capturar();
      const usados = new Set<string>();
      for (const c of lista) {
        if (!c.id) c.id = idDesdeNombre(c.nombre);
        const base = c.id; let n = 2;
        while (usados.has(c.id)) c.id = `${base}_${n++}`;
        usados.add(c.id);
      }
      if (lista.length === 0) { aviso("Deja al menos un color, o cancela."); return; }
      guardarColoresGoma(lista);
      aviso("Colores guardados.");
      velo.remove();
      alGuardar?.();
    }
  });

  render();
  document.body.appendChild(velo);
}
