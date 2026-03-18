import { useEffect } from 'react';
import { onValue, off } from 'firebase/database';

const useFirebaseSync = (dbRef, setImgStates, ignoreNext, isFirstLoad) => {
    useEffect(() => {
        const handler = onValue(dbRef, (snapshot) => {
            const remote = snapshot.val();
            if (remote && typeof remote === "object" && Object.keys(remote).length > 0) {
                ignoreNext.current = true;
                setImgStates(remote);
            }
            isFirstLoad.current = false;
        });
        return () => off(dbRef, "value", handler);
    }, [dbRef, setImgStates, ignoreNext, isFirstLoad]);
};

export default useFirebaseSync;