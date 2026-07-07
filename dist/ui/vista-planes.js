import { esEntrenamientoFijo } from "../domain/entities/plan-guardado.js";
import { generarSesion } from "../domain/usecases/generar-sesion.js";
import { expandirEntrenamiento } from "../domain/usecases/expandir-entrenamiento.js";
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
function cfgParaUsar(cfgBase, usuario) {
    const cfg = {
        ...cfgBase,
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
    if (esEntrenamientoFijo(p)) {
        const total = p.fijo.calentamiento.length + p.fijo.principal.length;
        const partes = [`${total} ejercicio${total === 1 ? "" : "s"}`, `${p.fijo.workSec}/${p.fijo.restSec}s`];
        return partes.join(" · ");
    }
    const cfg = p.cfg;
    const partes = [`${cfg.durMin} min`];
    const zona = zonaDesdePatrones(cfg.patrones);
    if (zona !== "todo")
        partes.push(ETIQUETA_ZONA_TRABAJO[zona]);
    partes.push(cfg.focus.join(" y "), `${cfg.workSec}/${cfg.restSec}s`);
    if (cfg.bajoImpacto)
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
             <p class="hint">Crea un entrenamiento a medida con el botón de arriba, o guarda una configuración desde "Montar a medida".</p>
             <button class="btn" data-accion="ir-configurador" style="margin-top: 12px;">Diseñar plantilla</button>
           </div>`
            : estado.planes
                .map((p) => {
                const fijo = esEntrenamientoFijo(p);
                const editar = fijo
                    ? `<button class="link" data-accion="editar" data-id="${esc(p.id)}" style="padding-left:0;">Editar</button>`
                    : `<button class="link" data-accion="ajustar" data-id="${esc(p.id)}" style="padding-left:0;">Ajustar</button>`;
                const etiqueta = fijo ? ` <span class="etq">a medida</span>` : "";
                return `
              <section class="plan">
                <div class="pn">
                  <div class="pt">${esc(p.nombre)}${etiqueta}</div>
                  <div class="pd">${esc(resumenPlan(p))}</div>
                  <div style="margin-top:6px;">
                    ${editar}
                    <button class="link" data-accion="borrar" data-id="${esc(p.id)}">Borrar</button>
                  </div>
                </div>
                <button class="btn primary" data-accion="usar" data-id="${esc(p.id)}">Usar</button>
              </section>`;
            })
                .join("");
        raiz.innerHTML = `
      <h1 class="scr-title">Planes</h1>
      <button class="btn primary wide" data-accion="disenar">✎ Diseñar entrenamiento a medida</button>
      <p class="lbl" style="margin-top:16px;">Guardados</p>
      ${cuerpo}
      ${estado.planes.length > 0 ? `<p class="hint" style="text-align:center;">Los planes de configuración generan una sesión fresca cada vez; los "a medida" ejecutan los ejercicios que elegiste. Ambos usan tu nivel actual.</p>` : ""}
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
            case "disenar":
                nav.aDisenador();
                break;
            case "usar": {
                if (!plan)
                    return;
                if (esEntrenamientoFijo(plan)) {
                    const res = expandirEntrenamiento(plan.fijo, catalogo, u.nivel, false);
                    if (!res.ok) {
                        aviso(res.error);
                        return;
                    }
                    if (res.valor.omitidos.length > 0) {
                        aviso(`Se omitieron ${res.valor.omitidos.length} ejercicio(s) no disponibles hoy.`);
                    }
                    mostrarDetallePlan(catalogo, res.valor.plan, `A medida: ${plan.nombre}`, (p) => nav.aSesion(p));
                }
                else {
                    const res = generarSesion(catalogo, cfgParaUsar(plan.cfg, u));
                    if (res.ok)
                        mostrarDetallePlan(catalogo, res.valor, `Plan: ${plan.nombre}`, (p) => nav.aSesion(p));
                    else
                        aviso(res.error);
                }
                break;
            }
            case "editar": {
                if (!plan)
                    return;
                nav.aDisenador(plan);
                break;
            }
            case "ajustar": {
                if (!plan || !plan.cfg)
                    return;
                app.stores.configurador.desdeConfig(cfgParaUsar(plan.cfg, u));
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
