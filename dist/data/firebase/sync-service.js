import { exportarTextos, importarTextos } from "../overrides.js";
import { obtenerFirebase } from "./firebase-sdk.js";
export class SyncService {
    deps;
    uid = null;
    user = null;
    estado = "desconectado";
    escuchas = new Set();
    ultimaSync = null;
    constructor(deps) {
        this.deps = deps;
    }
    // -------- estado observable (para el bloque de Ajustes) --------
    suscribirEstado(cb) {
        this.escuchas.add(cb);
        cb(this.estado);
        return () => this.escuchas.delete(cb);
    }
    fijarEstado(e) {
        this.estado = e;
        for (const cb of this.escuchas)
            cb(e);
    }
    obtenerEstado() {
        return this.estado;
    }
    obtenerUltimaSync() {
        return this.ultimaSync;
    }
    obtenerUsuario() {
        return this.user;
    }
    /**
     * Fija el usuario autenticado (o null al cerrar sesión) y dispara la
     * sincronización inicial. Lo llama el observador de auth de la app.
     */
    async fijarUsuario(user) {
        this.user = user;
        this.uid = user?.uid ?? null;
        if (!user) {
            this.fijarEstado("desconectado");
            return;
        }
        await this.sincronizar();
    }
    /** Sincronización completa: sube lo local y baja lo remoto (fusionando). */
    async sincronizar() {
        if (!this.uid)
            return;
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
        }
        catch (e) {
            // Sin conexión o reglas: quedamos en local, sin drama.
            this.fijarEstado(navigator.onLine ? "error" : "sin_conexion");
            // eslint-disable-next-line no-console
            console.warn("Sync:", e instanceof Error ? e.message : e);
        }
    }
    // ------------------------------------------------------------------
    // PERFIL: last-write-wins por marca de tiempo `actualizadoEn`.
    // ------------------------------------------------------------------
    async sincronizarPerfil(local) {
        const { db, dbApi } = await obtenerFirebase();
        const ref = dbApi.doc(db, "usuarios", this.uid);
        const snap = await dbApi.getDoc(ref);
        const localTs = local.actualizadoEn ?? local.creadoEn;
        if (snap.exists()) {
            const remoto = snap.data();
            const remotoTs = remoto.actualizadoEn ?? 0;
            if (remotoTs > localTs) {
                // Gana la nube: aplicamos su perfil sobre el local (conservando el id
                // local, que es la clave en IndexedDB de este dispositivo).
                const fusion = {
                    ...local,
                    nombre: remoto.nombre ?? local.nombre,
                    nivel: remoto.nivel ?? local.nivel,
                    objetivoSemanal: remoto.objetivoSemanal ?? local.objetivoSemanal,
                    molestiasPermanentes: remoto.molestiasPermanentes ?? local.molestiasPermanentes,
                    materialPorDefecto: remoto.materialPorDefecto ?? local.materialPorDefecto,
                    onboardingHecho: remoto.onboardingHecho ?? local.onboardingHecho,
                };
                fusion.actualizadoEn = remotoTs;
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
    async sincronizarSesiones(usuarioId) {
        const { db, dbApi } = await obtenerFirebase();
        const col = dbApi.collection(db, "usuarios", this.uid, "sesiones");
        const snap = await dbApi.getDocs(col);
        const remotasPorId = new Map();
        for (const d of snap.docs)
            remotasPorId.set(d.id, d.data());
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
                const ref = dbApi.doc(db, "usuarios", this.uid, "sesiones", s.id);
                batch.set(ref, this.aPlano(s));
            }
            await batch.commit();
        }
    }
    // ------------------------------------------------------------------
    // PLANES (config + a medida): last-write-wins por id.
    // ------------------------------------------------------------------
    async sincronizarPlanes(usuarioId) {
        const { db, dbApi } = await obtenerFirebase();
        const col = dbApi.collection(db, "usuarios", this.uid, "planes");
        const snap = await dbApi.getDocs(col);
        const remotosPorId = new Map();
        for (const d of snap.docs)
            remotosPorId.set(d.id, d.data());
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
                const ref = dbApi.doc(db, "usuarios", this.uid, "planes", p.id);
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
    async sincronizarCatalogo() {
        const { db, dbApi } = await obtenerFirebase();
        const ref = dbApi.doc(db, "catalogo", "estado");
        const snap = await dbApi.getDoc(ref);
        const local = exportarTextos();
        const localTs = this.leerTsCatalogoLocal();
        if (snap.exists()) {
            const remoto = snap.data();
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
        }
        catch {
            /* sin permiso de escritura del catálogo: normal si no eres el dueño */
        }
    }
    /** Marca de tiempo local del catálogo, para decidir quién gana. */
    leerTsCatalogoLocal() {
        const v = Number(localStorage.getItem("base.catalogo_ts") ?? "0");
        return Number.isFinite(v) ? v : 0;
    }
    guardarTsCatalogoLocal(ts) {
        try {
            localStorage.setItem("base.catalogo_ts", String(ts));
        }
        catch {
            /* nada */
        }
    }
    /** Serializa una entidad a objeto plano JSON-safe (quita undefined). */
    aPlano(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
}
