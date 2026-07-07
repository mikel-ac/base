import type { EjercicioAsignado } from "../domain/entities/configuracion.js";
import type { Ejercicio } from "../domain/entities/ejercicio.js";
import type { Media } from "../domain/entities/tipos.js";
import { resolverMedia, type SondaMedia } from "../domain/usecases/resolver-media.js";
import { urlMediaUsuario } from "../data/media-usuario.js";
import { esc } from "./comunes.js";

/**
 * DETALLE DE EJERCICIO (§4 del PRD): la variante que toca, la demostración
 * visual, las claves de técnica, el "evita" y el consejo general.
 *
 * La demostración sigue el orden automático del §10 (resolverMedia):
 *   1) clip propio media/{id}.mp4   2) media/{id}.gif
 *   3) galería del catálogo (dibujos svg o fotos)   4) marcador con el nombre.
 * Para saber si existe un clip propio se pregunta al servidor con una
 * petición ligera (HEAD): si algún día grabas tus clips y los dejas en la
 * carpeta media/ con el id del ejercicio, aparecerán solos, sin tocar código.
 */

export const sondaFetch: SondaMedia = {
  async existe(url: string): Promise<boolean> {
    try {
      const respuesta = await fetch(url, { method: "HEAD" });
      return respuesta.ok;
    } catch {
      return false;
    }
  },
};

function medioHtml(m: Media): string {
  const contenido = m.svg
    ? m.svg
    : m.src
      ? `<img src="${esc(m.src)}" alt="${esc(m.label)}" loading="lazy" onerror="this.style.display='none'" />`
      : "";
  const credito = m.credit ? ` <span class="credito">(${esc(m.credit)})</span>` : "";
  return `<figure class="medio">${contenido}<figcaption>${esc(m.label)}${credito}</figcaption></figure>`;
}

async function cargarMedia(e: Ejercicio, zona: HTMLElement): Promise<void> {
  const propio = await urlMediaUsuario(e.id);
  if (propio) {
    zona.innerHTML =
      propio.tipo === "video"
        ? `<div class="mediabox"><video src="${propio.url}" autoplay loop muted playsinline></video></div>`
        : `<div class="mediabox"><img src="${propio.url}" alt="Demostración de ${esc(e.nombre)}" /></div>`;
    return;
  }
  const resuelto = await resolverMedia(e, sondaFetch);
  if (!zona.isConnected) return; // el panel ya se cerró
  if (resuelto.tipo === "clip") {
    zona.innerHTML = resuelto.src.endsWith(".mp4")
      ? `<div class="mediabox"><video src="${esc(resuelto.src)}" autoplay loop muted playsinline></video></div>`
      : `<div class="mediabox"><img src="${esc(resuelto.src)}" alt="Demostración de ${esc(e.nombre)}" /></div>`;
  } else if (resuelto.tipo === "galeria") {
    zona.innerHTML = `<div class="galeria">${resuelto.medios.map(medioHtml).join("")}</div>`;
  } else {
    zona.innerHTML = `<div class="mediabox">${esc(resuelto.label)}</div>`;
  }
}

export function mostrarDetalleEjercicio(asignado: EjercicioAsignado, alCerrar?: () => void): void {
  const e = asignado.ejercicio;
  const velo = document.createElement("div");
  velo.className = "pantalla-full";
  const claves = e.claves.map((c) => `<li>${esc(c)}</li>`).join("");
  velo.innerHTML = `
    <div class="full-panel" role="dialog" aria-label="Detalle del ejercicio">
      <div class="full-hd">
        <button class="full-atras" data-accion="cerrar-detalle" aria-label="Volver">← Atrás</button>
      </div>
      <div class="full-body">
        <h2>${esc(e.nombre)}</h2>
        <p class="sub">Tu variante: ${esc(asignado.variante.nombre)} · ${esc(asignado.variante.cue)}</p>
        <div class="zona-media"><div class="mediabox">Cargando demostración…</div></div>
        ${claves ? `<h3>Claves para hacerlo bien</h3><ul class="klist">${claves}</ul>` : ""}
        ${e.evita ? `<h3 class="lbl danger" style="margin-bottom:0;">Evita</h3><div class="tip">${esc(e.evita)}</div>` : ""}
        ${e.consejo ? `<p class="consejo">${esc(e.consejo)}</p>` : ""}
      </div>
      <div class="full-foot">
        <button class="btn primary wide" data-accion="cerrar-detalle">Cerrar</button>
      </div>
    </div>`;

  const cerrar = (): void => {
    velo.remove();
    alCerrar?.();
  };
  velo.addEventListener("click", (ev) => {
    const objetivo = ev.target as HTMLElement;
    if (objetivo.closest("[data-accion='cerrar-detalle']")) cerrar();
  });
  document.body.appendChild(velo);
  void cargarMedia(e, velo.querySelector<HTMLElement>(".zona-media")!);
}
