import Dexie from 'dexie';

// Base de datos IndexedDB para almacenamiento offline
export const db = new Dexie('GroceryDeliveryDB');

db.version(1).stores({
    stores: '++id, name, qrCode, latitude, longitude, status',
    products: '++id, name, sku, category, price, status',
    orders: '++id, storeId, deliveryPersonId, orderDate, status, synced',
    orderItems: '++id, orderId, productId, quantity, unitPrice',
    assignments: '++id, storeId, deliveryPersonId, startDate, endDate, visited',
    notifications: '++id, deliveryPersonId, createdAt, readStatus',
    syncQueue: '++id, action, entity, data, timestamp, retries'
});

// Verificar disponibilidad de IndexedDB y cuotas
const checkStorageAvailability = async () => {
    try {
        if (!('indexedDB' in window)) {
            console.error('❌ IndexedDB no está disponible en este navegador');
            return { available: false, quota: 0, usage: 0 };
        }

        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            const percentUsed = ((estimate.usage / estimate.quota) * 100).toFixed(2);

            console.log(`💾 Almacenamiento: ${(estimate.usage / 1024 / 1024).toFixed(2)} MB de ${(estimate.quota / 1024 / 1024).toFixed(2)} MB (${percentUsed}%)`);

            if (percentUsed > 90) {
                console.warn('⚠️ El almacenamiento está casi lleno. Considera limpiar datos antiguos.');
            }

            return {
                available: true,
                quota: estimate.quota,
                usage: estimate.usage,
                percentUsed: parseFloat(percentUsed)
            };
        }

        return { available: true, quota: 0, usage: 0 };
    } catch (error) {
        console.error('❌ Error verificando almacenamiento:', error);
        return { available: false, quota: 0, usage: 0 };
    }
};

