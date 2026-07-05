import { RunnerStore } from "../state/runner.js";
import { animarEntrada, esc } from "./comunes.js";
import { mostrarDetalleEjercicio, sondaFetch } from "./detalle-ejercicio.js";
import { resolverMedia } from "../domain/usecases/resolver-media.js";
import { urlMediaUsuario } from "../data/media-usuario.js";
import { mostrarListaSesion } from "./lista-sesion.js";
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
        const medio = r.src.endsWith(".mp4")
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
    trabajo: "Trabajo",
    descanso: "Descanso",
    fin: "Fin",
};
// -------------------------------------------------------- zona y pantalla
const ZONA_TEXTO = {
    empuje: "Tren superior", tiron: "Tren superior", pierna: "Pierna y glúteo",
    core: "Core", cardio: "Cardio · global", movilidad: "Movilidad", calentamiento: "Calentamiento",
};
// Mantener la pantalla encendida (y sonando) durante la sesión.
let wakeLock = null;
let sesionViva = false;
async function pedirWake() {
    try {
        const n = navigator;
        if (n.wakeLock && !wakeLock)
            wakeLock = await n.wakeLock.request("screen");
    }
    catch {
        /* el dispositivo no lo soporta: seguimos igual */
    }
}
function soltarWake() {
    try {
        wakeLock?.release();
    }
    catch { /* nada */ }
    wakeLock = null;
}
document.addEventListener("visibilitychange", () => {
    if (sesionViva && document.visibilityState === "visible")
        void pedirWake();
});
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
        const esDescansoOPrep = s.fase === "descanso" || s.fase === "prep";
        const bloqueTexto = paso.bloque === "calentamiento" ? "Calentamiento" : "Entrenamiento";
        raiz.innerHTML = `
      <div class="runner">
        <div class="rhd">
          <span class="prog">${bloqueTexto} · ${s.indice + 1} / ${s.pasos.length}</span>
          <button class="link" data-accion="terminar">Salir</button>
        </div>

        <div class="phase">${FASE_TEXTO[s.fase]}${s.pausado ? " · pausa" : ""}</div>

        <div class="timer">
          <svg class="ring" viewBox="0 0 120 120" aria-hidden="true">
            <circle class="track" cx="60" cy="60" r="54"/>
            <circle class="fill sin-transicion" cx="60" cy="60" r="54" style="stroke-dashoffset: ${offsetAnillo(s)};"/>
          </svg>
          <span class="num" aria-live="polite">${formatearTiempo(s.restanteSec)}</span>
        </div>

        <div class="ex">
          <div class="ex-n">${esDescansoOPrep ? "Siguiente: " : ""}${esc(paso.asignado.ejercicio.nombre)}</div>
          <div class="ex-v">${esc(paso.asignado.variante.nombre)}</div>
          <div class="zona-tag">Trabaja: ${ZONA_TEXTO[paso.asignado.ejercicio.patron] ?? "Global"}</div>
          <div class="prev-media" id="prev-media"></div>
          <p class="ex-c">${esc(paso.asignado.variante.cue)}</p>
          <button class="link" data-accion="detalle-ejercicio">Ver detalle del ejercicio</button>
        </div>

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
    void pedirWake();
    return () => {
        window.clearInterval(reloj);
        desuscribir();
        raiz.removeEventListener("click", alPulsar);
        raiz.removeEventListener("input", alDeslizar);
        raiz.classList.remove("sin-nav");
        sesionViva = false;
        soltarWake();
        for (const velo of document.querySelectorAll(".velo"))
            velo.remove();
    };
}
