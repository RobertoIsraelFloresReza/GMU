import '../index.css'; // Asegúrate de que el CSS esté importado correctamente
import React, { useEffect, useState,  } from 'react';
import Swal from 'sweetalert2';
import { FaSync, FaTrash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Spinner } from 'flowbite-react';
import AxiosClient from '../config/http-gateway/http-client';
import AuthContext from '../config/context/auth-context';
import { se } from 'date-fns/locale';

const Notificaciones = () => {
  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState([]);

  const obtenerNotificaciones = async () => {
    try {
      setLoading(true);
      const response = await AxiosClient.get('/notificaciones/user/');
      setNotifications(response.data);
    } catch (error) {
      Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar las categorías',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#7e22ce',
          customClass: {
              confirmButton:
                'bg-purple-500 text-white hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 rounded-lg shadow-md transition-all',
          },
      });
    } finally {
        setLoading(false);
    }
  }
  
  useEffect(() => {
    obtenerNotificaciones();
  }, []);

  const markAsRead = async (notification) => {
    try {
      const response = await AxiosClient.put(`/notificaciones/`,
        { 
          idNotification: notification.idNotificacion,
          idMember: notification.idMiembro,
        }

      );
      setNotifications(prev =>
        prev.map(n =>
          n.idNotificacion === notification.idNotificacion
            ? { ...n, leido: true }
            : n
        )
      );
    } catch (error) {
      Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar las categorías',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#7e22ce',
          customClass: {
              confirmButton:
                'bg-purple-500 text-white hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 rounded-lg shadow-md transition-all',
          },
      });
    }
  };

  const handleDelete = async (idNotificacion) => {
    try {
      await AxiosClient.delete(`/notificaciones/${idNotificacion}`);
      setNotifications(notifications.filter(n => n.idNotificacion !== idNotificacion));
      Swal.fire({
        title: 'Eliminada',
        text: 'La notificación fue eliminada correctamente',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar la notificación',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };


  return (
    <div className="notifications-container">
      <div className="notifications-header flex items-center justify-between">
        <h2 className="text-xl font-semibold text-purple-800">Notificaciones</h2>
        <button
          onClick={obtenerNotificaciones}
          className="p-2 text-green-500 hover:text-green-700 transition"
          title="Actualizar"
        >
          <FaSync size={18} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <span className="text-lg text-purple-700 font-semibold animate-pulse">
            Cargando notificaciones...
          </span>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.length === 0 ? (
            <p className="no-notifications">No hay notificaciones</p>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.idNotificacion}
                className={`notification-item ${notification.leido ? 'read' : 'unread'}`}
                onClick={() => markAsRead(notification)}
              >
                <div className="notification-content">
                  <h3>{notification.titulo}</h3>
                  <p>{notification.mensaje}</p>
                  {notification.days > 0 && (
                    <span className="notification-date">Días restante: {notification.days}</span>
                  )}
                </div>

                <div className="notification-actions">
                  {!notification.leido && <div className="unread-dot"></div>}
                  {notification.leido && <FaTrash
                    className="notification-delete text-red-600 hover:text-red-800 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.idNotificacion);
                    }}
                  />}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notificaciones;