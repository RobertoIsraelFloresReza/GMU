import { useState, useEffect } from 'react';
import { FaWifi, FaCloudUploadAlt, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import { syncService } from '../services/syncService';
import useOnlineStatus from '../hooks/useOnlineStatus';

/**
 * Indicador visual persistente del estado offline/online
 * Muestra contador de pedidos pendientes de sincronización
 */
const OfflineIndicator = () => {
    const isOnline = useOnlineStatus();
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Verificar si hay sesión activa
    useEffect(() => {
        const checkLogin = () => {
            const token = localStorage.getItem('token');
            setIsLoggedIn(!!token);
        };

        checkLogin();

        // Verificar cada 2 segundos si cambió el estado de login
        const loginInterval = setInterval(checkLogin, 2000);

        return () => clearInterval(loginInterval);
    }, []);

    // Actualizar contador cada 5 segundos (solo si hay sesión)
    useEffect(() => {
        if (!isLoggedIn) return;

        updatePendingCount();

        const interval = setInterval(() => {
            updatePendingCount();
        }, 5000);

        return () => clearInterval(interval);
    }, [isLoggedIn]);

    const updatePendingCount = async () => {
        try {
            const count = await syncService.getPendingCount();
            setPendingCount(count);
        } catch (error) {
            console.error('Error obteniendo contador de pendientes:', error);
        }
    };

    const handleManualSync = async () => {
        if (!isOnline || isSyncing) return;

        setIsSyncing(true);
        try {
            await syncService.forceSyncNow();
            await updatePendingCount();
        } finally {
            setIsSyncing(false);
        }
    };

    // No mostrar nada si no hay sesión activa
    if (!isLoggedIn) {
        return null;
    }

    // No mostrar nada si está online y no hay pendientes
    if (isOnline && pendingCount === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
            {/* Indicador compacto */}
            <div
                className={`relative rounded-xl shadow-2xl border-2 overflow-hidden cursor-pointer transition-all duration-300 ${
                    isOnline
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-400'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600 border-orange-400'
                } ${showDetails ? 'w-80' : 'w-auto'}`}
                onClick={() => setShowDetails(!showDetails)}
            >
                {/* Contenido compacto */}
                <div className="flex items-center gap-3 p-3">
                    {/* Icono */}
                    <div className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center ${isSyncing ? 'animate-pulse' : ''}`}>
                        {!isOnline ? (
                            <FaWifi className="text-white text-xl transform rotate-180" />
                        ) : isSyncing ? (
                            <FaSync className="text-white text-lg animate-spin" />
                        ) : pendingCount > 0 ? (
                            <FaCloudUploadAlt className="text-white text-xl" />
                        ) : (
                            <FaWifi className="text-white text-xl" />
                        )}
                    </div>

                    {/* Texto */}
                    <div className="flex-1 text-white">
                        <div className="font-bold text-sm">
                            {!isOnline ? 'Modo Offline' : isSyncing ? 'Sincronizando...' : 'Pedidos Pendientes'}
                        </div>
                        {pendingCount > 0 && (
                            <div className="text-xs opacity-90">
                                {pendingCount} {pendingCount === 1 ? 'pedido' : 'pedidos'}
                            </div>
                        )}
                    </div>

                    {/* Badge de contador */}
                    {pendingCount > 0 && !showDetails && (
                        <div className="w-8 h-8 rounded-full bg-white text-orange-600 flex items-center justify-center font-black text-sm">
                            {pendingCount > 99 ? '99+' : pendingCount}
                        </div>
                    )}
                </div>

                {/* Detalles expandidos */}
                {showDetails && (
                    <div className="border-t-2 border-white/20 bg-black/10 p-3 space-y-2">
                        {!isOnline && (
                            <div className="flex items-start gap-2 text-white text-xs">
                                <FaExclamationTriangle className="flex-shrink-0 mt-0.5" />
                                <span>
                                    Los pedidos se guardarán localmente y se sincronizarán automáticamente cuando recuperes la conexión.
                                </span>
                            </div>
                        )}

                        {isOnline && pendingCount > 0 && (
                            <>
                                <div className="text-white text-xs mb-2">
                                    {pendingCount} {pendingCount === 1 ? 'pedido pendiente' : 'pedidos pendientes'} de sincronización
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleManualSync();
                                    }}
                                    disabled={isSyncing}
                                    className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSyncing ? (
                                        <>
                                            <FaSync className="animate-spin" />
                                            Sincronizando...
                                        </>
                                    ) : (
                                        <>
                                            <FaSync />
                                            Sincronizar Ahora
                                        </>
                                    )}
                                </button>
                            </>
                        )}

                        {isOnline && pendingCount === 0 && (
                            <div className="text-white text-xs">
                                Todos los pedidos están sincronizados
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OfflineIndicator;
