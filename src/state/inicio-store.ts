import type { Metricas } from "../domain/entities/metricas.js";
import type { Sesion } from "../domain/entities/sesion.js";
import type { Sugerencia } from "../domain/entities/sugerencia.js";
import type { Usuario } from "../domain/entities/usuario.js";
import type { SesionRepository } from "../domain/repositories/sesion-repository.js";
import type { UsuarioRepository } from "../domain/repositories/usuario-repository.js";
import { CalcularMetricas } from "../domain/usecases/calcular-metricas.js";
import { SugerirHoy } from "../domain/usecases/sugerir-hoy.js";
import { Store } from "./store.js";

/** Contrato de estado de la pantalla de Inicio (§11.4). */
export interface InicioState {
  cargando: boolean;
  usuario: Usuario | null;
  metricas: Metricas | null;
  sugerencia: Sugerencia | null;
  ultimaSesion: Sesion | null;
  error: string | null;
}

const ESTADO_INICIAL: InicioState = {
  cargando: true,
  usuario: null,
  metricas: null,
  sugerencia: null,
  ultimaSesion: null,
  error: null,
};

/** Orquesta los casos de uso de Inicio y expone el estado. Sin UI. */
export class InicioStore extends Store<InicioState> {
  private readonly calcularMetricas: CalcularMetricas;
  private readonly sugerirHoy: SugerirHoy;
  private readonly sesiones: SesionRepository;

  constructor(
    private readonly usuarios: UsuarioRepository,
    sesiones: SesionRepository
  ) {
    super(ESTADO_INICIAL);
    this.sesiones = sesiones;
    this.calcularMetricas = new CalcularMetricas(sesiones);
    this.sugerirHoy = new SugerirHoy(sesiones);
  }

  /** Llamar al entrar en Inicio y tras registrar una sesión. */
  async cargar(): Promise<void> {
    this.fijar({ cargando: true, error: null });
    try {
      const usuario = await this.usuarios.obtenerActivo();
      const [metricas, sugerencia, ultimaSesion] = await Promise.all([
        this.calcularMetricas.ejecutar(usuario),
        this.sugerirHoy.ejecutar(usuario),
        this.sesiones.ultimaSesion(usuario.id),
      ]);
      this.fijar({ cargando: false, usuario, metricas, sugerencia, ultimaSesion });
    } catch (e) {
      this.fijar({ cargando: false, error: e instanceof Error ? e.message : "Error al cargar Inicio." });
    }
  }
}
