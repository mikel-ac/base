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
export declare const NOMBRE_DB = "base-db";
export declare const VERSION_DB = 1;
export declare function abrirDb(): Promise<IDBDatabase>;
/** Convierte una petición IndexedDB (basada en eventos) en una Promise. */
export declare function pedir<T>(peticion: IDBRequest<T>): Promise<T>;
/** Azúcar para abrir una transacción y devolver el object store. */
export declare function almacen(db: IDBDatabase, nombre: string, modo: IDBTransactionMode): IDBObjectStore;
