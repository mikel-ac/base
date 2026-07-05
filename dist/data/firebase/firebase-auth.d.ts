import { type User } from "./firebase-sdk.js";
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
/**
 * Procesa el resultado de un signInWithRedirect pendiente (tras volver de
 * Google). Se llama una vez al arrancar el observador. No hace nada si no
 * había redirección en curso.
 */
export declare function procesarRedireccionPendiente(): Promise<void>;
/** Inicia sesión con Google. Devuelve el usuario, o null si se usó redirect. */
export declare function iniciarSesionGoogle(): Promise<User | null>;
export declare function cerrarSesion(): Promise<void>;
/**
 * Observa el usuario actual. Llama a `cb` con el usuario (o null) cada vez que
 * cambia el estado de sesión. Devuelve una función para dejar de observar.
 */
export declare function observarUsuario(cb: (user: User | null) => void): Promise<() => void>;
