/** Rutas candidatas de clip propio, en orden de preferencia. */
export function candidatosClip(ejercicioId) {
    return [`media/${ejercicioId}.mp4`, `media/${ejercicioId}.gif`];
}
export async function resolverMedia(e, sonda) {
    // 0) URL explícita fijada por el usuario en el Gestor (se sincroniza como
    //    texto a todos los dispositivos). Tiene prioridad sobre el autodescubrimiento.
    const url = e.urlMedia?.trim();
    if (url)
        return { tipo: "clip", src: url };
    for (const src of candidatosClip(e.id)) {
        if (await sonda.existe(src))
            return { tipo: "clip", src };
    }
    const conContenido = e.images.filter((m) => m.src || m.svg);
    if (conContenido.length > 0)
        return { tipo: "galeria", medios: conContenido };
    return { tipo: "marcador", label: e.nombre };
}
