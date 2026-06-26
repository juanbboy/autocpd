// import { useEffect } from 'react';
// import { onValue, off } from 'firebase/database';

// const useFirebaseSync = (dbRef, setImgStates, ignoreNext, isFirstLoad) => {
//     useEffect(() => {
//         const handler = onValue(dbRef, (snapshot) => {
//             const remote = snapshot.val();
//             if (remote && typeof remote === "object" && Object.keys(remote).length > 0) {
//                 ignoreNext.current = true;
//                 setImgStates(remote);
//             }
//             isFirstLoad.current = false;
//         });
//         return () => off(dbRef, "value", handler);
//     }, [dbRef, setImgStates, ignoreNext, isFirstLoad]);
// };

// export default useFirebaseSync;


import { useEffect } from 'react';
import { onValue } from 'firebase/database'; // 'off' ya no es necesario con el retorno de onValue

const useFirebaseSync = (dbRef, setImgStates, ignoreNext, isFirstLoad) => {
    useEffect(() => {
        // 1. Escuchar los datos en tiempo real
        const unsubscribe = onValue(dbRef, (snapshot) => {
            const remote = snapshot.val();

            if (remote && typeof remote === "object" && Object.keys(remote).length > 0) {
                // Bloquea temporalmente el envío local hacia Firebase
                ignoreNext.current = true;
                setImgStates(remote);
            }

            isFirstLoad.current = false;
        });

        // 2. CORRECCIÓN: onValue devuelve directamente la función de limpieza
        return () => unsubscribe();
    }, [dbRef, setImgStates, ignoreNext, isFirstLoad]);
};

export default useFirebaseSync;
