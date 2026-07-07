import type { Usuario } from "../domain/entities/usuario.js";
import type { Material, Zona } from "../domain/entities/tipos.js";
import { NIVEL_MAX, NIVEL_MIN, TODAS_ZONAS, TODOS_MATERIALES, MATERIAL_ETIQUETA } from "../domain/entities/tipos.js";
import { numEjerciciosPara } from "../domain/usecases/generar-sesion.js";
import { clamp, redondear2 } from "../core/util.js";
import type { ConfiguradorState, ZonaTrabajo } from "../state/configurador-store.js";
import { animarEntrada, aviso, esc } from "./comunes.js";
import type { Ctx, Nav } from "./main.js";
import { mostrarDetallePlan } from "./panel-detalle.js";

/**
 * PANTALLA "MONTAR A MEDIDA" con la capa visual Bloques: chips píldora,
 * segmentado de nivel, toggle, disclosure "Hoy me molesta algo" (plegado)
 * y steppers en filas, como el mockup. El estado sigue viviendo en
 * ConfiguradorStore; esto solo pinta y traduce toques.
 */

const ETIQUETA_ZONA: Record<Zona, string> = {
  hombro: "Hombro",
  muneca: "Muñeca",
  codo: "Codo",
  rodilla: "Rodilla",
  tobillo: "Tobillo",
  gemelo: "Gemelo",
  lumbar: "Lumbar",
  cuello: "Cuello",
};

const ETIQUETA_ZONA_TRABAJO: Record<ZonaTrabajo, string> = {
  todo: "Todo el cuerpo",
  core: "Core",
  pierna_gluteo: "Pierna y glúteo",
  tren_superior: "Tren superior",
};

const AJUSTE_NIVEL_DIA = 0.5;

const LIMITES = {
  durMin: { min: 5, max: 60, paso: 5 },
  calentamientoMin: { min: 0, max: 10, paso: 1 },
  workSec: { min: 20, max: 90, paso: 5 },
  restSec: { min: 0, max: 60, paso: 5 },
} as const;

type CampoTiempo = keyof typeof LIMITES;

let perfilPrecargado = false;

