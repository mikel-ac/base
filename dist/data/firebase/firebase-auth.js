import { obtenerFirebase } from "./firebase-sdk.js";
/** ¿Estamos en una PWA instalada (standalone) en iOS/iPadOS? */
function esPwaEnIos() {
    const ua = navigator.userAgent || "";
    const esIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches ||
        navigator.standalone === true;
    return esIos && !!standalone;
}
/**
 * Procesa el resultado de un signInWithRedirect pendiente (tras volver de
 * Google). Se llama una vez al arrancar el observador. No hace nada si no
 * había redirección en curso.
 */
export async function procesarRedireccionPendiente() {
    const { auth, authApi } = await obtenerFirebase();
    try {
        await authApi.getRedirectResult(auth);
    }
    catch {
        /* sin redirección pendiente o ya procesada */
    }
}
/** Inicia sesión con Google. Devuelve el usuario, o null si se usó redirect. */
export async function iniciarSesionGoogle() {
    const { auth, authApi, provider } = await obtenerFirebase();
    if (esPwaEnIos()) {
        // Redirige: la página se recarga y vuelve autenticada; el resultado se
        // recoge en procesarRedireccionPendiente() al arrancar.
        await authApi.signInWithRedirect(auth, provider);
        return null;
    }
    try {
        const cred = await authApi.signInWithPopup(auth, provider);
        return cred.user;
    }
    catch (e) {
        // Si el popup falla (bloqueado, o iOS que no completa), intentamos redirect
        // como último recurso antes de rendirnos.
        const msg = e instanceof Error ? e.message : "";
        if (/popup/i.test(msg)) {
            await authApi.signInWithRedirect(auth, provider);
            return null;
        }
        throw e;
    }
}
export async function cerrarSesion() {
    const { auth, authApi } = await obtenerFirebase();
    await authApi.signOut(auth);
}
/**
 * Observa el usuario actual. Llama a `cb` con el usuario (o null) cada vez que
 * cambia el estado de sesión. Devuelve una función para dejar de observar.
 */
export async function observarUsuario(cb) {
    const { auth, authApi } = await obtenerFirebase();
    await procesarRedireccionPendiente();
    return authApi.onAuthStateChanged(auth, cb);
}
