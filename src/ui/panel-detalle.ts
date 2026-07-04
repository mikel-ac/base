import type { PlanSesion } from "../domain/entities/configuracion.js";
import type { Ejercicio } from "../domain/entities/ejercicio.js";
import { generarSesion } from "../domain/usecases/generar-sesion.js";
import { aviso, esc } from "./comunes.js";
import { mostrarDetalleEjercicio } from "./detalle-ejercicio.js";

/**
 * PANEL DE DETALLE de una sesión generada: listado completo con Regenerar
 * y Empezar. Lo comparten "Ver detalle" (inicio) y "Generar sesión"
 * (configurador). Tocar fuera del panel lo cierra.
 */
export function mostrarDetallePlan(
  catalogo: Ejercicio[],
  plan: PlanSesion,
  titulo: string,
  alEmpezar: (plan: PlanSesion) => void
): void {
  const todos = [...plan.calentamiento, ...plan.principal];
  const item = (a: PlanSesion["principal"][number]) =>
    `<li data-indice="${todos.indexOf(a)}">${esc(a.ejercicio.nombre)} <span class="var">· ${esc(a.variante.nombre)}</span></li>`;
  const velo = document.createElement("div");
  velo.className = "velo";
  velo.innerHTML = `
    <div class="panel" role="dialog" aria-label="Detalle de la sesión">
      <h2>${esc(titulo)}</h2>
      <p class="sub">${plan.cfg.durMin} min + ${plan.cfg.calentamientoMin} de calentamiento · intervalos de ${plan.cfg.workSec}/${plan.cfg.restSec}s</p>
      <p class="sub">Toca un ejercicio para ver su detalle.</p>
      <h3>Calentamiento</h3>
      <ol>${plan.calentamiento.map(item).join("")}</ol>
      <h3>Entrenamiento (${plan.principal.length})</h3>
      <ol>${plan.principal.map(item).join("")}</ol>
      <div class="row">
        <button class="btn" data-accion="regenerar">Regenerar</button>
        <button class="btn primary" data-accion="empezar">Empezar</button>
      </div>
    </div>`;
  velo.addEventListener("click", (ev) => {
    const objetivo = ev.target as HTMLElement;
    const accion = objetivo.closest<HTMLElement>("[data-accion]")?.dataset["accion"];
    if (objetivo === velo) velo.remove();
    if (accion === "regenerar") {
      const res = generarSesion(catalogo, plan.cfg);
      if (res.ok) {
        velo.remove();
        mostrarDetallePlan(catalogo, res.valor, titulo, alEmpezar);
      } else {
        aviso(res.error);
      }
    }
    if (accion === "empezar") {
      velo.remove();
      alEmpezar(plan);
      return;
    }
    const li = objetivo.closest<HTMLElement>("li[data-indice]");
    if (li) {
      const asignado = todos[Number(li.dataset["indice"])];
      if (asignado) mostrarDetalleEjercicio(asignado);
    }
  });
  document.body.appendChild(velo);
}
