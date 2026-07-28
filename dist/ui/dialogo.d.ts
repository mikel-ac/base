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
export interface OpcionesConfirmar {
    titulo: string;
    /** Texto explicativo. Los saltos de línea se respetan. */
    texto?: string;
    /** Etiqueta del botón que confirma. Por defecto "Aceptar". */
    aceptar?: string;
    /** Etiqueta del botón que cancela. Por defecto "Cancelar". */
    cancelar?: string;
    /** true si la acción es destructiva: el botón se pinta en rojo. */
    peligro?: boolean;
}
export interface OpcionesTexto {
    titulo: string;
    texto?: string;
    /** Texto de ayuda dentro del campo. */
    placeholder?: string;
    /** Valor inicial del campo. */
    valor?: string;
    aceptar?: string;
    cancelar?: string;
}
/** Filas de datos para el repaso previo (etiqueta + valor). */
export interface FilaResumen {
    etiqueta: string;
    valor: string;
    /** true para destacar el valor como "atención" (p. ej. nada seleccionado). */
    ojo?: boolean;
}
export interface OpcionesResumen {
    titulo: string;
    texto?: string;
    filas: FilaResumen[];
    aceptar?: string;
    cancelar?: string;
}
/** Pregunta de sí/no. Devuelve true si el usuario confirma. */
export declare function confirmar(o: OpcionesConfirmar): Promise<boolean>;
/** Repaso de datos antes de una acción. Devuelve true si sigue adelante. */
export declare function confirmarResumen(o: OpcionesResumen): Promise<boolean>;
/**
 * Pide un texto. Devuelve la cadena escrita, o null si se cancela.
 * (Mismo contrato que window.prompt: cancelar es null, no cadena vacía.)
 */
export declare function pedirTexto(o: OpcionesTexto): Promise<string | null>;
