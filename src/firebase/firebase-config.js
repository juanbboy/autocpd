import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase, ref } from "firebase/database";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL // URL de la base de datos Realtime
};

const app = initializeApp(firebaseConfig);
export const dbi = getDatabase(app);
export const dbRef = ref(dbi, "imgStates");
export const db = getFirestore(app);
export const auth = getAuth(app);
export const messaging = getMessaging(app);

export const requestNotificationPermissionAndToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await messaging.getToken({
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
