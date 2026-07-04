/** Limita un número al rango [min, max]. */
export function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}
/** Redondea a 2 decimales (para que el nivel no acumule decimales infinitos). */
export function redondear2(n) {
    return Math.round(n * 100) / 100;
}
/** Identificador único local (no hace falta nada más sofisticado sin nube). */
export function uuid() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    // Repuesto por si el entorno no tiene crypto.randomUUID (muy raro hoy).
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}
export const rngPorDefecto = Math.random;
/** RNG determinista (algoritmo mulberry32): misma semilla → misma secuencia. */
export function crearRngConSemilla(semilla) {
    let a = semilla >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
/** Devuelve una copia barajada del array (Fisher–Yates). No modifica el original. */
export function barajar(arr, rng) {
    const copia = [...arr];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const a = copia[i];
        copia[i] = copia[j];
        copia[j] = a;
    }
    return copia;
}
