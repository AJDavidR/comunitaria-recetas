// Versión del cache
const CACHE_VERSION = 'v1';
const CACHE_NAME = `cocina-comunitaria-${CACHE_VERSION}`;

// Archivos a cachear
const ARCHIVOS_CACHE = [
  '/',
  '/index.html',
  '/agregar.html',
  '/login.html',
  '/categorias.html',
  '/css/variables.css',
  '/css/styles.css',
  '/js/main.js',
  '/js/auth.js',
  '/js/recetas.js',
  '/js/modal.js',
  '/js/notificaciones.js',
  '/js/estadisticas.js',
  '/js/compartir.js',
  '/js/export-import.js',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(ARCHIVOS_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('cocina-comunitaria-') && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  // No cachear peticiones a la API
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then((response) => {
            // No cachear si no es una respuesta exitosa
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        // Si falla la petición y estamos offline, intentar servir del cache
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver más',
        icon: '/assets/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/assets/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Cocina Comunitaria', options)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Manejar sincronización en segundo plano
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-recetas') {
    event.waitUntil(sincronizarRecetas());
  }
});

// Función para sincronizar recetas
async function sincronizarRecetas() {
  try {
    const db = await openDB();
    const recetasPendientes = await db.getAll('recetas-pendientes');
    
    for (const receta of recetasPendientes) {
      try {
        const response = await fetch('/api/recetas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(receta)
        });

        if (response.ok) {
          await db.delete('recetas-pendientes', receta.id);
        }
      } catch (error) {
        console.error('Error sincronizando receta:', error);
      }
    }
  } catch (error) {
    console.error('Error en sincronización:', error);
  }
}

// Función auxiliar para abrir IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CocinaComunitaria', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('recetas-pendientes')) {
        db.createObjectStore('recetas-pendientes', { keyPath: 'id' });
      }
    };
  });
} 