// Funciones helper para gestionar la sincronización offline
export const offlineStorage = {
    // Verificar disponibilidad antes de usar
    async isAvailable() {
        const storage = await checkStorageAvailability();
        return storage.available;
    },

    // Obtener info de almacenamiento
    async getStorageInfo() {
        return await checkStorageAvailability();
    },

    // Guardar pedido offline con validaciones
    async saveOrderOffline(order) {
        try {
            const isAvailable = await this.isAvailable();
            if (!isAvailable) {
                throw new Error('IndexedDB no está disponible');
            }

            // Extraer datos que no van a la tabla orders
            const { qrCode, orderData, ...orderToSave } = order;

            const orderId = await db.orders.add({
                ...orderToSave,
                synced: false,
                createdAt: new Date().toISOString()
            });

            console.log(`✅ Pedido guardado offline con ID local: ${orderId}`);

            // Agregar a cola de sincronización
            await db.syncQueue.add({
                action: 'CREATE_ORDER',
                entity: 'orders',
                data: {
                    qrCode: qrCode || orderToSave.qrCode,
                    deliveryPersonId: orderToSave.deliveryPersonId,
                    orderData: orderData || {
                        items: [],
                        notes: orderToSave.notes
                    },
                    localId: orderId
                },
                timestamp: new Date().toISOString(),
                retries: 0
            });

            return orderId;
        } catch (error) {
            console.error('❌ Error guardando pedido offline:', error);
            throw error;
        }
    },

    // Guardar items del pedido offline
    async saveOrderItemsOffline(orderId, items) {
        try {
            const itemIds = await Promise.all(
                items.map(item =>
                    db.orderItems.add({
                        orderId,
                        ...item
                    })
                )
            );
            console.log(`✅ ${itemIds.length} items guardados offline para pedido ${orderId}`);
            return itemIds;
        } catch (error) {
            console.error('❌ Error guardando items offline:', error);
            throw error;
        }
    },

    // Obtener pedidos no sincronizados con detalles completos
    async getUnsyncedOrders() {
        try {
            const orders = await db.orders.where('synced').equals(false).toArray();

            // Obtener items para cada pedido
            const ordersWithItems = await Promise.all(
                orders.map(async (order) => {
                    const items = await db.orderItems.where('orderId').equals(order.id).toArray();
                    return { ...order, items };
                })
            );

            console.log(`📦 ${ordersWithItems.length} pedidos sin sincronizar encontrados`);
            return ordersWithItems;
        } catch (error) {
            console.error('❌ Error obteniendo pedidos sin sincronizar:', error);
            return [];
        }
    },

    // Marcar pedido como sincronizado
    async markOrderSynced(localId, serverId) {
        try {
            await db.orders.update(localId, {
                synced: true,
                serverId: serverId,
                syncedAt: new Date().toISOString()
            });
            console.log(`✅ Pedido ${localId} marcado como sincronizado (Server ID: ${serverId})`);
        } catch (error) {
            console.error('❌ Error marcando pedido como sincronizado:', error);
            throw error;
        }
    },

    // Marcar asignación como visitada
    async markAssignmentVisited(assignmentId, visitDate) {
        try {
            await db.assignments.update(assignmentId, {
                visited: true,
                visitDate: visitDate || new Date().toISOString()
            });

            await db.syncQueue.add({
                action: 'UPDATE_ASSIGNMENT',
                entity: 'assignments',
                data: { assignmentId, visited: true, visitDate },
                timestamp: new Date().toISOString(),
                retries: 0
            });

            console.log(`✅ Asignación ${assignmentId} marcada como visitada`);
        } catch (error) {
            console.error('❌ Error marcando asignación visitada:', error);
            throw error;
        }
    },

    // Obtener items de la cola de sincronización ordenados por timestamp
    async getSyncQueue() {
        try {
            const queue = await db.syncQueue.orderBy('timestamp').toArray();
            console.log(`📋 Cola de sincronización: ${queue.length} items`);
            return queue;
        } catch (error) {
            console.error('❌ Error obteniendo cola de sincronización:', error);
            return [];
        }
    },

    // Limpiar item de la cola después de sincronización exitosa
    async removeSyncQueueItem(id) {
        try {
            await db.syncQueue.delete(id);
            console.log(`✅ Item ${id} removido de cola de sincronización`);
        } catch (error) {
            console.error('❌ Error removiendo item de cola:', error);
            throw error;
        }
    },

    // Incrementar reintentos de sincronización
    async incrementSyncRetries(id) {
        try {
            const item = await db.syncQueue.get(id);
            if (item) {
                await db.syncQueue.update(id, {
                    retries: item.retries + 1,
                    lastAttempt: new Date().toISOString()
                });
                console.log(`⚠️ Reintento ${item.retries + 1} para item ${id}`);
            }
        } catch (error) {
            console.error('❌ Error incrementando reintentos:', error);
        }
    },

    // Guardar stores localmente con validación
    async saveStores(stores) {
        try {
            if (!Array.isArray(stores) || stores.length === 0) {
                console.warn('⚠️ No hay tiendas para guardar');
                return;
            }

            await db.stores.clear();
            await db.stores.bulkAdd(stores);
            console.log(`✅ ${stores.length} tiendas guardadas en caché`);
        } catch (error) {
            console.error('❌ Error guardando tiendas:', error);
            throw error;
        }
    },

    // Guardar productos localmente con validación
    async saveProducts(products) {
        try {
            if (!Array.isArray(products) || products.length === 0) {
                console.warn('⚠️ No hay productos para guardar');
                return;
            }

            await db.products.clear();
            await db.products.bulkAdd(products);
            console.log(`✅ ${products.length} productos guardados en caché`);
        } catch (error) {
            console.error('❌ Error guardando productos:', error);
            throw error;
        }
    },

    // Guardar asignaciones localmente con validación
    async saveAssignments(assignments) {
        try {
            if (!Array.isArray(assignments) || assignments.length === 0) {
                console.warn('⚠️ No hay asignaciones para guardar');
                return;
            }

            await db.assignments.clear();
            await db.assignments.bulkAdd(assignments);
            console.log(`✅ ${assignments.length} asignaciones guardadas en caché`);
        } catch (error) {
            console.error('❌ Error guardando asignaciones:', error);
            throw error;
        }
    },

    // Obtener datos locales con manejo de errores
    async getLocalStores() {
        try {
            const stores = await db.stores.toArray();
            console.log(`📦 ${stores.length} tiendas obtenidas de caché`);
            return stores;
        } catch (error) {
            console.error('❌ Error obteniendo tiendas locales:', error);
            return [];
        }
    },

    async getLocalProducts() {
        try {
            const products = await db.products.toArray();
            console.log(`📦 ${products.length} productos obtenidos de caché`);
            return products;
        } catch (error) {
            console.error('❌ Error obteniendo productos locales:', error);
            return [];
        }
    },

    async getLocalAssignments() {
        try {
            const assignments = await db.assignments.toArray();
            console.log(`📦 ${assignments.length} asignaciones obtenidas de caché`);
            return assignments;
        } catch (error) {
            console.error('❌ Error obteniendo asignaciones locales:', error);
            return [];
        }
    },

    // Contar pedidos pendientes de sincronización
    async getPendingSyncCount() {
        try {
            const count = await db.syncQueue.count();
            return count;
        } catch (error) {
            console.error('❌ Error contando items pendientes:', error);
            return 0;
        }
    },

    // Limpiar base de datos local
    async clearAll() {
        try {
            await db.delete();
            await db.open();
            console.log('🗑️ Base de datos local limpiada completamente');
        } catch (error) {
            console.error('❌ Error limpiando base de datos:', error);
            throw error;
        }
    },

    // Limpiar solo pedidos antiguos sincronizados
    async cleanOldSyncedOrders(daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            const cutoffISO = cutoffDate.toISOString();

            const oldOrders = await db.orders
                .where('synced').equals(true)
                .and(order => order.syncedAt && order.syncedAt < cutoffISO)
                .toArray();

            if (oldOrders.length > 0) {
                await Promise.all(
                    oldOrders.map(order => db.orders.delete(order.id))
                );
                console.log(`🗑️ ${oldOrders.length} pedidos antiguos eliminados`);
            }
        } catch (error) {
            console.error('❌ Error limpiando pedidos antiguos:', error);
        }
    },

    // Obtener estadísticas de almacenamiento
    async getStats() {
        try {
            const stats = {
                stores: await db.stores.count(),
                products: await db.products.count(),
                orders: await db.orders.count(),
                unsyncedOrders: await db.orders.where('synced').equals(false).count(),
                syncQueue: await db.syncQueue.count(),
                assignments: await db.assignments.count(),
                storage: await this.getStorageInfo()
            };

            console.log('📊 Estadísticas de almacenamiento:', stats);
            return stats;
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return null;
        }
    }
};

export default db;
