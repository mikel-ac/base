/**
 * DIÁLOGOS PROPIOS (sustituyen a window.confirm / window.prompt).
 *
 * Por qué existen: los diálogos del navegador rompen el lenguaje visual de la
 * app y no se pueden estilar. Estos siguen el diseño de BASE (borde grueso,
 * sombra dura, Anton en el título).
 *
 * DIFERENCIA CLAVE con los nativos: aquellos BLOQUEAN el hilo (el código se
 * escribía `if (confirm()) …`); estos son asíncronos y devuelven una promesa,
 * así que quien llama debe usar `await` o `.then`. Un descuido aquí ejecuta la
 * acción sin esperar respuesta, de ahí que todas las llamadas se migraran.
 *
 * Decisiones de comportamiento:
 *  - NO se cierran tocando el fondo: son decisiones, y un cierre accidental
 *    (al hacer scroll, por ejemplo) sería justo lo que queremos evitar.
 *  - Escape y el botón atrás de Android cancelan.
 *  - Se apilan por encima de cualquier otro modal (z-index propio) y detienen
 *    la propagación del toque, para poder abrirse DENTRO de otro panel.
 *  - Bloquean el scroll del fondo mientras están abiertos.
 *  - Usan la clase `.dlg-velo`, NO `.velo`: la vista de sesión borra todos los
 *    `.velo` al desmontarse y se llevaría el diálogo por delante.
 */
