/**
 * EDITOR DE COLORES DE GOMA (desde Ajustes).
 *
 * Renombrar, cambiar color, borrar, añadir y REORDENAR arrastrando por el asa.
 * Orden = de menos a más resistente. Guarda al pulsar "Guardar" y viaja con el
 * catálogo compartido si hay sync.
 *
 * Reordenación robusta: cada fila tiene una clave estable (`data-key`). Durante
 * el arrastre se mueve un fantasma flotante y se recolocan los NODOS existentes
 * por su clave (sin recrear el DOM), evitando el "temblor" de re-renderizar en
 * cada movimiento del dedo.
 */
export declare function mostrarEditorGomas(alGuardar?: () => void): void;
