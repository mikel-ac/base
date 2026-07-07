/**
 * EDITOR DE COLORES DE GOMA (desde Ajustes).
 *
 * Lista editable: renombrar, cambiar el color CSS, borrar, añadir y reordenar
 * (subir/bajar). El orden importa: es de menos a más resistente. Los cambios
 * se guardan al pulsar "Guardar" y, si hay sincronización, viajan con el
 * catálogo compartido (los colores viven en la config común).
 *
 * `alGuardar` permite a quien abre el panel refrescar lo que dependa de los
 * colores (por ejemplo, un selector abierto).
 */
export declare function mostrarEditorGomas(alGuardar?: () => void): void;