function esc(t) {
    return t.replace(/[&<>"']/g, (c) => c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;");
}
/** Evita que un doble toque abra dos diálogos apilados. */
let hayDialogoAbierto = false;
/** Monta el armazón común y devuelve la promesa con el resultado. */
function montar(cuerpoHTML, resolverDesde, valorAlCancelar) {
    // Si ya hay uno abierto, el segundo se descarta en vez de apilarse: dos
    // diálogos superpuestos dejarían el historial y el foco descuadrados.
    if (hayDialogoAbierto)
        return Promise.resolve(valorAlCancelar);
    hayDialogoAbierto = true;
    return new Promise((resolve) => {
        const velo = document.createElement("div");
        velo.className = "dlg-velo";
        velo.innerHTML = cuerpoHTML;
        // El fondo no debe desplazarse mientras el diálogo está abierto.
        const overflowPrevio = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        // Declarados antes de `cerrar` porque este los consulta.
        let porAtras = false;
        let historialPropio = false;
        let cerrado = false;
        const cerrar = (valor) => {
            if (cerrado)
                return;
            cerrado = true;
            hayDialogoAbierto = false;
            document.body.style.overflow = overflowPrevio;
            document.removeEventListener("keydown", alTeclado, true);
            window.removeEventListener("popstate", alAtras);
            // Deshacemos la entrada del historial que añadimos para capturar el
            // botón atrás, salvo que sea el propio atrás quien nos cierra.
            if (historialPropio && !porAtras)
                history.back();
            velo.remove();
            resolve(valor);
        };
        // El toque dentro del diálogo no debe llegar a paneles de debajo (estos
        // diálogos pueden abrirse dentro de otro modal que escucha clicks).
        velo.addEventListener("click", (ev) => ev.stopPropagation());
        velo.addEventListener("pointerdown", (ev) => ev.stopPropagation());
        const alTeclado = (ev) => {
            if (ev.key === "Escape") {
                ev.stopPropagation();
                cerrar(valorAlCancelar);
            }
        };
        document.addEventListener("keydown", alTeclado, true);
        // Botón atrás de Android: añadimos una entrada al historial para poder
        // interceptarlo y cancelar el diálogo en vez de salir de la pantalla.
        const alAtras = () => {
            porAtras = true;
            cerrar(valorAlCancelar);
        };
        try {
            history.pushState({ dlg: true }, "");
            historialPropio = true;
            window.addEventListener("popstate", alAtras);
        }
        catch {
            /* si el historial no está disponible, seguimos sin esta protección */
        }
        resolverDesde(velo, cerrar);
        document.body.appendChild(velo);
        // Foco al primer control para que el teclado funcione de inmediato.
        const primerCampo = velo.querySelector("input");
        const botonPrincipal = velo.querySelector("[data-dlg='ok']");
        (primerCampo ?? botonPrincipal)?.focus();
        primerCampo?.select();
    });
}
function pie(aceptar, cancelar, peligro = false) {
    return `
    <div class="dlg-pie">
      <button class="btn dlg-btn" data-dlg="no">${esc(cancelar)}</button>
      <button class="btn primary dlg-btn ${peligro ? "dlg-peligro" : ""}" data-dlg="ok">${esc(aceptar)}</button>
    </div>`;
}
/** Pregunta de sí/no. Devuelve true si el usuario confirma. */
export function confirmar(o) {
    const html = `
    <div class="dlg" role="alertdialog" aria-modal="true" aria-label="${esc(o.titulo)}">
      <h2 class="dlg-t">${esc(o.titulo)}</h2>
      ${o.texto ? `<p class="dlg-x">${esc(o.texto)}</p>` : ""}
      ${pie(o.aceptar ?? "Aceptar", o.cancelar ?? "Cancelar", o.peligro)}
    </div>`;
    return montar(html, (velo, cerrar) => {
        velo.addEventListener("click", (ev) => {
            const b = ev.target.closest("[data-dlg]");
            if (!b)
                return;
            cerrar(b.dataset["dlg"] === "ok");
        });
    }, false);
}
/** Repaso de datos antes de una acción. Devuelve true si sigue adelante. */
export function confirmarResumen(o) {
    const filas = o.filas
        .map((f) => `
      <div class="dlg-fila">
        <span class="dlg-fila-k">${esc(f.etiqueta)}</span>
        <span class="dlg-fila-v ${f.ojo ? "ojo" : ""}">${esc(f.valor)}</span>
      </div>`)
        .join("");
    const html = `
    <div class="dlg" role="alertdialog" aria-modal="true" aria-label="${esc(o.titulo)}">
      <h2 class="dlg-t">${esc(o.titulo)}</h2>
      ${o.texto ? `<p class="dlg-x">${esc(o.texto)}</p>` : ""}
      <div class="dlg-filas">${filas}</div>
      ${pie(o.aceptar ?? "Aceptar", o.cancelar ?? "Cancelar")}
    </div>`;
    return montar(html, (velo, cerrar) => {
        velo.addEventListener("click", (ev) => {
            const b = ev.target.closest("[data-dlg]");
            if (!b)
                return;
            cerrar(b.dataset["dlg"] === "ok");
        });
    }, false);
}
/**
 * Pide un texto. Devuelve la cadena escrita, o null si se cancela.
 * (Mismo contrato que window.prompt: cancelar es null, no cadena vacía.)
 */
export function pedirTexto(o) {
    const html = `
    <div class="dlg" role="dialog" aria-modal="true" aria-label="${esc(o.titulo)}">
      <h2 class="dlg-t">${esc(o.titulo)}</h2>
      ${o.texto ? `<p class="dlg-x">${esc(o.texto)}</p>` : ""}
      <input class="field dlg-campo" type="text" value="${esc(o.valor ?? "")}"
             placeholder="${esc(o.placeholder ?? "")}" autocomplete="off" />
      ${pie(o.aceptar ?? "Guardar", o.cancelar ?? "Cancelar")}
    </div>`;
    return montar(html, (velo, cerrar) => {
        const campo = velo.querySelector(".dlg-campo");
        const aceptar = () => cerrar(campo.value);
        velo.addEventListener("click", (ev) => {
            const b = ev.target.closest("[data-dlg]");
            if (!b)
                return;
            if (b.dataset["dlg"] === "ok")
                aceptar();
            else
                cerrar(null);
        });
        // Enter confirma, como en el diálogo nativo.
        campo.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter") {
                ev.preventDefault();
                aceptar();
            }
        });
    }, null);
}
