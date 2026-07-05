import type { Ejercicio } from "../domain/entities/ejercicio.js";
import type { EntrenamientoFijo, LineaEntrenamiento } from "../domain/entities/entrenamiento-fijo.js";
import type { PlanGuardado } from "../domain/entities/plan-guardado.js";
import type { Usuario } from "../domain/entities/usuario.js";
import { esEntrenamientoFijo } from "../domain/entities/plan-guardado.js";
import { zonaTrabajoDe } from "../data/overrides.js";
import { cargarCatalogo } from "../data/seed/cargar-catalogo.js";
import { ZONA_TRABAJO_ETIQUETA } from "../domain/entities/tipos.js";
import { uuid } from "../core/util.js";
import { animarEntrada, aviso, esc } from "./comunes.js";
import type { Ctx, Nav } from "./main.js";

/**
 * DISEÑADOR DE ENTRENAMIENTOS "A MEDIDA".
 *
 * Permite elegir ejercicios del catálogo, ordenarlos (arrastrando) en dos
 * bloques (calentamiento y principal), fijar los tiempos de trabajo/descanso,
 * y guardar todo con un nombre. Después se puede reabrir para editarlo.
 *
 * Se guarda como un PlanGuardado con payload `fijo` (ver entrenamiento-fijo.ts):
 * referencias al catálogo por línea, con id de línea propio para admitir el
 * MISMO ejercicio varias veces. Al usarlo, expandir-entrenamiento.ts lo
 * convierte en un PlanSesion normal que ejecuta el runner de siempre.
 *
 * El arrastre usa Pointer Events (funciona en táctil y ratón), el mismo
 * enfoque que en otras apps del usuario. No hay dependencias externas.
 */

type Bloque = "calentamiento" | "principal";

const LIMITES = { min: 5, max: 120, paso: 5 } as const;

function nuevaLinea(ejercicioId: string): LineaEntrenamiento {
  return { lineaId: uuid(), ejercicioId };
}

