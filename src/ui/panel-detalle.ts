import type { PlanSesion, EjercicioAsignado } from "../domain/entities/configuracion.js";
import type { Ejercicio } from "../domain/entities/ejercicio.js";
import { generarSesion } from "../domain/usecases/generar-sesion.js";
import { sustituirEjercicio } from "../domain/usecases/sustituir-ejercicio.js";
import { aviso, esc } from "./comunes.js";
import { mostrarDetalleEjercicio } from "./detalle-ejercicio.js";

/**
 * PANEL DE DETALLE de una sesión generada: listado completo con Regenerar,
 * Empezar y SUSTITUCIÓN por ejercicio. Lo comparten "Ver detalle" (inicio),
 * "Generar sesión" (configurador) y los planes (config + a medida).
 *
 * Sustituir: cada ejercicio tiene un botón que lo cambia por otro equivalente
 * al toque (mismo patrón, viable con el material/molestias/nivel del plan, sin
 * repetir). Es una edición EN MEMORIA sobre este plan; si el usuario cierra sin
 * empezar, no persiste nada. Al empezar, se usa el plan ya con las sustituciones.
 */
export function mostrarDetallePlan(
  catalogo: Ejercicio[],
  planInicial: PlanSesion,
  titulo: string,
  alEmpezar: (plan: PlanSesion) => void
): void {
  let plan: PlanSesion = {
    ...planInicial,
    calentamiento: [...planInicial.calentamiento],
    principal: [...planInicial.principal],
  };

  const velo = document.createElement("div");
  velo.className = "velo";

  function filaHTML(a: EjercicioAsignado, bloque: "calentamiento" | "principal", i: number): string {
    return `<li data-bloque="${bloque}" data-i="${i}">
      <span class="li-txt">${esc(a.ejercicio.nombre)} <span class="var">· ${esc(a.variante.nombre)}</span></span>
      <button class="sustituir" data-sust="${bloque}:${i}" aria-label="Sustituir por otro ejercicio" title="Sustituir">⟳</button>
    </li>`;
  }

  function render(): void {
    velo.innerHTML = `
      <div class="panel" role="dialog" aria-label="Detalle de la sesión">
        <h2>${esc(titulo)}</h2>
        <p class="sub">${plan.cfg.durMin} min + ${plan.cfg.calentamientoMin} de calentamiento · intervalos de ${plan.cfg.workSec}/${plan.cfg.restSec}s</p>
        <p class="sub">Toca un ejercicio para su detalle, o &#10227; para cambiarlo por otro.</p>
        ${plan.calentamiento.length > 0 ? `<h3>Calentamiento</h3>
        <ol>${plan.calentamiento.map((a, i) => filaHTML(a, "calentamiento", i)).join("")}</ol>` : ""}
        <h3>Entrenamiento (${plan.principal.length})</h3>
        <ol>${plan.principal.map((a, i) => filaHTML(a, "principal", i)).join("")}</ol>
        <div class="row">
          <button class="btn" data-accion="regenerar">Regenerar</button>
          <button class="btn primary" data-accion="empezar">Empezar</button>
        </div>
      </div>`;
  }

  function idsUsados(): string[] {
    return [...plan.calentamiento, ...plan.principal].map((a) => a.ejercicio.id);
  }

  function sustituir(bloque: "calentamiento" | "principal", i: number): void {
    const lista = bloque === "calentamiento" ? plan.calentamiento : plan.principal;
    const actual = lista[i];
    if (!actual) return;
    const sust = sustituirEjercicio(actual.ejercicio, {
      catalogo,
      usados: idsUsados(),
      nivel: plan.cfg.nivel,
      material: plan.cfg.material,
      molestias: plan.cfg.molestias,
      bajoImpacto: plan.cfg.bajoImpacto,
    });
    if (!sust) {
      aviso("No hay otro ejercicio equivalente disponible.");
      return;
    }
    lista[i] = { ejercicio: sust.ejercicio, variante: sust.variante };
    render();
    const fila = velo.querySelector<HTMLElement>(`li[data-bloque="${bloque}"][data-i="${i}"]`);
    if (fila) {
      fila.classList.add("sust-flash");
      window.setTimeout(() => fila.classList.remove("sust-flash"), 420);
    }
  }

  velo.addEventListener("click", (ev) => {
    const objetivo = ev.target as HTMLElement;
    if (objetivo === velo) {
      velo.remove();
      return;
    }
    const sust = objetivo.closest<HTMLElement>("[data-sust]");
    if (sust) {
      const partes = sust.dataset["sust"]!.split(":");
      sustituir(partes[0] as "calentamiento" | "principal", Number(partes[1]));
      return;
    }
    const accion = objetivo.closest<HTMLElement>("[data-accion]")?.dataset["accion"];
    if (accion === "regenerar") {
      const res = generarSesion(catalogo, plan.cfg);
      if (res.ok) {
        plan = { ...res.valor, calentamiento: [...res.valor.calentamiento], principal: [...res.valor.principal] };
        render();
      } else {
        aviso(res.error);
      }
      return;
    }
    if (accion === "empezar") {
      velo.remove();
      alEmpezar(plan);
      return;
    }
    const li = objetivo.closest<HTMLElement>("li[data-bloque]");
    if (li && !objetivo.closest("[data-sust]")) {
      const bloque = li.dataset["bloque"] as "calentamiento" | "principal";
      const i = Number(li.dataset["i"]);
      const a = (bloque === "calentamiento" ? plan.calentamiento : plan.principal)[i];
      if (a) mostrarDetalleEjercicio(a);
    }
  });

  render();
  document.body.appendChild(velo);
}
