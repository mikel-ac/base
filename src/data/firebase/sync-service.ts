import type { Sesion } from "../../domain/entities/sesion.js";
import type { Usuario } from "../../domain/entities/usuario.js";
import type { PlanGuardado } from "../../domain/entities/plan-guardado.js";
import type { SesionRepository } from "../../domain/repositories/sesion-repository.js";
import type { UsuarioRepository } from "../../domain/repositories/usuario-repository.js";
import type { PlanGuardadoRepository } from "../../domain/repositories/plan-guardado-repository.js";
import { exportarTextos, importarTextos } from "../overrides.js";
import { obtenerFirebase, type User } from "./firebase-sdk.js";

/**
 * SERVICIO DE SINCRONIZACIÓN (enfoque híbrido, gratis y sin tarjeta).
 *
 * IndexedDB sigue siendo la FUENTE DE VERDAD local: la app funciona igual sin
 * cuenta y sin conexión. Cuando hay sesión iniciada, este servicio:
 *
 *  - DATOS PERSONALES (por usuario), en usuarios/{uid}:
 *      · perfil        → doc usuarios/{uid}          (last-write-wins por ts)
 *      · sesiones      → usuarios/{uid}/sesiones/{id} (solo-añadir: unión por id)
 *      · planes        → usuarios/{uid}/planes/{id}   (last-write-wins por id)
 *    Se sincronizan entre TODOS los dispositivos del mismo usuario.
 *
 *  - CATÁLOGO COMPARTIDO (común a todos), en catalogo/estado:
 *      · overrides + añadidos + borrados (lo que edita el Gestor).
 *    Lo LEEN todos; lo ESCRIBE solo el dueño (regla por UID en Firestore).
 *
 * Los VÍDEOS NO van aquí (Storage exige plan con tarjeta): se sirven por URL
 * desde la carpeta media/ de la web (campo urlMedia del ejercicio).
 *
 * Estrategia de fusión pensada para uso personal/familiar, sin conflictos
 * complejos: el historial es casi solo-añadir, y el perfil/planes con un
 * "gana el más reciente" es suficiente a esta escala.
 */

export type EstadoSync = "desconectado" | "sincronizando" | "sincronizado" | "sin_conexion" | "error";

export interface SyncDeps {
  usuarios: UsuarioRepository;
  sesiones: SesionRepository;
  planes: PlanGuardadoRepository;
  /** Se llama tras traer datos de la nube, para que la UI se refresque. */
  alCambiarDatos?: () => void;
}

export class SyncService {
  private uid: string | null = null;
  private user: User | null = null;
  private estado: EstadoSync = "desconectado";
  private escuchas = new Set<(e: EstadoSync) => void>();
  private ultimaSync: number | null = null;

  constructor(private readonly deps: SyncDeps) {}

  // -------- estado observable (para el bloque de Ajustes) --------
  suscribirEstado(cb: (e: EstadoSync) => void): () => void {
    this.escuchas.add(cb);
    cb(this.estado);
    return () => this.escuchas.delete(cb);
  }
  private fijarEstado(e: EstadoSync): void {
    this.estado = e;
    for (const cb of this.escuchas) cb(e);
  }
  obtenerEstado(): EstadoSync {
    return this.estado;
  }
  obtenerUltimaSync(): number | null {
    return this.ultimaSync;
  }
  obtenerUsuario(): User | null {
    return this.user;
  }

  /**
   * Fija el usuario autenticado (o null al cerrar sesión) y dispara la
   * sincronización inicial. Lo llama el observador de auth de la app.
   */
  async fijarUsuario(user: User | null): Promise<void> {
    this.user = user;
    this.uid = user?.uid ?? null;
    if (!user) {
      this.fijarEstado("desconectado");
      return;
    }
    await this.sincronizar();
  }

