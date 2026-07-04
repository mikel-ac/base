import type { ConfigSesion } from "./configuracion.js";

/**
 * Una configuración de sesión guardada con nombre, para recargarla después
 * (pantalla "Planes guardados" del §4). No aparece en la lista de entidades
 * del §5, pero sin ella la funcionalidad no tiene dónde persistir. Se
 * mantiene deliberadamente mínima: guarda la CONFIGURACIÓN, no ejercicios
 * concretos (cada recarga genera una sesión fresca con esas opciones).
 */
export interface PlanGuardado {
  id: string;
  usuarioId: string;
  nombre: string;
  cfg: ConfigSesion;
  creadoEn: number;
}
