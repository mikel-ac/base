const CLAVE = "base.ejercicios_override";
export function leerOverrides() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE) ?? "{}");
    }
    catch {
        return {};
    }
}
export function guardarOverride(id, ov) {
    const todos = leerOverrides();
    const combinado = { ...todos[id], ...ov };
    Object.keys(combinado).forEach((k) => {
        const v = combinado[k];
        if (v === undefined || v === "" || v === null)
            delete combinado[k];
    });
    if (Object.keys(combinado).length === 0)
        delete todos[id];
    else
        todos[id] = combinado;
    try {
        localStorage.setItem(CLAVE, JSON.stringify(todos));
    }
    catch {
        /* almacenamiento no disponible */
    }
}
/** Aplica las modificaciones del usuario sobre el catálogo base. */
export function aplicarOverrides(ejercicios) {
    const ov = leerOverrides();
    return ejercicios.map((e) => {
        const o = ov[e.id];
        if (!o)
            return e;
        return {
            ...e,
            ...(o.nombre ? { nombre: o.nombre } : {}),
            ...(o.consejo !== undefined ? { consejo: o.consejo } : {}),
            ...(o.notas !== undefined ? { notas: o.notas } : {}),
            ...(o.zonaTrabajo ? { zonaTrabajo: o.zonaTrabajo } : {}),
            ...(o.parejaId ? { parejaId: o.parejaId } : {}),
            ...(o.porLados !== undefined ? { porLados: o.porLados } : {}),
            ...(o.claves ? { claves: o.claves } : {}),
            ...(o.tipo ? { tipo: o.tipo } : {}),
        };
    });
}
const ZONA_DE_PATRON = {
    empuje: "tren_superior",
    tiron: "tren_superior",
    pierna: "pierna_gluteo",
    core: "core",
    cardio: "global",
    movilidad: "movilidad",
    calentamiento: "global",
};
/** Zona de trabajo efectiva: la que fijó el usuario, o la derivada del patrón. */
export function zonaTrabajoDe(e) {
    return e.zonaTrabajo ?? ZONA_DE_PATRON[e.patron];
}
