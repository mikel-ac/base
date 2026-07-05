import { ZONAS_TRABAJO, ZONA_TRABAJO_ETIQUETA } from "../domain/entities/tipos.js";
import { animarEntrada, aviso, esc } from "./comunes.js";
import { guardarOverride, zonaTrabajoDe, esAnadido, crearEjercicioUsuario, actualizarAnadido, eliminarEjercicio, patronDesde, exportarTextos, importarTextos, } from "../data/overrides.js";
import { urlMediaUsuario, guardarMediaUsuario, borrarMediaUsuario, exportarMedios, importarMedios } from "../data/media-usuario.js";
import { cargarCatalogo } from "../data/seed/cargar-catalogo.js";
/**
 * GESTOR DE EJERCICIOS (v2). Buscar/filtrar, editar (nombre, tipo, explicación,
 * claves, notas, zona, unilateral, imagen/vídeo) y crear/eliminar ejercicios.
 * Todo se guarda en el dispositivo (overrides + añadidos/borrados + medios en
 * IndexedDB), encima del catálogo base sin tocarlo.
 */
const TIPO_ETIQUETA = {
    fuerza: "Fuerza",
    cardio: "Cardio",
    movilidad: "Movilidad",
    calentamiento: "Calentamiento",
};
const TIPOS = ["fuerza", "cardio", "movilidad", "calentamiento"];
export function montarGestor(ctx, nav) {
    const { raiz } = ctx;
    const items = cargarCatalogo(); // en vivo: incluye tus ediciones y ejercicios propios
    let editandoId = null;
    let ztSel = "global";
    let tipoSel = "fuerza";
    let unilatSel = false;
    let animado = false;
    // buscador + filtros de la lista
    let busca = "";
    const filtroTipos = new Set();
    const filtroZonas = new Set();
    raiz.classList.add("sin-nav");
    function filtrados() {
        const q = busca.trim().toLowerCase();
        return items.filter((e) => {
            if (q && !e.nombre.toLowerCase().includes(q))
                return false;
            if (filtroTipos.size > 0 && !filtroTipos.has(e.tipo))
                return false;
            if (filtroZonas.size > 0 && !filtroZonas.has(zonaTrabajoDe(e)))
                return false;
            return true;
        });
    }
    function refrescarLista() {
        const cont = raiz.querySelector("#g-lista");
        if (!cont)
            return;
        const lista = filtrados();
        if (lista.length === 0) {
            cont.innerHTML = `<p class="hint" style="margin-top:14px">Ningún ejercicio con esos criterios.</p>`;
            return;
        }
        let cuerpo = "";
        for (const g of TIPOS) {
            const delGrupo = lista.filter((e) => e.tipo === g);
            if (delGrupo.length === 0)
                continue;
            cuerpo += `<p class="dayh">${TIPO_ETIQUETA[g]}</p>`;
            cuerpo += delGrupo
                .map((e) => `<button class="histrow" data-editar="${e.id}">
            <div class="hr-main">
              <div class="hr-f">${esc(e.nombre)}${esAnadido(e.id) ? ' <span class="etq">propio</span>' : ""}</div>
              <div class="hr-s">${ZONA_TRABAJO_ETIQUETA[zonaTrabajoDe(e)]}${e.porLados ? " · dos lados" : ""}</div>
            </div>
            <span class="chev">›</span>
          </button>`)
                .join("");
        }
        cont.innerHTML = cuerpo;
    }
    function pintarLista() {
        const chipsTipo = TIPOS.map((t) => `<button class="chip ${filtroTipos.has(t) ? "on" : ""}" data-ftipo="${t}">${TIPO_ETIQUETA[t]}</button>`).join("");
        const chipsZona = ZONAS_TRABAJO.map((z) => `<button class="chip ${filtroZonas.has(z) ? "on" : ""}" data-fzona="${z}">${ZONA_TRABAJO_ETIQUETA[z]}</button>`).join("");
        raiz.innerHTML = `
      <button class="back" data-accion="volver">← Ajustes</button>
      <h1 class="scr-title">Gestor de ejercicios</h1>
      <button class="btn primary wide" data-accion="nuevo">+ Nuevo ejercicio</button>
      <button class="btn wide" data-accion="disenar" style="margin-top:8px">✎ Diseñar entrenamiento a medida</button>
      <div class="row" style="margin-top:8px">
        <button class="btn" style="flex:1" data-accion="exportar">Exportar datos</button>
        <label class="btn" style="flex:1;text-align:center;cursor:pointer">Importar datos<input id="g-importar" type="file" accept="application/json,.json" hidden /></label>
      </div>
      <p class="hint" style="margin-top:6px">Para llevar tus ejercicios y medios a otro dispositivo: exporta aquí, pasa el archivo y en el otro móvil pulsa Importar.</p>
      <input id="g-buscar" class="field" type="search" placeholder="Buscar por nombre…" value="${esc(busca)}" style="margin-top:12px" autocomplete="off" />
      <p class="lbl" style="margin-top:12px">Filtrar por tipo</p>
      <div class="chips" id="g-ftipo">${chipsTipo}</div>
      <p class="lbl" style="margin-top:10px">Filtrar por zona</p>
      <div class="chips" id="g-fzona">${chipsZona}</div>
      <div id="g-lista" style="margin-top:12px"></div>
    `;
        refrescarLista();
        if (!animado) {
            animado = true;
            animarEntrada(raiz);
        }
    }
    async function pintarMediaPrev() {
        const cont = raiz.querySelector("#g-media-prev");
        if (!cont || !editandoId)
            return;
        const e = items.find((x) => x.id === editandoId);
        const propio = await urlMediaUsuario(editandoId);
        const q = raiz.querySelector("#g-quitar-media");
        if (propio) {
            cont.innerHTML =
                propio.tipo === "video"
                    ? `<video src="${propio.url}" autoplay loop muted playsinline></video>`
                    : `<img src="${propio.url}" alt="" />`;
            if (q)
                q.hidden = false;
            return;
        }
        // Prioridad: medio subido (este dispositivo) > URL de media (compartida) > imagen base.
        const url = e?.urlMedia?.trim();
        if (url) {
            const esVideo = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url);
            cont.innerHTML = esVideo
                ? `<video src="${esc(url)}" autoplay loop muted playsinline></video>`
                : `<img src="${esc(url)}" alt="" />`;
            if (q)
                q.hidden = true;
            return;
        }
        const base = e?.images.find((m) => m.src || m.svg);
        if (base?.src)
            cont.innerHTML = `<img src="${esc(base.src)}" alt="" />`;
        else if (base?.svg)
            cont.innerHTML = base.svg;
        else
            cont.innerHTML = `<span class="prev-vacio">Sin imagen · sube una para este ejercicio</span>`;
        if (q)
            q.hidden = true;
    }
    function pintarEdicion(e) {
        ztSel = zonaTrabajoDe(e);
        tipoSel = e.tipo;
        unilatSel = !!e.porLados;
        const segTipo = TIPOS.map((t) => `<button data-tipo="${t}" class="chip ${t === tipoSel ? "on" : ""}">${TIPO_ETIQUETA[t]}</button>`).join("");
        const segZT = ZONAS_TRABAJO.map((z) => `<button data-zt="${z}" class="chip ${z === ztSel ? "on" : ""}">${ZONA_TRABAJO_ETIQUETA[z]}</button>`).join("");
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

      <p class="lbl" style="margin-top:14px">Indicaciones / explicación</p>
      <textarea id="g-consejo" class="field" rows="2">${esc(e.consejo)}</textarea>

      <p class="lbl" style="margin-top:14px">Claves · una por línea</p>
      <textarea id="g-claves" class="field" rows="4" placeholder="Un punto de técnica por línea…">${esc((e.claves ?? []).join("\n"))}</textarea>

      <p class="lbl" style="margin-top:14px">Notas</p>
      <textarea id="g-notas" class="field" rows="2" placeholder="Tus notas personales…">${esc(e.notas ?? "")}</textarea>

      <p class="lbl" style="margin-top:14px">URL de vídeo/imagen (se comparte a todos)</p>
      <input id="g-urlmedia" class="field" type="text" value="${esc(e.urlMedia ?? "")}" placeholder="media/mi-video.mp4" autocomplete="off" />
      <p class="hint" style="margin-top:6px">Apunta a un archivo de la carpeta media/ de la web. Al ser texto, se sincroniza a todos los dispositivos (los vídeos subidos, en cambio, se quedan en este). Si ambos existen, manda el subido.</p>

      <p class="lbl" style="margin-top:14px">Zona de trabajo</p>
      <div class="chips" id="g-zt">${segZT}</div>

      <div class="frow" style="margin-top:14px">
        <div><div class="nm">Unilateral</div><div class="hint">se hace a los dos lados seguidos (saldrá dos veces)</div></div>
        <button class="tgl ${unilatSel ? "on" : ""}" data-accion="toggle-unilat" aria-pressed="${unilatSel}"><i></i></button>
      </div>

      <button class="btn primary wide" data-accion="guardar" style="margin-top:18px">Guardar</button>
      <button class="btn wide" data-accion="eliminar" style="margin-top:10px;color:var(--danger-ink);border-color:var(--danger-soft)">Eliminar ejercicio</button>
    `;
        animarEntrada(raiz);
        void pintarMediaPrev();
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
        const urlMedia = (raiz.querySelector("#g-urlmedia")?.value ?? "").trim();
        const clavesTxt = raiz.querySelector("#g-claves")?.value ?? "";
        const claves = clavesTxt.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
        e.nombre = nombre || e.nombre;
        e.tipo = tipoSel;
        e.consejo = consejo;
        e.notas = notas || undefined;
        e.claves = claves;
        e.zonaTrabajo = ztSel;
        e.porLados = unilatSel;
        e.urlMedia = urlMedia || undefined;
        if (esAnadido(e.id)) {
            // ejercicio propio: se actualiza entero (y recalculamos su patrón)
            e.patron = patronDesde(tipoSel, ztSel);
            if (e.variantes[0])
                e.variantes[0].cue = consejo;
            actualizarAnadido(e);
        }
        else {
            guardarOverride(e.id, {
                nombre: nombre || undefined,
                tipo: tipoSel,
                consejo,
                notas,
                claves,
                zonaTrabajo: ztSel,
                porLados: unilatSel,
                urlMedia: urlMedia || undefined,
            });
        }
        aviso("Guardado");
        editandoId = null;
        render();
    }
    function eliminar() {
        const e = items.find((x) => x.id === editandoId);
        if (!e)
            return;
        eliminarEjercicio(e.id);
        void borrarMediaUsuario(e.id);
        const i = items.indexOf(e);
        if (i >= 0)
            items.splice(i, 1);
        aviso("Ejercicio eliminado");
        editandoId = null;
        render();
    }
    function nuevo() {
        const ej = crearEjercicioUsuario({ nombre: "Nuevo ejercicio", tipo: "fuerza", zonaTrabajo: "global" });
        items.push(ej);
        editandoId = ej.id;
        render();
    }
    function descargar(nombre, texto) {
        const b = new Blob([texto], { type: "application/json" });
        const u = URL.createObjectURL(b);
        const a = document.createElement("a");
        a.href = u;
        a.download = nombre;
        a.click();
        setTimeout(() => URL.revokeObjectURL(u), 1000);
    }
    async function exportar() {
        aviso("Preparando…");
        const datos = { version: 1, textos: exportarTextos(), medios: await exportarMedios() };
        descargar("base-datos.json", JSON.stringify(datos));
        aviso("Datos exportados");
    }
    async function importar(archivo) {
        try {
            const txt = await archivo.text();
            const d = JSON.parse(txt);
            if (d.textos)
                importarTextos(d.textos);
            if (d.medios)
                await importarMedios(d.medios);
            aviso("Importado. Recargando…");
            setTimeout(() => location.reload(), 800);
        }
        catch {
            aviso("Archivo no válido");
        }
    }
    async function alCambiar(ev) {
        const t = ev.target;
        if (t.id === "g-buscar") {
            busca = t.value;
            refrescarLista();
            return;
        }
        if (t.id === "g-importar" && t.files && t.files[0]) {
            await importar(t.files[0]);
            t.value = "";
            return;
        }
        if (!editandoId || !t.files || t.files.length === 0)
            return;
        const archivo = t.files[0];
        if (t.id === "g-file-img") {
            await guardarMediaUsuario(editandoId, "imagen", archivo);
            await pintarMediaPrev();
            aviso("Imagen guardada");
        }
        else if (t.id === "g-file-vid") {
            await guardarMediaUsuario(editandoId, "video", archivo);
            await pintarMediaPrev();
            aviso("Vídeo guardado");
        }
        t.value = "";
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
        if (d["accion"] === "nuevo")
            return nuevo();
        if (d["accion"] === "disenar")
            return nav.aDisenador();
        if (d["accion"] === "exportar") {
            void exportar();
            return;
        }
        if (d["editar"]) {
            editandoId = d["editar"];
            return render();
        }
        if (d["ftipo"]) {
            const t = d["ftipo"];
            if (filtroTipos.has(t))
                filtroTipos.delete(t);
            else
                filtroTipos.add(t);
            boton.classList.toggle("on");
            return refrescarLista();
        }
        if (d["fzona"]) {
            const z = d["fzona"];
            if (filtroZonas.has(z))
                filtroZonas.delete(z);
            else
                filtroZonas.add(z);
            boton.classList.toggle("on");
            return refrescarLista();
        }
        if (d["tipo"]) {
            tipoSel = d["tipo"];
            raiz.querySelectorAll("#g-tipo [data-tipo]").forEach((b) => b.classList.toggle("on", b === boton));
            return;
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
        if (d["accion"] === "quitar-media") {
            if (editandoId) {
                const id = editandoId;
                void borrarMediaUsuario(id).then(() => pintarMediaPrev());
                aviso("Medio propio quitado");
            }
            return;
        }
        if (d["accion"] === "guardar")
            return guardar();
        if (d["accion"] === "eliminar")
            return eliminar();
    }
    raiz.addEventListener("click", alPulsar);
    raiz.addEventListener("change", (ev) => void alCambiar(ev));
    raiz.addEventListener("input", (ev) => void alCambiar(ev));
    render();
    return () => {
        raiz.removeEventListener("click", alPulsar);
        raiz.classList.remove("sin-nav");
    };
}
