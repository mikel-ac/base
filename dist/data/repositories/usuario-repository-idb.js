import { NIVEL_POR_DEFECTO } from "../../domain/entities/tipos.js";
import { uuid } from "../../core/util.js";
import { almacen, pedir } from "../datasources/indexeddb.js";
const CLAVE_ACTIVO = "usuarioActivoId";
/** Perfil por defecto: la app arranca sin registro ni onboarding obligatorio. */
function usuarioPorDefecto() {
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
export class UsuarioRepositoryIdb {
    db;
    constructor(db) {
        this.db = db;
    }
    async obtenerActivo() {
        const meta = await pedir(almacen(this.db, "meta", "readonly").get(CLAVE_ACTIVO));
        if (meta?.valor) {
            const usuario = await pedir(almacen(this.db, "usuarios", "readonly").get(meta.valor));
            if (usuario)
                return usuario;
            // El activo apuntaba a un perfil borrado: se repara solo más abajo.
        }
        const todos = await this.listar();
        if (todos.length > 0) {
            const primero = todos[0];
            await this.establecerActivo(primero.id);
            return primero;
        }
        const nuevo = usuarioPorDefecto();
        await this.guardar(nuevo);
        await this.establecerActivo(nuevo.id);
        return nuevo;
    }
    async establecerActivo(id) {
        await pedir(almacen(this.db, "meta", "readwrite").put({ clave: CLAVE_ACTIVO, valor: id }));
    }
    async guardar(u) {
        await pedir(almacen(this.db, "usuarios", "readwrite").put(u));
    }
    async listar() {
        const todos = await pedir(almacen(this.db, "usuarios", "readonly").getAll());
        return todos.sort((a, b) => a.creadoEn - b.creadoEn);
    }
}
