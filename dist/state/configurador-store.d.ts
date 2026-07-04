import type { ConfigSesion, PlanSesion } from "../domain/entities/configuracion.js";
import type { Ejercicio } from "../domain/entities/ejercicio.js";
import type { Sugerencia } from "../domain/entities/sugerencia.js";
import type { Usuario } from "../domain/entities/usuario.js";
import type { Material, Patron, Tipo, Zona } from "../domain/entities/tipos.js";
import type { Resultado } from "../core/resultado.js";
import { Store } from "./store.js";
/**
 * Zona de trabajo: un concepto de UI de UNA decisión, que por debajo se
 * traduce al filtro de patrones del motor. "todo" = sin filtro.
 */
export type ZonaTrabajo = "todo" | "core" | "pierna_gluteo" | "tren_superior";
export declare const PATRONES_POR_ZONA: Record<ZonaTrabajo, Patron[] | undefined>;
/** Deducir la zona a partir de los patrones de una configuración guardada. */
export declare function zonaDesdePatrones(patrones: Patron[] | undefined): ZonaTrabajo;
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
export declare class ConfiguradorStore extends Store<ConfiguradorState> {
    constructor();
    /** Precarga el material habitual del perfil. */
    desdePerfil(usuario: Usuario): void;
    /** Aplica la sugerencia del día (botón "usar"). El usuario puede retocarla. */
    desdeSugerencia(sugerencia: Sugerencia): void;
    /** Recarga una configuración guardada (pantalla "planes guardados"). */
    desdeConfig(cfg: ConfigSesion): void;
    alternarFocus(tipo: Tipo): void;
    alternarMaterial(m: Material): void;
    alternarMolestiaHoy(z: Zona): void;
    fijarNivelDia(nivel: number | null): void;
    fijarZonaTrabajo(zona: ZonaTrabajo): void;
    fijarBajoImpacto(activo: boolean): void;
    alternarFocusSil(tipo: Tipo): void;
    alternarMaterialSil(m: Material): void;
    alternarMolestiaHoySil(z: Zona): void;
    fijarNivelDiaSil(nivel: number | null): void;
    fijarBajoImpactoSil(activo: boolean): void;
    fijarTiempos(t: Partial<Pick<ConfiguradorState, "calentamientoMin" | "durMin" | "workSec" | "restSec">>): void;
    /** Construye la ConfigSesion final uniendo perfil + elecciones del día. */
    configPara(usuario: Usuario): ConfigSesion;
    /**
     * Genera la sesión. Devuelve Resultado para que la UI muestre los avisos
     * del motor ("elige al menos un enfoque", "afloja filtros") tal cual.
     */
    generar(catalogo: Ejercicio[], usuario: Usuario): Resultado<PlanSesion>;
    /**
     * "Empezar rápido" desde Inicio: solo minutos, resto por defecto/perfil.
     * Sesión equilibrada con los tres enfoques.
     */
    static configRapida(usuario: Usuario, minutos: number): ConfigSesion;
}
