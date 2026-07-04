import type { Usuario } from "../../domain/entities/usuario.js";
import { NIVEL_POR_DEFECTO } from "../../domain/entities/tipos.js";
import type { UsuarioRepository } from "../../domain/repositories/usuario-repository.js";
import { uuid } from "../../core/util.js";
import { almacen, pedir } from "../datasources/indexeddb.js";

const CLAVE_ACTIVO = "usuarioActivoId";

/** Perfil por defecto: la app arranca sin registro ni onboarding obligatorio. */
function usuarioPorDefecto(): Usuario {
  return {
    id: uuid(),
    nombre: "Yo",
    nivel: NIVEL_POR_DEFECTO,
    objetivoSemanal: 3,
    molestiasPermanentes: [],
    materialPorDefecto: [],
    onboardingHecho: false,
    creadoEn: Date.now(),
  };
}

export class UsuarioRepositoryIdb implements UsuarioRepository {
  constructor(private readonly db: IDBDatabase) {}

  async obtenerActivo(): Promise<Usuario> {
    const meta = await pedir<{ clave: string; valor: string } | undefined>(
      almacen(this.db, "meta", "readonly").get(CLAVE_ACTIVO)
    );
    if (meta?.valor) {
      const usuario = await pedir<Usuario | undefined>(
        almacen(this.db, "usuarios", "readonly").get(meta.valor)
      );
      if (usuario) return usuario;
      // El activo apuntaba a un perfil borrado: se repara solo más abajo.
    }
    const todos = await this.listar();
    if (todos.length > 0) {
      const primero = todos[0]!;
      await this.establecerActivo(primero.id);
      return primero;
    }
    const nuevo = usuarioPorDefecto();
    await this.guardar(nuevo);
    await this.establecerActivo(nuevo.id);
    return nuevo;
  }

  async establecerActivo(id: string): Promise<void> {
    await pedir(almacen(this.db, "meta", "readwrite").put({ clave: CLAVE_ACTIVO, valor: id }));
  }

  async guardar(u: Usuario): Promise<void> {
    await pedir(almacen(this.db, "usuarios", "readwrite").put(u));
  }

  async listar(): Promise<Usuario[]> {
    const todos = await pedir<Usuario[]>(almacen(this.db, "usuarios", "readonly").getAll());
    return todos.sort((a, b) => a.creadoEn - b.creadoEn);
  }
}
