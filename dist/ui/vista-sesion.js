import { RunnerStore } from "../state/runner.js";
import { animarEntrada, esc } from "./comunes.js";
import { mostrarDetalleEjercicio, sondaFetch } from "./detalle-ejercicio.js";
import { resolverMedia } from "../domain/usecases/resolver-media.js";
import { urlMediaUsuario } from "../data/media-usuario.js";
import { mostrarListaSesion } from "./lista-sesion.js";
import { guardarRegistroPendiente } from "./registro-pendiente.js";
import { colorGomaPorId } from "../data/colores-goma.js";
/** Previsualización del siguiente ejercicio durante el descanso/prepárate:
 *  usa la misma resolución de medios (clip propio → fotos → nada). */
async function pintarPreview(e, zona) {
    const propio = await urlMediaUsuario(e.id);
    if (propio) {
        if (!zona.isConnected)
            return;
        zona.innerHTML = `<div class="prev-galeria"><div class="prev-img">${propio.tipo === "video"
            ? `<video src="${propio.url}" autoplay loop muted playsinline></video>`
            : `<img src="${propio.url}" alt="" />`}</div></div>`;
        return;
    }
    const r = await resolverMedia(e, sondaFetch);
    if (!zona.isConnected)
        return;
    if (r.tipo === "clip") {
        const medio = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(r.src)
            ? `<video src="${esc(r.src)}" autoplay loop muted playsinline></video>`
            : `<img src="${esc(r.src)}" alt="" />`;
        zona.innerHTML = `<div class="prev-galeria"><div class="prev-img">${medio}</div></div>`;
    }
    else if (r.tipo === "galeria") {
        const imgs = r.medios
            .map((m) => m.svg
            ? `<div class="prev-img">${m.svg}</div>`
            : m.src
                ? `<div class="prev-img"><img src="${esc(m.src)}" alt="" loading="lazy" onerror="this.style.display=\'none\'" /></div>`
                : "")
            .join("");
        zona.innerHTML = imgs ? `<div class="prev-galeria">${imgs}</div>` : "";
    }
    else {
        zona.innerHTML = ""; // marcador: sin previsualización
    }
}
/**
 * PANTALLA DE SESIÓN con el cronómetro de ANILLO del mockup: un círculo
 * SVG cuyo trazo se va vaciando (stroke-dashoffset animado, 1s lineal)
 * mientras el número desciende con cifras tabulares.
 *
 * Detalle técnico importante: el anillo solo anima si NO se reconstruye
 * el HTML a cada segundo. Por eso el pintado es en dos niveles: si solo ha
 * cambiado el tiempo, se actualizan el número y el anillo en el sitio; el
 * resto de la pantalla solo se repinta al cambiar de fase/ejercicio/pausa.
 */
