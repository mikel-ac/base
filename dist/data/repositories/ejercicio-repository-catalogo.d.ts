import type { Ejercicio } from "../../domain/entities/ejercicio.js";
import type { EjercicioRepository } from "../../domain/repositories/ejercicio-repository.js";
/**
 * El catálogo NO va a IndexedDB: es dato de solo lectura que viaja con la
 * app y se versiona con ella (actualizar la app = actualizar el catálogo,
 * sin migraciones). Este repositorio lo sirve desde memoria. La interfaz
 * es async igualmente, por si algún día el catálogo viene de otro sitio.
 */
export declare class CatalogoEjercicioRepository implements EjercicioRepository {
    private readonly ejercicios;
    private readonly porIdMapa;
    constructor(ejercicios: Ejercicio[]);
    static desdeSeed(): CatalogoEjercicioRepository;
    todos(): Promise<Ejercicio[]>;
    porId(id: string): Promise<Ejercicio | null>;
}
