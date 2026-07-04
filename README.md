# Base · App completa (lógica + capa visual "Bloques")

App **Base** (entrenamiento en casa): modelo de datos, lógica pura, Clean
Architecture, y la capa visual "Bloques" (GUIA_DISENO_Base.md): acento verde,
Space Grotesk + Inter, tarjetas redondeadas con sombra suave, claro/oscuro
conmutable (por defecto sigue el sistema; en Ajustes se puede forzar y se
guarda localmente), micro-animaciones finas (entrada escalonada, indicador de
navegación deslizante, anillo del cronómetro, puntitos del objetivo) con
respeto a prefers-reduced-motion, y rojo tenue reservado en exclusiva a la
advertencia "Evita". Pantalla nueva: **Ajustes** (nombre, objetivo semanal,
molestias permanentes, apariencia), accesible desde la cabecera de Inicio.

## Cómo verla en el navegador

1. `npm install`   (solo instala TypeScript)
2. `npm run build` (compila a `dist/`)
3. Servir la carpeta con cualquier servidor local, p. ej.:
   `npx serve .`  o  `python3 -m http.server 8000`
   y abrir `http://localhost:8000` (con `file://` no funciona: los módulos
   ES y IndexedDB necesitan un servidor).

Para GitHub Pages: subir el proyecto CON la carpeta `dist/` generada
(o compilar antes de cada publicación). `index.html` carga
`./dist/ui/inicio.js` directamente, sin bundler: lo que compila `tsc`
funciona tal cual en el navegador.

## Pantallas

- **Inicio** (`src/ui/vista-inicio.ts`): hecha. "Usar sugerencia" y los
  chips de minutos generan la sesión y entran directos al entrenamiento;
  "Ver detalle" enseña el listado completo con Regenerar y Empezar.
- **Sesión** (`src/ui/vista-sesion.ts`): hecha. Cronómetro con fases
  (prepárate / trabajo / descanso), pitidos con botón de silencio y
  cuenta atrás audible en 3-2-1, pausar, saltar y terminar. Desde el
  cronómetro: "Ver toda la sesión" (lista con el actual resaltado y los
  hechos marcados) y "Ver detalle del ejercicio". Abrir cualquier panel
  pausa el tiempo; al cerrar se reanuda solo si no estaba ya en pausa.
- **Detalle de ejercicio** (`src/ui/detalle-ejercicio.ts`): hecha (§4).
  Variante que toca, demostración visual (§10: clip propio de media/ si
  existe → dibujos/fotos del catálogo → nombre), claves, evita y consejo.
  Accesible desde el cronómetro y tocando cualquier ejercicio en las
  listas (previa y en marcha).
- **Registro** (`src/ui/vista-registrar.ts`): hecha. Valoración opcional
  (fácil / en su punto / dura), kcal y nota; al guardar se ajusta el nivel
  ("subir despacio, bajar rápido") y se vuelve a inicio, ya actualizado.
- **Configurador "montar a medida"** (`src/ui/vista-configurador.ts`):
  hecha. Enfoques, nivel de hoy (Suave · Mi nivel · Fuerte, solo para hoy),
  material, bajo impacto, "hoy me molesta" plegable, tiempos con − / + y
  línea viva de nº de ejercicios. "Generar sesión" abre el detalle con
  Regenerar/Empezar; "Guardar como plan" persiste la configuración.
- **Historial** (`src/ui/vista-historial.ts`): hecha. Sesiones agrupadas
  por día ("Hoy", "Ayer", fecha) con totales de minutos y kcal. Tocar una
  sesión abre su detalle (ejercicios realizados, valoración, kcal, nota),
  y desde ahí cada ejercicio abre su ficha.
- **Planes** (`src/ui/vista-planes.ts`): hecha. Usar (genera sesión fresca),
  Ajustar (carga la configuración en el configurador) y Borrar. A propósito,
  un plan NO recupera ni el nivel (se usa siempre el actual, para no
  congelar la adaptación) ni las molestias del día en que se guardó.
- **Progreso** (`src/ui/vista-progreso.ts`): hecha. Nivel de intensidad
  (barra informativa 1.0–3.0, no editable), resumen de la semana con
  tendencia y semanas cumplidas, gráfica de 8 semanas (altura = minutos,
  número = sesiones, barra oscura = objetivo cumplido) y distribución de
  las últimas 10 valoraciones.

Las 7 pantallas del PRD están completas. Siguiente fase: laboratorio de
estilo (personalidad visual sobre esta estructura neutra).

## Zona de trabajo (extensión post-PRD)

El configurador permite limitar la sesión a una zona: Todo el cuerpo
(por defecto), Core, Pierna y glúteo, o Tren superior (empuje + tirón).
Por debajo es un filtro opcional de patrones en ConfigSesion (`patrones`),
de una línea en el motor: molestias, material, nivel, variantes y circuito
funcionan igual dentro de la zona. El calentamiento sigue siendo general
y los planes guardados conservan la zona.

El ciclo completo ya funciona: inicio → generar → entrenar → registrar →
inicio (con el objetivo semanal, la última sesión y el nivel al día).