export function montarConfigurador(ctx: Ctx, nav: Nav): () => void {
  const { raiz, app, catalogo } = ctx;
  const configurador = app.stores.configurador;
  let usuario: Usuario | null = null;
  let molestiasAbierto = false;
  let animado = false;

  raiz.classList.add("sin-nav");

  function nivelSuave(u: Usuario): number {
    return redondear2(clamp(u.nivel - AJUSTE_NIVEL_DIA, NIVEL_MIN, NIVEL_MAX));
  }
  function nivelFuerte(u: Usuario): number {
    return redondear2(clamp(u.nivel + AJUSTE_NIVEL_DIA, NIVEL_MIN, NIVEL_MAX));
  }

  function pintar(s: ConfiguradorState): void {
    if (!usuario) return;
    const u = usuario;

    const chip = (dataset: string, valor: string, etiqueta: string, activo: boolean) =>
      `<button class="chip ${activo ? "on" : ""}" data-${dataset}="${valor}">${etiqueta}</button>`;

    const eleccionNivel =
      s.nivelDia === null ? "perfil" : s.nivelDia < u.nivel ? "suave" : s.nivelDia > u.nivel ? "fuerte" : "perfil";

    const abierto = molestiasAbierto || s.molestiasHoy.length > 0;

    const filaStepper = (campo: CampoTiempo, etiqueta: string, unidad: string) => `
      <div class="frow">
        <span class="nm">${etiqueta}</span>
        <div class="stp">
          <button data-tiempo="${campo}" data-direccion="-" aria-label="Menos ${etiqueta.toLowerCase()}">−</button>
          <span class="v">${s[campo]} ${unidad}</span>
          <button data-tiempo="${campo}" data-direccion="+" aria-label="Más ${etiqueta.toLowerCase()}">+</button>
        </div>
      </div>`;

    const numEjercicios = numEjerciciosPara(s.durMin, s.workSec, s.restSec);

    raiz.innerHTML = `
      <button class="back" data-accion="volver">← Inicio</button>
      <h1 class="scr-title">Montar a medida</h1>

      <div>
        <p class="lbl">Material</p>
        <div class="chips">
          ${TODOS_MATERIALES.map((m) => chip("material", m, MATERIAL_ETIQUETA[m], s.material.includes(m))).join("")}
        </div>
      </div>

      <div>
        <p class="lbl">Enfoque · elige uno o varios</p>
        <div class="chips">
          ${chip("focus", "fuerza", "Fuerza", s.focus.includes("fuerza"))}
          ${chip("focus", "cardio", "Cardio", s.focus.includes("cardio"))}
          ${chip("focus", "movilidad", "Movilidad", s.focus.includes("movilidad"))}
        </div>
      </div>

      <div>
        <p class="lbl">Zona de trabajo</p>
        <div class="chips">
          ${(Object.keys(ETIQUETA_ZONA_TRABAJO) as ZonaTrabajo[])
            .map((z) => chip("zona-trabajo", z, ETIQUETA_ZONA_TRABAJO[z], s.zonaTrabajo === z))
            .join("")}
        </div>
        ${s.zonaTrabajo !== "todo" ? `<p class="hint">Sesión centrada en esa zona. En sesiones largas se repiten ejercicios en circuito.</p>` : ""}
      </div>

      <div>
        <p class="lbl">Nivel de hoy</p>
        <div class="seg">
          <button data-nivel="suave" class="${eleccionNivel === "suave" ? "on" : ""}">Suave</button>
          <button data-nivel="perfil" class="${eleccionNivel === "perfil" ? "on" : ""}">Mi nivel (${u.nivel.toFixed(1)})</button>
          <button data-nivel="fuerte" class="${eleccionNivel === "fuerte" ? "on" : ""}">Fuerte</button>
        </div>
        <p class="hint">Solo para hoy. Tu nivel guardado no cambia.</p>
      </div>

      <div class="frow">
        <div>
          <div class="nm">Bajo impacto</div>
          <div class="hint">sin saltos, suelo silencioso</div>
        </div>
        <button class="tgl ${s.bajoImpacto ? "on" : ""}" data-accion="bajo-impacto" aria-pressed="${s.bajoImpacto}" aria-label="Bajo impacto"><i></i></button>
      </div>

      <div>
        <button class="disc" data-accion="molestias-toggle" aria-expanded="${abierto}">
          Hoy me molesta algo <span class="plus">${abierto ? "−" : "+"}</span>
          ${s.molestiasHoy.length > 0 ? `<span style="text-transform:none;letter-spacing:0;">· ${esc(s.molestiasHoy.map((z) => ETIQUETA_ZONA[z]).join(", "))}</span>` : ""}
        </button>
        ${
          abierto
            ? `<div class="chips" style="margin-top:10px;">${TODAS_ZONAS.map((z) => chip("zona", z, ETIQUETA_ZONA[z], s.molestiasHoy.includes(z))).join("")}</div>
               <p class="hint">Solo para hoy. Las permanentes se ajustan en Ajustes y se aplican siempre.</p>`
            : ""
        }
      </div>

      <div>
        <p class="lbl">Duración</p>
        ${filaStepper("calentamientoMin", "Calentamiento", "min")}
        ${filaStepper("durMin", "Entrenamiento", "min")}
      </div>

      <div>
        <p class="lbl">Intervalos · cada ejercicio</p>
        ${filaStepper("workSec", "Trabajo", "s")}
        ${filaStepper("restSec", "Descanso", "s")}
        <p class="hint">Con estos tiempos: ${numEjercicios} ejercicios de entrenamiento.</p>
      </div>

      <button class="btn primary wide" data-accion="generar" style="margin-top:6px;">Generar sesión</button>
      <button class="btn wide" data-accion="guardar-plan">Guardar plantilla</button>
    `;

    if (!animado) {
      animado = true;
      animarEntrada(raiz);
    }
  }

  function alPulsar(ev: Event): void {
    const boton = (ev.target as HTMLElement).closest<HTMLElement>("button");
    if (!boton || !usuario) return;
    const u = usuario;
    const d = boton.dataset;

    // Chips y toggles: cambian la clase .on EN EL SITIO (para que la transición
    // CSS se vea) y guardan el estado en silencio, sin repintar toda la vista.
    if (d["focus"]) { boton.classList.toggle("on"); return configurador.alternarFocusSil(d["focus"] as never); }
    if (d["zonaTrabajo"]) return configurador.fijarZonaTrabajo(d["zonaTrabajo"] as ZonaTrabajo);
    if (d["material"]) { boton.classList.toggle("on"); return configurador.alternarMaterialSil(d["material"] as Material); }
    if (d["zona"]) { boton.classList.toggle("on"); return configurador.alternarMolestiaHoySil(d["zona"] as Zona); }

    if (d["nivel"]) {
      const grupo = boton.parentElement;
      if (grupo) grupo.querySelectorAll("button").forEach((b) => b.classList.remove("on"));
      boton.classList.add("on");
      if (d["nivel"] === "suave") configurador.fijarNivelDiaSil(nivelSuave(u));
      else if (d["nivel"] === "perfil") configurador.fijarNivelDiaSil(null);
      else if (d["nivel"] === "fuerte") configurador.fijarNivelDiaSil(nivelFuerte(u));
      return;
    }

    if (d["tiempo"]) {
      const campo = d["tiempo"] as CampoTiempo;
      const limite = LIMITES[campo];
      const delta = d["direccion"] === "+" ? limite.paso : -limite.paso;
      const valor = clamp(configurador.obtener()[campo] + delta, limite.min, limite.max);
      return configurador.fijarTiempos({ [campo]: valor });
    }

    switch (d["accion"]) {
      case "volver":
        nav.aInicio();
        break;
      case "bajo-impacto": {
        const nuevo = !configurador.obtener().bajoImpacto;
        boton.classList.toggle("on", nuevo);
        boton.setAttribute("aria-pressed", String(nuevo));
        configurador.fijarBajoImpactoSil(nuevo);
        break;
      }
      case "molestias-toggle":
        molestiasAbierto = !molestiasAbierto;
        pintar(configurador.obtener());
        break;
      case "generar": {
        const res = configurador.generar(catalogo, u);
        if (res.ok) mostrarDetallePlan(catalogo, res.valor, "Tu sesión a medida", (p) => nav.aSesion(p));
        else aviso(res.error);
        break;
      }
      case "guardar-plan": {
        const nombre = window.prompt("Nombre del plan (por ejemplo: Mañanas suaves):");
        if (nombre === null) return;
        void app.stores.planes
          .guardar(u.id, nombre, configurador.configPara(u))
          .then(() => aviso("Plan guardado. Lo verás en la pestaña Planes."))
          .catch(() => aviso("No se pudo guardar el plan."));
        break;
      }
    }
  }

  async function preparar(): Promise<void> {
    usuario = await app.repos.usuarios.obtenerActivo();
    if (!perfilPrecargado) {
      configurador.desdePerfil(usuario);
      perfilPrecargado = true;
    }
    pintar(configurador.obtener());
  }

  raiz.addEventListener("click", alPulsar);
  const desuscribir = configurador.suscribir((s) => pintar(s));
  raiz.innerHTML = `<p class="cargando">Cargando…</p>`;
  void preparar();

  return () => {
    desuscribir();
    raiz.removeEventListener("click", alPulsar);
    raiz.classList.remove("sin-nav");
    document.querySelector(".velo")?.remove();
  };
}
