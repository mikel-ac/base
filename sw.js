/* Service worker de Base. Sube el número de versión en cada despliegue
   (p. ej. base-v2, base-v3...) para forzar la actualización en el móvil. */
const CACHE = "base-v17";
const CORE = [
  "./", "./index.html", "./styles.css", "./manifest.webmanifest",
  "./dist/ui/main.js",
  "./icons/icon-192.png", "./icons/icon-512.png"
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
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
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res && (res.ok || res.type === "opaque")) {
          const cp = res.clone();
          caches.open(CACHE).then((c) => c.put(req, cp));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
