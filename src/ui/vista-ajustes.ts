import type { Usuario } from "../domain/entities/usuario.js";
import type { Zona } from "../domain/entities/tipos.js";
import { TODAS_ZONAS } from "../domain/entities/tipos.js";
import { clamp } from "../core/util.js";
import { animarEntrada, aviso, esc } from "./comunes.js";
import type { Ctx, Nav } from "./main.js";
import { fijarTema, temaActual, type Tema } from "./tema.js";
import { iniciarSesionGoogle, cerrarSesion, type User } from "../data/firebase/firebase-auth.js";
import type { EstadoSync } from "../data/firebase/sync-service.js";

/**
 * PANTALLA DE AJUSTES / PERFIL (guía §7): nombre, objetivo semanal,
 * molestias permanentes y Apariencia (Sistema / Claro / Oscuro).
 * Los cambios se guardan al momento, sin botón de guardar: es un perfil
 * local, no un formulario. El tema se persiste en el dispositivo y la
 * elección manual manda sobre el modo del sistema.
 */

const ETIQUETA_ZONA: Record<Zona, string> = {
  hombro: "Hombro",
  muneca: "Muñeca",
  codo: "Codo",
  rodilla: "Rodilla",
  tobillo: "Tobillo",
  gemelo: "Gemelo",
  lumbar: "Lumbar",
  cuello: "Cuello",
};

