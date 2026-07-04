import type { Usuario } from "../domain/entities/usuario.js";
import type { Zona } from "../domain/entities/tipos.js";
import { TODAS_ZONAS } from "../domain/entities/tipos.js";
import { clamp } from "../core/util.js";
import { animarEntrada, aviso, esc } from "./comunes.js";
import type { Ctx, Nav } from "./main.js";
import { fijarTema, temaActual, type Tema } from "./tema.js";

/**
 * PANTALLA DE AJUSTES / PERFIL (guía §7): nombre, objetivo semanal,
 * molestias permanentes y Apariencia (Sistema / Claro / Oscuro).
 * Los cambios se guardan al momento, sin botón de guardar: es un perfil
 * local, no un formulario. El tema se persiste en el dispositivo y la
 * elección manual manda sobre el modo del sistema.
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

export function montarAjustes(ctx: Ctx, nav: Nav): () => void {
  const { raiz, app } = ctx;
  let usuario: Usuario | null = null;
  let animado = false;

  raiz.classList.add("sin-nav");

  async function guardar(cambios: Partial<Usuario>): Promise<void> {
    if (!usuario) return;
    usuario = { ...usuario, ...cambios };
    try {
      await app.repos.usuarios.guardar(usuario);
    } catch {
      aviso("No se pudo guardar el cambio.");
    }
    pintar();
  }

  function pintar(): void {
    if (!usuario) return;
    const u = usuario;
    const tema = temaActual();

    const chipsMolestias = TODAS_ZONAS.map(
      (z) =>
        `<button class="chip ${u.molestiasPermanentes.includes(z) ? "on" : ""}" data-zona="${z}">${ETIQUETA_ZONA[z]}</button>`
    ).join("");

    const segTema = (["sistema", "claro", "oscuro"] as Tema[])
      .map(
        (t) =>
          `<button data-tema="${t}" class="${tema === t ? "on" : ""}">${t.charAt(0).toUpperCase() + t.slice(1)}</button>`
      )
      .join("");

    raiz.innerHTML = `
      <button class="back" data-accion="volver">← Inicio</button>
      <h1 class="scr-title">Ajustes</h1>

      <div>
        <p class="lbl">Perfil</p>
        <label class="campo">
          <input id="nombre" class="field" type="text" value="${esc(u.nombre === "Yo" ? "" : u.nombre)}" placeholder="Tu nombre" autocomplete="off" />
        </label>
        <div class="frow">
          <div>
            <div class="nm">Objetivo semanal</div>
            <div class="hint">sesiones por semana, como guía amable</div>
          </div>
          <div class="stp">
            <button data-objetivo="-1" aria-label="Menos sesiones">−</button>
            <span class="v">${u.objetivoSemanal}</span>
            <button data-objetivo="+1" aria-label="Más sesiones">+</button>
          </div>
        </div>
      </div>

      <div>
        <p class="lbl">Molestias permanentes</p>
        <div class="chips">${chipsMolestias}</div>
        <p class="hint">Se excluirán siempre de todas las sesiones, sin tener que marcarlas cada día.</p>
      </div>

      <div>
        <p class="lbl">Apariencia</p>
        <div class="seg">${segTema}</div>
        <p class="hint">"Sistema" sigue el modo claro/oscuro de tu dispositivo automáticamente.</p>
      </div>
    `;

    if (!animado) {
      animado = true;
      animarEntrada(raiz);
    }

    // El nombre se guarda al terminar de escribir (al salir del campo).
    const campoNombre = raiz.querySelector<HTMLInputElement>("#nombre");
    campoNombre?.addEventListener("change", () => {
      void guardar({ nombre: campoNombre.value.trim() === "" ? "Yo" : campoNombre.value.trim() });
    });
  }

  function alPulsar(ev: Event): void {
    const boton = (ev.target as HTMLElement).closest<HTMLElement>("button");
    if (!boton || !usuario) return;
    const u = usuario;
    const d = boton.dataset;

    if (d["accion"] === "volver") return nav.aInicio();
    if (d["objetivo"]) {
      return void guardar({ objetivoSemanal: clamp(u.objetivoSemanal + (d["objetivo"] === "+1" ? 1 : -1), 1, 7) });
    }
    if (d["zona"]) {
      const zona = d["zona"] as Zona;
      const lista = u.molestiasPermanentes.includes(zona)
        ? u.molestiasPermanentes.filter((z) => z !== zona)
        : [...u.molestiasPermanentes, zona];
      return void guardar({ molestiasPermanentes: lista });
    }
    if (d["tema"]) {
      fijarTema(d["tema"] as Tema);
      pintar();
    }
  }

  async function preparar(): Promise<void> {
    usuario = await app.repos.usuarios.obtenerActivo();
    pintar();
  }

  raiz.addEventListener("click", alPulsar);
  raiz.innerHTML = `<p class="cargando">Cargando…</p>`;
  void preparar();

  return () => {
    raiz.removeEventListener("click", alPulsar);
    raiz.classList.remove("sin-nav");
  };
}
