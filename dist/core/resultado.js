export function ok(valor) {
    return { ok: true, valor };
}
export function fallo(error) {
    return { ok: false, error };
}
