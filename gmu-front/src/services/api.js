import axios from 'axios';

// Usar variables de entorno de Vite
const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_PORT = import.meta.env.VITE_API_PORT || '';
const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const API_PROTOCOL = import.meta.env.VITE_API_PROTOCOL || '';

// Si no hay host, usar ruta relativa (para proxy reverso)
const API_BASE_URL = API_HOST
    ? `${API_PROTOCOL}://${API_HOST}:${API_PORT}${API_BASE}`
    : API_BASE;

// Create axios instance with interceptor for auth token
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to all requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth Services
export const authService = {
    login: (credentials) => api.post('/auth/signin', credentials),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

// Store Services
export const storeService = {
    getAll: () => api.get('/stores'),
    getById: (id) => api.get(`/stores/${id}`),
    getByQRCode: (qrCode) => api.get(`/stores/qr/${qrCode}`),
    create: (data) => api.post('/stores', data),
    update: (id, data) => api.put(`/stores/${id}`, data),
    delete: (id) => api.delete(`/stores/${id}`)
};

// Delivery Person Services
export const deliveryService = {
    getAll: () => api.get('/delivery-persons'),
    getById: (id) => api.get(`/delivery-persons/${id}`),
    create: (data) => api.post('/delivery-persons', data),
    update: (id, data) => api.put(`/delivery-persons/${id}`, data),
    delete: (id) => api.delete(`/delivery-persons/${id}`),
    updatePassword: (id, passwords) => api.put(`/delivery-persons/${id}/password`, passwords)
};

// Product Services
export const productService = {
    getAll: () => api.get('/products'),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`)
};

// Order Services
export const orderService = {
    getAll: () => api.get('/orders'),
    getById: (id) => api.get(`/orders/${id}`),
    getByStore: (storeId) => api.get(`/orders/store/${storeId}`),
    getByDeliveryPerson: (deliveryId) => api.get(`/orders/delivery/${deliveryId}`),
    getByStatus: (status) => api.get(`/orders/status/${status}`),
    create: (data) => api.post('/orders', data),
    createByQR: (qrCode, deliveryId, data) => api.post(`/orders/qr/${qrCode}/delivery/${deliveryId}`, data),
    update: (id, data) => api.put(`/orders/${id}`, data),
    updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
    delete: (id) => api.delete(`/orders/${id}`),
    getUnsynced: () => api.get('/orders/unsynced'),
    markAsSynced: (id) => api.patch(`/orders/${id}/sync`)
};

// Assignment Services
export const assignmentService = {
    getAll: () => api.get('/assignments'),
    getByDeliveryPerson: (deliveryId) => api.get(`/assignments/delivery/${deliveryId}`),
    create: (data) => api.post('/assignments', data),
    update: (id, data) => api.put(`/assignments/${id}`, data),
    delete: (id) => api.delete(`/assignments/${id}`),
    markVisited: (id) => api.put(`/assignments/${id}/visit`)
};

// Stats Services (Dashboard)
export const statsService = {
    getAdminStats: () => api.get('/stats/admin'),
    getDeliveryStats: (deliveryId) => api.get(`/stats/delivery/${deliveryId}`)
};

// User Services
export const userService = {
    updatePassword: (id, passwords) => api.put(`/users/${id}/password`, passwords)
};

export default api;
