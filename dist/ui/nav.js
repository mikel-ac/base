const PESTANAS = [
    { clave: "inicio", texto: "Inicio", icono: "▲" },
    { clave: "historial", texto: "Historial", icono: "≡" },
    { clave: "planes", texto: "Planes", icono: "◫" },
    { clave: "ajustes", texto: "Ajustes", icono: "⚙︎" },
];
export function htmlNav(activa) {
    const botones = PESTANAS.map((p) => `<button data-nav="${p.clave}" class="${p.clave === activa ? "on" : ""}"><span class="tab-ic">${p.icono}</span>${p.texto}</button>`).join("");
    return `<nav class="tabs" aria-label="Navegación principal">${botones}</nav>`;
}
/** Devuelve true si el toque era de navegación (y ya está gestionado). */
export function manejarNav(boton, navegacion, activa) {
    const destino = boton.dataset["nav"];
    if (!destino)
        return false;
    if (destino === activa)
        return true;
    switch (destino) {
        case "inicio":
            navegacion.aInicio();
            break;
        case "historial":
            navegacion.aHistorial();
            break;
        case "planes":
            navegacion.aPlanes();
            break;
        case "ajustes":
            navegacion.aAjustes();
            break;
        case "progreso":
            navegacion.aProgreso();
            break;
    }
    return true;
}
