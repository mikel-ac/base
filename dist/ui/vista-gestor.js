import { ZONAS_TRABAJO, ZONA_TRABAJO_ETIQUETA } from "../domain/entities/tipos.js";
import { animarEntrada, aviso, esc } from "./comunes.js";
import { guardarOverride, zonaTrabajoDe } from "../data/overrides.js";
/**
 * GESTOR DE EJERCICIOS (v1). Lista todos los ejercicios y permite editar
 * nombre, explicación, claves, notas, zona de trabajo y si es unilateral.
 * Los cambios se guardan como "overrides" en el dispositivo y se aplican
 * sobre el catálogo base al cargar, sin tocar la semilla.
 * Próximos incrementos: imágenes/loops, añadir/eliminar, diseñador de sesiones.
 */
const TIPO_ETIQUETA = {
    fuerza: "Fuerza",
    cardio: "Cardio",
    movilidad: "Movilidad",
    calentamiento: "Calentamiento",
};
export function montarGestor(ctx, nav) {
    const { raiz } = ctx;
    const items = ctx.catalogo.map((e) => ({ ...e }));
    let editandoId = null;
    let ztSel = "global";
    let unilatSel = false;
    let animado = false;
    raiz.classList.add("sin-nav");
    function pintarLista() {
        let cuerpo = "";
        for (const g of ["fuerza", "cardio", "movilidad", "calentamiento"]) {
            const delGrupo = items.filter((e) => e.tipo === g);
            if (delGrupo.length === 0)
                continue;
            cuerpo += `<p class="dayh">${TIPO_ETIQUETA[g]}</p>`;
            cuerpo += delGrupo
                .map((e) => `<button class="histrow" data-editar="${e.id}">
            <div class="hr-main">
              <div class="hr-f">${esc(e.nombre)}</div>
              <div class="hr-s">${ZONA_TRABAJO_ETIQUETA[zonaTrabajoDe(e)]}${e.porLados ? " · dos lados" : ""}</div>
            </div>
            <span class="chev">›</span>
          </button>`)
                .join("");
        }
        raiz.innerHTML = `
      <button class="back" data-accion="volver">← Ajustes</button>
      <h1 class="scr-title">Gestor de ejercicios</h1>
      <p class="hint">Edita nombre, explicación, claves, notas, zona de trabajo y si es unilateral. Tus cambios se guardan en este dispositivo, encima del catálogo base.</p>
      <div style="margin-top: 10px;">${cuerpo}</div>
    `;
        if (!animado) {
            animado = true;
            animarEntrada(raiz);
        }
    }
    function pintarEdicion(e) {
        ztSel = zonaTrabajoDe(e);
        unilatSel = !!e.porLados;
        const segZT = ZONAS_TRABAJO.map((z) => `<button data-zt="${z}" class="chip ${z === ztSel ? "on" : ""}">${ZONA_TRABAJO_ETIQUETA[z]}</button>`).join("");
        raiz.innerHTML = `
      <button class="back" data-accion="volver-lista">← Todos los ejercicios</button>
      <h1 class="scr-title">${esc(e.nombre)}</h1>

      <p class="lbl">Nombre</p>
      <input id="g-nombre" class="field" type="text" value="${esc(e.nombre)}" autocomplete="off" />

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
    }
    function render() {
        if (editandoId) {
            const e = items.find((x) => x.id === editandoId);
            if (e)
                pintarEdicion(e);
            else {
                editandoId = null;
                pintarLista();
            }
        }
        else {
            pintarLista();
        }
    }
    function guardar() {
        const e = items.find((x) => x.id === editandoId);
        if (!e)
            return;
        const nombre = (raiz.querySelector("#g-nombre")?.value ?? "").trim();
        const consejo = (raiz.querySelector("#g-consejo")?.value ?? "").trim();
        const notas = (raiz.querySelector("#g-notas")?.value ?? "").trim();
        const clavesTxt = raiz.querySelector("#g-claves")?.value ?? "";
        const claves = clavesTxt
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
        guardarOverride(e.id, {
            nombre: nombre || undefined,
            consejo,
            notas,
            claves,
            zonaTrabajo: ztSel,
            porLados: unilatSel,
        });
        e.nombre = nombre || e.nombre;
        e.consejo = consejo;
        e.notas = notas || undefined;
        e.claves = claves;
        e.zonaTrabajo = ztSel;
        e.porLados = unilatSel;
        aviso("Guardado");
        editandoId = null;
        render();
    }
    function alPulsar(ev) {
        const boton = ev.target.closest("button");
        if (!boton)
            return;
        const d = boton.dataset;
        if (d["accion"] === "volver")
            return nav.aAjustes();
        if (d["accion"] === "volver-lista") {
            editandoId = null;
            return render();
        }
        if (d["editar"]) {
            editandoId = d["editar"];
            return render();
        }
        if (d["zt"]) {
            ztSel = d["zt"];
            raiz.querySelectorAll("#g-zt [data-zt]").forEach((b) => b.classList.toggle("on", b === boton));
            return;
        }
        if (d["accion"] === "toggle-unilat") {
            unilatSel = !unilatSel;
            boton.classList.toggle("on", unilatSel);
            boton.setAttribute("aria-pressed", String(unilatSel));
            return;
        }
        if (d["accion"] === "guardar")
            return guardar();
    }
    raiz.addEventListener("click", alPulsar);
    render();
    return () => {
        raiz.removeEventListener("click", alPulsar);
        raiz.classList.remove("sin-nav");
    };
}
