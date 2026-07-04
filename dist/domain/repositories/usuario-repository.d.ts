import type { Usuario } from "../entities/usuario.js";
/**
 * Contrato de acceso a los perfiles. El dominio solo conoce esta interfaz;
 * quién la implementa (IndexedDB hoy, SQLite mañana) es cosa de la capa data.
 */
export interface UsuarioRepository {
    /**
     * Devuelve el perfil activo del dispositivo. Si no existe ninguno,
     * la implementación debe crear uno por defecto y devolverlo
     * (así la app siempre arranca sin pantalla de registro).
     */
    obtenerActivo(): Promise<Usuario>;
    /** Cambia el perfil activo (dispositivos compartidos). */
    establecerActivo(id: string): Promise<void>;
    /** Crea o actualiza (por id). */
    guardar(u: Usuario): Promise<void>;
    /** Todos los perfiles del dispositivo (para el selector). */
    listar(): Promise<Usuario[]>;
}
