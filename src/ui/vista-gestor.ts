import type { Ejercicio } from "../domain/entities/ejercicio.js";
import type { Tipo, ZonaTrabajo } from "../domain/entities/tipos.js";
import { ZONAS_TRABAJO, ZONA_TRABAJO_ETIQUETA } from "../domain/entities/tipos.js";
import { animarEntrada, aviso, esc } from "./comunes.js";
import { guardarOverride, zonaTrabajoDe } from "../data/overrides.js";
import { urlMediaUsuario, guardarMediaUsuario, borrarMediaUsuario } from "../data/media-usuario.js";
import type { Ctx, Nav } from "./main.js";

/**
 * GESTOR DE EJERCICIOS (v1). Editar nombre, tipo, explicación, claves, notas,
 * zona de trabajo, unilateral e imagen/vídeo de ayuda. Los textos se guardan
 * como "overrides" (localStorage); las imágenes/vídeos, como Blob en IndexedDB
 * (ver data/media-usuario.ts). Todo encima del catálogo base, sin tocarlo.
 */
const TIPO_ETIQUETA: Record<Tipo, string> = {
  fuerza: "Fuerza",
  cardio: "Cardio",
  movilidad: "Movilidad",
  calentamiento: "Calentamiento",
};
const TIPOS: Tipo[] = ["fuerza", "cardio", "movilidad", "calentamiento"];

