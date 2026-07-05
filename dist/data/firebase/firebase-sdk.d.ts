import type { Auth, User } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import type { Firestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
export type { User };
export interface ServiciosFirebase {
    auth: Auth;
    db: Firestore;
    authApi: typeof import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js");
    dbApi: typeof import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js");
    provider: import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js").GoogleAuthProvider;
}
/**
 * Carga e inicializa Firebase una sola vez (memoizado). Lanza si el navegador
 * no puede descargar el SDK (sin conexión la primera vez, bloqueadores, etc.);
 * quien llama debe capturarlo y seguir en modo local.
 */
export declare function obtenerFirebase(): Promise<ServiciosFirebase>;
