/**
 * CONFIGURACIÓN DE FIREBASE (proyecto "base-f43ec").
 *
 * Estos valores NO son secretos: viajan en el JavaScript público de la web de
 * todas formas. La seguridad real está en las REGLAS de Firestore (quién puede
 * leer/escribir qué), no en ocultar esta config. Ver reglas al final del
 * archivo firebase-sync.ts o en la consola de Firebase.
 *
 * Login elegido: SOLO Google (con email como plan B si el iPhone diera guerra).
 * Catálogo compartido editable SOLO por el UID del dueño (los demás solo leen).
 */
export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCkArATBebVHX0iggqBiknRq-VCZG6R1Oo",
    authDomain: "base-f43ec.firebaseapp.com",
    projectId: "base-f43ec",
    storageBucket: "base-f43ec.firebasestorage.app",
    messagingSenderId: "178410924182",
    appId: "1:178410924182:web:391d045d4803b105c0fab7",
};
/** Versión del SDK de Firebase que cargamos desde el CDN de gstatic. */
export const FIREBASE_SDK_VERSION = "10.14.1";
