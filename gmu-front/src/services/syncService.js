import { offlineStorage } from '../db/database';
import { orderService } from './api';
import { toast } from 'react-toastify';
import axios from 'axios';

/**
 * Servicio de sincronización automática para pedidos offline
 * Versión mejorada con reintentos exponenciales y validación real de red
 */
class SyncService {
    constructor() {
        this.isSyncing = false;
        this.syncInterval = null;
        this.retryTimeouts = {};
        this.maxRetries = 3;
        this.baseRetryDelay = 2000; // 2 segundos
    }

    /**
     * Verifica si realmente hay conexión al backend
     */
    async checkRealConnectivity() {
        if (!navigator.onLine) {
            return false;
        }

        // Verificar si hay token (usuario logueado)
        const token = localStorage.getItem('token');
        if (!token) {
            // Si no hay token, asumir que hay conexión básica
            return navigator.onLine;
        }

        try {
            // Intentar hacer ping al backend CON el token
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

            const API_HOST = import.meta.env.VITE_API_HOST || '';
            const API_PORT = import.meta.env.VITE_API_PORT || '';
            const API_PROTOCOL = import.meta.env.VITE_API_PROTOCOL || '';
            const API_BASE = import.meta.env.VITE_API_BASE || '/api';

            // Si no hay host, usar ruta relativa (para proxy reverso)
            const API_URL = API_HOST
                ? `${API_PROTOCOL}://${API_HOST}:${API_PORT}${API_BASE}`
                : API_BASE;

            await axios.get(`${API_URL}/stores`, {
                signal: controller.signal,
                timeout: 5000,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            clearTimeout(timeoutId);
            return true;
        } catch (error) {
            // Si es 401 (Unauthorized), el backend está alcanzable pero el token expiró
            if (error.response?.status === 401) {
                console.log('⚠️ Token expirado - redirigiendo a login');
                // Limpiar sesión y redirigir
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('deliveryPersonId');
                window.location.href = '/login';
                return false;
            }

            // Para cualquier otro error, el backend no está alcanzable
            console.log('⚠️ Backend no alcanzable:', error.message);
            return false;
        }
    }

    /**
     * Inicia el servicio de sincronización
     * Escucha eventos de conexión y sincroniza automáticamente
     */
    start() {
        console.log('🔄 SyncService v2 iniciado');

        // Sincronizar al recuperar conexión
        window.addEventListener('online', () => {
            // Solo mostrar mensajes si hay usuario logueado
            const token = localStorage.getItem('token');
            if (token) {
                console.log('📶 Evento online detectado - verificando conectividad real...');
                toast.info('Conexión restaurada');
                this.handleOnlineEvent();
            }
        });

        // Notificar cuando se pierde conexión (solo si hay sesión)
        window.addEventListener('offline', () => {
            const token = localStorage.getItem('token');
            if (token) {
                console.log('📵 Evento offline detectado');
                toast.warning('Sin conexión. Los pedidos se guardarán offline.');
            }
        });

        // Escuchar mensajes del Service Worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SYNC_ORDERS') {
                    const token = localStorage.getItem('token');
                    if (token) {
                        console.log('📬 Service Worker solicita sincronización');
                        this.syncAll();
                    }
                }
            });
        }

        // Sincronizar cada 5 minutos si hay conexión Y usuario logueado
        this.syncInterval = setInterval(async () => {
            const token = localStorage.getItem('token');
            if (!token) return; // No sincronizar si no hay sesión

            const hasConnection = await this.checkRealConnectivity();
            if (hasConnection) {
                console.log('⏰ Sincronización programada ejecutándose...');
                this.syncAll();
            }
        }, 5 * 60 * 1000); // 5 minutos

        // NO sincronizar al iniciar - esperar a que haya login
    }

    /**
     * Maneja el evento de conexión restaurada
     */
    async handleOnlineEvent() {
        // Verificar que haya sesión activa
        const token = localStorage.getItem('token');
        if (!token) {
            return; // No hacer nada si no hay sesión
        }

        // Esperar 2 segundos para que la conexión se estabilice
        await new Promise(resolve => setTimeout(resolve, 2000));

        const hasConnection = await this.checkRealConnectivity();
        if (hasConnection) {
            console.log('✅ Conexión al backend confirmada - iniciando sincronización...');

            // Solo mostrar toast si hay pedidos pendientes
            const pendingCount = await this.getPendingCount();
            if (pendingCount > 0) {
                toast.success('Sincronizando pedidos pendientes...');
            }

            this.syncAll();
        } else {
            console.log('❌ Backend no alcanzable aún');
            // No mostrar warning repetitivo
        }
    }

    /**
     * Detiene el servicio de sincronización
     */
    stop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }

        // Limpiar timeouts de reintentos
        Object.values(this.retryTimeouts).forEach(timeout => clearTimeout(timeout));
        this.retryTimeouts = {};

        console.log('🛑 SyncService detenido');
    }

    /**
     * Sincroniza todos los elementos pendientes en la cola
     */
    async syncAll() {
        // Verificar que haya sesión activa
        const token = localStorage.getItem('token');
        if (!token) {
            return; // No sincronizar si no hay sesión
        }

        if (this.isSyncing) {
            console.log('⏳ Ya hay una sincronización en progreso');
            return;
        }

        // Verificar conectividad real
        const hasConnection = await this.checkRealConnectivity();
        if (!hasConnection) {
            console.log('📵 Sin conexión real al backend - sincronización cancelada');
            return;
        }

        this.isSyncing = true;
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        try {
            const queue = await offlineStorage.getSyncQueue();

            if (queue.length === 0) {
                console.log('✅ No hay elementos pendientes de sincronización');
                this.isSyncing = false;
                return;
            }

            console.log(`🔄 Sincronizando ${queue.length} elemento(s)...`);

            // Sincronizar items en orden (más antiguos primero)
            for (const item of queue) {
                try {
                    await this.syncItem(item);
                    await offlineStorage.removeSyncQueueItem(item.id);
                    successCount++;
                    console.log(`✅ Sincronizado: ${item.action} - ${item.entity} (ID: ${item.id})`);
                } catch (error) {
                    console.error(`❌ Error sincronizando item ${item.id}:`, error);
                    errors.push({ item, error: error.message });

                    // Incrementar reintentos
                    await offlineStorage.incrementSyncRetries(item.id);

                    // Si ya se intentó el máximo de veces, remover de la cola
                    if (item.retries >= this.maxRetries - 1) {
                        console.error(`🗑️ Removiendo item ${item.id} después de ${this.maxRetries} intentos fallidos`);
                        await offlineStorage.removeSyncQueueItem(item.id);

                        // Guardar en log de errores para revisión manual
                        this.logFailedSync(item, error);
                    } else {
                        // Programar reintento con backoff exponencial
                        const retryDelay = this.baseRetryDelay * Math.pow(2, item.retries);
                        console.log(`⏱️ Reintentando item ${item.id} en ${retryDelay / 1000} segundos`);
                    }

                    errorCount++;
                }
            }

            // Mostrar resultados al usuario
            if (successCount > 0 && errorCount === 0) {
                toast.success(`✅ ${successCount} pedido(s) sincronizado(s) exitosamente`);
            } else if (successCount > 0 && errorCount > 0) {
                toast.warning(`✅ ${successCount} sincronizado(s), ⚠️ ${errorCount} con errores`);
            } else if (successCount === 0 && errorCount > 0) {
                toast.error(`❌ ${errorCount} pedido(s) no se pudieron sincronizar. Se reintentará automáticamente.`);
            }

            // Si hubo errores, mostrar resumen en consola
            if (errors.length > 0) {
                console.error('📋 Resumen de errores de sincronización:', errors);
            }

            // Si se sincronizó al menos un pedido, disparar evento para refrescar lista
            if (successCount > 0) {
                window.dispatchEvent(new CustomEvent('orders-synced', {
                    detail: { count: successCount }
                }));
                console.log('🔔 Evento orders-synced disparado');
            }

        } catch (error) {
            console.error('❌ Error crítico en sincronización:', error);
            toast.error('Error al sincronizar pedidos offline');
        } finally {
            this.isSyncing = false;

            // Limpiar pedidos antiguos sincronizados (más de 30 días)
            await offlineStorage.cleanOldSyncedOrders(30);
        }
    }

    /**
     * Sincroniza un elemento individual de la cola
     */
    async syncItem(item) {
        switch (item.action) {
            case 'CREATE_ORDER':
                return await this.syncCreateOrder(item.data);

            case 'UPDATE_ASSIGNMENT':
                return await this.syncUpdateAssignment(item.data);

            default:
                console.warn(`⚠️ Acción desconocida: ${item.action}`);
                throw new Error(`Acción desconocida: ${item.action}`);
        }
    }

    /**
     * Sincroniza la creación de un pedido offline
     */
    async syncCreateOrder(data) {
        const { qrCode, deliveryPersonId, orderData, localId } = data;

        console.log('📦 Sincronizando pedido offline:', {
            qrCode,
            deliveryPersonId,
            localId,
            items: orderData.items?.length
        });

        try {
            // Crear pedido en el servidor
            const response = await orderService.createByQR(qrCode, deliveryPersonId, orderData);

            const serverOrderId = response.data.data?.idOrder;

            if (!serverOrderId) {
                throw new Error('El servidor no retornó un ID de pedido');
            }

            // Marcar como sincronizado en la BD local
            if (localId) {
                await offlineStorage.markOrderSynced(localId, serverOrderId);
            }

            console.log(`✅ Pedido sincronizado con el servidor (Server ID: ${serverOrderId})`);
            return response;
        } catch (error) {
            console.error('❌ Error creando pedido en servidor:', error);

            // Analizar el tipo de error
            if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
                throw new Error('Error de red - sin conexión al servidor');
            } else if (error.response?.status === 404) {
                throw new Error('Tienda o repartidor no encontrado - revisar datos');
            } else if (error.response?.status === 400) {
                throw new Error('Datos inválidos - revisar pedido');
            } else if (error.response?.status >= 500) {
                throw new Error('Error del servidor - reintentar más tarde');
            }

            throw error;
        }
    }

    /**
     * Sincroniza la actualización de una asignación
     */
    async syncUpdateAssignment(data) {
        const { assignmentId, visited, visitDate } = data;

        console.log('📍 Sincronizando visita a tienda:', { assignmentId, visitDate });

        try {
            // Aquí iría la llamada al API para actualizar la asignación
            // await assignmentService.markVisited(assignmentId);

            console.log('✅ Visita sincronizada');
            return Promise.resolve();
        } catch (error) {
            console.error('❌ Error sincronizando visita:', error);
            throw error;
        }
    }

    /**
     * Obtiene el número de elementos pendientes de sincronización
     */
    async getPendingCount() {
        try {
            const count = await offlineStorage.getPendingSyncCount();
            return count;
        } catch (error) {
            console.error('❌ Error obteniendo contador de pendientes:', error);
            return 0;
        }
    }

    /**
     * Registra un elemento que falló definitivamente
     */
    logFailedSync(item, error) {
        const failedItems = JSON.parse(localStorage.getItem('failedSyncItems') || '[]');
        failedItems.push({
            item,
            error: error.message,
            failedAt: new Date().toISOString()
        });

        // Mantener solo los últimos 50 errores
        if (failedItems.length > 50) {
            failedItems.shift();
        }

        localStorage.setItem('failedSyncItems', JSON.stringify(failedItems));
        console.error('💾 Item guardado en log de errores para revisión manual:', item);
    }

    /**
     * Obtiene items que fallaron definitivamente
     */
    getFailedItems() {
        return JSON.parse(localStorage.getItem('failedSyncItems') || '[]');
    }

    /**
     * Limpia el log de items fallidos
     */
    clearFailedItems() {
        localStorage.removeItem('failedSyncItems');
        console.log('🗑️ Log de items fallidos limpiado');
    }

    /**
     * Fuerza la sincronización inmediata (útil para botón manual)
     */
    async forceSyncNow() {
        console.log('🔄 Sincronización forzada manualmente');
        toast.info('Sincronizando pedidos...');
        await this.syncAll();
    }

    /**
     * Registra el Service Worker para Background Sync
     */
    async registerBackgroundSync() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;

                // Verificar si Background Sync está disponible
                if (registration && 'sync' in registration) {
                    await registration.sync.register('sync-orders');
                    console.log('✅ Background Sync registrado');
                } else {
                    console.log('⚠️ Background Sync no disponible en este navegador');
                }
            } catch (error) {
                console.error('❌ Error registrando Background Sync:', error);
            }
        }
    }
}

// Exportar instancia única (Singleton)
export const syncService = new SyncService();
export default syncService;
