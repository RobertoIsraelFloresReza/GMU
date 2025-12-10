import { useEffect, useState } from 'react';
import { requestNotificationPermission, onMessageListener } from '../config/firebase';
import { toast } from 'react-toastify';
import axios from 'axios';

/**
 * Hook personalizado para manejar notificaciones push
 */
const useNotifications = () => {
  const [fcmToken, setFcmToken] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    // Verificar si las notificaciones están soportadas
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones de escritorio');
      return;
    }

    // Verificar si ya se tiene permiso
    if (Notification.permission === 'granted') {
      setPermissionGranted(true);
      initializeNotifications();
    }
  }, []);

  /**
   * Inicializar notificaciones y obtener token
   */
  const initializeNotifications = async () => {
    try {
      const token = await requestNotificationPermission();

      if (token) {
        setFcmToken(token);
        setPermissionGranted(true);

        // Guardar el token en el backend
        await saveFcmTokenToBackend(token);

        // Escuchar mensajes en foreground
        listenForMessages();
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  /**
   * Guardar el FCM token en el backend
   */
  const saveFcmTokenToBackend = async (token) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const authToken = localStorage.getItem('token');

      if (!user || !authToken) {
        console.warn('User not authenticated, cannot save FCM token');
        return;
      }

      // Solo intentar guardar si hay conexión
      if (!navigator.onLine) {
        console.log('⚠️ Offline - FCM token no guardado en backend');
        return;
      }

      const API_HOST = import.meta.env.VITE_API_HOST || '';
      const API_PORT = import.meta.env.VITE_API_PORT || '';
      const API_PROTOCOL = import.meta.env.VITE_API_PROTOCOL || '';
      const API_BASE = import.meta.env.VITE_API_BASE || '/api';

      // Si no hay host, usar ruta relativa (para proxy reverso)
      const API_URL = API_HOST
        ? `${API_PROTOCOL}://${API_HOST}:${API_PORT}${API_BASE}`
        : API_BASE;

      await axios.post(
        `${API_URL}/fcm-tokens`,
        {
          userId: user.idUser,
          token: token,
          deviceType: 'WEB'
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      console.log('FCM token saved to backend successfully');
    } catch (error) {
      // Solo mostrar error si NO es un error de red
      if (error.code !== 'ERR_NETWORK' && error.message !== 'Network Error') {
        console.error('Error saving FCM token to backend:', error);
      }
    }
  };

  /**
   * Escuchar mensajes cuando la app está en foreground
   */
  const listenForMessages = () => {
    onMessageListener()
      .then((payload) => {
        console.log('Message received in foreground:', payload);

        const title = payload.notification?.title || 'Nueva Notificación';
        const body = payload.notification?.body || '';

        // Mostrar toast con la notificación
        toast.info(
          <div>
            <strong>{title}</strong>
            <p className="text-sm mt-1">{body}</p>
          </div>,
          {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );

        // También mostrar notificación nativa si tiene permiso
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body: body,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: payload.data?.tag || 'default',
            requireInteraction: false,
          });
        }
      })
      .catch((err) => console.error('Error receiving message:', err));
  };

  /**
   * Solicitar permiso de notificaciones al usuario
   */
  const askForPermission = async () => {
    if (Notification.permission === 'granted') {
      toast.info('Ya tienes las notificaciones habilitadas');
      return;
    }

    await initializeNotifications();
  };

  /**
   * Verificar si las notificaciones están habilitadas
   */
  const areNotificationsEnabled = () => {
    return Notification.permission === 'granted';
  };

  return {
    fcmToken,
    permissionGranted,
    askForPermission,
    areNotificationsEnabled
  };
};

export default useNotifications;
