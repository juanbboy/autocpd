importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Inicializa Firebase en el Service Worker
firebase.initializeApp({
    apiKey: "AIzaSyAxk3KtvIQqmFGoWukQcZ6DIvWCX_DknRQ",
    authDomain: "autocpd-a397e.firebaseapp.com",
    projectId: "autocpd-a397e",
    messagingSenderId: "239234311497",
    appId: "1:239234311497:web:92c84e8d8d9a63f24d2698",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});