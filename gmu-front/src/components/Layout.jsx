import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaTruck, FaChartLine, FaStore, FaBoxes, FaQrcode, FaMapMarkerAlt, FaClipboardList, FaRoute, FaBars, FaTimes, FaBell, FaSignOutAlt, FaUser, FaTasks, FaShoppingCart, FaBellSlash } from 'react-icons/fa';
import useNotifications from '../hooks/useNotifications.jsx';
import NotificationPanel from './NotificationPanel';
import axios from 'axios';
import { offlineStorage } from '../db/database';

const Layout = ({ children, userRole }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();
    const { permissionGranted, askForPermission, areNotificationsEnabled } = useNotifications();

    const getUser = () => {
        try {
            const storedUser = localStorage.getItem('user');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (e) {
            return null;
        }
    };

    const user = getUser();
    const userId = user?.idUser;

    const loadUnreadCount = useCallback(async () => {
        // No intentar cargar si no hay conexión
        if (!navigator.onLine) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!userId || !token) return;

            const API_HOST = import.meta.env.VITE_API_HOST || '';
            const API_PORT = import.meta.env.VITE_API_PORT || '';
            const API_PROTOCOL = import.meta.env.VITE_API_PROTOCOL || '';
            const API_BASE = import.meta.env.VITE_API_BASE || '/api';

            // Si no hay host, usar ruta relativa (para proxy reverso)
            const API_URL = API_HOST
                ? `${API_PROTOCOL}://${API_HOST}:${API_PORT}${API_BASE}`
                : API_BASE;

            const response = await axios.get(
                `${API_URL}/notifications/user/${userId}/unread-count`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setUnreadCount(response.data.data || 0);
        } catch (error) {
            // Solo mostrar error si NO es un error de red
            if (error.code !== 'ERR_NETWORK' && error.message !== 'Network Error') {
                console.error('Error loading unread count:', error);
            }
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            loadUnreadCount();
            // Actualizar contador cada 30 segundos
            const interval = setInterval(loadUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [userId, loadUnreadCount]);

    const handleLogout = async () => {
        try {
            // Limpiar TODO el localStorage
            localStorage.clear();

            // Limpiar TODA la base de datos IndexedDB
            await offlineStorage.clearAll();

            console.log('✅ Sesión cerrada y datos locales limpiados');

            // Navegar a login
            navigate('/login');
        } catch (error) {
            console.error('❌ Error cerrando sesión:', error);
            // Incluso si hay error, limpiar y salir
            localStorage.clear();
            navigate('/login');
        }
    };

    const handleNotificationClick = () => {
        if (!areNotificationsEnabled()) {
            askForPermission();
        } else {
            setNotificationPanelOpen(!notificationPanelOpen);
        }
    };

    // Menú para Admin
    const adminMenu = [
        { path: '/admin/dashboard', icon: FaChartLine, label: 'Dashboard' },
        { path: '/admin/stores', icon: FaStore, label: 'Tiendas' },
        { path: '/admin/delivery', icon: FaTruck, label: 'Repartidores' },
        { path: '/admin/products', icon: FaBoxes, label: 'Productos' },
        { path: '/admin/assignments', icon: FaTasks, label: 'Asignaciones' },
        { path: '/admin/orders', icon: FaShoppingCart, label: 'Pedidos' },
    ];

    // Menú para Delivery
    const deliveryMenu = [
        { path: '/delivery/routes', icon: FaRoute, label: 'Mis Rutas' },
        { path: '/delivery/qr-scan', icon: FaQrcode, label: 'Escanear QR' },
        { path: '/delivery/orders', icon: FaShoppingCart, label: 'Mis Pedidos' },
    ];

    const menuItems = userRole === 'ADMIN' ? adminMenu : deliveryMenu;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sidebar - Desktop */}
            <aside className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        {userRole === 'ADMIN' ? <FaTruck /> : <FaRoute />}
                        <div>
                            <div>Grocery<span className="text-orange-400">Delivery</span></div>
                            <div className="text-xs text-slate-400 font-normal">
                                {userRole === 'ADMIN' ? 'Panel Administrativo' : 'Panel Repartidor'}
                            </div>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-title">Menú Principal</div>
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <div className="nav-item-icon">
                                <item.icon />
                            </div>
                            <span>{item.label}</span>
                            {item.badge && <span className="nav-item-badge">{item.badge}</span>}
                        </Link>
                    ))}

                    <div className="nav-section-title mt-6">Cuenta</div>
                    <button
                        onClick={handleLogout}
                        className="nav-item w-full text-left hover:bg-red-500/10 hover:text-red-500"
                    >
                        <div className="nav-item-icon">
                            <FaSignOutAlt />
                        </div>
                        <span>Cerrar Sesión</span>
                    </button>
                </nav>
            </aside>

            {/* Overlay para móvil */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[999] lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Main Content */}
            <main className="main-content">
                {/* Navbar */}
                <nav className="navbar">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            {sidebarOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
                        </button>
                        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
                            {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
                        </h1>
                    </div>

                    <div className="navbar-actions">
                        <button
                            onClick={handleNotificationClick}
                            className={`icon-button relative ${permissionGranted ? 'text-blue-600' : 'text-slate-400'}`}
                            title={permissionGranted ? 'Ver notificaciones' : 'Click para habilitar notificaciones'}
                        >
                            {permissionGranted ? <FaBell /> : <FaBellSlash />}
                            {unreadCount > 0 && permissionGranted && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="user-menu"
                            >
                                <div className="user-avatar">
                                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="hidden md:block text-left">
                                    <div className="text-sm font-semibold text-slate-900">
                                        {user?.email?.split('@')[0] || 'Usuario'}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {userRole === 'ADMIN' ? 'Administrador' : 'Repartidor'}
                                    </div>
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false);
                                            navigate('/profile');
                                        }}
                                        className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700"
                                    >
                                        <FaUser />
                                        <span>Mi Perfil</span>
                                    </button>
                                    <hr className="my-2 border-slate-200" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-red-600"
                                    >
                                        <FaSignOutAlt />
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Page Content */}
                <div className="page-content">
                    {children}
                </div>
            </main>

            {/* Notification Panel */}
            <NotificationPanel
                isOpen={notificationPanelOpen}
                onClose={() => {
                    setNotificationPanelOpen(false);
                    loadUnreadCount(); // Reload counter when closing
                }}
                userId={user?.idUser}
            />
        </div>
    );
};

export default Layout;
