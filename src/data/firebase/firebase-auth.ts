import { obtenerFirebase, type User } from "./firebase-sdk.js";

/**
 * AUTENTICACIÓN. Solo Google (decisión del proyecto). Expone iniciar/cerrar
 * sesión y un observador del usuario actual.
 *
 * iPhone / PWA instalada: el popup de Google a veces no completa el retorno
 * dentro de una PWA a pantalla completa en iOS. Por eso, cuando detectamos ese
 * caso, usamos signInWithRedirect (recarga la página y vuelve autenticado) en
 * lugar de signInWithPopup. En el resto de casos, el popup es más cómodo.
 */

export type { User };

/** ¿Estamos en una PWA instalada (standalone) en iOS/iPadOS? */
function esPwaEnIos(): boolean {
  const ua = navigator.userAgent || "";
  const esIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return esIos && !!standalone;
}

/**
 * Procesa el resultado de un signInWithRedirect pendiente (tras volver de
 * Google). Se llama una vez al arrancar el observador. No hace nada si no
 * había redirección en curso.
 */
export async function procesarRedireccionPendiente(): Promise<void> {
  const { auth, authApi } = await obtenerFirebase();
  try {
    await authApi.getRedirectResult(auth);
  } catch {
    /* sin redirección pendiente o ya procesada */
  }
}

/** Inicia sesión con Google. Devuelve el usuario, o null si se usó redirect. */
export async function iniciarSesionGoogle(): Promise<User | null> {
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
  } catch (e) {
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

export async function cerrarSesion(): Promise<void> {
  const { auth, authApi } = await obtenerFirebase();
  await authApi.signOut(auth);
}

/**
 * Observa el usuario actual. Llama a `cb` con el usuario (o null) cada vez que
 * cambia el estado de sesión. Devuelve una función para dejar de observar.
 */
export async function observarUsuario(cb: (user: User | null) => void): Promise<() => void> {
  const { auth, authApi } = await obtenerFirebase();
  await procesarRedireccionPendiente();
  return authApi.onAuthStateChanged(auth, cb);
}
