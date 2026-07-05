export interface MediaUsuario {
    id: string;
    tipo: "imagen" | "video";
    blob: Blob;
}
export declare function guardarMediaUsuario(id: string, tipo: "imagen" | "video", blob: Blob): Promise<void>;
export declare function obtenerMediaUsuario(id: string): Promise<MediaUsuario | null>;
export declare function borrarMediaUsuario(id: string): Promise<void>;
/** Devuelve una URL usable en <img>/<video> para el medio propio, o null. */
export declare function urlMediaUsuario(id: string): Promise<{
    tipo: "imagen" | "video";
    url: string;
} | null>;
export declare function exportarMedios(): Promise<Record<string, {
    tipo: string;
    datos: string;
}>>;
export declare function importarMedios(obj: Record<string, {
    tipo: string;
    datos: string;
}>): Promise<void>;
