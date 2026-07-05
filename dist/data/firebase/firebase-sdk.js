import { FIREBASE_CONFIG, FIREBASE_SDK_VERSION } from "./firebase-config.js";
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
let cache = null;
/**
 * Carga e inicializa Firebase una sola vez (memoizado). Lanza si el navegador
 * no puede descargar el SDK (sin conexión la primera vez, bloqueadores, etc.);
 * quien llama debe capturarlo y seguir en modo local.
 */
export function obtenerFirebase() {
    if (cache)
        return cache;
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
