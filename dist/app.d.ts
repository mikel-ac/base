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
import { SyncService } from "./data/firebase/sync-service.js";
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
    };
    /** Sincronización en la nube (Firebase). Opcional: la app va sin ella. */
    sync: SyncService;
}
export declare function crearApp(): Promise<App>;
