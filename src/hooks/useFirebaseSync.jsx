// import React from 'react'

// const useFirebaseSync = (setImgStates, ignoreNext, isFirstLoad)= => {
//   useEffect(() => {
//     // Escucha cambios en la base de datos y actualiza el estado local
//     const handler = onValue(dbRef, (snapshot) => {
//       const remote = snapshot.val();
//       if (remote && typeof remote === "object" && Object.keys(remote).length > 0) {
//         ignoreNext.current = true;
//         setImgStates(remote);
//       }
//       isFirstLoad.current = false;
//     });
//     return () => off(dbRef, "value", handler);
//   }, [setImgStates, ignoreNext, isFirstLoad]);
// }

// export default useFirebaseSync