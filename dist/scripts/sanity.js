/**
 * PRUEBAS DE HUMO de la lógica pura contra el catálogo real.
 * Se ejecutan con `npm run sanity`. Si algo viola una regla del PRD,
 * este script termina con error. No prueban IndexedDB (eso necesita
 * navegador); prueban todo lo demás, que es donde vive el riesgo.
 */
import { cargarCatalogo } from "../data/seed/cargar-catalogo.js";
import { ajustarNivel } from "../domain/usecases/ajustar-nivel.js";
import { calcularMetricas } from "../domain/usecases/calcular-metricas.js";
import { impactoDeVariante } from "../domain/usecases/filtros.js";
import { generarSesion, numEjerciciosPara } from "../domain/usecases/generar-sesion.js";
import { patronDominante, sugerirHoy } from "../domain/usecases/sugerir-hoy.js";
import { alternativasPara, moverEjercicio, quitarEjercicio, sustituirEjercicio } from "../domain/usecases/editar-plan.js";
import { crearRngConSemilla } from "../core/util.js";
import { crearRunner, reducirRunner } from "../state/runner.js";
let pruebas = 0;
function comprobar(condicion, mensaje) {
    pruebas++;
    if (!condicion) {
        throw new Error("FALLO: " + mensaje);
    }
}
// ---------- 1. Seed ----------
const catalogo = cargarCatalogo();
comprobar(catalogo.length === 55, `el catálogo debe tener 55 ejercicios (tiene ${catalogo.length})`);
comprobar(catalogo.every((e) => e.variantes.length >= 1), "todo ejercicio tiene variantes");
// ---------- 2. Adaptación de nivel (§7) ----------
comprobar(ajustarNivel(2.0, "en_su_punto") === 2.0, "en_su_punto no toca el nivel");
comprobar(ajustarNivel(2.0, "facil") === 2.15, "fácil sube +0.15");
comprobar(ajustarNivel(2.0, "dura") === 1.6, "dura baja -0.40");
comprobar(ajustarNivel(2.9, "facil") === 3.0 && ajustarNivel(2.95, "facil") === 3.0, "tope superior 3.0");
comprobar(ajustarNivel(1.1, "dura") === 1.0, "tope inferior 1.0");
// ---------- 3. Generación de sesiones (§6) ----------
const cfgBase = {
    nivel: 2.0,
    focus: ["fuerza", "cardio", "movilidad"],
    material: ["banda", "esterilla"],
    bajoImpacto: false,
    molestias: [],
    calentamientoMin: 5,
    durMin: 20,
    workSec: 40,
    restSec: 20,
};
comprobar(numEjerciciosPara(20, 40, 20) === 20, "20 min a 40/20 son 20 intervalos");
// Guardas (regla 8)
const sinFocus = generarSesion(catalogo, { ...cfgBase, focus: [] });
comprobar(!sinFocus.ok, "focus vacío → error controlado");
const imposible = generarSesion(catalogo, {
    ...cfgBase,
    molestias: ["hombro", "muneca", "codo", "rodilla", "tobillo", "gemelo", "lumbar", "cuello"],
    material: [],
    focus: ["cardio"],
    bajoImpacto: true,
});
// Con todas las molestias puede quedar pool vacío o casi: si devuelve fallo, es el mensaje de aflojar.
if (!imposible.ok)
    comprobar(imposible.error.length > 0, "el fallo trae mensaje");
