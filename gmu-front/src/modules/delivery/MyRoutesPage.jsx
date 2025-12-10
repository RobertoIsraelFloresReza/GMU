import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRoute, FaStore, FaCheckCircle, FaClock, FaMapMarkerAlt, FaQrcode, FaShoppingCart, FaPhone, FaUser } from 'react-icons/fa';
import Layout from '../../components/Layout';
import RouteMap from '../../components/RouteMap';
import { assignmentService, deliveryService, orderService } from '../../services/api';
import { toast } from 'react-toastify';
import { cacheService } from '../../services/cacheService';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const MyRoutesPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState([]);
    const [storesWithStatus, setStoresWithStatus] = useState([]);
    const [orders, setOrders] = useState([]);
    const [deliveryPersonId, setDeliveryPersonId] = useState(null);
    const [showRouteLines, setShowRouteLines] = useState(true);
    const isOnline = useOnlineStatus();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('user'));

            if (!user || !user.email) {
                toast.error('No hay sesión de usuario');
                navigate('/login');
                return;
            }

            console.log(`📍 Cargando rutas (Online: ${isOnline})...`);

            // 1. Obtener asignaciones desde cache (funciona offline)
            const cachedAssignments = await cacheService.getAssignments();
            const activeAssignments = cachedAssignments.filter(a => a.status !== false) || [];
            setAssignments(activeAssignments);

            // Obtener deliveryPersonId del localStorage o cache
            const cachedDeliveryPersonId = localStorage.getItem('deliveryPersonId');
            let dpId = null;
            if (cachedDeliveryPersonId) {
                dpId = parseInt(cachedDeliveryPersonId);
                setDeliveryPersonId(dpId);
            }

            // 2. Procesar tiendas con sus datos de asignaciones
            const storesWithVisitStatus = activeAssignments.map(assignment => {
                const store = assignment.store;

                return {
                    ...store,
                    visited: assignment.visited || false,
                    lastVisit: assignment.visitDate || null,
                    assignmentId: assignment.idAssignment
                };
            });

            setStoresWithStatus(storesWithVisitStatus);
            console.log(`✅ ${storesWithVisitStatus.length} tiendas cargadas desde cache`);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al cargar información de rutas');
        } finally {
            setLoading(false);
        }
    };

    const visitedCount = storesWithStatus.filter(s => s.visited).length;
    const pendingCount = storesWithStatus.filter(s => !s.visited).length;

    const handleNavigateToStore = (store) => {
        // Abrir Google Maps con la ubicación de la tienda
        if (store.latitude && store.longitude) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
            window.open(url, '_blank');
        } else {
            toast.warning('Esta tienda no tiene coordenadas configuradas');
        }
    };

    return (
        <Layout userRole="DELIVERY_PERSON">
            <div className="animate-fade-in">
                <div className="page-header mb-6">
                    <div>
                        <h2 className="page-title">Mis Rutas</h2>
                        <p className="page-subtitle">Tiendas asignadas y estado de visitas de hoy</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="rounded-2xl shadow-lg overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #3b82f6, #2563eb)' }}>
                        <div className="p-6 text-center">
                            <FaStore className="text-3xl mx-auto mb-2" style={{ color: '#ffffff' }} />
                            <p className="text-sm mb-1" style={{ color: '#ffffff', fontWeight: '500' }}>Total Asignadas</p>
                            <p className="text-4xl font-bold" style={{ color: '#ffffff' }}>{storesWithStatus.length}</p>
                        </div>
                    </div>
                    <div className="rounded-2xl shadow-lg overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #10b981, #059669)' }}>
                        <div className="p-6 text-center">
                            <FaCheckCircle className="text-3xl mx-auto mb-2" style={{ color: '#ffffff' }} />
                            <p className="text-sm mb-1" style={{ color: '#ffffff', fontWeight: '500' }}>Visitadas Hoy</p>
                            <p className="text-4xl font-bold" style={{ color: '#ffffff' }}>{visitedCount}</p>
                        </div>
                    </div>
                    <div className="rounded-2xl shadow-lg overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #ef4444, #dc2626)' }}>
                        <div className="p-6 text-center">
                            <FaClock className="text-3xl mx-auto mb-2" style={{ color: '#ffffff' }} />
                            <p className="text-sm mb-1" style={{ color: '#ffffff', fontWeight: '500' }}>Pendientes</p>
                            <p className="text-4xl font-bold" style={{ color: '#ffffff' }}>{pendingCount}</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <>
                        {/* Mapa de Rutas */}
                        <div className="card mb-6">
                            <div className="card-body">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <FaRoute className="text-blue-600" /> Mapa de Rutas
                                    </h3>
                                    <button
                                        onClick={() => setShowRouteLines(!showRouteLines)}
                                        className={`btn btn-sm ${showRouteLines ? 'btn-primary' : 'btn-outline'}`}
                                    >
                                        {showRouteLines ? 'Ocultar Ruta' : 'Mostrar Ruta'}
                                    </button>
                                </div>

                                {/* Leyenda */}
                                <div className="flex flex-wrap gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                                        <span className="text-sm text-slate-700">Visitada</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                                        <span className="text-sm text-slate-700">Pendiente</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                                        <span className="text-sm text-slate-700">Ubicación Actual</span>
                                    </div>
                                </div>

                                <RouteMap
                                    stores={storesWithStatus}
                                    showRoute={showRouteLines}
                                    height="500px"
                                />
                            </div>
                        </div>

                        {/* Lista de Tiendas */}
                        <div className="card">
                            <div className="card-body">
                                <h3 className="text-xl font-bold text-slate-900 mb-4">
                                    Listado de Tiendas Asignadas
                                </h3>

                                {storesWithStatus.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FaStore className="text-6xl text-slate-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-slate-700 mb-2">
                                            No tienes tiendas asignadas
                                        </h3>
                                        <p className="text-slate-500">
                                            Contacta al administrador para que te asigne rutas
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {storesWithStatus.map((store) => (
                                            <div
                                                key={store.idStore}
                                                className={`card border-2 ${
                                                    store.visited
                                                        ? 'border-green-200 bg-green-50'
                                                        : 'border-red-200 bg-red-50'
                                                } hover:shadow-lg transition-all`}
                                            >
                                                <div className="card-body">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start gap-4 flex-1">
                                                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                                                                store.visited ? 'bg-green-600' : 'bg-red-600'
                                                            }`}>
                                                                {store.visited ? (
                                                                    <FaCheckCircle className="text-3xl text-white" />
                                                                ) : (
                                                                    <FaClock className="text-3xl text-white" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <h3 className="font-bold text-lg text-slate-900">
                                                                        {store.name}
                                                                    </h3>
                                                                    {store.visited ? (
                                                                        <span className="badge badge-success">
                                                                            ✓ Visitada Hoy
                                                                        </span>
                                                                    ) : (
                                                                        <span className="badge badge-danger">
                                                                            ⏱ Pendiente
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="space-y-1 text-sm text-slate-600">
                                                                    <div className="flex items-start gap-2">
                                                                        <FaMapMarkerAlt className="mt-1 text-blue-600" />
                                                                        <span>{store.address}</span>
                                                                    </div>
                                                                    {store.phone && (
                                                                        <div className="flex items-center gap-2">
                                                                            <FaPhone className="text-green-600" />
                                                                            <span>{store.phone}</span>
                                                                        </div>
                                                                    )}
                                                                    {store.contactName && (
                                                                        <div className="flex items-center gap-2">
                                                                            <FaUser className="text-purple-600" />
                                                                            <span>{store.contactName}</span>
                                                                        </div>
                                                                    )}
                                                                    {store.qrCode && (
                                                                        <div className="flex items-center gap-2">
                                                                            <FaQrcode className="text-orange-600" />
                                                                            <span className="text-xs">QR: {store.qrCode}</span>
                                                                        </div>
                                                                    )}
                                                                    {store.lastVisit && (
                                                                        <div className="text-xs text-green-600 mt-2">
                                                                            <strong>Última visita:</strong>{' '}
                                                                            {new Date(store.lastVisit).toLocaleString('es-MX')}
                                                                        </div>
                                                                    )}
                                                                    {store.totalOrders > 0 && (
                                                                        <div className="text-xs text-slate-500">
                                                                            <strong>Total pedidos:</strong> {store.totalOrders}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-200">
                                                        <button
                                                            onClick={() => handleNavigateToStore(store)}
                                                            className="btn btn-outline btn-sm"
                                                        >
                                                            <FaMapMarkerAlt /> Ir en Maps
                                                        </button>
                                                        <button
                                                            onClick={() => navigate('/delivery/qr-scan', { state: { store } })}
                                                            className="btn btn-primary btn-sm"
                                                        >
                                                            <FaQrcode /> Escanear QR
                                                        </button>
                                                        {store.visited && (
                                                            <button
                                                                onClick={() => navigate('/delivery/orders')}
                                                                className="btn bg-green-600 hover:bg-green-700 text-white btn-sm sm:col-span-2 md:col-span-1"
                                                            >
                                                                <FaShoppingCart /> Ver Pedido
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
};

export default MyRoutesPage;
