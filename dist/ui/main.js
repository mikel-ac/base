import { crearApp } from "../app.js";
import { esc } from "./comunes.js";
import { aplicarTema, temaActual } from "./tema.js";
import { montarConfigurador } from "./vista-configurador.js";
import { montarHistorial } from "./vista-historial.js";
import { montarInicio } from "./vista-inicio.js";
import { montarPlanes } from "./vista-planes.js";
import { montarAjustes } from "./vista-ajustes.js";
import { montarProgreso } from "./vista-progreso.js";
import { montarRegistrar } from "./vista-registrar.js";
import { montarSesion } from "./vista-sesion.js";
const raiz = document.getElementById("app");
let limpiar = null;
function cambiar(montar) {
    limpiar?.();
    window.scrollTo(0, 0);
    limpiar = montar();
}
async function arrancar() {
    aplicarTema(temaActual()); // por si el guion del index no pudo ejecutarse
    try {
        const app = await crearApp();
        const catalogo = await app.repos.ejercicios.todos();
        const ctx = { app, catalogo, raiz };
        const nav = {
            aInicio: () => cambiar(() => montarInicio(ctx, nav)),
            aConfigurador: () => cambiar(() => montarConfigurador(ctx, nav)),
            aHistorial: () => cambiar(() => montarHistorial(ctx, nav)),
            aPlanes: () => cambiar(() => montarPlanes(ctx, nav)),
            aProgreso: () => cambiar(() => montarProgreso(ctx, nav)),
            aAjustes: () => cambiar(() => montarAjustes(ctx, nav)),
            aSesion: (plan) => cambiar(() => montarSesion(ctx, nav, plan)),
            aRegistrar: (plan) => cambiar(() => montarRegistrar(ctx, nav, plan)),
        };
        nav.aInicio();
    }
    catch (e) {
        raiz.innerHTML = `<p class="cargando">${esc(e instanceof Error ? e.message : "No se pudo arrancar la app.")}</p>`;
    }
}
void arrancar();
