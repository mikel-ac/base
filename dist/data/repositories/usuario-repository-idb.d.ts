import type { Usuario } from "../../domain/entities/usuario.js";
import type { UsuarioRepository } from "../../domain/repositories/usuario-repository.js";
export declare class UsuarioRepositoryIdb implements UsuarioRepository {
    private readonly db;
    constructor(db: IDBDatabase);
    obtenerActivo(): Promise<Usuario>;
    establecerActivo(id: string): Promise<void>;
    guardar(u: Usuario): Promise<void>;
    listar(): Promise<Usuario[]>;
}
