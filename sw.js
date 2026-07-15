/* Service worker de Base.
   Sube el número de APP_CACHE en cada despliegue (base-v26, base-v27…) para
   forzar la actualización en el móvil.

   DOS cachés separadas:
   - APP_CACHE (versionada): código, estilos, iconos. Se borra y regenera en
     cada versión para que las actualizaciones lleguen limpias.
   - MEDIA_CACHE (persistente): los vídeos/imágenes de ./media/. NO se borra
     al actualizar la app: los vídeos no cambian con el código y volver a
     bajar cientos de MB tras cada versión sería un despilfarro. */
const APP_CACHE = "base-v26";
const MEDIA_CACHE = "base-media";
const CORE = [
  "./", "./index.html", "./styles.css", "./manifest.webmanifest",
  "./dist/ui/main.js",
  "./icons/icon-192.png", "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(APP_CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(
        ks.filter((k) => k !== APP_CACHE && k !== MEDIA_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  // Dejar pasar SIN tocar todo lo que no sea de nuestro propio origen:
  // el SDK de Firebase (gstatic), Auth (Google) y Firestore deben ir directos
  // a la red. Interceptarlos rompería el login y la sincronización.
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Peticiones parciales (Range) de <video>: van directas a la red. La Cache
  // API no admite respuestas 206 y contestarlas desde caché rompe el seek.
  if (req.headers.has("range")) return;

  const esMedia = url.pathname.includes("/media/");
  const cacheDestino = esMedia ? MEDIA_CACHE : APP_CACHE;

  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          // Solo se cachean respuestas completas y correctas (200).
          if (res && res.status === 200) {
            const cp = res.clone();
            caches.open(cacheDestino).then((c) => c.put(req, cp)).catch(() => { /* sin hueco */ });
          }
          return res;
        })
        .catch(() => {
          if (hit) return hit;
          // Sin red y sin caché: para navegaciones, la cáscara de la app.
          if (req.mode === "navigate") return caches.match("./index.html");
          return Response.error();
        });
      return hit || net;
    })
  );
});
