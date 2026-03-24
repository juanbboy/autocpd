import { onMessage } from "firebase/messaging";
import { messaging } from "../firebase/firebase-config";

export const listenForMessages = (callback) => {
    onMessage(messaging, (payload) => {
        console.log('Mensaje recibido:', payload);
        callback(payload);
    })
}