## Cómo está organizado (Clean Architecture)

```
src/
├── core/        Utilidades puras: Resultado, clamp, uuid, RNG con semilla, fechas/semana ISO
├── domain/      EL NÚCLEO. No conoce IndexedDB ni UI. Aquí viven las reglas del PRD.
│   ├── entities/       Usuario, Ejercicio, Sesion, Metricas, Sugerencia, ConfigSesion, PlanGuardado
│   ├── repositories/   INTERFACES (contratos) de acceso a datos
│   └── usecases/       generar-sesion (§6) · ajustar-nivel (§7) · filtros/molestias (§8)
│                       sugerir-hoy (§9) · calcular-metricas (§5.4) · registrar-sesion
│                       editar-plan (mover/quitar/sustituir, §4) · resolver-media (§10)
├── data/        Implementa los contratos del dominio.
│   ├── seed/           catalogo.ts (generado del JSON) + cargar-catalogo.ts (valida y traduce)
│   ├── datasources/    indexeddb.ts — el ÚNICO archivo que sabe que existe IndexedDB
│   └── repositories/   usuarios/sesiones/planes → IndexedDB · catálogo → memoria
├── ui/          Capa de presentación (pantallas estructurales; solo pintar y conectar)
├── state/       Contratos de estado para la UI (sin vistas):
│                Store genérico · InicioStore · ConfiguradorStore · RunnerStore
│                HistorialStore · PlanesStore
├── scripts/     sanity.ts — pruebas de humo de toda la lógica contra el catálogo real
└── app.ts       Raíz de composición: el único sitio donde se enchufan las piezas
```

Regla de dependencias: `state → domain ← data`. El dominio no importa nada de
fuera. Cambiar IndexedDB por SQLite = escribir nuevos repositorios y tocar
solo `app.ts`.

## Cómo usarlo desde la futura UI

```ts
import { crearApp } from "./app.js";

const app = await crearApp();

// Pantalla de Inicio
app.stores.inicio.suscribir((estado) => pintarInicio(estado));
await app.stores.inicio.cargar();

// Configurador → generar → runner
const usuario = app.stores.inicio.obtener().usuario!;
const catalogo = await app.repos.ejercicios.todos();
const res = app.stores.configurador.generar(catalogo, usuario);
if (!res.ok) { mostrarAviso(res.error); }        // "elige al menos un enfoque", etc.
else {
  const runner = new RunnerStore(res.valor);
  runner.suscribir((s) => pintarRunner(s));
  const reloj = setInterval(() => {
    const efectos = runner.despachar({ tipo: "TICK" });
    if (efectos.includes("AVISO_TRABAJO")) sonarBeep();   // con TU control de volumen
    if (runner.obtener().fase === "fin") clearInterval(reloj);
  }, 1000);
}

// Registrar al terminar (aquí se ajusta el nivel: subir despacio, bajar rápido)
await app.usecases.registrarSesion.ejecutar(usuario, res.valor, {
  valoracion: "en_su_punto", kcal: null, nota: "",
});
```

## Comandos

- `npm run check`  → comprueba tipos (sin generar nada)
- `npm run sanity` → compila y ejecuta ~26.000 comprobaciones de las reglas del PRD

## Decisiones importantes (resumen)

1. **TypeScript sin framework**: los tipos son los contratos entre capas; la UI queda libre.
2. **Catálogo embebido, no en IndexedDB**: es dato de solo lectura que viaja y se
   versiona con la app. `cargar-catalogo.ts` lo valida al arrancar y traduce sus
   campos (inglés) al dominio (español).
3. **Materiales = alternativas**: basta con tener UNO de los listados (así está el
   catálogo: el remo vale con goma o con banda). Vacío = peso corporal.
4. **Métricas siempre calculadas**, nunca guardadas: imposible que se desincronicen.
5. **Runner como máquina de estados pura**: sin setInterval ni sonidos dentro; la UI
   pone el reloj y ejecuta los efectos (beeps con su volumen).
6. **RNG inyectable**: misma semilla → misma sesión → lógica probable de verdad.
7. **Supuestos marcados** en el código donde el PRD no fijaba detalle: nº de
   ejercicios de calentamiento (~1/min, entre 2 y 5), ventanas de métricas
   (10 valoraciones, 8 semanas), umbral de tendencia (±0,5 sesiones/semana).
   Cada uno vive en una función pequeña, fácil de ajustar.
8. **PlanGuardado** añadido como entidad mínima: el §4 pide la pantalla "planes
   guardados" y necesitaba dónde persistir. Guarda la configuración, no los
   ejercicios: cada recarga genera una sesión fresca.
9. **Edición de sesión sin re-equilibrar**: al mover/quitar/sustituir NO se
   re-aplican las reglas de equilibrio (la elección manual del usuario
   prevalece, principio del PRD); solo se valida seguridad y viabilidad al
   sustituir (molestias, material, variante para el nivel).
10. **Énfasis conectado**: la sugerencia del día pasa su patrón al generador
    como un sesgo (~1 hueco extra en el reparto). Nunca salta los filtros de
    seguridad, y retocar los enfoques a mano lo desactiva.
