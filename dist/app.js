import { abrirDb } from "./data/datasources/indexeddb.js";
import { CatalogoEjercicioRepository } from "./data/repositories/ejercicio-repository-catalogo.js";
import { PlanGuardadoRepositoryIdb } from "./data/repositories/plan-guardado-repository-idb.js";
import { SesionRepositoryIdb } from "./data/repositories/sesion-repository-idb.js";
import { UsuarioRepositoryIdb } from "./data/repositories/usuario-repository-idb.js";
import { CalcularMetricas } from "./domain/usecases/calcular-metricas.js";
import { RegistrarSesion } from "./domain/usecases/registrar-sesion.js";
import { ConfiguradorStore } from "./state/configurador-store.js";
import { HistorialStore } from "./state/historial-store.js";
import { InicioStore } from "./state/inicio-store.js";
import { PlanesStore } from "./state/planes-store.js";
import { SyncService } from "./data/firebase/sync-service.js";
export async function crearApp() {
    const db = await abrirDb();
    const usuarios = new UsuarioRepositoryIdb(db);
    const ejercicios = CatalogoEjercicioRepository.desdeSeed();
    const sesiones = new SesionRepositoryIdb(db);
    const planes = new PlanGuardadoRepositoryIdb(db);
    const sync = new SyncService({ usuarios, sesiones, planes });
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
        sync,
    };
}
