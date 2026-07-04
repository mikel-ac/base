import type { Ejercicio } from "../../domain/entities/ejercicio.js";
import type { EjercicioRepository } from "../../domain/repositories/ejercicio-repository.js";
import { cargarCatalogo } from "../seed/cargar-catalogo.js";

/**
 * El catálogo NO va a IndexedDB: es dato de solo lectura que viaja con la
 * app y se versiona con ella (actualizar la app = actualizar el catálogo,
 * sin migraciones). Este repositorio lo sirve desde memoria. La interfaz
 * es async igualmente, por si algún día el catálogo viene de otro sitio.
 */
export class CatalogoEjercicioRepository implements EjercicioRepository {
  private readonly porIdMapa: Map<string, Ejercicio>;

  constructor(private readonly ejercicios: Ejercicio[]) {
    this.porIdMapa = new Map(ejercicios.map((e) => [e.id, e]));
  }

  static desdeSeed(): CatalogoEjercicioRepository {
    return new CatalogoEjercicioRepository(cargarCatalogo());
  }

  async todos(): Promise<Ejercicio[]> {
    return this.ejercicios;
  }

  async porId(id: string): Promise<Ejercicio | null> {
    return this.porIdMapa.get(id) ?? null;
  }
}
