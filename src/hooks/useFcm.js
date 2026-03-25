import { requestNotificationPermissionAndToken } from "./useToken";
import { useEffect } from "react";
import { listenForMessages } from "../services/fcm";
import { sendToken } from "../services/sendtoken";

export const useFCM = () => {

    useEffect(() => {
        const init = async () => {
            const token = await requestNotificationPermissionAndToken();
            if (token) {
                sendToken(token);
            }
        };
        init();
        const unsubscribe = listenForMessages(() => { });

        return () => unsubscribe();
    }, []);
};


// import { requestNotificationPermissionAndToken } from "./useToken";
// import { useEffect, useState } from "react";
// import { listenForMessages } from "../services/fcm";
// import { sendToken } from "../services/sendtoken";

// export const useFCM = () => {
//     const [token, setToken] = useState(null);
//     const [notification, setNotification] = useState(null);

//     useEffect(() => {
//         requestNotificationPermissionAndToken().then((token) => {
//             setToken(token);
//             sendToken(token);
//         });

//         const unsubscribe = listenForMessages((payload) => {
//             setNotification(payload);
//         });

//         return () => unsubscribe();
//     }, []);

//     return { token, notification };
// };