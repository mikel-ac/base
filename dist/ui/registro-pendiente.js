/**
 * REGISTRO PENDIENTE.
 *
 * Al terminar una sesión, el usuario pasa a la pantalla "¿Qué tal la sesión?"
 * para anotar valoración/notas/kcal. Ese momento es frágil: en móvil (sobre
 * todo iOS/PWA) la app puede recargarse mientras se escribe, y antes se perdía
 * todo y volvía a Inicio.
 *
 * Para evitarlo, persistimos aquí un "registro pendiente" (el plan terminado +
 * lo que se lleve escrito). Mientras exista, al arrancar la app se vuelve a la
 * pantalla de registro con los datos recuperados. Solo se borra cuando el
 * usuario GUARDA en el historial o DESCARTA explícitamente. Nada se guarda por
 * su cuenta.
 */
const CLAVE = "base.registro_pendiente";
export function leerRegistroPendiente() {
    try {
        const raw = localStorage.getItem(CLAVE);
        if (!raw)
            return null;
        const d = JSON.parse(raw);
        if (!d || !d.plan)
            return null;
        return d;
    }
    catch {
        return null;
    }
}
export function guardarRegistroPendiente(reg) {
    try {
        localStorage.setItem(CLAVE, JSON.stringify(reg));
    }
    catch {
        /* almacenamiento lleno o no disponible: se seguirá en memoria */
    }
}
export function borrarRegistroPendiente() {
    try {
        localStorage.removeItem(CLAVE);
    }
    catch {
        /* nada */
    }
}