export function montarAjustes(ctx: Ctx, nav: Nav): () => void {
  const { raiz, app } = ctx;
  let usuario: Usuario | null = null;
  let animado = false;

  // Estado del bloque "Cuenta y sincronización".
  let user: User | null = app.sync.obtenerUsuario();
  let estadoSync: EstadoSync = app.sync.obtenerEstado();
  const desuscribirSync = app.sync.suscribirEstado((e) => {
    estadoSync = e;
    user = app.sync.obtenerUsuario();
    actualizarBloqueCuenta();
  });

  raiz.classList.add("sin-nav");

  // ---------- Bloque "Cuenta y sincronización" ----------
  const ESTADO_TEXTO: Record<EstadoSync, string> = {
    desconectado: "",
    sincronizando: "Sincronizando…",
    sincronizado: "Sincronizado",
    sin_conexion: "Sin conexión · se sincroniza al volver",
    error: "No se pudo sincronizar ahora",
  };

  function hace(ts: number | null): string {
    if (!ts) return "";
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 60) return " · hace un momento";
    const m = Math.round(s / 60);
    if (m < 60) return ` · hace ${m} min`;
    const h = Math.round(m / 60);
    return ` · hace ${h} h`;
  }

  function htmlBloqueCuenta(): string {
    if (!user) {
      return `
        <p class="hint" style="margin-top:0">Entra para tener tu historial, ajustes y entrenamientos en todos tus dispositivos.</p>
        <button class="btn wide g-signin" data-accion="login">
          <span class="g-logo" aria-hidden="true">G</span> Continuar con Google
        </button>
        <p class="hint">Sin cuenta la app funciona igual, solo en este dispositivo.</p>`;
    }
    const nombre = esc(user.displayName ?? "Tu cuenta");
    const email = esc(user.email ?? "");
    const inicial = (user.displayName ?? user.email ?? "?").charAt(0).toUpperCase();
    const estadoTxt = ESTADO_TEXTO[estadoSync] || "Conectado";
    const cuando = estadoSync === "sincronizado" ? hace(app.sync.obtenerUltimaSync()) : "";
    const uidCorto = user.uid.length > 12 ? `${user.uid.slice(0, 6)}…${user.uid.slice(-4)}` : user.uid;
    const claseEstado =
      estadoSync === "sincronizado" ? "ok" : estadoSync === "error" ? "err" : "neutro";
    return `
      <div class="cuenta-fila">
        <div class="avatar">${esc(inicial)}</div>
        <div style="min-width:0">
          <div class="nm">${nombre}</div>
          <div class="hint" style="margin:0">${email}</div>
        </div>
      </div>
      <div class="sync-estado ${claseEstado}">${esc(estadoTxt + cuando)}
        <button class="link" data-accion="sync-ahora" style="margin-left:auto;padding:0 4px">Sincronizar</button>
      </div>
      <div class="uid-fila">
        <span class="hint" style="margin:0">UID</span>
        <code class="uid">${esc(uidCorto)}</code>
        <button class="link" data-accion="copiar-uid" style="margin-left:auto;padding:0 4px">Copiar</button>
      </div>
      <p class="hint">El UID es lo que pega en las reglas de Firestore para poder editar el catálogo común.</p>
      <button class="btn wide" data-accion="logout" style="color:var(--danger-ink);border-color:var(--danger-soft);margin-top:6px">Cerrar sesión</button>`;
  }

  /** Texto corto para el summary plegado (a la derecha del título). */
  function miniEstadoCuenta(): string {
    if (!user) return "Entrar";
    if (estadoSync === "sincronizado") return "Sincronizado";
    if (estadoSync === "sincronizando") return "Sincronizando…";
    if (estadoSync === "sin_conexion") return "Sin conexión";
    if (estadoSync === "error") return "Error";
    return esc(user.displayName ?? "Conectado");
  }

  function actualizarBloqueCuenta(): void {
    const cont = raiz.querySelector<HTMLElement>("#bloque-cuenta-inner");
    if (cont) cont.innerHTML = htmlBloqueCuenta();
    const mini = raiz.querySelector<HTMLElement>("#cuenta-mini");
    if (mini) mini.textContent = miniEstadoCuenta();
  }

  async function guardar(cambios: Partial<Usuario>): Promise<void> {
    if (!usuario) return;
    usuario = { ...usuario, ...cambios };
    try {
      await app.repos.usuarios.guardar(usuario);
    } catch {
      aviso("No se pudo guardar el cambio.");
    }
    pintar();
  }

  function pintar(): void {
    if (!usuario) return;
    const u = usuario;
    const tema = temaActual();

    const chipsMolestias = TODAS_ZONAS.map(
      (z) =>
        `<button class="chip ${u.molestiasPermanentes.includes(z) ? "on" : ""}" data-zona="${z}">${ETIQUETA_ZONA[z]}</button>`
    ).join("");

    const segTema = (["sistema", "claro", "oscuro"] as Tema[])
      .map(
        (t) =>
          `<button data-tema="${t}" class="${tema === t ? "on" : ""}">${t.charAt(0).toUpperCase() + t.slice(1)}</button>`
      )
      .join("");

    raiz.innerHTML = `
      <button class="back" data-accion="volver">← Inicio</button>
      <h1 class="scr-title">Ajustes</h1>

      <div>
        <p class="lbl">Perfil</p>
        <label class="campo">
          <input id="nombre" class="field" type="text" value="${esc(u.nombre === "Yo" ? "" : u.nombre)}" placeholder="Tu nombre" autocomplete="off" />
        </label>
        <div class="frow">
          <div>
            <div class="nm">Objetivo semanal</div>
            <div class="hint">sesiones por semana, como guía amable</div>
          </div>
          <div class="stp">
            <button data-objetivo="-1" aria-label="Menos sesiones">−</button>
            <span class="v">${u.objetivoSemanal}</span>
            <button data-objetivo="+1" aria-label="Más sesiones">+</button>
          </div>
        </div>
      </div>

      <details class="cuenta-plegable">
        <summary>
          <span>Cuenta y sincronización</span>
          <span class="estado-mini" id="cuenta-mini">${miniEstadoCuenta()}</span>
        </summary>
        <div id="bloque-cuenta-inner">${htmlBloqueCuenta()}</div>
      </details>

      <div>
        <p class="lbl">Molestias permanentes</p>
        <div class="chips">${chipsMolestias}</div>
        <p class="hint">Se excluirán siempre de todas las sesiones, sin tener que marcarlas cada día.</p>
      </div>

      <div>
        <p class="lbl">Apariencia</p>
        <div class="seg">${segTema}</div>
        <p class="hint">"Sistema" sigue el modo claro/oscuro de tu dispositivo automáticamente.</p>
      </div>

      <div>
        <p class="lbl">Ejercicios</p>
        <button class="btn wide" data-accion="gestor">Gestor de ejercicios</button>
        <p class="hint">Editar ejercicios: notas, explicación, zona de trabajo y parejas.</p>
      </div>
    `;

    if (!animado) {
      animado = true;
      animarEntrada(raiz);
    }

    // El nombre se guarda al terminar de escribir (al salir del campo).
    const campoNombre = raiz.querySelector<HTMLInputElement>("#nombre");
    campoNombre?.addEventListener("change", () => {
      void guardar({ nombre: campoNombre.value.trim() === "" ? "Yo" : campoNombre.value.trim() });
    });
  }

  function alPulsar(ev: Event): void {
    const boton = (ev.target as HTMLElement).closest<HTMLElement>("button");
    if (!boton || !usuario) return;
    const u = usuario;
    const d = boton.dataset;

    if (d["accion"] === "volver") return nav.aInicio();
    if (d["accion"] === "gestor") return nav.aGestor();
    if (d["accion"] === "login") {
      aviso("Abriendo Google…");
      void iniciarSesionGoogle().catch((e) => {
        aviso(e instanceof Error && /popup/i.test(e.message) ? "El navegador bloqueó la ventana de Google." : "No se pudo iniciar sesión.");
      });
      return;
    }
    if (d["accion"] === "logout") {
      void cerrarSesion()
        .then(() => aviso("Sesión cerrada."))
        .catch(() => aviso("No se pudo cerrar sesión."));
      return;
    }
    if (d["accion"] === "sync-ahora") {
      aviso("Sincronizando…");
      void app.sync.sincronizar();
      return;
    }
    if (d["accion"] === "copiar-uid") {
      const uid = user?.uid;
      if (uid) {
        void navigator.clipboard?.writeText(uid).then(
          () => aviso("UID copiado."),
          () => aviso(uid)
        );
      }
      return;
    }
    if (d["objetivo"]) {
      return void guardar({ objetivoSemanal: clamp(u.objetivoSemanal + (d["objetivo"] === "+1" ? 1 : -1), 1, 7) });
    }
    if (d["zona"]) {
      const zona = d["zona"] as Zona;
      const lista = u.molestiasPermanentes.includes(zona)
        ? u.molestiasPermanentes.filter((z) => z !== zona)
        : [...u.molestiasPermanentes, zona];
      return void guardar({ molestiasPermanentes: lista });
    }
    if (d["tema"]) {
      fijarTema(d["tema"] as Tema);
      pintar();
    }
  }

  async function preparar(): Promise<void> {
    usuario = await app.repos.usuarios.obtenerActivo();
    pintar();
  }

  raiz.addEventListener("click", alPulsar);
  raiz.innerHTML = `<p class="cargando">Cargando…</p>`;
  void preparar();

  return () => {
    raiz.removeEventListener("click", alPulsar);
    raiz.classList.remove("sin-nav");
    desuscribirSync();
  };
}
