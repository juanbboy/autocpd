import { getToken } from "firebase/messaging";
import { messaging } from "../firebase/firebase-config";

export const requestNotificationPermissionAndToken = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const currentToken = await getToken(messaging, {
                vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js')
            });
            return currentToken;
        } else {
            throw new Error('Permiso de notificaciones denegado');
        }
    } catch (error) {
        console.error('Error al obtener el token de notificaciones:', error);
        return null;
    }
};






//  useEffect(() => {
//         if (!messaging) return;
//         const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
//         if (isIOS && !window.matchMedia('(display-mode: standalone)').matches) {
//             return;
//         }
//         navigator.serviceWorker
//             .getRegistration('/firebase-messaging-sw.js')
//             .then((registration) => {
//                 if (!registration) {
//                     return navigator.serviceWorker.register('/firebase-messaging-sw.js');
//                 }
//                 return registration;
//             })
//             .then((registration) => {
//                 getToken(messaging, {
//                     vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
//                     serviceWorkerRegistration: registration,
//                 })
//                     .then((currentToken) => {
//                         if (currentToken) {
//                             setFcmToken(currentToken);
//                             // Guarda el token en la base de datos para poder enviar notificaciones a este usuario
//                             set(ref(db, `fcmTokens/${currentToken}`), {
//                                 registeredAt: Date.now(),
//                                 userAgent: navigator.userAgent
//                             });
//                         }
//                     })
//                     .catch((err) => {
//                         console.log("An error occurred while retrieving token. ", err);
//                     });
//             });
//     }, [messaging]);
