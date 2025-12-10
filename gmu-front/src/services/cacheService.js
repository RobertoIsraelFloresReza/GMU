import { offlineStorage } from '../db/database';
import { storeService, productService, assignmentService, deliveryService } from './api';

/**
 * Servicio para cachear todos los datos necesarios para modo offline
 * Se ejecuta después del login para tener todos los datos disponibles sin internet
 */
class CacheService {
    constructor() {
        this.isCaching = false;
        this.lastCacheTime = null;
    }

    /**
     * Cachea todos los datos necesarios para el repartidor
     * Se ejecuta automáticamente después del login
     */
    async cacheAllData(userId, userRole) {
        if (this.isCaching) {
            console.log('⏳ Ya hay un proceso de cache en progreso');
            return;
        }

        this.isCaching = true;
        console.log('📦 Iniciando cache de datos para modo offline...');

        try {
            // Solo cachear si hay internet
            if (!navigator.onLine) {
                console.log('📵 Sin conexión - usando datos cacheados previamente');
                this.isCaching = false;
                return;
            }

            if (userRole === 'DELIVERY_PERSON') {
                await this.cacheDeliveryPersonData(userId);
            } else if (userRole === 'ADMIN') {
                await this.cacheAdminData();
            }

            this.lastCacheTime = new Date().toISOString();
            localStorage.setItem('lastCacheTime', this.lastCacheTime);
            console.log('✅ Todos los datos cacheados exitosamente');

        } catch (error) {
            console.error('❌ Error cacheando datos:', error);
        } finally {
            this.isCaching = false;
        }
    }

    /**
     * Cachea datos específicos del repartidor
     */
    async cacheDeliveryPersonData(userId) {
        console.log('👷 Cacheando datos de repartidor...');

        // 1. Cachear tiendas
        try {
            console.log('🏪 Descargando tiendas...');
            const storesResponse = await storeService.getAll();
            const stores = storesResponse.data.data || [];
            await offlineStorage.saveStores(stores);
            console.log(`✅ ${stores.length} tiendas cacheadas`);
        } catch (error) {
            console.error('❌ Error cacheando tiendas:', error);
        }

        // 2. Cachear productos
        try {
            console.log('📦 Descargando productos...');
            const productsResponse = await productService.getAll();
            const products = productsResponse.data.data || [];
            await offlineStorage.saveProducts(products);
            console.log(`✅ ${products.length} productos cacheados`);
        } catch (error) {
            console.error('❌ Error cacheando productos:', error);
        }

        // 3. Cachear asignaciones del repartidor
        try {
            console.log('📍 Descargando asignaciones...');
            const user = JSON.parse(localStorage.getItem('user'));

            if (user && user.email) {
                // Buscar el delivery person por email
                const deliveryResponse = await deliveryService.getAll();
                const deliveryPerson = deliveryResponse.data.data.find(
                    dp => dp.email === user.email
                );

                if (deliveryPerson) {
                    const assignmentsResponse = await assignmentService.getByDeliveryPerson(
                        deliveryPerson.idDeliveryPerson
                    );
                    const assignments = assignmentsResponse.data.data || [];

                    // Guardar asignaciones con información de tiendas
                    const assignmentsWithStores = assignments.map(a => ({
                        ...a,
                        idAssignment: a.idAssignment,
                        storeId: a.store?.idStore,
                        deliveryPersonId: deliveryPerson.idDeliveryPerson,
                        visited: a.visited || false,
                        visitDate: a.visitDate || null
                    }));

                    await offlineStorage.saveAssignments(assignmentsWithStores);
                    console.log(`✅ ${assignments.length} asignaciones cacheadas`);

                    // Guardar el deliveryPersonId en localStorage
                    localStorage.setItem('deliveryPersonId', deliveryPerson.idDeliveryPerson);
                }
            }
        } catch (error) {
            console.error('❌ Error cacheando asignaciones:', error);
        }
    }

