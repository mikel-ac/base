import type { SesionRepository } from "../../domain/repositories/sesion-repository.js";
import type { UsuarioRepository } from "../../domain/repositories/usuario-repository.js";
import type { PlanGuardadoRepository } from "../../domain/repositories/plan-guardado-repository.js";
import { type User } from "./firebase-sdk.js";
/**
 * SERVICIO DE SINCRONIZACIÓN (enfoque híbrido, gratis y sin tarjeta).
 *
 * IndexedDB sigue siendo la FUENTE DE VERDAD local: la app funciona igual sin
 * cuenta y sin conexión. Cuando hay sesión iniciada, este servicio:
 *
 *  - DATOS PERSONALES (por usuario), en usuarios/{uid}:
 *      · perfil        → doc usuarios/{uid}          (last-write-wins por ts)
 *      · sesiones      → usuarios/{uid}/sesiones/{id} (solo-añadir: unión por id)
 *      · planes        → usuarios/{uid}/planes/{id}   (last-write-wins por id)
 *    Se sincronizan entre TODOS los dispositivos del mismo usuario.
 *
 *  - CATÁLOGO COMPARTIDO (común a todos), en catalogo/estado:
 *      · overrides + añadidos + borrados (lo que edita el Gestor).
 *    Lo LEEN todos; lo ESCRIBE solo el dueño (regla por UID en Firestore).
 *
 * Los VÍDEOS NO van aquí (Storage exige plan con tarjeta): se sirven por URL
 * desde la carpeta media/ de la web (campo urlMedia del ejercicio).
 *
 * Estrategia de fusión pensada para uso personal/familiar, sin conflictos
 * complejos: el historial es casi solo-añadir, y el perfil/planes con un
 * "gana el más reciente" es suficiente a esta escala.
 */
export type EstadoSync = "desconectado" | "sincronizando" | "sincronizado" | "sin_conexion" | "error";
export interface SyncDeps {
    usuarios: UsuarioRepository;
    sesiones: SesionRepository;
    planes: PlanGuardadoRepository;
    /** Se llama tras traer datos de la nube, para que la UI se refresque. */
    alCambiarDatos?: () => void;
}
export declare class SyncService {
    private readonly deps;
    private uid;
    private user;
    private estado;
    private escuchas;
    private ultimaSync;
    constructor(deps: SyncDeps);
    suscribirEstado(cb: (e: EstadoSync) => void): () => void;
    private fijarEstado;
    obtenerEstado(): EstadoSync;
    obtenerUltimaSync(): number | null;
    obtenerUsuario(): User | null;
    /**
     * Fija el usuario autenticado (o null al cerrar sesión) y dispara la
     * sincronización inicial. Lo llama el observador de auth de la app.
     */
    fijarUsuario(user: User | null): Promise<void>;
    /** Sincronización completa: sube lo local y baja lo remoto (fusionando). */
    sincronizar(): Promise<void>;
    private sincronizarPerfil;
    private sincronizarSesiones;
    private sincronizarPlanes;
    private sincronizarCatalogo;
    /** Marca de tiempo local del catálogo, para decidir quién gana. */
    private leerTsCatalogoLocal;
    private guardarTsCatalogoLocal;
    /** Serializa una entidad a objeto plano JSON-safe (quita undefined). */
    private aPlano;
}
