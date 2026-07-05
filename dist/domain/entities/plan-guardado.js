/** ¿Es un entrenamiento fijo (diseñado a mano) en vez de un plan de config? */
export function esEntrenamientoFijo(p) {
    return p.fijo !== undefined;
}