export function montarGestor(ctx: Ctx, nav: Nav): () => void {
  const { raiz } = ctx;
  const items: Ejercicio[] = ctx.catalogo.map((e) => ({ ...e }));
  let editandoId: string | null = null;
  let ztSel: ZonaTrabajo = "global";
  let tipoSel: Tipo = "fuerza";
  let unilatSel = false;
  let animado = false;

  raiz.classList.add("sin-nav");

  function pintarLista(): void {
    let cuerpo = "";
    for (const g of TIPOS) {
      const delGrupo = items.filter((e) => e.tipo === g);
      if (delGrupo.length === 0) continue;
      cuerpo += `<p class="dayh">${TIPO_ETIQUETA[g]}</p>`;
      cuerpo += delGrupo
        .map(
          (e) => `<button class="histrow" data-editar="${e.id}">
            <div class="hr-main">
              <div class="hr-f">${esc(e.nombre)}</div>
              <div class="hr-s">${ZONA_TRABAJO_ETIQUETA[zonaTrabajoDe(e)]}${e.porLados ? " · dos lados" : ""}</div>
            </div>
            <span class="chev">›</span>
          </button>`
        )
        .join("");
    }
    raiz.innerHTML = `
      <button class="back" data-accion="volver">← Ajustes</button>
      <h1 class="scr-title">Gestor de ejercicios</h1>
      <p class="hint">Edita nombre, tipo, explicación, claves, notas, zona, unilateral e imagen/vídeo. Los cambios se guardan en este dispositivo, encima del catálogo base.</p>
      <div style="margin-top: 10px;">${cuerpo}</div>
    `;
    if (!animado) {
      animado = true;
      animarEntrada(raiz);
    }
  }

  async function pintarMediaPrev(): Promise<void> {
    const cont = raiz.querySelector<HTMLElement>("#g-media-prev");
    if (!cont || !editandoId) return;
    const e = items.find((x) => x.id === editandoId);
    const propio = await urlMediaUsuario(editandoId);
    if (propio) {
      cont.innerHTML =
        propio.tipo === "video"
          ? `<video src="${propio.url}" autoplay loop muted playsinline></video>`
          : `<img src="${propio.url}" alt="" />`;
      const q = raiz.querySelector<HTMLElement>("#g-quitar-media");
      if (q) q.hidden = false;
      return;
    }
    const base = e?.images.find((m) => m.src || m.svg);
    if (base?.src) cont.innerHTML = `<img src="${esc(base.src)}" alt="" />`;
    else if (base?.svg) cont.innerHTML = base.svg;
    else cont.innerHTML = `<span class="prev-vacio">Sin imagen · sube una para este ejercicio</span>`;
    const q = raiz.querySelector<HTMLElement>("#g-quitar-media");
    if (q) q.hidden = true;
  }

  function pintarEdicion(e: Ejercicio): void {
    ztSel = zonaTrabajoDe(e);
    tipoSel = e.tipo;
    unilatSel = !!e.porLados;
    const segTipo = TIPOS.map(
      (t) => `<button data-tipo="${t}" class="chip ${t === tipoSel ? "on" : ""}">${TIPO_ETIQUETA[t]}</button>`
    ).join("");
    const segZT = ZONAS_TRABAJO.map(
      (z) => `<button data-zt="${z}" class="chip ${z === ztSel ? "on" : ""}">${ZONA_TRABAJO_ETIQUETA[z]}</button>`
    ).join("");
    raiz.innerHTML = `
      <button class="back" data-accion="volver-lista">← Todos los ejercicios</button>
      <h1 class="scr-title">${esc(e.nombre)}</h1>

      <p class="lbl">Imagen / vídeo de ayuda</p>
      <div id="g-media-prev" class="mediabox"></div>
      <div class="row" style="margin-top:8px">
        <label class="btn" style="flex:1;text-align:center;cursor:pointer">Subir imagen<input id="g-file-img" type="file" accept="image/*" hidden /></label>
        <label class="btn" style="flex:1;text-align:center;cursor:pointer">Subir vídeo<input id="g-file-vid" type="file" accept="video/*" hidden /></label>
      </div>
      <button id="g-quitar-media" class="btn wide" data-accion="quitar-media" style="margin-top:8px" hidden>Quitar medio propio</button>

      <p class="lbl" style="margin-top:16px">Nombre</p>
      <input id="g-nombre" class="field" type="text" value="${esc(e.nombre)}" autocomplete="off" />

      <p class="lbl" style="margin-top:14px">Tipo</p>
      <div class="chips" id="g-tipo">${segTipo}</div>

      <p class="lbl" style="margin-top:14px">Explicación</p>
      <textarea id="g-consejo" class="field" rows="2">${esc(e.consejo)}</textarea>

      <p class="lbl" style="margin-top:14px">Claves · una por línea</p>
      <textarea id="g-claves" class="field" rows="4" placeholder="Un punto de técnica por línea…">${esc((e.claves ?? []).join("\\n"))}</textarea>

      <p class="lbl" style="margin-top:14px">Notas</p>
      <textarea id="g-notas" class="field" rows="2" placeholder="Tus notas personales…">${esc(e.notas ?? "")}</textarea>

      <p class="lbl" style="margin-top:14px">Zona de trabajo</p>
      <div class="chips" id="g-zt">${segZT}</div>

      <div class="frow" style="margin-top:14px">
        <div><div class="nm">Unilateral</div><div class="hint">se hace a los dos lados seguidos (saldrá dos veces)</div></div>
        <button class="tgl ${unilatSel ? "on" : ""}" data-accion="toggle-unilat" aria-pressed="${unilatSel}"><i></i></button>
      </div>

      <button class="btn primary wide" data-accion="guardar" style="margin-top:18px">Guardar</button>
    `;
    animarEntrada(raiz);
    void pintarMediaPrev();
  }

  function render(): void {
    if (editandoId) {
      const e = items.find((x) => x.id === editandoId);
      if (e) pintarEdicion(e);
      else {
        editandoId = null;
        pintarLista();
      }
    } else {
      pintarLista();
    }
  }

  function guardar(): void {
    const e = items.find((x) => x.id === editandoId);
    if (!e) return;
    const nombre = (raiz.querySelector<HTMLInputElement>("#g-nombre")?.value ?? "").trim();
    const consejo = (raiz.querySelector<HTMLTextAreaElement>("#g-consejo")?.value ?? "").trim();
    const notas = (raiz.querySelector<HTMLTextAreaElement>("#g-notas")?.value ?? "").trim();
    const clavesTxt = raiz.querySelector<HTMLTextAreaElement>("#g-claves")?.value ?? "";
    const claves = clavesTxt.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

    guardarOverride(e.id, {
      nombre: nombre || undefined,
      tipo: tipoSel,
      consejo,
      notas,
      claves,
      zonaTrabajo: ztSel,
      porLados: unilatSel,
    });
    e.nombre = nombre || e.nombre;
    e.tipo = tipoSel;
    e.consejo = consejo;
    e.notas = notas || undefined;
    e.claves = claves;
    e.zonaTrabajo = ztSel;
    e.porLados = unilatSel;

    aviso("Guardado");
    editandoId = null;
    render();
  }

  async function alCambiar(ev: Event): Promise<void> {
    const t = ev.target as HTMLInputElement;
    if (!editandoId || !t.files || t.files.length === 0) return;
    const archivo = t.files[0]!;
    if (t.id === "g-file-img") {
      await guardarMediaUsuario(editandoId, "imagen", archivo);
      await pintarMediaPrev();
      aviso("Imagen guardada");
    } else if (t.id === "g-file-vid") {
      await guardarMediaUsuario(editandoId, "video", archivo);
      await pintarMediaPrev();
      aviso("Vídeo guardado");
    }
    t.value = "";
  }

  function alPulsar(ev: Event): void {
    const boton = (ev.target as HTMLElement).closest<HTMLElement>("button");
    if (!boton) return;
    const d = boton.dataset;
    if (d["accion"] === "volver") return nav.aAjustes();
    if (d["accion"] === "volver-lista") {
      editandoId = null;
      return render();
    }
    if (d["editar"]) {
      editandoId = d["editar"];
      return render();
    }
    if (d["tipo"]) {
      tipoSel = d["tipo"] as Tipo;
      raiz.querySelectorAll("#g-tipo [data-tipo]").forEach((b) => b.classList.toggle("on", b === boton));
      return;
    }
    if (d["zt"]) {
      ztSel = d["zt"] as ZonaTrabajo;
      raiz.querySelectorAll("#g-zt [data-zt]").forEach((b) => b.classList.toggle("on", b === boton));
      return;
    }
    if (d["accion"] === "toggle-unilat") {
      unilatSel = !unilatSel;
      boton.classList.toggle("on", unilatSel);
      boton.setAttribute("aria-pressed", String(unilatSel));
      return;
    }
    if (d["accion"] === "quitar-media") {
      if (editandoId) {
        const id = editandoId;
        void borrarMediaUsuario(id).then(() => pintarMediaPrev());
        aviso("Medio propio quitado");
      }
      return;
    }
    if (d["accion"] === "guardar") return guardar();
  }

  raiz.addEventListener("click", alPulsar);
  raiz.addEventListener("change", (ev) => void alCambiar(ev));
  render();

  return () => {
    raiz.removeEventListener("click", alPulsar);
    raiz.classList.remove("sin-nav");
  };
}
