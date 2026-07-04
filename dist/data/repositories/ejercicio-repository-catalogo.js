import { cargarCatalogo } from "../seed/cargar-catalogo.js";
/**
 * El catálogo NO va a IndexedDB: es dato de solo lectura que viaja con la
 * app y se versiona con ella (actualizar la app = actualizar el catálogo,
 * sin migraciones). Este repositorio lo sirve desde memoria. La interfaz
 * es async igualmente, por si algún día el catálogo viene de otro sitio.
 */
export class CatalogoEjercicioRepository {
    ejercicios;
    porIdMapa;
    constructor(ejercicios) {
        this.ejercicios = ejercicios;
        this.porIdMapa = new Map(ejercicios.map((e) => [e.id, e]));
    }
    static desdeSeed() {
        return new CatalogoEjercicioRepository(cargarCatalogo());
    }
    async todos() {
        return this.ejercicios;
    }
    async porId(id) {
        return this.porIdMapa.get(id) ?? null;
    }
}