// 200 sesiones con semillas distintas: invariantes del PRD
for (let semilla = 1; semilla <= 200; semilla++) {
    const rng = crearRngConSemilla(semilla);
    const molestias = semilla % 3 === 0 ? ["rodilla"] : semilla % 3 === 1 ? ["hombro", "lumbar"] : [];
    const cfg = {
        ...cfgBase,
        molestias: [...molestias],
        bajoImpacto: semilla % 2 === 0,
        nivel: 1 + (semilla % 21) / 10, // 1.0 … 3.0
        durMin: 10 + (semilla % 4) * 10,
    };
    const res = generarSesion(catalogo, cfg, rng);
    comprobar(res.ok, `sesión ${semilla} se genera`);
    if (!res.ok)
        continue;
    const plan = res.valor;
    comprobar(plan.principal.length === numEjerciciosPara(cfg.durMin, cfg.workSec, cfg.restSec), `sesión ${semilla}: nº de ejercicios correcto`);
    for (const a of [...plan.calentamiento, ...plan.principal]) {
        comprobar(!a.ejercicio.joints.some((z) => cfg.molestias.includes(z)), `sesión ${semilla}: sin zonas con molestia (${a.ejercicio.id})`);
        comprobar(a.ejercicio.materiales.length === 0 || a.ejercicio.materiales.some((m) => cfg.material.includes(m)), `sesión ${semilla}: material disponible (${a.ejercicio.id})`);
        if (cfg.bajoImpacto) {
            comprobar(impactoDeVariante(a.ejercicio, a.variante) !== "alto", `sesión ${semilla}: bajo impacto respetado (${a.ejercicio.id})`);
        }
    }
    for (const a of plan.principal) {
        comprobar(cfg.focus.includes(a.ejercicio.tipo), `sesión ${semilla}: tipo dentro del focus`);
    }
    for (const a of plan.calentamiento) {
        comprobar(a.ejercicio.tipo === "calentamiento", `sesión ${semilla}: el calentamiento es calentamiento`);
    }
    // Regla 3: nunca dos patrones iguales seguidos (con pool multi-patrón siempre es evitable)
    for (let i = 1; i < plan.principal.length; i++) {
        comprobar(plan.principal[i].ejercicio.patron !== plan.principal[i - 1].ejercicio.patron, `sesión ${semilla}: patrones no consecutivos (pos ${i})`);
    }
    // Regla 4: el material no monopoliza
    const conMaterial = plan.principal.filter((a) => a.ejercicio.materiales.length > 0).length;
    // Regla blanda: puede excederse en 1 cuando el circuito y la regla dura de
    // patrones no dejan otra opción; nunca debe monopolizar.
    comprobar(conMaterial <= Math.ceil(plan.principal.length / 2) + 1, `sesión ${semilla}: material sin monopolizar (${conMaterial}/${plan.principal.length})`);
}
// Reproducibilidad: misma semilla → misma sesión
const a1 = generarSesion(catalogo, cfgBase, crearRngConSemilla(42));
const a2 = generarSesion(catalogo, cfgBase, crearRngConSemilla(42));
comprobar(a1.ok && a2.ok && JSON.stringify(a1) === JSON.stringify(a2), "misma semilla → misma sesión");
// Nivel bajo → variantes suaves; nivel alto → fuertes (donde existan)
const suave = generarSesion(catalogo, { ...cfgBase, nivel: 1.0 }, crearRngConSemilla(7));
if (suave.ok) {
    comprobar(suave.valor.principal.every((x) => x.variante.nivel <= 2), "nivel 1.0 no asigna variantes de nivel 3");
}
// ---------- 4. Sugerencia del día (§9) ----------
const usuario = {
    id: "u1", nombre: "Prueba", nivel: 2.0, objetivoSemanal: 3,
    molestiasPermanentes: [], materialPorDefecto: [], onboardingHecho: true, creadoEn: 0,
};
const frio = sugerirHoy(usuario, []);
comprobar(frio.focus.length === 3 && frio.enfasis === null && frio.nivelSugerido === 2.0, "arranque en frío: equilibrada al nivel actual");
const DIA = 24 * 60 * 60 * 1000;
const ahora = Date.now();
function sesionFalsa(desplDias, patrones, valoracion) {
    return {
        id: `s${desplDias}`, usuarioId: "u1", ts: ahora - desplDias * DIA,
        focus: ["fuerza", "cardio", "movilidad"], patrones, durMin: 20, calentamientoMin: 5,
        workSec: 40, restSec: 20, numEjercicios: patrones.length,
        ejercicios: [], nivelEnSesion: 2.0, valoracion, kcal: null, nota: "",
    };
}
const tranquila = sugerirHoy(usuario, [sesionFalsa(1, ["pierna", "pierna", "core"], "en_su_punto")]);
comprobar(tranquila.enfasis !== "pierna", "recuperación: no repite el patrón dominante de ayer");
comprobar(tranquila.nivelSugerido === 2.0 && tranquila.focus.length === 3, "tras una sesión normal, sigue equilibrada");
const trasDura = sugerirHoy(usuario, [sesionFalsa(1, ["empuje", "empuje", "core"], "dura")]);
comprobar(trasDura.nivelSugerido === 1.7, "tras 'dura': nivel −0.3");
comprobar(trasDura.focus.length === 2 && trasDura.focus.includes("movilidad") && trasDura.focus.includes("cardio"), "tras 'dura': día suave (movilidad+cardio)");
comprobar(patronDominante(sesionFalsa(0, ["core", "core", "tiron"], null)) === "core", "patrón dominante = moda");
// ---------- 5. Métricas (§5.4) ----------
const sesiones = [
    sesionFalsa(0, ["core"], "facil"),
    sesionFalsa(1, ["pierna"], "en_su_punto"),
    sesionFalsa(2, ["empuje"], "dura"),
    sesionFalsa(9, ["core"], "facil"),
    sesionFalsa(10, ["tiron"], null),
];
const m = calcularMetricas(usuario, sesiones, ahora);
comprobar(m.objetivoSemanal === 3 && m.nivelActual === 2.0, "métricas: datos del usuario");
comprobar(m.distribucionValoracion.facil === 2 && m.distribucionValoracion.dura === 1 && m.distribucionValoracion.en_su_punto === 1, "métricas: distribución de valoraciones (ignora sin valorar)");
comprobar(m.volumenPorSemana.length === 8, "métricas: 8 semanas de volumen");
const totalVolumen = m.volumenPorSemana.reduce((s, v) => s + v.sesiones, 0);
comprobar(totalVolumen === 5, `métricas: el volumen suma las 5 sesiones (suma ${totalVolumen})`);
comprobar(["subiendo", "estable", "bajando"].includes(m.tendenciaSesiones), "métricas: tendencia válida");
// ---------- 6. Edición de sesión (§4) ----------
const base = generarSesion(catalogo, cfgBase, crearRngConSemilla(11));
comprobar(base.ok, "plan base para editar");
if (base.ok) {
    const plan = base.valor;
    const n0 = plan.principal.length;
    // mover: mismo contenido, orden nuevo, y el plan original queda intacto
    const movido = moverEjercicio(plan, "principal", 0, n0 - 1);
    comprobar(movido.ok, "mover funciona");
    if (movido.ok) {
        comprobar(movido.valor.principal.length === n0, "mover no cambia el nº de ejercicios");
        comprobar(movido.valor.principal[n0 - 1].ejercicio.id === plan.principal[0].ejercicio.id, "mover coloca el ejercicio donde toca");
        comprobar(plan.principal[0].ejercicio.id !== movido.valor.principal[0].ejercicio.id || n0 === 1, "el plan original no se modifica");
    }
    comprobar(!moverEjercicio(plan, "principal", 0, 999).ok, "mover fuera de rango → error controlado");
    // quitar: uno menos; no se puede vaciar el bloque principal
    const quitado = quitarEjercicio(plan, "principal", 0);
    comprobar(quitado.ok && quitado.valor.principal.length === n0 - 1, "quitar reduce en 1");
    let unico = plan;
    while (unico.principal.length > 1) {
        const r = quitarEjercicio(unico, "principal", 0);
        if (!r.ok)
            break;
        unico = r.valor;
    }
    comprobar(!quitarEjercicio(unico, "principal", 0).ok, "no se puede dejar la sesión sin ejercicios");
    // sustituir: acepta viables y rechaza los que chocan con molestias
    const alternativas = alternativasPara(catalogo, plan, "principal", 0);
    comprobar(alternativas.length > 0, "hay alternativas para sustituir");
    comprobar(alternativas.every((e) => !plan.principal.some((a) => a.ejercicio.id === e.id)), "las alternativas no repiten ejercicios del plan");
    const sust = sustituirEjercicio(plan, "principal", 0, alternativas[0]);
    comprobar(sust.ok && sust.valor.principal[0].ejercicio.id === alternativas[0].id, "sustituir coloca el nuevo ejercicio");
    const planConMolestia = generarSesion(catalogo, { ...cfgBase, molestias: ["hombro"] }, crearRngConSemilla(12));
    if (planConMolestia.ok) {
        const conHombro = catalogo.find((e) => e.joints.includes("hombro") && e.tipo !== "calentamiento");
        comprobar(conHombro !== undefined, "existe un ejercicio que carga el hombro");
        if (conHombro) {
            comprobar(!sustituirEjercicio(planConMolestia.valor, "principal", 0, conHombro).ok, "sustituir rechaza ejercicios que cargan una zona con molestia");
        }
    }
}
// ---------- 7. Énfasis de la sugerencia en el generador (§9) ----------
for (const semilla of [21, 22, 23, 24, 25]) {
    const conEnfasis = generarSesion(catalogo, { ...cfgBase, enfasis: "tiron" }, crearRngConSemilla(semilla));
    comprobar(conEnfasis.ok, `sesión con énfasis (semilla ${semilla})`);
    if (conEnfasis.ok) {
        const cuenta = new Map();
        for (const a of conEnfasis.valor.principal) {
            cuenta.set(a.ejercicio.patron, (cuenta.get(a.ejercicio.patron) ?? 0) + 1);
        }
        const deTiron = cuenta.get("tiron") ?? 0;
        const maxOtros = Math.max(...[...cuenta.entries()].filter(([p]) => p !== "tiron").map(([, c]) => c));
        comprobar(deTiron >= 1, `énfasis: el patrón sugerido aparece (semilla ${semilla})`);
        comprobar(deTiron >= maxOtros - 1, `énfasis: tirón no queda por detrás del resto (semilla ${semilla}: ${deTiron} vs ${maxOtros})`);
        // Y las reglas duras siguen intactas:
        for (let i = 1; i < conEnfasis.valor.principal.length; i++) {
            comprobar(conEnfasis.valor.principal[i].ejercicio.patron !== conEnfasis.valor.principal[i - 1].ejercicio.patron, `énfasis: patrones no consecutivos (semilla ${semilla})`);
        }
    }
}
// El énfasis nunca salta los filtros de seguridad: con molestia de hombro,
// pedir énfasis "empuje" no cuela ejercicios que carguen el hombro.
const enfasisSeguro = generarSesion(catalogo, { ...cfgBase, molestias: ["hombro"], enfasis: "empuje" }, crearRngConSemilla(30));
if (enfasisSeguro.ok) {
    comprobar(enfasisSeguro.valor.principal.every((a) => !a.ejercicio.joints.includes("hombro")), "énfasis: los filtros de seguridad mandan");
}
// ---------- 7b. Zona de trabajo (entrenamientos de zona concreta) ----------
// Core: todos los ejercicios del bloque principal son de patrón core,
// y el calentamiento sigue siendo general.
for (const semilla of [51, 52, 53]) {
    const core = generarSesion(catalogo, { ...cfgBase, patrones: ["core"], durMin: 15 }, crearRngConSemilla(semilla));
    comprobar(core.ok, `sesión de core (semilla ${semilla})`);
    if (core.ok) {
        comprobar(core.valor.principal.every((a) => a.ejercicio.patron === "core"), `core: solo patrón core (semilla ${semilla})`);
        comprobar(core.valor.principal.length === numEjerciciosPara(15, 40, 20), `core: nº de ejercicios correcto (repite en circuito si hace falta)`);
        comprobar(core.valor.calentamiento.every((a) => a.ejercicio.tipo === "calentamiento"), `core: calentamiento general intacto`);
    }
}
// Tren superior: solo empuje y tirón, y además alternando (dos patrones dan juego).
const tren = generarSesion(catalogo, { ...cfgBase, patrones: ["empuje", "tiron"] }, crearRngConSemilla(60));
comprobar(tren.ok, "sesión de tren superior");
if (tren.ok) {
    comprobar(tren.valor.principal.every((a) => a.ejercicio.patron === "empuje" || a.ejercicio.patron === "tiron"), "tren superior: solo empuje y tirón");
    for (let i = 1; i < tren.valor.principal.length; i++) {
        comprobar(tren.valor.principal[i].ejercicio.patron !== tren.valor.principal[i - 1].ejercicio.patron, `tren superior: alterna patrones (pos ${i})`);
    }
}
// Pierna y glúteo con molestia de rodilla: la seguridad manda dentro de la zona.
const pierna = generarSesion(catalogo, { ...cfgBase, patrones: ["pierna"], molestias: ["rodilla"] }, crearRngConSemilla(61));
if (pierna.ok) {
    comprobar(pierna.valor.principal.every((a) => a.ejercicio.patron === "pierna" && !a.ejercicio.joints.includes("rodilla")), "pierna: zona + molestia respetadas a la vez");
}
else {
    comprobar(pierna.error.length > 0, "pierna con rodilla: si no queda pool, error controlado con mensaje");
}
// Zona vacía o ausente = todo el cuerpo (equivalentes).
const sinZona = generarSesion(catalogo, { ...cfgBase, patrones: [] }, crearRngConSemilla(62));
comprobar(sinZona.ok, "patrones vacío se comporta como todo el cuerpo");
// ---------- 8. Runner ----------
const planPrueba = generarSesion(catalogo, { ...cfgBase, durMin: 2 }, crearRngConSemilla(3));
comprobar(planPrueba.ok, "plan para el runner");
if (planPrueba.ok) {
    let estado = crearRunner(planPrueba.valor, 3);
    comprobar(estado.fase === "prep" && estado.restanteSec === 3, "runner: empieza en prep");
    // Consumir prep con ticks
    let r = reducirRunner(estado, { tipo: "TICK" });
    r = reducirRunner(r.estado, { tipo: "TICK" });
    r = reducirRunner(r.estado, { tipo: "TICK" });
    comprobar(r.estado.fase === "trabajo" && r.efectos.includes("AVISO_TRABAJO"), "runner: prep → trabajo con aviso");
    // Pausa congela el tiempo
    const pausado = reducirRunner(r.estado, { tipo: "PAUSAR" });
    const tickPausado = reducirRunner(pausado.estado, { tipo: "TICK" });
    comprobar(tickPausado.estado.restanteSec === r.estado.restanteSec, "runner: en pausa no corre el tiempo");
    // Correr hasta el final a base de ticks: debe terminar en "fin" y avisar
    let cursor = reducirRunner(pausado.estado, { tipo: "REANUDAR" }).estado;
    let avisosFin = 0;
    for (let i = 0; i < 100000 && cursor.fase !== "fin"; i++) {
        const paso = reducirRunner(cursor, { tipo: "TICK" });
        cursor = paso.estado;
        if (paso.efectos.includes("AVISO_FIN"))
            avisosFin++;
    }
    comprobar(cursor.fase === "fin" && avisosFin === 1, "runner: la sesión llega a fin con un único aviso");
    // Cuenta atrás audible: en una fase de trabajo de 40s deben sonar
    // exactamente 3 tics (en 3, 2 y 1) antes del cambio de fase.
    let enTrabajo = crearRunner(planPrueba.valor, 3);
    let paso2 = reducirRunner(enTrabajo, { tipo: "SALTAR" }); // directo a trabajo
    comprobar(paso2.estado.fase === "trabajo", "runner: SALTAR desde prep entra a trabajo");
    let tics = 0;
    let cursor2 = paso2.estado;
    while (cursor2.fase === "trabajo") {
        const r2 = reducirRunner(cursor2, { tipo: "TICK" });
        if (r2.efectos.includes("AVISO_CUENTA"))
            tics++;
        comprobar(!(r2.efectos.includes("AVISO_CUENTA") && cursor2.restanteSec - 1 > 3), "runner: el tic solo suena en los últimos 3 segundos");
        cursor2 = r2.estado;
    }
    comprobar(tics === 3, `runner: 3 tics de cuenta atrás por fase (sonaron ${tics})`);
    // Terminar anticipado
    const anticipado = reducirRunner(crearRunner(planPrueba.valor, 3), { tipo: "TERMINAR" });
    comprobar(anticipado.estado.fase === "fin", "runner: TERMINAR corta la sesión");
}
console.log(`OK · ${pruebas} comprobaciones pasadas.`);
