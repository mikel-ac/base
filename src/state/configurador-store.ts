import type { ConfigSesion, PlanSesion } from "../domain/entities/configuracion.js";
import type { Ejercicio } from "../domain/entities/ejercicio.js";
import type { Sugerencia } from "../domain/entities/sugerencia.js";
import type { Usuario } from "../domain/entities/usuario.js";
import type { Material, Patron, Tipo, Zona } from "../domain/entities/tipos.js";
import type { Resultado } from "../core/resultado.js";
import { generarSesion } from "../domain/usecases/generar-sesion.js";
import { Store } from "./store.js";

/**
 * Zona de trabajo: un concepto de UI de UNA decisión, que por debajo se
 * traduce al filtro de patrones del motor. "todo" = sin filtro.
 */
export type ZonaTrabajo = "todo" | "core" | "pierna_gluteo" | "tren_superior";

export const PATRONES_POR_ZONA: Record<ZonaTrabajo, Patron[] | undefined> = {
  todo: undefined,
  core: ["core"],
  pierna_gluteo: ["pierna"],
  tren_superior: ["empuje", "tiron"],
};

/** Deducir la zona a partir de los patrones de una configuración guardada. */
export function zonaDesdePatrones(patrones: Patron[] | undefined): ZonaTrabajo {
  if (!patrones || patrones.length === 0) return "todo";
  const clave = [...patrones].sort().join(",");
  if (clave === "core") return "core";
  if (clave === "pierna") return "pierna_gluteo";
  if (clave === "empuje,tiron") return "tren_superior";
  return "todo"; // combinación desconocida: se trata como cuerpo entero
}

/**
 * Contrato de estado del configurador "montar a medida" (§11.4).
 * `molestiasHoy` guarda SOLO las puntuales; las permanentes viven en el
 * perfil y se unen al generar. Así la UI puede mostrar cada grupo por
 * separado ("hoy me molesta" plegado por defecto es decisión de UI).
 */
export interface ConfiguradorState {
  focus: Tipo[];
  /** Zona de trabajo del día ("todo" = sin restricción). */
  zonaTrabajo: ZonaTrabajo;
  /** Énfasis de patrón si se llegó desde la sugerencia del día; null si no. */
  enfasis: Patron | null;
  material: Material[];
  /** Nivel elegido para HOY. null = usar el del perfil. */
  nivelDia: number | null;
  bajoImpacto: boolean;
  molestiasHoy: Zona[];
  calentamientoMin: number;
  durMin: number;
  workSec: number;
  restSec: number;
}

/** Valores de arranque razonables; el perfil los ajusta con desdePerfil(). */
const ESTADO_INICIAL: ConfiguradorState = {
  focus: ["fuerza", "cardio", "movilidad"],
  zonaTrabajo: "todo",
  enfasis: null,
  material: [],
  nivelDia: null,
  bajoImpacto: false,
  molestiasHoy: [],
  calentamientoMin: 5,
  durMin: 20,
  workSec: 40,
  restSec: 20,
};

function alternar<T>(lista: T[], valor: T): T[] {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}

export class ConfiguradorStore extends Store<ConfiguradorState> {
  constructor() {
    super(ESTADO_INICIAL);
  }

  /** Precarga el material habitual del perfil. */
  desdePerfil(usuario: Usuario): void {
    this.fijar({ material: [...usuario.materialPorDefecto] });
  }

  /** Aplica la sugerencia del día (botón "usar"). El usuario puede retocarla. */
  desdeSugerencia(sugerencia: Sugerencia): void {
    this.fijar({
      focus: [...sugerencia.focus],
      nivelDia: sugerencia.nivelSugerido,
      enfasis: sugerencia.enfasis,
    });
  }

  /** Recarga una configuración guardada (pantalla "planes guardados"). */
  desdeConfig(cfg: ConfigSesion): void {
    this.fijar({
      zonaTrabajo: zonaDesdePatrones(cfg.patrones),
      focus: [...cfg.focus],
      material: [...cfg.material],
      nivelDia: cfg.nivel,
      bajoImpacto: cfg.bajoImpacto,
      calentamientoMin: cfg.calentamientoMin,
      durMin: cfg.durMin,
      workSec: cfg.workSec,
      restSec: cfg.restSec,
    });
  }

