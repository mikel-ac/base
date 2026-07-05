import { FIREBASE_CONFIG, FIREBASE_SDK_VERSION } from "./firebase-config.js";
import type {
  Auth,
  User,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import type {
  Firestore,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/**
 * FACADE DEL SDK DE FIREBASE. Único archivo que sabe cómo se carga Firebase
 * (importaciones dinámicas desde el CDN de gstatic, sin npm ni bundler).
 * Aísla el SDK igual que indexeddb.ts aísla IndexedDB: el resto de la app usa
 * los servicios que devuelve aquí, sin importar el SDK directamente.
 *
 * La carga es PEREZOSA: el SDK solo se descarga la primera vez que se pide
 * (al abrir Ajustes o al iniciar sesión), no en el arranque de la app. Así la
 * app sigue arrancando al instante y funcionando sin conexión ni cuenta.
 */

const BASE = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;

export type { User };

export interface ServiciosFirebase {
  auth: Auth;
  db: Firestore;
  // Funciones del SDK que necesita la capa de sync, ya cargadas:
  authApi: typeof import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js");
  dbApi: typeof import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js");
  provider: import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js").GoogleAuthProvider;
}

let cache: Promise<ServiciosFirebase> | null = null;

/**
 * Carga e inicializa Firebase una sola vez (memoizado). Lanza si el navegador
 * no puede descargar el SDK (sin conexión la primera vez, bloqueadores, etc.);
 * quien llama debe capturarlo y seguir en modo local.
 */
export function obtenerFirebase(): Promise<ServiciosFirebase> {
  if (cache) return cache;
  cache = (async () => {
    const appApi = await import(`${BASE}/firebase-app.js`);
    const authApi = await import(`${BASE}/firebase-auth.js`);
    const dbApi = await import(`${BASE}/firebase-firestore.js`);

    const app = appApi.initializeApp({ ...FIREBASE_CONFIG });
    const auth = authApi.getAuth(app);
    const db = dbApi.getFirestore(app);
    const provider = new authApi.GoogleAuthProvider();
    // Fuerza el selector de cuenta (evita entrar con la cuenta equivocada
    // en dispositivos compartidos).
    provider.setCustomParameters({ prompt: "select_account" });

    return { auth, db, authApi, dbApi, provider };
  })();
  return cache;
}