    /**
     * Cachea datos para admin
     */
    async cacheAdminData() {
        console.log('👨‍💼 Cacheando datos de administrador...');

        // Cachear todo para admin
        await this.cacheDeliveryPersonData(null);
    }

    /**
     * Obtiene tiendas (desde cache si no hay internet)
     */
    async getStores() {
        if (navigator.onLine) {
            try {
                const response = await storeService.getAll();
                const stores = response.data.data || [];
                await offlineStorage.saveStores(stores);
                return stores;
            } catch (error) {
                console.warn('⚠️ Error obteniendo tiendas online, usando cache:', error);
                return await offlineStorage.getLocalStores();
            }
        } else {
            console.log('📵 Sin conexión - usando tiendas cacheadas');
            return await offlineStorage.getLocalStores();
        }
    }

    /**
     * Obtiene productos (desde cache si no hay internet)
     */
    async getProducts() {
        if (navigator.onLine) {
            try {
                const response = await productService.getAll();
                const products = response.data.data || [];
                await offlineStorage.saveProducts(products);
                return products;
            } catch (error) {
                console.warn('⚠️ Error obteniendo productos online, usando cache:', error);
                return await offlineStorage.getLocalProducts();
            }
        } else {
            console.log('📵 Sin conexión - usando productos cacheados');
            return await offlineStorage.getLocalProducts();
        }
    }

    /**
     * Obtiene asignaciones (desde cache si no hay internet)
     */
    async getAssignments() {
        if (navigator.onLine) {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                if (user && user.email) {
                    const deliveryResponse = await deliveryService.getAll();
                    const deliveryPerson = deliveryResponse.data.data.find(
                        dp => dp.email === user.email
                    );

                    if (deliveryPerson) {
                        const response = await assignmentService.getByDeliveryPerson(
                            deliveryPerson.idDeliveryPerson
                        );
                        const assignments = response.data.data || [];
                        await offlineStorage.saveAssignments(assignments);
                        return assignments;
                    }
                }
                return [];
            } catch (error) {
                console.warn('⚠️ Error obteniendo asignaciones online, usando cache:', error);
                return await offlineStorage.getLocalAssignments();
            }
        } else {
            console.log('📵 Sin conexión - usando asignaciones cacheadas');
            return await offlineStorage.getLocalAssignments();
        }
    }

    /**
     * Busca una tienda por QR code (funciona offline)
     */
    async findStoreByQR(qrCode) {
        console.log('🔍 Buscando tienda con QR:', qrCode);

        // Intentar online primero
        if (navigator.onLine) {
            try {
                const response = await storeService.getByQRCode(qrCode);
                const store = response.data.data;
                console.log('✅ Tienda encontrada online:', store);
                return store;
            } catch (error) {
                console.warn('⚠️ Error buscando online, intentando cache:', error);
            }
        }

        // Buscar en cache
        console.log('📵 Buscando en cache local...');
        const cachedStores = await offlineStorage.getLocalStores();
        const store = cachedStores.find(s => s.qrCode === qrCode);

        if (store) {
            console.log('✅ Tienda encontrada en cache:', store);
            return store;
        }

        console.error('❌ Tienda no encontrada ni online ni en cache');
        throw new Error('Tienda no encontrada. Asegúrate de tener conexión al menos una vez.');
    }

    /**
     * Verifica si hay datos cacheados
     */
    async hasCachedData() {
        const stores = await offlineStorage.getLocalStores();
        const products = await offlineStorage.getLocalProducts();
        return stores.length > 0 && products.length > 0;
    }

    /**
     * Limpia todo el cache
     */
    async clearCache() {
        await offlineStorage.clearAll();
        localStorage.removeItem('lastCacheTime');
        this.lastCacheTime = null;
        console.log('🗑️ Cache limpiado completamente');
    }
}

// Exportar instancia única (Singleton)
export const cacheService = new CacheService();
export default cacheService;
