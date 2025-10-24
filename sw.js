// =======================================================
// 🧩 A. CONFIGURACIÓN INICIAL
// =======================================================

// Nombre de la caché (cámbialo cuando actualices archivos)
const CACHE_NAME = 'cocktail-pwa-v3';

// Lista de archivos del App Shell que se precachean
// (Estos son los recursos esenciales de tu app)
const appShellAssets = [
  './',                 // raíz
  './index.html',
  './main.js',
  './styles/main.css',
  './scripts/app.js',
  './manifest.json'
];

// Fallback JSON para la API cuando no haya conexión
const OFFLINE_COCKTAIL_JSON = {
  drinks: [{
    idDrink: "00000",
    strDrink: "🚫 ¡Sin Conexión ni Datos Frescos!",
    strTags: "FALLBACK",
    strCategory: "Desconectado",
    strInstructions:
      "No pudimos obtener resultados en este momento. Este es un resultado genérico para demostrar que la aplicación NO SE ROMPE. Intenta conectarte de nuevo.",
    strDrinkThumb: "https://via.placeholder.com/200x300?text=OFFLINE",
    strIngredient1: "Service Worker",
    strIngredient2: "Fallback JSON"
  }]
};

// =======================================================
// ⚙️ B. CICLO DE VIDA: INSTALACIÓN (PRECACHE)
// =======================================================

self.addEventListener('install', event => {
  console.log('[SW] ⚙️ Instalando y precacheando el App Shell...');

  // Abrimos la caché y guardamos los recursos del App Shell
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 📦 Archivos guardados en caché:', appShellAssets);
        return cache.addAll(appShellAssets);
      })
      .then(() => self.skipWaiting()) // Forzamos activación inmediata
  );
});

// =======================================================
// 🚀 C. CICLO DE VIDA: ACTIVACIÓN
// =======================================================

self.addEventListener('activate', event => {
  console.log('[SW] 🚀 Service Worker activado.');

  // Limpiamos versiones antiguas del caché
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log(`[SW] 🧹 Borrando caché antigua: ${key}`);
          return caches.delete(key);
        }
      }))
    ).then(() => self.clients.claim())
  );
});

// =======================================================
// 🌐 D. CICLO DE VIDA: FETCH (ESTRATEGIAS DE CACHE)
// =======================================================

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // --- ESTRATEGIA 1: CACHE ONLY para el App Shell ---
  const isAppShellRequest = appShellAssets.some(asset =>
    // Comprobamos si la ruta termina con el nombre del archivo del App Shell
    requestUrl.pathname.endsWith(asset.replace('./', ''))
  );

  if (isAppShellRequest) {
    console.log(`[SW] 🗂 App Shell desde caché: ${requestUrl.pathname}`);
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || new Response('Archivo del App Shell no encontrado', { status: 404 });
      })
    );
    return; // salimos del evento
  }

  // --- ESTRATEGIA 2: NETWORK FIRST con fallback JSON (para la API) ---
  if (requestUrl.host === 'www.thecocktaildb.com' &&
      requestUrl.pathname.includes('/search.php')) {
    console.log('[SW] 🌐 API Network First con fallback JSON');

    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Si la respuesta es válida, la devolvemos
          if (response.ok) return response;

          // Si no es válida, devolvemos el fallback JSON
          console.warn('[SW] ⚠️ Respuesta no válida, usando JSON de fallback');
          return new Response(JSON.stringify(OFFLINE_COCKTAIL_JSON), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
        .catch(() => {
          // Si no hay red, devolvemos el JSON de fallback
          console.warn('[SW] ❌ Sin conexión, usando JSON de fallback');
          return new Response(JSON.stringify(OFFLINE_COCKTAIL_JSON), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // --- ESTRATEGIA 3: CACHE FIRST con actualización (para otros recursos) ---
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Si el recurso está en caché, lo devolvemos inmediatamente
        if (cachedResponse) {
          console.log(`[SW] 📁 Recurso desde caché: ${requestUrl.pathname}`);
          return cachedResponse;
        }

        // Si no está en caché, intentamos obtenerlo de la red
        return fetch(event.request)
          .then(networkResponse => {
            // Guardamos una copia en caché para el futuro
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
              console.log(`[SW] 💾 Guardado en caché: ${requestUrl.pathname}`);
              return networkResponse;
            });
          });
      })
      .catch(() => {
        // Si no hay red ni caché, devolvemos una respuesta vacía o aviso
        console.warn(`[SW] ⚠️ Sin conexión ni caché disponible: ${requestUrl.pathname}`);
        return new Response('Recurso no disponible offline.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});
