/**
 * MEDIOS PROPIOS DEL USUARIO (imágenes/vídeos subidos desde el Gestor).
 * Se guardan como Blob en IndexedDB (en este dispositivo), porque pueden ser
 * pesados y no caben en localStorage. Tienen PRIORIDAD sobre las imágenes del
 * catálogo: si el usuario sube algo para un ejercicio, es lo que se muestra.
 * Nota: al ser local, viven en este navegador; sincronizar entre dispositivos
 * será un paso aparte (Drive/Firebase/export), como el resto de datos locales.
 */
const DB = "base-media";
const STORE = "medios";
function abrir() {
    return new Promise((res, rej) => {
        const req = indexedDB.open(DB, 1);
        req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains(STORE))
                req.result.createObjectStore(STORE, { keyPath: "id" });
        };
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
    });
}
export async function guardarMediaUsuario(id, tipo, blob) {
    const db = await abrir();
    try {
        await new Promise((res, rej) => {
            const tx = db.transaction(STORE, "readwrite");
            tx.objectStore(STORE).put({ id, tipo, blob });
            tx.oncomplete = () => res();
            tx.onerror = () => rej(tx.error);
        });
    }
    finally {
        db.close();
    }
}
export async function obtenerMediaUsuario(id) {
    const db = await abrir();
    try {
        return await new Promise((res, rej) => {
            const tx = db.transaction(STORE, "readonly");
            const req = tx.objectStore(STORE).get(id);
            req.onsuccess = () => res(req.result ?? null);
            req.onerror = () => rej(req.error);
        });
    }
    finally {
        db.close();
    }
}
export async function borrarMediaUsuario(id) {
    const db = await abrir();
    try {
        await new Promise((res, rej) => {
            const tx = db.transaction(STORE, "readwrite");
            tx.objectStore(STORE).delete(id);
            tx.oncomplete = () => res();
            tx.onerror = () => rej(tx.error);
        });
    }
    finally {
        db.close();
    }
}
/** Devuelve una URL usable en <img>/<video> para el medio propio, o null. */
export async function urlMediaUsuario(id) {
    const m = await obtenerMediaUsuario(id).catch(() => null);
    if (!m)
        return null;
    return { tipo: m.tipo, url: URL.createObjectURL(m.blob) };
}