// ---------------------------------------------------------------- pitidos
let audio = null;
const CLAVE_VOL = "base.volumen";
function leerVolumen() {
    const v = Number(localStorage.getItem(CLAVE_VOL));
    return Number.isFinite(v) && v >= 0 && v <= 1 ? v : 0.6;
}
let volumen = leerVolumen();
function pitido(frecuencia, duracion = 0.15, cuando = 0) {
    if (volumen <= 0)
        return;
    try {
        audio ??= new AudioContext();
        const osc = audio.createOscillator();
        const gan = audio.createGain();
        osc.frequency.value = frecuencia;
        gan.gain.value = 0.2 * volumen;
        osc.connect(gan);
        gan.connect(audio.destination);
        osc.start(audio.currentTime + cuando);
        osc.stop(audio.currentTime + cuando + duracion);
    }
    catch {
        /* sin audio disponible: la app sigue en silencio */
    }
}
function sonarEfectos(efectos) {
    for (const efecto of efectos) {
        if (efecto === "AVISO_CUENTA")
            pitido(1200, 0.06);
        if (efecto === "AVISO_TRABAJO")
            pitido(880);
        if (efecto === "AVISO_DESCANSO")
            pitido(440);
        if (efecto === "AVISO_PREP_PRINCIPAL")
            pitido(520, 0.18);
        if (efecto === "AVISO_FIN") {
            pitido(660, 0.15, 0);
            pitido(660, 0.15, 0.2);
            pitido(880, 0.3, 0.4);
        }
    }
}
// ------------------------------------------------------------------ anillo
const CIRCUNFERENCIA = 339.292; // 2·π·54 (radio del círculo del SVG)
function formatearTiempo(sec) {
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
function duracionDeFase(s) {
    if (s.fase === "prep")
        return s.prepSec;
    if (s.fase === "prep-principal")
        return s.prepPrincipalSec;
    if (s.fase === "descanso")
        return s.restSec;
    return s.workSec;
}
function offsetAnillo(s) {
    const total = Math.max(1, duracionDeFase(s));
    return CIRCUNFERENCIA * (1 - s.restanteSec / total);
}
const FASE_TEXTO = {
    prep: "Prepárate",
    "prep-principal": "Empieza el entrenamiento",
    trabajo: "Trabajo",
    descanso: "Descanso",
    fin: "Fin",
};
// -------------------------------------------------------- zona y pantalla
const ZONA_TEXTO = {
    empuje: "Tren superior", tiron: "Tren superior", pierna: "Pierna y glúteo",
    core: "Core", cardio: "Cardio · global", movilidad: "Movilidad", calentamiento: "Calentamiento",
};
// Mantener la pantalla encendida durante la sesión.
// La Wake Lock API libera el bloqueo automáticamente cuando la pestaña deja de
// ser visible (bloqueo de pantalla, cambio de app, otra pestaña). Por eso hay
// que: (1) escuchar el evento "release" para saber que se soltó y limpiar la
// referencia, y (2) volver a pedirlo cada vez que la pestaña vuelve a ser
// visible. Sin (1), la variable se quedaba no-nula tras una liberación
// automática y el reintento no volvía a pedir el lock: la pantalla se apagaba.
let wakeLock = null;
let sesionViva = false;
async function pedirWake() {
    try {
        const n = navigator;
        if (!n.wakeLock)
            return; // no soportado: no hay nada que hacer
        if (wakeLock)
            return; // ya tenemos uno vivo
        const sentinel = await n.wakeLock.request("screen");
        wakeLock = sentinel;
        // Cuando el sistema lo libere solo, limpiamos la referencia para poder
        // volver a pedirlo al regresar a la app.
        sentinel.addEventListener?.("release", () => {
            wakeLock = null;
        });
    }
    catch {
        /* el dispositivo no lo soporta o lo rechazó: seguimos igual */
    }
}
function soltarWake() {
    try {
        void wakeLock?.release();
    }
    catch { /* nada */ }
    wakeLock = null;
}
document.addEventListener("visibilitychange", () => {
    if (sesionViva && document.visibilityState === "visible")
        void pedirWake();
});
/**
 * FALLBACK para mantener la pantalla encendida cuando la Wake Lock API no está
 * disponible (Safari iOS antiguo, algunos navegadores). Un <video> diminuto,
 * mudo y en bucle reproduciéndose evita que el sistema apague la pantalla.
 * Es un truco conocido y fiable. El vídeo va oculto y no molesta.
 */
let videoDespierta = null;
// Vídeo mp4 mínimo (varios frames negros) embebido en base64. Pesa muy poco.
const MP4_KEEPAWAKE = "data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAC721kYXQAAAKuBgX//6rcRem95tlIt5Ys2CDZI+7veDI2NCAtIGNvcmUgMTQyIC0gSDI2NC9NUEVHLTQgQVZDIGNvZGVjIC0gQ29weWxlZnQgMjAwMy0yMDE0IC0gaHR0cDovL3d3dy52aWRlb2xhbi5vcmcveDI2NC5odG1sIC0gb3B0aW9uczogY2FiYWM9MSByZWY9MyBkZWJsb2NrPTE6MDowIGFuYWx5c2U9MHgzOjB4MTEzIG1lPWhleCBzdWJtZT03IHBzeT0xIHBzeV9yZD0xLjAwOjAuMDAgbWl4ZWRfcmVmPTEgbWVfcmFuZ2U9MTYgY2hyb21hX21lPTEgdHJlbGxpcz0xIDh4OGRjdD0xIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJvbWFfcXBfb2Zmc2V0PS0yIHRocmVhZHM9NiBsb29rYWhlYWRfdGhyZWFkcz0xIHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9MCBibHVyYXlfY29tcGF0PTAgY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTMgYl9weXJhbWlkPTIgYl9hZGFwdD0xIGJfYmlhcz0wIGRpcmVjdD0xIHdlaWdodGI9MSBvcGVuX2dvcD0wIHdlaWdodHA9MiBrZXlpbnQ9MjUwIGtleWludF9taW49MjUgc2NlbmVjdXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2thaGVhZD00MCByYz1jcmYgbWJ0cmVlPTEgY3JmPTIzLjAgcWNvbXA9MC42MCBxcG1pbj0wIHFwbWF4PTY5IHFwc3RlcD00IGlwX3JhdGlvPTEuNDAgYXE9MToxLjAwAIAAAAAWZYiEAD//8m+P5OXfBeLGOfKE3xQADAAAAwAAAwAABxOgWZ3EAAAAAWgAAAAEA/wAAAAAAAAAAAAAAAAAAAAAA==";
function activarVideoDespierta() {
    if (videoDespierta)
        return;
    const v = document.createElement("video");
    v.setAttribute("playsinline", "");
    v.muted = true;
    v.loop = true;
    v.src = MP4_KEEPAWAKE;
    v.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-10px;top:-10px;";
    document.body.appendChild(v);
    void v.play().catch(() => { });
    videoDespierta = v;
}
function pararVideoDespierta() {
    if (!videoDespierta)
        return;
    try {
        videoDespierta.pause();
        videoDespierta.remove();
    }
    catch { /* nada */ }
    videoDespierta = null;
}
/** ¿El navegador soporta la Wake Lock API? */
function hayWakeLockNativo() {
    return "wakeLock" in navigator;
}
// ------------------------------------------------------------------- vista
const CLAVE_SESION = "base.sesion_activa";
export function leerSesionActiva() {
    try {
        const raw = localStorage.getItem(CLAVE_SESION);
        if (!raw)
            return null;
        const d = JSON.parse(raw);
        if (!d || !d.estado || d.estado.fase === "fin")
            return null;
        return d;
    }
    catch {
        return null;
    }
}
export function borrarSesionActiva() {
    try {
        localStorage.removeItem(CLAVE_SESION);
    }
    catch { /* nada */ }
}
function guardarSesionActiva(plan, estado) {
    try {
        localStorage.setItem(CLAVE_SESION, JSON.stringify({ plan, estado }));
    }
    catch { /* nada */ }
}
export function montarSesion(ctx, nav, plan, estadoInicial) {
    const { raiz } = ctx;
    const runner = new RunnerStore(plan, 10, estadoInicial);
    let reloj;
    let claveUltimoPintado = "";
    let animado = false;
    raiz.classList.add("sin-nav");
    function pintar(s) {
        if (s.fase === "fin") {
            borrarSesionActiva();
            // Deja un registro pendiente (vacío de anotaciones) para que la pantalla
            // "¿Qué tal la sesión?" sobreviva a recargas y espere tu decisión.
            guardarRegistroPendiente({ plan, valoracion: null, kcal: "", nota: "" });
            return;
        }
        guardarSesionActiva(plan, s);
        const paso = s.pasos[s.indice];
        if (!paso)
            return;
        const clave = `${s.fase}|${s.indice}|${s.pausado}`;
        if (clave === claveUltimoPintado) {
            // Solo ha pasado un segundo: número y anillo, sin tocar nada más.
            const num = raiz.querySelector(".num");
            const relleno = raiz.querySelector(".ring .fill");
            if (num)
                num.textContent = formatearTiempo(s.restanteSec);
            if (relleno)
                relleno.style.strokeDashoffset = String(offsetAnillo(s));
            return;
        }
        claveUltimoPintado = clave;
        const esDescansoOPrep = s.fase === "descanso" || s.fase === "prep" || s.fase === "prep-principal";
        const bloqueTexto = paso.bloque === "calentamiento" ? "Calentamiento" : "Entrenamiento";
        raiz.innerHTML = `
      <div class="runner">
        <div class="rhd">
          <span class="prog">${bloqueTexto} · ${s.indice + 1} / ${s.pasos.length}</span>
          <button class="link" data-accion="terminar">Salir</button>
        </div>

        <div class="phase">${FASE_TEXTO[s.fase]}${s.pausado ? " · pausa" : ""}</div>

        <div class="prev-media b-video" id="prev-media"></div>

        <div class="b-block">
          <div class="timer b-ring">
            <svg class="ring" viewBox="0 0 120 120" aria-hidden="true">
              <circle class="track" cx="60" cy="60" r="54"/>
              <circle class="fill sin-transicion" cx="60" cy="60" r="54" style="stroke-dashoffset: ${offsetAnillo(s)};"/>
            </svg>
            <span class="num" aria-live="polite">${formatearTiempo(s.restanteSec)}</span>
          </div>
          <div class="ex b-info">
            <div class="ex-n">${esDescansoOPrep ? "Siguiente: " : ""}${esc(paso.asignado.ejercicio.nombre)}</div>
            <div class="ex-v">${esc(paso.asignado.variante.nombre)}</div>
            <div class="zona-tag">Trabaja: ${ZONA_TEXTO[paso.asignado.ejercicio.patron] ?? "Global"}</div>
            ${(() => {
            const goma = colorGomaPorId(paso.asignado.ejercicio.gomaColorId);
            return goma
                ? `<div class="goma-linea"><span class="goma-muestra" style="background:${esc(goma.css)}"></span>Goma: ${esc(goma.nombre)}</div>`
                : "";
        })()}
          </div>
        </div>

        ${paso.asignado.ejercicio.evita && paso.asignado.ejercicio.evita.trim() !== ""
            ? `<p class="ex-evita"><b>Evita:</b> ${esc(paso.asignado.ejercicio.evita)}</p>`
            : ""}
        <button class="link b-detalle" data-accion="detalle-ejercicio">Ver detalle del ejercicio</button>

        <div class="ctrls">
          <button class="btn" data-accion="saltar">Saltar</button>
          <button class="btn primary" data-accion="pausa">${s.pausado ? "Reanudar" : "Pausa"}</button>
        </div>
        <div class="runner-extra row">
          <button class="link" data-accion="ver-sesion">Ver toda la sesión</button>
          <label class="vol"><span aria-hidden="true">🔊</span><input type="range" min="0" max="100" value="${Math.round(volumen * 100)}" data-accion="volumen" aria-label="Volumen del aviso" /></label>
        </div>
      </div>
    `;
        // El anillo entra sin transición en su posición actual; a partir del
        // siguiente segundo, anima (así los cambios de fase no "rebobinan").
        const relleno = raiz.querySelector(".ring .fill");
        if (relleno) {
            void relleno.getBoundingClientRect();
            relleno.classList.remove("sin-transicion");
        }
        const slotPrev = raiz.querySelector("#prev-media");
        if (slotPrev)
            void pintarPreview(paso.asignado.ejercicio, slotPrev);
        if (!animado) {
            animado = true;
            const runnerEl = raiz.querySelector(".runner");
            if (runnerEl)
                animarEntrada(runnerEl);
        }
    }
    function despachar(ev) {
        const efectos = runner.despachar(ev);
        sonarEfectos(efectos);
        if (runner.obtener().fase === "fin") {
            window.clearInterval(reloj);
            nav.aRegistrar(plan);
        }
    }
    /** Abre un panel pausando; al cerrar reanuda solo si no estaba en pausa. */
    function abrirConPausa(abrir) {
        const estabaPausado = runner.obtener().pausado;
        if (!estabaPausado)
            despachar({ tipo: "PAUSAR" });
        abrir(() => {
            if (!estabaPausado && runner.obtener().fase !== "fin")
                despachar({ tipo: "REANUDAR" });
        });
    }
    function alPulsar(ev) {
        const boton = ev.target.closest("[data-accion]");
        if (!boton)
            return;
        switch (boton.dataset["accion"]) {
            case "detalle-ejercicio": {
                const s = runner.obtener();
                const paso = s.pasos[s.indice];
                if (paso)
                    abrirConPausa((alCerrar) => mostrarDetalleEjercicio(paso.asignado, alCerrar));
                break;
            }
            case "ver-sesion": {
                const s = runner.obtener();
                abrirConPausa((alCerrar) => mostrarListaSesion(s.pasos, s.indice, alCerrar));
                break;
            }
            case "pausa":
                despachar({ tipo: runner.obtener().pausado ? "REANUDAR" : "PAUSAR" });
                break;
            case "saltar":
                despachar({ tipo: "SALTAR" });
                break;
            case "terminar":
                if (window.confirm("¿Terminar la sesión aquí?"))
                    despachar({ tipo: "TERMINAR" });
                break;
        }
    }
    function alDeslizar(ev) {
        const t = ev.target;
        if (t instanceof HTMLInputElement && t.dataset["accion"] === "volumen") {
            volumen = Math.max(0, Math.min(1, Number(t.value) / 100));
            localStorage.setItem(CLAVE_VOL, String(volumen));
        }
    }
    raiz.addEventListener("click", alPulsar);
    raiz.addEventListener("input", alDeslizar);
    const desuscribir = runner.suscribir(pintar);
    reloj = window.setInterval(() => despachar({ tipo: "TICK" }), 1000);
    sesionViva = true;
    if (hayWakeLockNativo())
        void pedirWake();
    else
        activarVideoDespierta();
    return () => {
        window.clearInterval(reloj);
        desuscribir();
        raiz.removeEventListener("click", alPulsar);
        raiz.removeEventListener("input", alDeslizar);
        raiz.classList.remove("sin-nav");
        sesionViva = false;
        soltarWake();
        pararVideoDespierta();
        for (const velo of document.querySelectorAll(".velo"))
            velo.remove();
    };
}
