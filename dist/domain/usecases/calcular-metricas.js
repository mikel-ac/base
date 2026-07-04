import { semanaISO, ultimasSemanasISO } from "../../core/fechas.js";
/**
 * MÉTRICAS DERIVADAS (§5.4). La fuente de verdad es SIEMPRE el Historial:
 * aquí no se guarda nada, solo se calcula. Decisiones concretas (ajustables):
 * - distribución de valoraciones: últimas 10 sesiones valoradas,
 * - volumen: últimas 8 semanas ISO, con ceros donde no hubo nada,
 * - tendencia: media de sesiones de las 3 semanas COMPLETAS más recientes
 *   frente a las 3 anteriores; ±0.5 sesiones/semana marca subida o bajada.
 *   (La semana en curso se excluye: aún no ha terminado y engañaría.)
 */
const N_VALORACIONES = 10;
const N_SEMANAS_VOLUMEN = 8;
export function calcularMetricas(usuario, sesiones, ahora) {
    const ordenadas = [...sesiones].sort((a, b) => a.ts - b.ts);
    // --- sesiones por semana ISO ---
    const porSemana = new Map();
    for (const s of ordenadas) {
        const clave = semanaISO(s.ts);
        const acc = porSemana.get(clave) ?? { sesiones: 0, minutos: 0 };
        acc.sesiones += 1;
        acc.minutos += s.durMin + s.calentamientoMin;
        porSemana.set(clave, acc);
    }
    const semanaActual = semanaISO(ahora);
    const sesionesEstaSemana = porSemana.get(semanaActual)?.sesiones ?? 0;
    // Semanas que alcanzaron el objetivo (la actual solo cuenta si ya lo alcanzó).
    let semanasCumplidas = 0;
    for (const [, datos] of porSemana) {
        if (datos.sesiones >= usuario.objetivoSemanal)
            semanasCumplidas++;
    }
    // --- distribución de valoraciones (últimas N valoradas) ---
    const distribucion = { facil: 0, en_su_punto: 0, dura: 0 };
    const valoradas = ordenadas.filter((s) => s.valoracion !== null).slice(-N_VALORACIONES);
    for (const s of valoradas)
        distribucion[s.valoracion]++;
    // --- volumen por semana, con ceros, listo para una gráfica ---
    const volumenPorSemana = ultimasSemanasISO(ahora, N_SEMANAS_VOLUMEN).map((clave) => ({
        semanaISO: clave,
        sesiones: porSemana.get(clave)?.sesiones ?? 0,
        minutos: porSemana.get(clave)?.minutos ?? 0,
    }));
    // --- tendencia sobre semanas completas (excluye la actual) ---
    const completas = ultimasSemanasISO(ahora, 7).slice(0, 6); // 6 semanas antes de la actual
    const cuenta = (claves) => claves.reduce((suma, c) => suma + (porSemana.get(c)?.sesiones ?? 0), 0);
    const antiguas = cuenta(completas.slice(0, 3)) / 3;
    const recientes = cuenta(completas.slice(3, 6)) / 3;
    let tendenciaSesiones = "estable";
    if (recientes - antiguas >= 0.5)
        tendenciaSesiones = "subiendo";
    else if (antiguas - recientes >= 0.5)
        tendenciaSesiones = "bajando";
    return {
        sesionesEstaSemana,
        objetivoSemanal: usuario.objetivoSemanal,
        semanasCumplidas,
        nivelActual: usuario.nivel,
        distribucionValoracion: distribucion,
        volumenPorSemana,
        tendenciaSesiones,
    };
}
/** Caso de uso con acceso a datos, para la pantalla de Inicio/Progreso. */
export class CalcularMetricas {
    sesiones;
    constructor(sesiones) {
        this.sesiones = sesiones;
    }
    async ejecutar(usuario, ahora = Date.now()) {
        const todas = await this.sesiones.listarPorUsuario(usuario.id);
        return calcularMetricas(usuario, todas, ahora);
    }
}