  /** Sincronización completa: sube lo local y baja lo remoto (fusionando). */
  async sincronizar(): Promise<void> {
    if (!this.uid) return;
    if (!navigator.onLine) {
      this.fijarEstado("sin_conexion");
      return;
    }
    this.fijarEstado("sincronizando");
    try {
      const usuarioLocal = await this.deps.usuarios.obtenerActivo();
      await this.sincronizarPerfil(usuarioLocal);
      await this.sincronizarSesiones(usuarioLocal.id);
      await this.sincronizarPlanes(usuarioLocal.id);
      await this.sincronizarCatalogo();
      this.ultimaSync = Date.now();
      this.fijarEstado("sincronizado");
      this.deps.alCambiarDatos?.();
    } catch (e) {
      // Sin conexión o reglas: quedamos en local, sin drama.
      this.fijarEstado(navigator.onLine ? "error" : "sin_conexion");
      // eslint-disable-next-line no-console
      console.warn("Sync:", e instanceof Error ? e.message : e);
    }
  }

  // ------------------------------------------------------------------
  // PERFIL: last-write-wins por marca de tiempo `actualizadoEn`.
  // ------------------------------------------------------------------
  private async sincronizarPerfil(local: Usuario): Promise<void> {
    const { db, dbApi } = await obtenerFirebase();
    const ref = dbApi.doc(db, "usuarios", this.uid!);
    const snap = await dbApi.getDoc(ref);

    const localTs = (local as Usuario & { actualizadoEn?: number }).actualizadoEn ?? local.creadoEn;

    if (snap.exists()) {
      const remoto = snap.data() as Partial<Usuario> & { actualizadoEn?: number };
      const remotoTs = remoto.actualizadoEn ?? 0;
      if (remotoTs > localTs) {
        // Gana la nube: aplicamos su perfil sobre el local (conservando el id
        // local, que es la clave en IndexedDB de este dispositivo).
        const fusion: Usuario = {
          ...local,
          nombre: remoto.nombre ?? local.nombre,
          nivel: remoto.nivel ?? local.nivel,
          objetivoSemanal: remoto.objetivoSemanal ?? local.objetivoSemanal,
          molestiasPermanentes: remoto.molestiasPermanentes ?? local.molestiasPermanentes,
          materialPorDefecto: remoto.materialPorDefecto ?? local.materialPorDefecto,
          onboardingHecho: remoto.onboardingHecho ?? local.onboardingHecho,
        };
        (fusion as Usuario & { actualizadoEn?: number }).actualizadoEn = remotoTs;
        await this.deps.usuarios.guardar(fusion);
        return;
      }
    }
    // Gana lo local (o no existía en la nube): subimos.
    await dbApi.setDoc(ref, {
      nombre: local.nombre,
      nivel: local.nivel,
      objetivoSemanal: local.objetivoSemanal,
      molestiasPermanentes: local.molestiasPermanentes,
      materialPorDefecto: local.materialPorDefecto,
      onboardingHecho: local.onboardingHecho,
      actualizadoEn: localTs,
    });
  }

  // ------------------------------------------------------------------
  // SESIONES (historial): unión por id. Solo-añadir en la práctica.
  // ------------------------------------------------------------------
  private async sincronizarSesiones(usuarioId: string): Promise<void> {
    const { db, dbApi } = await obtenerFirebase();
    const col = dbApi.collection(db, "usuarios", this.uid!, "sesiones");
    const snap = await dbApi.getDocs(col);

    const remotasPorId = new Map<string, Sesion>();
    for (const d of snap.docs) remotasPorId.set(d.id, d.data() as unknown as Sesion);

    const locales = await this.deps.sesiones.listarPorUsuario(usuarioId);
    const localesPorId = new Map(locales.map((s) => [s.id, s]));

    // Bajar: las que están en la nube pero no en local.
    for (const [id, s] of remotasPorId) {
      if (!localesPorId.has(id)) {
        await this.deps.sesiones.guardar({ ...s, usuarioId });
      }
    }
    // Subir: las locales que no están en la nube (por lotes).
    const porSubir = locales.filter((s) => !remotasPorId.has(s.id));
    if (porSubir.length > 0) {
      const batch = dbApi.writeBatch(db);
      for (const s of porSubir) {
        const ref = dbApi.doc(db, "usuarios", this.uid!, "sesiones", s.id);
        batch.set(ref, this.aPlano(s));
      }
      await batch.commit();
    }
  }

