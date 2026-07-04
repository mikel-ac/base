import type { Material, Zona } from "./tipos.js";
/** Perfil local. Un dispositivo tiene al menos uno; puede haber varios si se comparte. */
export interface Usuario {
    id: string;
    nombre: string;
    /** Nivel continuo de intensidad, 1.0–3.0 (§7). Elige las variantes. */
    nivel: number;
    /** Sesiones/semana como guía amable, no obligación. */
    objetivoSemanal: number;
    /** Zonas a excluir SIEMPRE (se unen con las molestias puntuales del día). */
    molestiasPermanentes: Zona[];
    /** Material que suele tener disponible (precarga el configurador). */
    materialPorDefecto: Material[];
    onboardingHecho: boolean;
    creadoEn: number;
}
