import { useEffect } from 'react';
import AppRouter from './router/AppRouter';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import { syncService } from './services/syncService';
import OfflineIndicator from './components/OfflineIndicator';

function App() {

  useEffect(() => {
    // NOTA: Service Workers deshabilitados temporalmente para desarrollo con HTTPS autofirmado
    // Los Service Workers tienen problemas con certificados SSL autofirmados
    // Para producción con certificados válidos, descomentar este código:

    /*
    if ('serviceWorker' in navigator) {
      // Service Worker principal para offline
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('✅ Service Worker principal registrado:', registration);
        })
        .catch((error) => {
          console.error('❌ Error registrando Service Worker principal:', error);
        });

      // Service Worker de Firebase para notificaciones
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('✅ Service Worker Firebase registrado:', registration);
        })
        .catch((error) => {
          console.error('❌ Error registrando Service Worker Firebase:', error);
        });
    }
    */

    // Iniciar servicio de sincronización automática
    syncService.start();
    console.log('🔄 Servicio de sincronización automática iniciado');

    // Registrar Background Sync (solo funciona con Service Workers activos)
    // syncService.registerBackgroundSync();

    // Limpiar al desmontar
    return () => {
      syncService.stop();
      console.log('🛑 Servicio de sincronización detenido');
    };
  }, []);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false}
        theme="light"
      />
      <OfflineIndicator />
      <AppRouter />
    </>
  );
}

export default App;