  // ------------------------------------------------------------------
  // PLANES (config + a medida): last-write-wins por id.
  // ------------------------------------------------------------------
  private async sincronizarPlanes(usuarioId: string): Promise<void> {
    const { db, dbApi } = await obtenerFirebase();
    const col = dbApi.collection(db, "usuarios", this.uid!, "planes");
    const snap = await dbApi.getDocs(col);

    const remotosPorId = new Map<string, PlanGuardado>();
    for (const d of snap.docs) remotosPorId.set(d.id, d.data() as unknown as PlanGuardado);

    const locales = await this.deps.planes.listarPorUsuario(usuarioId);
    const localesPorId = new Map(locales.map((p) => [p.id, p]));

    // Bajar los que no tenemos.
    for (const [id, p] of remotosPorId) {
      if (!localesPorId.has(id)) {
        await this.deps.planes.guardar({ ...p, usuarioId });
      }
    }
    // Subir los locales que faltan en la nube.
    const porSubir = locales.filter((p) => !remotosPorId.has(p.id));
    if (porSubir.length > 0) {
      const batch = dbApi.writeBatch(db);
      for (const p of porSubir) {
        const ref = dbApi.doc(db, "usuarios", this.uid!, "planes", p.id);
        batch.set(ref, this.aPlano(p));
      }
      await batch.commit();
    }
  }

  // ------------------------------------------------------------------
  // CATÁLOGO COMPARTIDO: doc único catalogo/estado. Todos leen; escribe
  // solo el dueño. Si la escritura falla por permisos, seguimos con lo
  // remoto (los no-dueños simplemente descargan y aplican).
  // ------------------------------------------------------------------
  private async sincronizarCatalogo(): Promise<void> {
    const { db, dbApi } = await obtenerFirebase();
    const ref = dbApi.doc(db, "catalogo", "estado");
    const snap = await dbApi.getDoc(ref);
    const local = exportarTextos();
    const localTs = this.leerTsCatalogoLocal();

    if (snap.exists()) {
      const remoto = snap.data() as {
        overrides?: unknown;
        anadidos?: unknown;
        borrados?: unknown;
        coloresGoma?: unknown;
        actualizadoEn?: number;
      };
      const remotoTs = remoto.actualizadoEn ?? 0;
      if (remotoTs >= localTs) {
        // La nube manda: aplicamos el catálogo compartido sobre este dispositivo.
        importarTextos({
          overrides: remoto.overrides,
          anadidos: remoto.anadidos,
          borrados: remoto.borrados,
          coloresGoma: remoto.coloresGoma,
        });
        this.guardarTsCatalogoLocal(remotoTs);
        return;
      }
    }
    // Lo local es más nuevo (o no había remoto): intentamos subir. Solo el
    // dueño tiene permiso; si falla, no pasa nada (quedamos con lo local).
    // Subimos el sello REAL de la última edición local (no la hora de ahora),
    // para que "quién es más nuevo" refleje quién editó más tarde, no quién
    // sincronizó más tarde. Si por lo que sea no hay sello, usamos ahora.
    const selloSubida = localTs > 0 ? localTs : Date.now();
    try {
      await dbApi.setDoc(ref, {
        overrides: local.overrides,
        anadidos: local.anadidos,
        borrados: local.borrados,
        coloresGoma: local.coloresGoma ?? null,
        actualizadoEn: selloSubida,
      });
      this.guardarTsCatalogoLocal(selloSubida);
    } catch {
      /* sin permiso de escritura del catálogo: normal si no eres el dueño */
    }
  }

  /** Marca de tiempo local del catálogo, para decidir quién gana. */
  private leerTsCatalogoLocal(): number {
    const v = Number(localStorage.getItem("base.catalogo_ts") ?? "0");
    return Number.isFinite(v) ? v : 0;
  }
  private guardarTsCatalogoLocal(ts: number): void {
    try {
      localStorage.setItem("base.catalogo_ts", String(ts));
    } catch {
      /* nada */
    }
  }

  /** Serializa una entidad a objeto plano JSON-safe (quita undefined). */
  private aPlano<T>(obj: T): Record<string, unknown> {
    return JSON.parse(JSON.stringify(obj)) as Record<string, unknown>;
  }
}
