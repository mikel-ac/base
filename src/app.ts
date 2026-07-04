import { abrirDb } from "./data/datasources/indexeddb.js";
import { CatalogoEjercicioRepository } from "./data/repositories/ejercicio-repository-catalogo.js";
import { PlanGuardadoRepositoryIdb } from "./data/repositories/plan-guardado-repository-idb.js";
import { SesionRepositoryIdb } from "./data/repositories/sesion-repository-idb.js";
import { UsuarioRepositoryIdb } from "./data/repositories/usuario-repository-idb.js";
import type { EjercicioRepository } from "./domain/repositories/ejercicio-repository.js";
import type { PlanGuardadoRepository } from "./domain/repositories/plan-guardado-repository.js";
import type { SesionRepository } from "./domain/repositories/sesion-repository.js";
import type { UsuarioRepository } from "./domain/repositories/usuario-repository.js";
import { CalcularMetricas } from "./domain/usecases/calcular-metricas.js";
import { RegistrarSesion } from "./domain/usecases/registrar-sesion.js";
import { ConfiguradorStore } from "./state/configurador-store.js";
import { HistorialStore } from "./state/historial-store.js";
import { InicioStore } from "./state/inicio-store.js";
import { PlanesStore } from "./state/planes-store.js";

/**
 * RAÍZ DE COMPOSICIÓN. El ÚNICO sitio donde se decide qué implementación
 * concreta usa cada contrato. La futura UI hará:
 *
 *   const app = await crearApp();
 *   await app.stores.inicio.cargar();
 *   app.stores.inicio.suscribir((estado) => pintarInicio(estado));
 *
 * Para cambiar IndexedDB por SQLite, o meter repos falsos en pruebas,
 * solo se toca este archivo.
 */
export interface App {
  repos: {
    usuarios: UsuarioRepository;
    ejercicios: EjercicioRepository;
    sesiones: SesionRepository;
    planes: PlanGuardadoRepository;
  };
  usecases: {
    registrarSesion: RegistrarSesion;
    calcularMetricas: CalcularMetricas;
  };
  stores: {
    inicio: InicioStore;
    configurador: ConfiguradorStore;
    historial: HistorialStore;
    planes: PlanesStore;
    // El RunnerStore se crea al empezar cada sesión: new RunnerStore(plan)
  };
}

export async function crearApp(): Promise<App> {
  const db = await abrirDb();

  const usuarios = new UsuarioRepositoryIdb(db);
  const ejercicios = CatalogoEjercicioRepository.desdeSeed();
  const sesiones = new SesionRepositoryIdb(db);
  const planes = new PlanGuardadoRepositoryIdb(db);

  return {
    repos: { usuarios, ejercicios, sesiones, planes },
    usecases: {
      registrarSesion: new RegistrarSesion(usuarios, sesiones),
      calcularMetricas: new CalcularMetricas(sesiones),
    },
    stores: {
      inicio: new InicioStore(usuarios, sesiones),
      configurador: new ConfiguradorStore(),
      historial: new HistorialStore(sesiones),
      planes: new PlanesStore(planes),
    },
  };
}
