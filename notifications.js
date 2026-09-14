// notifications.js - Gestore Notifiche Live

let swRegistration = null;

// Inizializza e registra il Service Worker
async function initNotifications() {
    if ('serviceWorker' in navigator && 'Notification' in window) {
        try {
            swRegistration = await navigator.serviceWorker.register('sw.js');
            console.log('[Notification System] Service Worker registrato con successo.');
        } catch (error) {
            console.error('[Notification System] Errore di registrazione SW:', error);
        }
    }
}

// Richiede il permesso all'utente (se non ancora concesso)
async function requestNotificationPermission() {
    if (!('Notification' in window)) return false;

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

// Programma la notifica di arrivo all'avvio del volo
async function scheduleLandingNotification(durationMs, depName, arrName) {
    const hasPermission = await requestNotificationPermission();
    
    if (hasPermission && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_LANDING',
            delayMs: durationMs,
            flightInfo: { dep: depName, arr: arrName }
        });
    }
}

// Inizializza all'avvio
initNotifications();