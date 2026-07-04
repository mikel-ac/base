/**
 * Utilidades de fecha. Todo trabaja con timestamps (milisegundos) y
 * devuelve claves de texto fáciles de agrupar:
 *  - claveDia:   "2026-07-02"  (día local del usuario)
 *  - semanaISO:  "2026-W27"    (semana ISO: lunes a domingo)
 */
const MS_DIA = 24 * 60 * 60 * 1000;
/** Clave de día en horario LOCAL (el usuario entrena en su zona horaria). */
export function claveDia(ts) {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dia}`;
}
/** Semana ISO 8601 (las semanas empiezan en lunes). Ej.: "2026-W27". */
export function semanaISO(ts) {
    const d = new Date(ts);
    // Trabajamos en UTC sobre la fecha local para evitar líos de zona horaria.
    const fecha = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const diaSemana = fecha.getUTCDay() || 7; // domingo=7
    fecha.setUTCDate(fecha.getUTCDate() + 4 - diaSemana); // jueves de esa semana
    const inicioAno = new Date(Date.UTC(fecha.getUTCFullYear(), 0, 1));
    const semana = Math.ceil(((fecha.getTime() - inicioAno.getTime()) / MS_DIA + 1) / 7);
    return `${fecha.getUTCFullYear()}-W${String(semana).padStart(2, "0")}`;
}
/**
 * Claves de las últimas N semanas ISO, de la más antigua a la más reciente,
 * terminando en la semana de `ahora`. Sirve para pintar el volumen semanal
 * rellenando con ceros las semanas sin sesiones.
 */
export function ultimasSemanasISO(ahora, n) {
    const semanas = [];
    for (let k = n - 1; k >= 0; k--) {
        semanas.push(semanaISO(ahora - k * 7 * MS_DIA));
    }
    return semanas;
}