  alternarFocus(tipo: Tipo): void {
    // Si el usuario retoca los enfoques, deja de aplicar el énfasis sugerido:
    // su elección manual prevalece sobre la sugerencia.
    this.fijar({ focus: alternar(this.obtener().focus, tipo), enfasis: null });
  }
  alternarMaterial(m: Material): void {
    this.fijar({ material: alternar(this.obtener().material, m) });
  }
  alternarMolestiaHoy(z: Zona): void {
    this.fijar({ molestiasHoy: alternar(this.obtener().molestiasHoy, z) });
  }
  fijarNivelDia(nivel: number | null): void {
    this.fijar({ nivelDia: nivel });
  }
  fijarZonaTrabajo(zona: ZonaTrabajo): void {
    this.fijar({ zonaTrabajo: zona });
  }
  fijarBajoImpacto(activo: boolean): void {
    this.fijar({ bajoImpacto: activo });
  }

  // Variantes "silenciosas": actualizan el estado sin repintar, para que el
  // chip/toggle anime en el sitio (la clase .on la cambia la vista).
  alternarFocusSil(tipo: Tipo): void { this.fijarSilencioso({ focus: alternar(this.obtener().focus, tipo), enfasis: null }); }
  alternarMaterialSil(m: Material): void { this.fijarSilencioso({ material: alternar(this.obtener().material, m) }); }
  alternarMolestiaHoySil(z: Zona): void { this.fijarSilencioso({ molestiasHoy: alternar(this.obtener().molestiasHoy, z) }); }
  fijarNivelDiaSil(nivel: number | null): void { this.fijarSilencioso({ nivelDia: nivel }); }
  fijarBajoImpactoSil(activo: boolean): void { this.fijarSilencioso({ bajoImpacto: activo }); }
  fijarTiempos(t: Partial<Pick<ConfiguradorState, "calentamientoMin" | "durMin" | "workSec" | "restSec">>): void {
    this.fijar(t);
  }

  /** Construye la ConfigSesion final uniendo perfil + elecciones del día. */
  configPara(usuario: Usuario): ConfigSesion {
    const s = this.obtener();
    const molestias = [...new Set([...usuario.molestiasPermanentes, ...s.molestiasHoy])];
    return {
      nivel: s.nivelDia ?? usuario.nivel,
      focus: [...s.focus],
      material: [...s.material],
      bajoImpacto: s.bajoImpacto,
      molestias,
      calentamientoMin: s.calentamientoMin,
      durMin: s.durMin,
      workSec: s.workSec,
      restSec: s.restSec,
      ...(PATRONES_POR_ZONA[s.zonaTrabajo] ? { patrones: [...PATRONES_POR_ZONA[s.zonaTrabajo]!] } : {}),
      ...(s.enfasis ? { enfasis: s.enfasis } : {}),
    };
  }

  /**
   * Genera la sesión. Devuelve Resultado para que la UI muestre los avisos
   * del motor ("elige al menos un enfoque", "afloja filtros") tal cual.
   */
  generar(catalogo: Ejercicio[], usuario: Usuario): Resultado<PlanSesion> {
    return generarSesion(catalogo, this.configPara(usuario));
  }

  /**
   * "Empezar rápido" desde Inicio: solo minutos, resto por defecto/perfil.
   * Sesión equilibrada con los tres enfoques.
   */
  static configRapida(usuario: Usuario, minutos: number): ConfigSesion {
    return {
      nivel: usuario.nivel,
      focus: ["fuerza", "cardio", "movilidad"],
      material: [...usuario.materialPorDefecto],
      bajoImpacto: false,
      molestias: [...usuario.molestiasPermanentes],
      calentamientoMin: 5,
      durMin: minutos,
      workSec: 40,
      restSec: 20,
    };
  }
}