export function montarDisenador(
  ctx: Ctx,
  nav: Nav,
  planExistente?: PlanGuardado
): () => void {
  const { raiz, app } = ctx;
  // Catálogo VIVO (incluye ediciones y ejercicios propios del Gestor hechos
  // en esta misma sesión), no el que se cargó al arrancar la app.
  const catalogo = cargarCatalogo();
  const porId = new Map(catalogo.map((e) => [e.id, e]));

  // --- estado del borrador (en memoria hasta pulsar Guardar) ---
  const editId = planExistente?.id;
  let nombre = planExistente?.nombre ?? "";
  let workSec = 40;
  let restSec = 20;
  let calentamiento: LineaEntrenamiento[] = [];
  let principal: LineaEntrenamiento[] = [];

  if (planExistente && esEntrenamientoFijo(planExistente)) {
    workSec = planExistente.fijo.workSec;
    restSec = planExistente.fijo.restSec;
    // Copias nuevas para no mutar el guardado hasta confirmar.
    calentamiento = planExistente.fijo.calentamiento.map((l) => ({ ...l }));
    principal = planExistente.fijo.principal.map((l) => ({ ...l }));
  }

  let usuario: Usuario | null = null;
  let animado = false;

  // --- selector de ejercicios (overlay) ---
  let selectorBloque: Bloque | null = null;
  let selBusca = "";
  let selFiltro: "todos" | "core" | "pierna_gluteo" | "tren_superior" | "movilidad" | "global" | "calentamiento" =
    "todos";

  raiz.classList.add("sin-nav");

  // ---------- helpers de dominio (para pintar y contar) ----------
  function lista(b: Bloque): LineaEntrenamiento[] {
    return b === "calentamiento" ? calentamiento : principal;
  }

  /** Nº de huecos reales que ocupa una línea (unilateral = 2). */
  function huecos(linea: LineaEntrenamiento): number {
    const e = porId.get(linea.ejercicioId);
    return e?.porLados ? 2 : 1;
  }

  function totalHuecos(): number {
    const cuenta = (arr: LineaEntrenamiento[]) => arr.reduce((s, l) => s + huecos(l), 0);
    return cuenta(calentamiento) + cuenta(principal);
  }

  function minutosEstimados(): number {
    const seg = totalHuecos() * (workSec + restSec);
    return Math.max(0, Math.round(seg / 60));
  }

  function idsEnUso(): Set<string> {
    const s = new Set<string>();
    for (const l of [...calentamiento, ...principal]) s.add(l.ejercicioId);
    return s;
  }

  // ---------- pintado de una fila de ejercicio del entrenamiento ----------
  function filaLinea(b: Bloque, linea: LineaEntrenamiento, indice: number): string {
    const e = porId.get(linea.ejercicioId);
    const nombreEj = e ? esc(e.nombre) : "(ejercicio eliminado)";
    const sub = e
      ? `${ZONA_TRABAJO_ETIQUETA[zonaTrabajoDe(e)]}${e.porLados ? " · por lados" : ""}`
      : "ya no está en el catálogo";
    return `
      <div class="ds-item" data-bloque="${b}" data-indice="${indice}" data-linea="${esc(linea.lineaId)}">
        <button class="ds-asa" data-asa aria-label="Arrastrar para reordenar">⠿</button>
        <div class="ds-item-main">
          <div class="ds-item-nombre">${nombreEj}</div>
          <div class="ds-item-sub">${esc(sub)}</div>
        </div>
        <button class="ds-quitar" data-quitar aria-label="Quitar del entrenamiento">✕</button>
      </div>`;
  }

  function htmlBloque(b: Bloque, titulo: string): string {
    const arr = lista(b);
    const filas = arr.map((l, i) => filaLinea(b, l, i)).join("");
    const vacio =
      arr.length === 0
        ? `<p class="ds-vacio">${b === "calentamiento" ? "Sin calentamiento (opcional)." : "Aún no has añadido ejercicios."}</p>`
        : "";
    return `
      <p class="lbl ds-blabel">${esc(titulo)} · ${arr.length}</p>
      <div class="ds-lista" data-lista="${b}">${filas}${vacio}</div>
      <button class="ds-add" data-add="${b}">＋ Añadir ejercicio</button>`;
  }

  // ---------- pantalla principal del diseñador ----------
  function pintar(): void {
    raiz.innerHTML = `
      <button class="back" data-accion="volver">← Planes</button>
      <h1 class="scr-title">${editId ? "Editar entrenamiento" : "Diseñar entrenamiento"}</h1>

      <input id="ds-nombre" class="field" type="text" placeholder="Nombre del entrenamiento…"
             value="${esc(nombre)}" autocomplete="off" style="margin-top:4px" />

      <div class="ds-tiempos">
        <div class="frow">
          <span class="nm">Trabajo</span>
          <div class="stp">
            <button data-tiempo="workSec" data-dir="-" aria-label="Menos trabajo">−</button>
            <span class="v" id="ds-work">${workSec} s</span>
            <button data-tiempo="workSec" data-dir="+" aria-label="Más trabajo">+</button>
          </div>
        </div>
        <div class="frow">
          <span class="nm">Descanso</span>
          <div class="stp">
            <button data-tiempo="restSec" data-dir="-" aria-label="Menos descanso">−</button>
            <span class="v" id="ds-rest">${restSec} s</span>
            <button data-tiempo="restSec" data-dir="+" aria-label="Más descanso">+</button>
          </div>
        </div>
        <div class="frow">
          <span class="nm">Duración estimada</span>
          <span class="v ds-total" id="ds-total">~${minutosEstimados()} min</span>
        </div>
      </div>

      <div id="ds-cal">${htmlBloque("calentamiento", "Calentamiento")}</div>
      <div id="ds-prin">${htmlBloque("principal", "Principal")}</div>

      <button class="btn primary wide" data-accion="guardar" style="margin-top:18px">Guardar entrenamiento</button>
      <p class="hint" style="text-align:center;margin-top:10px">
        La dificultad de cada ejercicio se ajusta a tu nivel actual al usarlo. Los unilaterales se hacen a los dos lados.
      </p>
    `;
    if (!animado) {
      animado = true;
      animarEntrada(raiz);
    }
  }

  /** Repinta solo los bloques + totales (tras añadir/quitar/reordenar), sin
      recrear los campos de texto para no perder el foco/el cursor del nombre. */
  function refrescarBloques(): void {
    const cal = raiz.querySelector<HTMLElement>("#ds-cal");
    const pri = raiz.querySelector<HTMLElement>("#ds-prin");
    const tot = raiz.querySelector<HTMLElement>("#ds-total");
    if (cal) cal.innerHTML = htmlBloque("calentamiento", "Calentamiento");
    if (pri) pri.innerHTML = htmlBloque("principal", "Principal");
    if (tot) tot.textContent = `~${minutosEstimados()} min`;
  }

  // ---------- selector de ejercicios (overlay) ----------
  function candidatosSelector(): Ejercicio[] {
    const q = selBusca.trim().toLowerCase();
    return catalogo.filter((e) => {
      if (q && !e.nombre.toLowerCase().includes(q)) return false;
      if (selFiltro === "todos") return true;
      if (selFiltro === "calentamiento") return e.tipo === "calentamiento";
      return zonaTrabajoDe(e) === selFiltro;
    });
  }

  function pintarSelector(): void {
    document.querySelector(".velo")?.remove();
    if (!selectorBloque) return;
    const b = selectorBloque;
    const usados = idsEnUso();
    const cs = candidatosSelector();

    const filtros: { clave: typeof selFiltro; texto: string }[] =
      b === "calentamiento"
        ? [
            { clave: "todos", texto: "Todos" },
            { clave: "calentamiento", texto: "Calentamiento" },
          ]
        : [
            { clave: "todos", texto: "Todos" },
            { clave: "core", texto: "Core" },
            { clave: "pierna_gluteo", texto: "Pierna" },
            { clave: "tren_superior", texto: "Tren sup." },
            { clave: "movilidad", texto: "Movilidad" },
            { clave: "global", texto: "Global" },
          ];

    const chips = filtros
      .map(
        (f) =>
          `<button class="chip ${f.clave === selFiltro ? "on" : ""}" data-selfiltro="${f.clave}">${f.texto}</button>`
      )
      .join("");

    const filas =
      cs.length === 0
        ? `<p class="hint" style="margin-top:12px">Ningún ejercicio con esos criterios.</p>`
        : cs
            .map((e) => {
              const yaEsta = usados.has(e.id);
              return `
                <button class="ds-cand ${yaEsta ? "usado" : ""}" data-cand="${esc(e.id)}">
                  <div class="ds-item-main">
                    <div class="ds-item-nombre">${esc(e.nombre)}</div>
                    <div class="ds-item-sub">${esc(ZONA_TRABAJO_ETIQUETA[zonaTrabajoDe(e)])}${e.porLados ? " · por lados" : ""}${yaEsta ? " · ya en el entrenamiento" : ""}</div>
                  </div>
                  <span class="ds-cand-add">＋</span>
                </button>`;
            })
            .join("");

    const velo = document.createElement("div");
    velo.className = "velo";
    velo.innerHTML = `
      <div class="panel ds-selector" role="dialog" aria-label="Añadir ejercicio">
        <h2>Añadir a ${b === "calentamiento" ? "calentamiento" : "principal"}</h2>
        <input id="ds-selbuscar" class="field" type="search" placeholder="Buscar por nombre…"
               value="${esc(selBusca)}" autocomplete="off" />
        <div class="chips" style="margin-top:10px">${chips}</div>
        <div class="ds-candlista">${filas}</div>
        <div class="row"><button class="btn wide" data-accion="cerrar-sel">Hecho</button></div>
      </div>`;
    document.body.appendChild(velo);

    const buscar = velo.querySelector<HTMLInputElement>("#ds-selbuscar");
    buscar?.addEventListener("input", () => {
      selBusca = buscar.value;
      // Repintar solo la lista para no perder el foco del buscador.
      const cont = velo.querySelector<HTMLElement>(".ds-candlista");
      if (!cont) return;
      const usados2 = idsEnUso();
      const cs2 = candidatosSelector();
      cont.innerHTML =
        cs2.length === 0
          ? `<p class="hint" style="margin-top:12px">Ningún ejercicio con esos criterios.</p>`
          : cs2
              .map((e) => {
                const yaEsta = usados2.has(e.id);
                return `
                  <button class="ds-cand ${yaEsta ? "usado" : ""}" data-cand="${esc(e.id)}">
                    <div class="ds-item-main">
                      <div class="ds-item-nombre">${esc(e.nombre)}</div>
                      <div class="ds-item-sub">${esc(ZONA_TRABAJO_ETIQUETA[zonaTrabajoDe(e)])}${e.porLados ? " · por lados" : ""}${yaEsta ? " · ya en el entrenamiento" : ""}</div>
                    </div>
                    <span class="ds-cand-add">＋</span>
                  </button>`;
              })
              .join("");
    });

    velo.addEventListener("click", (ev) => {
      const objetivo = ev.target as HTMLElement;
      if (objetivo === velo || objetivo.closest("[data-accion='cerrar-sel']")) {
        cerrarSelector();
        return;
      }
      const cand = objetivo.closest<HTMLElement>("[data-cand]");
      if (cand) {
        const id = cand.dataset["cand"]!;
        // Se permite añadir aunque ya esté (duplicados intencionados).
        lista(b).push(nuevaLinea(id));
        refrescarBloques();
        // Marcar la fila como "usado" al vuelo (sin cerrar el selector).
        cand.classList.add("usado");
        const sub = cand.querySelector(".ds-item-sub");
        if (sub && !sub.textContent?.includes("ya en el entrenamiento")) {
          sub.textContent = `${sub.textContent} · ya en el entrenamiento`;
        }
        return;
      }
      const chip = objetivo.closest<HTMLElement>("[data-selfiltro]");
      if (chip) {
        selFiltro = chip.dataset["selfiltro"] as typeof selFiltro;
        pintarSelector();
      }
    });
  }

  function abrirSelector(b: Bloque): void {
    selectorBloque = b;
    selBusca = "";
    selFiltro = b === "calentamiento" ? "calentamiento" : "todos";
    pintarSelector();
  }

  function cerrarSelector(): void {
    selectorBloque = null;
    document.querySelector(".velo")?.remove();
  }

  // ---------- arrastrar para reordenar (Pointer Events, táctil + ratón) ----------
  let arrastre: {
    bloque: Bloque;
    desdeIndice: number;
    fila: HTMLElement;
    fantasma: HTMLElement;
    contenedor: HTMLElement;
    offsetY: number;
  } | null = null;

  function iniciarArrastre(ev: PointerEvent, asa: HTMLElement): void {
    const fila = asa.closest<HTMLElement>(".ds-item");
    if (!fila) return;
    const b = fila.dataset["bloque"] as Bloque;
    const contenedor = raiz.querySelector<HTMLElement>(`.ds-lista[data-lista="${b}"]`);
    if (!contenedor) return;
    const indice = Number(fila.dataset["indice"]);

    const rect = fila.getBoundingClientRect();
    const fantasma = fila.cloneNode(true) as HTMLElement;
    fantasma.classList.add("ds-fantasma");
    fantasma.style.width = `${rect.width}px`;
    fantasma.style.left = `${rect.left}px`;
    fantasma.style.top = `${rect.top}px`;
    document.body.appendChild(fantasma);
    fila.classList.add("ds-arrastrando");

    arrastre = {
      bloque: b,
      desdeIndice: indice,
      fila,
      fantasma,
      contenedor,
      offsetY: ev.clientY - rect.top,
    };
    asa.setPointerCapture(ev.pointerId);
    ev.preventDefault();
  }

  function moverArrastre(ev: PointerEvent): void {
    if (!arrastre) return;
    arrastre.fantasma.style.top = `${ev.clientY - arrastre.offsetY}px`;

    // Encontrar sobre qué fila está el puntero dentro del mismo bloque.
    const filas = Array.from(
      arrastre.contenedor.querySelectorAll<HTMLElement>(".ds-item:not(.ds-arrastrando)")
    );
    let insertarAntesDe: HTMLElement | null = null;
    for (const f of filas) {
      const r = f.getBoundingClientRect();
      if (ev.clientY < r.top + r.height / 2) {
        insertarAntesDe = f;
        break;
      }
    }
    if (insertarAntesDe) arrastre.contenedor.insertBefore(arrastre.fila, insertarAntesDe);
    else arrastre.contenedor.appendChild(arrastre.fila);
  }

  function soltarArrastre(): void {
    if (!arrastre) return;
    const { bloque, desdeIndice, fila, fantasma, contenedor } = arrastre;
    fantasma.remove();
    fila.classList.remove("ds-arrastrando");

    // Nuevo índice = posición del elemento arrastrado entre las filas del DOM.
    const filas = Array.from(contenedor.querySelectorAll<HTMLElement>(".ds-item"));
    const hasta = filas.indexOf(fila);
    arrastre = null;

    if (hasta < 0 || hasta === desdeIndice) {
      refrescarBloques();
      return;
    }
    const arr = lista(bloque);
    const [movida] = arr.splice(desdeIndice, 1);
    if (movida) arr.splice(hasta, 0, movida);
    refrescarBloques();
  }

  // ---------- steppers ----------
  function ajustarTiempo(campo: "workSec" | "restSec", dir: "+" | "-"): void {
    const delta = dir === "+" ? LIMITES.paso : -LIMITES.paso;
    // El descanso puede bajar a 0 (sin descanso); el trabajo tiene mínimo.
    const min = campo === "restSec" ? 0 : LIMITES.min;
    const actual = campo === "workSec" ? workSec : restSec;
    const nuevo = Math.max(min, Math.min(LIMITES.max, actual + delta));
    if (campo === "workSec") workSec = nuevo;
    else restSec = nuevo;
    const spanW = raiz.querySelector<HTMLElement>("#ds-work");
    const spanR = raiz.querySelector<HTMLElement>("#ds-rest");
    if (spanW) spanW.textContent = `${workSec} s`;
    if (spanR) spanR.textContent = `${restSec} s`;
    const tot = raiz.querySelector<HTMLElement>("#ds-total");
    if (tot) tot.textContent = `~${minutosEstimados()} min`;
  }

  // ---------- guardar ----------
  async function guardar(): Promise<void> {
    if (!usuario) return;
    if (principal.length === 0) {
      aviso("Añade al menos un ejercicio al bloque principal.");
      return;
    }
    const campoNombre = raiz.querySelector<HTMLInputElement>("#ds-nombre");
    const n = (campoNombre?.value ?? nombre).trim();
    const fijo: EntrenamientoFijo = {
      workSec,
      restSec,
      calentamiento: calentamiento.map((l) => ({ ...l })),
      principal: principal.map((l) => ({ ...l })),
    };
    try {
      await app.stores.planes.guardarFijo(usuario.id, n, fijo, editId);
      aviso(editId ? "Entrenamiento actualizado." : "Entrenamiento guardado.");
      nav.aPlanes();
    } catch {
      aviso("No se pudo guardar el entrenamiento.");
    }
  }

  // ---------- eventos ----------
  function alPulsar(ev: Event): void {
    const objetivo = ev.target as HTMLElement;

    const stepper = objetivo.closest<HTMLElement>("[data-tiempo]");
    if (stepper) {
      ajustarTiempo(
        stepper.dataset["tiempo"] as "workSec" | "restSec",
        stepper.dataset["dir"] as "+" | "-"
      );
      return;
    }

    const add = objetivo.closest<HTMLElement>("[data-add]");
    if (add) {
      abrirSelector(add.dataset["add"] as Bloque);
      return;
    }

    const quitar = objetivo.closest<HTMLElement>("[data-quitar]");
    if (quitar) {
      const fila = quitar.closest<HTMLElement>(".ds-item");
      if (fila) {
        const b = fila.dataset["bloque"] as Bloque;
        const i = Number(fila.dataset["indice"]);
        lista(b).splice(i, 1);
        refrescarBloques();
      }
      return;
    }

    const accion = objetivo.closest<HTMLElement>("[data-accion]")?.dataset["accion"];
    if (accion === "volver") {
      // Recordar el nombre escrito por si el usuario vuelve (no persiste, pero
      // evita perder el texto si navega sin querer). Aquí simplemente salimos.
      nav.aPlanes();
    } else if (accion === "guardar") {
      void guardar();
    }
  }

  function alPointerDown(ev: PointerEvent): void {
    const asa = (ev.target as HTMLElement).closest<HTMLElement>("[data-asa]");
    if (asa) iniciarArrastre(ev, asa);
  }

  function alNombreInput(ev: Event): void {
    nombre = (ev.target as HTMLInputElement).value;
  }

  pintar();

  raiz.addEventListener("click", alPulsar);
  raiz.addEventListener("pointerdown", alPointerDown);
  raiz.addEventListener("pointermove", moverArrastre);
  raiz.addEventListener("pointerup", soltarArrastre);
  raiz.addEventListener("pointercancel", soltarArrastre);
  raiz.addEventListener("input", (ev) => {
    if ((ev.target as HTMLElement).id === "ds-nombre") alNombreInput(ev);
  });

  void (async () => {
    usuario = await app.repos.usuarios.obtenerActivo();
    // La lista de planes debe estar cargada para que guardarFijo pueda
    // localizar el plan al editar (conserva creadoEn).
    if (app.stores.planes.obtener().planes.length === 0) {
      await app.stores.planes.cargar(usuario.id);
    }
  })();

  return () => {
    raiz.classList.remove("sin-nav");
    raiz.removeEventListener("click", alPulsar);
    raiz.removeEventListener("pointerdown", alPointerDown);
    raiz.removeEventListener("pointermove", moverArrastre);
    raiz.removeEventListener("pointerup", soltarArrastre);
    raiz.removeEventListener("pointercancel", soltarArrastre);
    document.querySelector(".velo")?.remove();
    document.querySelector(".ds-fantasma")?.remove();
  };
}
