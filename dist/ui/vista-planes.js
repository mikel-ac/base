import { generarSesion } from "../domain/usecases/generar-sesion.js";
import { zonaDesdePatrones } from "../state/configurador-store.js";
import { animarEntrada, aviso, esc } from "./comunes.js";
import { activarIndicador, htmlNav, manejarNav } from "./nav.js";
import { mostrarDetallePlan } from "./panel-detalle.js";
/**
 * PANTALLA DE PLANES GUARDADOS (§4). Un plan guarda tu CONFIGURACIÓN
 * (enfoques, material, tiempos, bajo impacto), no ejercicios concretos:
 * cada "Usar" genera una sesión fresca.
 *
 * Dos cosas NO se recuperan del plan, a propósito:
 * - el nivel: se usa siempre tu nivel ACTUAL, para no congelar la
 *   adaptación (un plan de hace meses seguiría el ritmo de tu progreso);
 * - las molestias: se aplican tus permanentes de HOY, no las que hubiera
 *   el día que guardaste (las molestias puntuales no deben perseguirte).
 */
function cfgParaUsar(plan, usuario) {
    const cfg = {
        ...plan.cfg,
        nivel: usuario.nivel,
        molestias: [...usuario.molestiasPermanentes],
    };
    delete cfg.enfasis; // el énfasis era de un día concreto, no del plan
    return cfg;
}
const ETIQUETA_ZONA_TRABAJO = {
    core: "core",
    pierna_gluteo: "pierna y glúteo",
    tren_superior: "tren superior",
};
function resumenPlan(p) {
    const partes = [`${p.cfg.durMin} min`];
    const zona = zonaDesdePatrones(p.cfg.patrones);
    if (zona !== "todo")
        partes.push(ETIQUETA_ZONA_TRABAJO[zona]);
    partes.push(p.cfg.focus.join(" y "), `${p.cfg.workSec}/${p.cfg.restSec}s`);
    if (p.cfg.bajoImpacto)
        partes.push("bajo impacto");
    return partes.join(" · ");
}
export function montarPlanes(ctx, nav) {
    const { raiz, app, catalogo } = ctx;
    let usuario = null;
    let planesPorId = new Map();
    let animado = false;
    function pintar(estado) {
        if (estado.cargando) {
            raiz.innerHTML = `<p class="cargando">Cargando…</p>`;
            return;
        }
        if (estado.error) {
            raiz.innerHTML = `<p class="cargando">${esc(estado.error)}</p>`;
            return;
        }
        planesPorId = new Map(estado.planes.map((p) => [p.id, p]));
        const cuerpo = estado.planes.length === 0
            ? `<div class="vacio">
             <p>No tienes planes guardados.</p>
             <p class="hint">Se crean desde "Montar a medida" con el botón "Guardar como plan".</p>
             <button class="btn" data-accion="ir-configurador" style="margin-top: 12px;">Ir a montar a medida</button>
           </div>`
            : estado.planes
                .map((p) => `
              <section class="plan">
                <div class="pn">
                  <div class="pt">${esc(p.nombre)}</div>
                  <div class="pd">${esc(resumenPlan(p))}</div>
                  <div style="margin-top:6px;">
                    <button class="link" data-accion="ajustar" data-id="${esc(p.id)}" style="padding-left:0;">Ajustar</button>
                    <button class="link" data-accion="borrar" data-id="${esc(p.id)}">Borrar</button>
                  </div>
                </div>
                <button class="btn primary" data-accion="usar" data-id="${esc(p.id)}">Usar</button>
              </section>`)
                .join("");
        raiz.innerHTML = `
      <h1 class="scr-title">Planes</h1>
      <p class="lbl" style="margin:0;">Guardados</p>
      ${cuerpo}
      ${estado.planes.length > 0 ? `<p class="hint" style="text-align:center;">Un plan guarda tu configuración, no ejercicios: cada uso genera una sesión fresca con tu nivel actual.</p>` : ""}
      ${htmlNav("planes")}
    `;
        activarIndicador(raiz, "planes");
        if (!animado) {
            animado = true;
            animarEntrada(raiz);
        }
    }
    function alPulsar(ev) {
        const boton = ev.target.closest("button");
        if (!boton || !usuario)
            return;
        const u = usuario;
        if (manejarNav(boton, nav, "planes"))
            return;
        const plan = boton.dataset["id"] ? planesPorId.get(boton.dataset["id"]) : undefined;
        switch (boton.dataset["accion"]) {
            case "ir-configurador":
                nav.aConfigurador();
                break;
            case "usar": {
                if (!plan)
                    return;
                const res = generarSesion(catalogo, cfgParaUsar(plan, u));
                if (res.ok)
                    mostrarDetallePlan(catalogo, res.valor, `Plan: ${plan.nombre}`, (p) => nav.aSesion(p));
                else
                    aviso(res.error);
                break;
            }
            case "ajustar": {
                if (!plan)
                    return;
                app.stores.configurador.desdeConfig(cfgParaUsar(plan, u));
                app.stores.configurador.fijarNivelDia(null); // nivel: siempre el actual
                nav.aConfigurador();
                break;
            }
            case "borrar": {
                if (!plan)
                    return;
                if (window.confirm(`¿Borrar el plan "${plan.nombre}"?`)) {
                    void app.stores.planes.eliminar(u.id, plan.id).catch(() => aviso("No se pudo borrar el plan."));
                }
                break;
            }
        }
    }
    async function preparar() {
        usuario = await app.repos.usuarios.obtenerActivo();
        await app.stores.planes.cargar(usuario.id);
    }
    raiz.addEventListener("click", alPulsar);
    const desuscribir = app.stores.planes.suscribir(pintar);
    void preparar();
    return () => {
        desuscribir();
        raiz.removeEventListener("click", alPulsar);
        document.querySelector(".velo")?.remove();
    };
}
