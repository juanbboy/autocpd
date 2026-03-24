import { requestNotificationPermissionAndToken } from "../services/token";
import { useEffect, useState } from "react";
import { listenForMessages } from "../services/fcm";

export const useFCM = () => {
    const [token, setToken] = useState(null);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        requestNotificationPermissionAndToken().then(setToken);

        const unsubscribe = listenForMessages((payload) => {
            setNotification(payload);
        });

        return () => unsubscribe();
    }, []);

    return { token, notification };
};
