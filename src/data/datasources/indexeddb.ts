/**
 * ADAPTADOR DE INDEXEDDB. Único archivo que sabe que existe IndexedDB.
 * Si algún día se cambia a SQLite, se sustituyen este archivo y los
 * repositorios *-idb; el dominio y el estado no se enteran.
 *
 * Esquema v1 (la versión permite migrar en el futuro sin perder datos):
 *  - usuarios:  clave "id"
 *  - sesiones:  clave "id", índice "porUsuario" sobre usuarioId
 *  - planes:    clave "id", índice "porUsuario" sobre usuarioId
 *  - meta:      clave "clave" (pares clave-valor: p. ej. usuario activo)
 *
 * Con cientos de registros al año, un índice por usuario basta (§5.5):
 * los filtros por fecha se hacen en memoria, que a esta escala es gratis.
 */

export const NOMBRE_DB = "base-db";
export const VERSION_DB = 1;

export function abrirDb(): Promise<IDBDatabase> {
  return new Promise((resolver, rechazar) => {
    const peticion = indexedDB.open(NOMBRE_DB, VERSION_DB);
    peticion.onupgradeneeded = () => {
      const db = peticion.result;
      if (!db.objectStoreNames.contains("usuarios")) {
        db.createObjectStore("usuarios", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("sesiones")) {
        const sesiones = db.createObjectStore("sesiones", { keyPath: "id" });
        sesiones.createIndex("porUsuario", "usuarioId", { unique: false });
      }
      if (!db.objectStoreNames.contains("planes")) {
        const planes = db.createObjectStore("planes", { keyPath: "id" });
        planes.createIndex("porUsuario", "usuarioId", { unique: false });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "clave" });
      }
    };
    peticion.onsuccess = () => resolver(peticion.result);
    peticion.onerror = () => rechazar(peticion.error ?? new Error("No se pudo abrir la base de datos local."));
  });
}

/** Convierte una petición IndexedDB (basada en eventos) en una Promise. */
export function pedir<T>(peticion: IDBRequest<T>): Promise<T> {
  return new Promise((resolver, rechazar) => {
    peticion.onsuccess = () => resolver(peticion.result);
    peticion.onerror = () => rechazar(peticion.error ?? new Error("Error de base de datos local."));
  });
}

/** Azúcar para abrir una transacción y devolver el object store. */
export function almacen(
  db: IDBDatabase,
  nombre: string,
  modo: IDBTransactionMode
): IDBObjectStore {
  return db.transaction(nombre, modo).objectStore(nombre);
}
