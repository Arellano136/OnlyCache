// =======================================================
// 🧩 A. CONFIGURACIÓN INICIAL
// =======================================================

const CACHE_NAME = 'cocktail-pwa-v3';
const API_CACHE = 'cocktail-api-v1';

const appShellAssets = [
  './',
  './index.html',
  './main.js',
  './styles/main.css',
  './scripts/app.js',
  './manifest.json',
  './img/icons/192.png',
  './img/icons/512.png'
];

// Fallback JSON para cuando no hay datos
const OFFLINE_COCKTAIL_JSON = {
  drinks: [{
    idDrink: "00000",
    strDrink: "🚫 Sin Conexión",
    strCategory: "Desconectado",
    strAlcoholic: "N/A",
    strInstructions: "No hay resultados disponibles. Intenta conectarte de nuevo o busca algo que hayas consultado antes.",
    strDrinkThumb: "https://via.placeholder.com/200x300?text=OFFLINE"
  }]
};

// =======================================================
// ⚙️ B. CICLO DE VIDA: INSTALACIÓN
// =======================================================

self.addEventListener('install', event => {
  console.log('[SW] ⚙️ Instalando y precacheando el App Shell...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 📦 Archivos guardados en caché:', appShellAssets);
        return cache.addAll(appShellAssets);
      })
      .then(() => self.skipWaiting())
  );
});

// =======================================================
// 🚀 C. CICLO DE VIDA: ACTIVACIÓN
// =======================================================

self.addEventListener('activate', event => {
  console.log('[SW] 🚀 Service Worker activado.');

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME && key !== API_CACHE) {
          console.log(`[SW] 🧹 Borrando caché antigua: ${key}`);
          return caches.delete(key);
        }
      }))
    ).then(() => self.clients.claim())
  );
});

// =======================================================
// 🌐 D. CICLO DE VIDA: FETCH
// =======================================================

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // --- ESTRATEGIA 1: CACHE ONLY para el App Shell ---
  const isAppShellRequest = appShellAssets.some(asset => {
    const assetPath = asset.replace('./', '');
    return assetPath === '' ? 
      requestUrl.pathname === '/' || requestUrl.pathname.endsWith('/index.html') :
      requestUrl.pathname.endsWith(assetPath);
  });

  if (isAppShellRequest) {
    console.log(`[SW] 🗂 App Shell desde caché: ${requestUrl.pathname}`);
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || new Response('Archivo del App Shell no encontrado', { status: 404 });
      })
    );
    return;
  }

  // --- ESTRATEGIA 2: NETWORK FIRST + CACHE para la API de cócteles ---
  if (requestUrl.hostname === 'www.thecocktaildb.com' && 
      requestUrl.pathname === '/api/json/v1/1/search.php') {
    
    console.log('[SW] 🌐 API - Network First + Cache');

    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Si la respuesta es válida, la cacheamos y la devolvemos
          if (response.ok) {
            console.log('[SW] ✅ Respuesta de API válida, guardando en caché...');
            const responseClone = response.clone();
            caches.open(API_CACHE).then(cache => {
              cache.put(event.request, responseClone);
            });
            return response;
          } else {
            // Si no es 200, intentamos usar caché
            console.warn('[SW] ⚠️ API retornó error, buscando en caché...');
            return caches.match(event.request).then(cached => {
              if (cached) {
                console.log('[SW] 📁 Devolviendo respuesta cacheada de la API');
                return cached;
              }
              // Si no hay caché, devolvemos fallback
              return new Response(JSON.stringify(OFFLINE_COCKTAIL_JSON), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              });
            });
          }
        })
        .catch(() => {
          // Sin conexión: intentamos caché, si no hay, fallback
          console.warn('[SW] ❌ Sin conexión, intentando caché o fallback');
          return caches.match(event.request).then(cached => {
            if (cached) {
              console.log('[SW] 📁 Devolviendo respuesta cacheada de la API (offline)');
              return cached;
            }
            console.log('[SW] 🚫 Usando JSON fallback');
            return new Response(JSON.stringify(OFFLINE_COCKTAIL_JSON), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // --- ESTRATEGIA 3: CACHE FIRST para otros recursos ---
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log(`[SW] 📁 Recurso desde caché: ${requestUrl.pathname}`);
          return cachedResponse;
        }

        return fetch(event.request)
          .then(networkResponse => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
              console.log(`[SW] 💾 Guardado en caché: ${requestUrl.pathname}`);
            });
            return networkResponse;
          });
      })
      .catch(() => {
        console.warn(`[SW] ⚠️ Sin conexión ni caché: ${requestUrl.pathname}`);
        return new Response('Recurso no disponible offline.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});