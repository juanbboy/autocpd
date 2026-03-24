
import { ref, set } from "firebase/database";
import { dbi } from "../firebase/firebase-config";

export const sendToken = async (currentToken) => {
    if (currentToken) {
        // Guarda el token en la base de datos para poder enviar notificaciones a este usuario
        await set(ref(dbi, `fcmTokens/${currentToken}`), {
            registeredAt: Date.now(),
            userAgent: navigator.userAgent
        });
    }
};
