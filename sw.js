// sw.js - Service Worker per notifiche in background

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Ascolta i messaggi inviati dalla web app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SCHEDULE_LANDING') {
        const delay = event.data.delayMs;
        const flightInfo = event.data.flightInfo;

        // Programma la notifica di atterraggio
        setTimeout(() => {
            self.registration.showNotification('🛬 Atterraggio Completato!', {
                body: `Sei arrivato a ${flightInfo.arr}. La tua sessione di focus è conclusa con successo!`,
                icon: 'https://fav.farm/✈️',
                badge: 'https://fav.farm/✈️',
                vibrate: [200, 100, 200],
                tag: 'flight-landing',
                renotify: true,
                data: { url: self.location.origin }
            });
        }, delay);
    }
});

// Cliccando sulla notifica si riapre l'app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow('/');
        })
    );
});