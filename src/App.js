import React, { useEffect } from 'react'
import { Provider } from 'react-redux'
import AppRouter from './routers/AppRouter'
import { store } from './store/store'
import { requestNotificationPermissionAndToken } from './firebase/firebase-config';

const App = () => {
  useEffect(() => {
    requestNotificationPermissionAndToken().then(token => {
      if (token) {
        console.log('Token FCM:', token);
        // Aquí puedes enviar el token a tu backend si lo necesitas
      }
    });
  }, []);

  return (
    <Provider store={store}>
      <AppRouter />
    </Provider>
  )
}

export default App

