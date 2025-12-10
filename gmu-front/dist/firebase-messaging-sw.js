// Firebase Messaging Service Worker
// Este archivo maneja las notificaciones cuando la app está cerrada o en background

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCpqccsDBPIsCGFzNcCw0IOo7i34GX8D_c",
  authDomain: "grocerydelivery-pro.firebaseapp.com",
  projectId: "grocerydelivery-pro",
  storageBucket: "grocerydelivery-pro.firebasestorage.app",
  messagingSenderId: "244265753932",
  appId: "1:244265753932:web:4cc30df026abeab0a583e9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'GroceryDelivery Pro';
  const notificationOptions = {
    body: payload.notification?.body || 'Nueva notificación',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: payload.data?.tag || 'default',
    data: payload.data,
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received:', event);

  event.notification.close();

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si hay una ventana abierta, enfócala
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abre una nueva
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
