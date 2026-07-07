const PESTANAS = [
    { clave: "inicio", texto: "Inicio", icono: "▲" },
    { clave: "historial", texto: "Historial", icono: "≡" },
    { clave: "planes", texto: "Planes", icono: "◫" },
    { clave: "progreso", texto: "Progreso", icono: "◔" },
];
let pestanaAnterior = null;
export function htmlNav(activa) {
    const botones = PESTANAS.map((p) => `<button data-nav="${p.clave}" class="${p.clave === activa ? "on" : ""}"><span class="tab-ic">${p.icono}</span>${p.texto}</button>`).join("");
    return `<nav class="tabs" aria-label="Navegación principal">${botones}</nav>`;
}
/** Llamar tras pintar una pantalla con nav: coloca y desliza el indicador. */
export function activarIndicador(raiz, activa) {
    const tabs = raiz.querySelector(".tabs");
    const indicador = raiz.querySelector(".tab-ind");
    if (!tabs || !indicador)
        return;
    const mover = (clave, animar) => {
        const boton = tabs.querySelector(`[data-nav="${clave}"]`);
        if (!boton)
            return;
        if (!animar)
            indicador.style.transition = "none";
        indicador.style.left = `${boton.offsetLeft}px`;
        indicador.style.width = `${boton.offsetWidth}px`;
        if (!animar) {
            void indicador.offsetWidth; // forzar el repintado antes de reactivar
            indicador.style.transition = "";
        }
    };
    // Arrancar donde estaba la pestaña anterior y deslizar hasta la actual.
    const desde = pestanaAnterior ?? activa;
    requestAnimationFrame(() => {
        mover(desde, false);
        if (desde !== activa)
            requestAnimationFrame(() => mover(activa, true));
    });
    pestanaAnterior = activa;
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
        case "progreso":
            navegacion.aProgreso();
            break;
    }
    return true;
}
