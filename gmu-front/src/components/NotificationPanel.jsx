import { useState, useEffect } from 'react';
import { FaBell, FaTimes, FaShoppingCart, FaStore, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const NotificationPanel = ({ isOpen, onClose, userId }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            loadNotifications();
        }
    }, [isOpen, userId]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const API_HOST = import.meta.env.VITE_API_HOST || '';
            const API_PORT = import.meta.env.VITE_API_PORT || '';
            const API_PROTOCOL = import.meta.env.VITE_API_PROTOCOL || '';
            const API_BASE = import.meta.env.VITE_API_BASE || '/api';

            // Si no hay host, usar ruta relativa (para proxy reverso)
            const API_URL = API_HOST
                ? `${API_PROTOCOL}://${API_HOST}:${API_PORT}${API_BASE}`
                : API_BASE;

            const response = await axios.get(
                `${API_URL}/notifications/user/${userId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setNotifications(response.data.data || []);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            const API_HOST = import.meta.env.VITE_API_HOST || '';
            const API_PORT = import.meta.env.VITE_API_PORT || '';
            const API_PROTOCOL = import.meta.env.VITE_API_PROTOCOL || '';
            const API_BASE = import.meta.env.VITE_API_BASE || '/api';

            // Si no hay host, usar ruta relativa (para proxy reverso)
            const API_URL = API_HOST
                ? `${API_PROTOCOL}://${API_HOST}:${API_PORT}${API_BASE}`
                : API_BASE;

            await axios.put(
                `${API_URL}/notifications/${notificationId}/read`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            loadNotifications();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            const API_HOST = import.meta.env.VITE_API_HOST || '';
            const API_PORT = import.meta.env.VITE_API_PORT || '';
            const API_PROTOCOL = import.meta.env.VITE_API_PROTOCOL || '';
            const API_BASE = import.meta.env.VITE_API_BASE || '/api';

            // Si no hay host, usar ruta relativa (para proxy reverso)
            const API_URL = API_HOST
                ? `${API_PROTOCOL}://${API_HOST}:${API_PORT}${API_BASE}`
                : API_BASE;

            await axios.put(
                `${API_URL}/notifications/user/${userId}/read-all`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            toast.success('Todas las notificaciones marcadas como leídas');
            loadNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
            toast.error('Error al marcar notificaciones');
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'ORDER_CREATED':
            case 'ORDER_UPDATED':
            case 'ORDER_COMPLETED':
            case 'ORDER_CANCELLED':
                return <FaShoppingCart className="text-blue-600" />;
            case 'STORE_ASSIGNED':
                return <FaStore className="text-green-600" />;
            case 'WARNING':
                return <FaExclamationTriangle className="text-yellow-600" />;
            case 'INFO':
            default:
                return <FaInfoCircle className="text-slate-600" />;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours} h`;
        if (diffDays < 7) return `Hace ${diffDays} d`;

        return date.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 overflow-hidden bg-black/20 sm:bg-transparent"
            onClick={onClose}
        >
            <div
                className="absolute inset-x-0 bottom-0 sm:inset-auto sm:right-4 sm:top-20 sm:w-96 w-full max-h-[85vh] sm:max-h-[600px] bg-white rounded-t-2xl sm:rounded-lg shadow-xl border-t sm:border border-gray-200 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Mobile Handle */}
                <div className="sm:hidden pt-2 pb-1 flex justify-center">
                    <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
                </div>

                {/* Header */}
                <div className="px-4 sm:px-4 py-3 sm:py-3 border-b border-gray-200 bg-gray-50 rounded-t-2xl sm:rounded-t-lg">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-base sm:text-base text-gray-800 flex items-center gap-2">
                            <FaBell className="text-blue-600 text-lg sm:text-base" />
                            Notificaciones
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-2 sm:p-1"
                        >
                            <FaTimes className="text-xl sm:text-base" />
                        </button>
                    </div>
                    {notifications.filter(n => !n.isRead).length > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="mt-2 text-xs sm:text-xs text-blue-600 hover:text-blue-700 font-medium active:text-blue-800"
                        >
                            Marcar todas como leídas
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                    {loading ? (
                        <div className="flex justify-center items-center py-12 sm:py-12">
                            <div className="animate-spin rounded-full h-10 w-10 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-12 sm:py-12 px-4">
                            <FaBell className="text-5xl sm:text-4xl text-gray-300 mx-auto mb-3" />
                            <p className="text-base sm:text-sm text-gray-500">No hay notificaciones</p>
                        </div>
                    ) : (
                        <div className="pb-4 sm:pb-0">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.idNotification}
                                    className={`px-4 sm:px-4 py-4 sm:py-3 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors ${
                                        !notification.isRead ? 'bg-blue-50' : ''
                                    }`}
                                    onClick={() => !notification.isRead && markAsRead(notification.idNotification)}
                                >
                                    <div className="flex gap-3 sm:gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="text-xl sm:text-base">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-medium text-sm sm:text-sm text-gray-900 break-words">
                                                    {notification.title}
                                                </p>
                                                {!notification.isRead && (
                                                    <span className="flex-shrink-0 w-2.5 h-2.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full mt-1"></span>
                                                )}
                                            </div>
                                            <p className="text-sm sm:text-sm text-gray-600 mt-1 break-words">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs sm:text-xs text-gray-400 mt-2 sm:mt-1">
                                                {formatDate(notification.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationPanel;
