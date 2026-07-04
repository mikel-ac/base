/**
 * Utilidades de fecha. Todo trabaja con timestamps (milisegundos) y
 * devuelve claves de texto fáciles de agrupar:
 *  - claveDia:   "2026-07-02"  (día local del usuario)
 *  - semanaISO:  "2026-W27"    (semana ISO: lunes a domingo)
 */
/** Clave de día en horario LOCAL (el usuario entrena en su zona horaria). */
export declare function claveDia(ts: number): string;
/** Semana ISO 8601 (las semanas empiezan en lunes). Ej.: "2026-W27". */
export declare function semanaISO(ts: number): string;
/**
 * Claves de las últimas N semanas ISO, de la más antigua a la más reciente,
 * terminando en la semana de `ahora`. Sirve para pintar el volumen semanal
 * rellenando con ceros las semanas sin sesiones.
 */
export declare function ultimasSemanasISO(ahora: number, n: number): string[];
