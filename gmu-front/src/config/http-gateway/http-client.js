import axios from 'axios';

// Usar variables de entorno de Vite
const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_PORT = import.meta.env.VITE_API_PORT || '';
const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const API_PROTOCOL = import.meta.env.VITE_API_PROTOCOL || '';

// Si no hay host, usar ruta relativa (para proxy reverso)
const SERVER_URL = API_HOST
    ? `${API_PROTOCOL}://${API_HOST}:${API_PORT}${API_BASE}`
    : API_BASE;

const AxiosClient = axios.create({
    baseURL: SERVER_URL,
    withCredentials: true,
});

const requestHandler = (request) => {
    request.headers["Accept"] = "application/json";

    // Solo establecer si no es multipart/form-data
    if (!request.headers["Content-Type"]) {
        request.headers["Content-Type"] = "application/json";
    }


    const session = JSON.parse(localStorage.getItem("user")) || null;
    if (session?.token)
        request.headers["Authorization"] = `Bearer ${session.token}`;
    return request;
};
AxiosClient.interceptors.request.use(
    (req) => requestHandler(req),
    (err) => Promise.reject(err)
);
AxiosClient.interceptors.response.use(
    (res) => res.data,
    (err) => Promise.reject(err)
);
export default AxiosClient;