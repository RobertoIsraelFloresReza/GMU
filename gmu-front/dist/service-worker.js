/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'grocery-delivery-v2';
const RUNTIME_CACHE = 'grocery-delivery-runtime-v2';

// URLs críticas para cachear en instalación
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Instalando v2...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Cacheando recursos principales');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('[Service Worker] Error al cachear:', error);
            })
    );
    self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activando v2...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                        console.log('[Service Worker] Eliminando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Estrategia de caché mejorada
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorar requests que no sean GET
    if (request.method !== 'GET') return;

    // Ignorar requests a la API (siempre ir a red)
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Ignorar chrome extensions y requests externos no relacionados
    if (url.origin !== self.location.origin) {
        return;
    }

    // Para assets estáticos (JS, CSS, imágenes): Cache First
    if (request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'image' ||
        request.destination === 'font') {

        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        console.log('[Service Worker] ✅ Sirviendo desde caché:', request.url);
                        return cachedResponse;
                    }

                    // Si no está en caché, obtener de red y cachear
                    return fetch(request)
                        .then((response) => {
                            if (response && response.status === 200) {
                                const responseToCache = response.clone();
                                caches.open(RUNTIME_CACHE).then((cache) => {
                                    cache.put(request, responseToCache);
                                });
                            }
                            return response;
                        })
                        .catch(() => {
                            console.log('[Service Worker] ❌ Recurso no disponible offline:', request.url);
                        });
                })
        );
        return;
    }

    // Para navegación (HTML): Network First con fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cachear la respuesta para uso offline
                    const responseToCache = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    // Si falla la red, servir desde caché o index.html
                    return caches.match(request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // Fallback a index.html para SPA routing
                            return caches.match('/index.html');
                        });
                })
        );
        return;
    }

    // Para el resto: Network First, fallback a Cache
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response && response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        console.log('[Service Worker] Sirviendo desde caché:', request.url);
                        return cachedResponse;
                    }

                    return new Response('Recurso no disponible offline', {
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

// Background Sync para sincronización automática
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] 🔄 Evento de sincronización recibido:', event.tag);

    if (event.tag === 'sync-orders') {
        event.waitUntil(syncOrders());
    }
});

async function syncOrders() {
    try {
        console.log('[Service Worker] 📦 Sincronizando pedidos offline...');

        // Notificar a todos los clientes que se debe sincronizar
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_ORDERS',
                timestamp: new Date().toISOString()
            });
        });

        return Promise.resolve();
    } catch (error) {
        console.error('[Service Worker] ❌ Error en sincronización:', error);
        return Promise.reject(error);
    }
}

// Push Notifications
self.addEventListener('push', (event) => {
    console.log('[Service Worker] 📬 Push recibido');

    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'GroceryDelivery Pro', body: event.data.text() };
        }
    }

    const title = data.title || 'GroceryDelivery Pro';
    const options = {
        body: data.body || 'Nueva notificación',
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'notification',
        data: data.data || {},
        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] 🔔 Notificación clickeada');
    event.notification.close();

    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Buscar ventana ya abierta
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Si no hay ventana abierta, abrir nueva
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Mensaje desde la app
self.addEventListener('message', (event) => {
    console.log('[Service Worker] 💬 Mensaje recibido:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
        const urls = event.data.urls || [];
        event.waitUntil(
            caches.open(RUNTIME_CACHE).then((cache) => {
                return cache.addAll(urls);
            })
        );
    }
});
