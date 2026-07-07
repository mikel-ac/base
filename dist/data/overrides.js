const CLAVE = "base.ejercicios_override";
const CLAVE_ANADIDOS = "base.ejercicios_anadidos";
const CLAVE_BORRADOS = "base.ejercicios_borrados";
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
export function leerAnadidos() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE_ANADIDOS) ?? "[]");
    }
    catch {
        return [];
    }
}
function guardarAnadidos(lista) {
    try {
        localStorage.setItem(CLAVE_ANADIDOS, JSON.stringify(lista));
    }
    catch { /* nada */ }
}
export function leerBorrados() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE_BORRADOS) ?? "[]");
    }
    catch {
        return [];
    }
}
export function esAnadido(id) {
    return leerAnadidos().some((e) => e.id === id);
}
export function patronDesde(tipo, zona) {
    if (tipo === "calentamiento")
        return "calentamiento";
    if (tipo === "cardio")
        return "cardio";
    if (tipo === "movilidad")
        return "movilidad";
    if (zona === "core")
        return "core";
    if (zona === "pierna_gluteo")
        return "pierna";
    if (zona === "tren_superior")
        return "empuje";
    return "core";
}
export function crearEjercicioUsuario(datos) {
    const id = "user_" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    const ej = {
        id,
        nombre: datos.nombre,
        tipo: datos.tipo,
        patron: patronDesde(datos.tipo, datos.zonaTrabajo),
        musculos: [],
        materiales: datos.materiales ?? [],
        impacto: "bajo",
        dumbbellReady: false,
        variantes: [{ nivel: 2, nombre: "Estándar", cue: datos.consejo ?? "" }],
        claves: datos.claves ?? [],
        evita: "",
        consejo: datos.consejo ?? "",
        joints: [],
        images: [],
        zonaTrabajo: datos.zonaTrabajo,
        porLados: datos.porLados ?? false,
    };
    const lista = leerAnadidos();
    lista.push(ej);
    guardarAnadidos(lista);
    return ej;
}
export function actualizarAnadido(ej) {
    guardarAnadidos(leerAnadidos().map((x) => (x.id === ej.id ? ej : x)));
}
export function eliminarEjercicio(id) {
    if (esAnadido(id)) {
        guardarAnadidos(leerAnadidos().filter((e) => e.id !== id));
    }
    else {
        const b = new Set(leerBorrados());
        b.add(id);
        try {
            localStorage.setItem(CLAVE_BORRADOS, JSON.stringify([...b]));
        }
        catch { /* nada */ }
    }
    const ov = leerOverrides();
    if (ov[id]) {
        delete ov[id];
        try {
            localStorage.setItem(CLAVE, JSON.stringify(ov));
        }
        catch { /* nada */ }
    }
}
export function aplicarOverrides(ejercicios) {
    const ov = leerOverrides();
    const borrados = new Set(leerBorrados());
    const anadidos = leerAnadidos();
    const todos = [...ejercicios, ...anadidos].filter((e) => !borrados.has(e.id));
    return todos.map((e) => {
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
            ...(o.materiales ? { materiales: o.materiales } : {}),
            ...(o.urlMedia !== undefined ? { urlMedia: o.urlMedia } : {}),
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
export function exportarTextos() {
    return { overrides: leerOverrides(), anadidos: leerAnadidos(), borrados: leerBorrados() };
}
export function importarTextos(d) {
    if (d.overrides)
        try {
            localStorage.setItem(CLAVE, JSON.stringify(d.overrides));
        }
        catch { /* nada */ }
    if (d.anadidos)
        try {
            localStorage.setItem(CLAVE_ANADIDOS, JSON.stringify(d.anadidos));
        }
        catch { /* nada */ }
    if (d.borrados)
        try {
            localStorage.setItem(CLAVE_BORRADOS, JSON.stringify(d.borrados));
        }
        catch { /* nada */ }
}
