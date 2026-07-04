/** Rutas candidatas de clip propio, en orden de preferencia. */
export function candidatosClip(ejercicioId) {
    return [`media/${ejercicioId}.mp4`, `media/${ejercicioId}.gif`];
}
export async function resolverMedia(e, sonda) {
    for (const src of candidatosClip(e.id)) {
        if (await sonda.existe(src))
            return { tipo: "clip", src };
    }
    const conContenido = e.images.filter((m) => m.src || m.svg);
    if (conContenido.length > 0)
        return { tipo: "galeria", medios: conContenido };
    return { tipo: "marcador", label: e.nombre };
}
