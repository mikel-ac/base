import { crearApp } from "../app.js";
import { cargarCatalogo } from "../data/seed/cargar-catalogo.js";
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
import { montarGestor } from "./vista-gestor.js";
import { montarDisenador } from "./vista-disenador.js";
import { observarUsuario } from "../data/firebase/firebase-auth.js";
import { leerRegistroPendiente } from "./registro-pendiente.js";
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
        // El catálogo se lee en vivo en cada acceso (ver Ctx): así las vistas ven
        // siempre los ejercicios propios y los que llegan por sincronización.
        const ctx = {
            app,
            get catalogo() {
                return cargarCatalogo();
            },
            raiz,
        };
        const nav = {
            aInicio: () => cambiar(() => montarInicio(ctx, nav)),
            aConfigurador: () => cambiar(() => montarConfigurador(ctx, nav)),
            aHistorial: () => cambiar(() => montarHistorial(ctx, nav)),
            aPlanes: () => cambiar(() => montarPlanes(ctx, nav)),
            aProgreso: () => cambiar(() => montarProgreso(ctx, nav)),
            aAjustes: () => cambiar(() => montarAjustes(ctx, nav)),
            aGestor: () => cambiar(() => montarGestor(ctx, nav)),
            aDisenador: (plan) => cambiar(() => montarDisenador(ctx, nav, plan)),
            aSesion: (plan, estado) => cambiar(() => montarSesion(ctx, nav, plan, estado)),
            aRegistrar: (plan) => cambiar(() => montarRegistrar(ctx, nav, plan)),
        };
        // Si quedó una sesión terminada sin registrar (p. ej. la app se recargó
        // mientras anotabas), vuelve a la pantalla de registro con lo que hubiera,
        // en vez de perderlo e ir a Inicio.
        const pendiente = leerRegistroPendiente();
        if (pendiente)
            nav.aRegistrar(pendiente.plan);
        else
            nav.aInicio();
        // Observador de sesión de Firebase: si ya había sesión (o el usuario entra
        // luego), el SyncService sincroniza. Es perezoso y no bloquea el arranque;
        // si Firebase no carga (sin conexión la 1ª vez, bloqueadores…), la app
        // sigue funcionando en local sin enterarse.
        void (async () => {
            try {
                await observarUsuario((user) => {
                    void app.sync.fijarUsuario(user);
                });
            }
            catch {
                /* Firebase no disponible: modo local */
            }
        })();
    }
    catch (e) {
        raiz.innerHTML = `<p class="cargando">${esc(e instanceof Error ? e.message : "No se pudo arrancar la app.")}</p>`;
    }
}
void arrancar();
