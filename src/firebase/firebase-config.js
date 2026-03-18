import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";          // Para Cloud Firestore
import { getAuth } from "firebase/auth"; // Para autenticación
// --- Sincronización en tiempo real usando Firebase Realtime Database ---
import { getDatabase, ref, onValue, off } from "firebase/database";

// --- Firebase Cloud Messaging (FCM) ---
// import { getMessaging } from "firebase/messaging";
import { useEffect } from "react";

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

// Inicializa la app de Firebase y la referencia a la base de datos
const app = initializeApp(firebaseConfig);
export const dbi = getDatabase(app);
export const dbRef = ref(dbi, "imgStates");
export const db = getFirestore(app);
export const auth = getAuth(app);


// Custom hook para sincronización en tiempo real
export function useFirebaseSync(setImgStates, ignoreNext, isFirstLoad) {
  useEffect(() => {
    // Escucha cambios en la base de datos y actualiza el estado local
    const handler = onValue(dbRef, (snapshot) => {
      const remote = snapshot.val();
      if (remote && typeof remote === "object" && Object.keys(remote).length > 0) {
        ignoreNext.current = true;
        setImgStates(remote);
      }
      isFirstLoad.current = false;
    });
    return () => off(dbRef, "value", handler);
  }, [setImgStates, ignoreNext, isFirstLoad]);
}