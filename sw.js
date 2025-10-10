// Service Worker pour PWA - Les Gardiens du Jeu
const CACHE_NAME = 'gdj-cache-v1';
const STATIC_CACHE = 'gdj-static-v1';
const DYNAMIC_CACHE = 'gdj-dynamic-v1';

// Fichiers à mettre en cache lors de l'installation
const STATIC_FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/admin-extended.js',
  '/dashboard.js',
  '/dialogs.js',
  '/settings.js',
  '/soumissions.js',
  '/init-new-features.js',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Mise en cache des fichiers statiques');
        return cache.addAll(STATIC_FILES);
      })
      .catch((err) => {
        console.error('[SW] Erreur lors de la mise en cache:', err);
      })
  );
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Suppression du cache obsolète:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Stratégie de cache: Network First avec fallback sur cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ne pas intercepter les requêtes vers l'API GitHub et Netlify Functions
  if (request.url.includes('/.netlify/functions/') ||
      request.url.includes('api.github.com') ||
      request.url.includes('github.com')) {
    return; // Laisser passer sans interception
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cloner la réponse car elle ne peut être utilisée qu'une fois
        const responseClone = response.clone();

        // Mettre en cache dynamiquement les nouvelles ressources
        if (request.method === 'GET') {
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }

        return response;
      })
      .catch(() => {
        // Si le réseau échoue, chercher dans le cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Si pas dans le cache et que c'est une navigation, renvoyer index.html
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }

          // Sinon, retourner une réponse d'erreur basique
          return new Response('Contenu non disponible hors ligne', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

// Gestion des messages du client (pour la synchronisation en arrière-plan)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Synchronisation en arrière-plan (Background Sync API)
self.addEventListener('sync', (event) => {
  console.log('[SW] Synchronisation en arrière-plan:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(syncDataWithGitHub());
  }
});

// Fonction de synchronisation avec GitHub
async function syncDataWithGitHub() {
  try {
    console.log('[SW] Tentative de synchronisation avec GitHub...');

    // Récupérer les données en attente depuis IndexedDB ou localStorage
    const pendingData = await getPendingData();

    if (pendingData && pendingData.length > 0) {
      // Envoyer à la Netlify Function
      const response = await fetch('/.netlify/functions/github-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: pendingData })
      });

      if (response.ok) {
        console.log('[SW] Synchronisation réussie');
        await clearPendingData();

        // Notifier le client
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              message: 'Données synchronisées avec succès'
            });
          });
        });
      }
    }
  } catch (error) {
    console.error('[SW] Erreur lors de la synchronisation:', error);
    throw error; // Re-throw pour réessayer plus tard
  }
}

// Récupérer les données en attente (à adapter selon votre structure)
async function getPendingData() {
  // Cette fonction devra être adaptée selon votre implémentation
  return [];
}

// Effacer les données en attente après synchronisation
async function clearPendingData() {
  // À implémenter selon votre structure
  return true;
}

// Notifications push (optionnel, pour plus tard)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Les Gardiens du Jeu';
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.url || '/'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Gestion du clic sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});
