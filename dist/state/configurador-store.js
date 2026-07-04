import { generarSesion } from "../domain/usecases/generar-sesion.js";
import { Store } from "./store.js";
export const PATRONES_POR_ZONA = {
    todo: undefined,
    core: ["core"],
    pierna_gluteo: ["pierna"],
    tren_superior: ["empuje", "tiron"],
};
/** Deducir la zona a partir de los patrones de una configuración guardada. */
export function zonaDesdePatrones(patrones) {
    if (!patrones || patrones.length === 0)
        return "todo";
    const clave = [...patrones].sort().join(",");
    if (clave === "core")
        return "core";
    if (clave === "pierna")
        return "pierna_gluteo";
    if (clave === "empuje,tiron")
        return "tren_superior";
    return "todo"; // combinación desconocida: se trata como cuerpo entero
}
/** Valores de arranque razonables; el perfil los ajusta con desdePerfil(). */
const ESTADO_INICIAL = {
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
function alternar(lista, valor) {
    return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}
export class ConfiguradorStore extends Store {
    constructor() {
        super(ESTADO_INICIAL);
    }
    /** Precarga el material habitual del perfil. */
    desdePerfil(usuario) {
        this.fijar({ material: [...usuario.materialPorDefecto] });
    }
    /** Aplica la sugerencia del día (botón "usar"). El usuario puede retocarla. */
    desdeSugerencia(sugerencia) {
        this.fijar({
            focus: [...sugerencia.focus],
            nivelDia: sugerencia.nivelSugerido,
            enfasis: sugerencia.enfasis,
        });
    }
    /** Recarga una configuración guardada (pantalla "planes guardados"). */
    desdeConfig(cfg) {
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
    alternarFocus(tipo) {
        // Si el usuario retoca los enfoques, deja de aplicar el énfasis sugerido:
        // su elección manual prevalece sobre la sugerencia.
        this.fijar({ focus: alternar(this.obtener().focus, tipo), enfasis: null });
    }
    alternarMaterial(m) {
        this.fijar({ material: alternar(this.obtener().material, m) });
    }
    alternarMolestiaHoy(z) {
        this.fijar({ molestiasHoy: alternar(this.obtener().molestiasHoy, z) });
    }
    fijarNivelDia(nivel) {
        this.fijar({ nivelDia: nivel });
    }
    fijarZonaTrabajo(zona) {
        this.fijar({ zonaTrabajo: zona });
    }
    fijarBajoImpacto(activo) {
        this.fijar({ bajoImpacto: activo });
    }
    // Variantes "silenciosas": actualizan el estado sin repintar, para que el
    // chip/toggle anime en el sitio (la clase .on la cambia la vista).
    alternarFocusSil(tipo) { this.fijarSilencioso({ focus: alternar(this.obtener().focus, tipo), enfasis: null }); }
    alternarMaterialSil(m) { this.fijarSilencioso({ material: alternar(this.obtener().material, m) }); }
    alternarMolestiaHoySil(z) { this.fijarSilencioso({ molestiasHoy: alternar(this.obtener().molestiasHoy, z) }); }
    fijarNivelDiaSil(nivel) { this.fijarSilencioso({ nivelDia: nivel }); }
    fijarBajoImpactoSil(activo) { this.fijarSilencioso({ bajoImpacto: activo }); }
    fijarTiempos(t) {
        this.fijar(t);
    }
    /** Construye la ConfigSesion final uniendo perfil + elecciones del día. */
    configPara(usuario) {
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
            ...(PATRONES_POR_ZONA[s.zonaTrabajo] ? { patrones: [...PATRONES_POR_ZONA[s.zonaTrabajo]] } : {}),
            ...(s.enfasis ? { enfasis: s.enfasis } : {}),
        };
    }
    /**
     * Genera la sesión. Devuelve Resultado para que la UI muestre los avisos
     * del motor ("elige al menos un enfoque", "afloja filtros") tal cual.
     */
    generar(catalogo, usuario) {
        return generarSesion(catalogo, this.configPara(usuario));
    }
    /**
     * "Empezar rápido" desde Inicio: solo minutos, resto por defecto/perfil.
     * Sesión equilibrada con los tres enfoques.
     */
    static configRapida(usuario, minutos) {
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
