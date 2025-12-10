import { useState, useEffect } from 'react';
import { FaMapMarkedAlt, FaRoute, FaStore, FaCheckCircle, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import Layout from '../../components/Layout';
import { assignmentService, storeService } from '../../services/api';
import { toast } from 'react-toastify';

const MapPage = () => {
    const [assignments, setAssignments] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStore, setSelectedStore] = useState(null);

    useEffect(() => {
        loadAssignments();
    }, []);

    const loadAssignments = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('user'));

            if (user?.idDeliveryPerson) {
                const response = await assignmentService.getByDeliveryPerson(user.idDeliveryPerson);
                const assignmentsData = response.data.data || [];
                setAssignments(assignmentsData);

                // Extraer las tiendas de las asignaciones
                const storesData = assignmentsData.map(a => a.store).filter(Boolean);
                setStores(storesData);
            }
        } catch (error) {
            console.error('Error loading assignments:', error);
            toast.error('Error al cargar rutas');
        } finally {
            setLoading(false);
        }
    };

    const openInMaps = (store) => {
        if (store.latitude && store.longitude) {
            // Abrir Google Maps con las coordenadas
            const url = `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
            window.open(url, '_blank');
        } else {
            // Abrir con la dirección
            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`;
            window.open(url, '_blank');
        }
    };

    const getStoreStatus = (assignment) => {
        if (assignment.visited) return 'completed';
        if (assignment.status) return 'in_progress';
        return 'pending';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 border-green-300';
            case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-300';
            default: return 'bg-orange-100 text-orange-800 border-orange-300';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <FaCheckCircle className="text-green-600" />;
            case 'in_progress': return <FaClock className="text-blue-600" />;
            default: return <FaMapMarkerAlt className="text-orange-600" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'completed': return 'Completada';
            case 'in_progress': return 'En Progreso';
            default: return 'Pendiente';
        }
    };

    const pendingCount = assignments.filter(a => !a.visited).length;
    const completedCount = assignments.filter(a => a.visited).length;
    const totalDistance = assignments.length * 2.5; // Estimación de distancia

    return (
        <Layout userRole="DELIVERY_PERSON">
            <div className="animate-fade-in">
                <div className="page-header mb-6">
                    <div>
                        <h2 className="page-title">Mapa de Rutas</h2>
                        <p className="page-subtitle">Planifica tu ruta de entrega</p>
                    </div>
                </div>

                {/* Stats Cards - Optimizado para móvil */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="card">
                        <div className="card-body p-3 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                    <FaRoute className="text-xl sm:text-2xl text-orange-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-slate-600 whitespace-nowrap">Pendientes</p>
                                    <p className="text-xl sm:text-2xl font-bold text-slate-900">{pendingCount}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-body p-3 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                    <FaCheckCircle className="text-xl sm:text-2xl text-green-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-slate-600 whitespace-nowrap">Completadas</p>
                                    <p className="text-xl sm:text-2xl font-bold text-slate-900">{completedCount}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-body p-3 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                    <FaMapMarkedAlt className="text-xl sm:text-2xl text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-slate-600 whitespace-nowrap">Distancia Est.</p>
                                    <p className="text-xl sm:text-2xl font-bold text-slate-900">{totalDistance.toFixed(1)} km</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="spinner"></div>
                    </div>
                ) : assignments.length === 0 ? (
                    <div className="card">
                        <div className="card-body text-center py-12">
                            <FaMapMarkedAlt className="text-6xl text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 mb-2">No tienes asignaciones</h3>
                            <p className="text-slate-500">Espera a que te asignen tiendas para ver tu ruta</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Map Placeholder */}
                        <div className="card mb-4 sm:mb-6">
                            <div className="card-body p-3 sm:p-4">
                                <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 text-center">
                                    <FaMapMarkedAlt className="text-4xl sm:text-5xl md:text-6xl text-blue-600 mx-auto mb-3 sm:mb-4" />
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Vista de Mapa</h3>
                                    <p className="text-xs sm:text-sm md:text-base text-slate-600 mb-3 sm:mb-4 px-2">
                                        Aquí se mostrará el mapa interactivo con todas tus tiendas asignadas
                                    </p>
                                    <div className="flex gap-2 sm:gap-3 justify-center">
                                        <button
                                            onClick={() => {
                                                if (stores.length > 0) {
                                                    openInMaps(stores[0]);
                                                }
                                            }}
                                            className="btn btn-primary text-xs sm:text-sm md:text-base py-2 sm:py-3 px-3 sm:px-4"
                                        >
                                            <FaRoute /> <span className="hidden sm:inline">Ver Ruta en</span> Google Maps
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Store List */}
                        <div className="card">
                            <div className="card-body p-3 sm:p-4">
                                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Tiendas en tu Ruta</h3>
                                <div className="space-y-2 sm:space-y-3">
                                    {assignments.map((assignment, index) => {
                                        const store = assignment.store;
                                        const status = getStoreStatus(assignment);

                                        return (
                                            <div
                                                key={assignment.idAssignment}
                                                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all hover:shadow-md ${getStatusColor(status)}`}
                                            >
                                                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                                                    <div className="flex items-start gap-2 sm:gap-3 flex-1 w-full">
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center font-bold text-slate-700 text-sm sm:text-base">
                                                                {index + 1}
                                                            </div>
                                                            <div className="text-lg sm:text-xl">
                                                                {getStatusIcon(status)}
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-sm sm:text-base md:text-lg mb-1 break-words">{store?.name}</h4>
                                                            <div className="flex items-start gap-1 sm:gap-2 text-xs sm:text-sm mb-2">
                                                                <FaMapMarkerAlt className="mt-1 flex-shrink-0" />
                                                                <span className="break-words">{store?.address}</span>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
                                                                <span className={`px-2 py-1 rounded-full font-semibold whitespace-nowrap ${getStatusColor(status)}`}>
                                                                    {getStatusText(status)}
                                                                </span>
                                                                {store?.phone && (
                                                                    <span className="text-slate-600 whitespace-nowrap">Tel: {store.phone}</span>
                                                                )}
                                                                {assignment.visitDate && (
                                                                    <span className="text-green-600 font-semibold break-all">
                                                                        ✓ {new Date(assignment.visitDate).toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => openInMaps(store)}
                                                        className="btn btn-outline text-xs sm:text-sm py-2 px-3 sm:px-4 w-full sm:w-auto whitespace-nowrap"
                                                    >
                                                        <FaMapMarkedAlt /> Navegar
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Route Summary */}
                        <div className="card mt-4 sm:mt-6 bg-gradient-to-br from-green-50 to-blue-50">
                            <div className="card-body p-3 sm:p-4">
                                <h4 className="font-bold text-sm sm:text-base text-slate-900 mb-3">Resumen de Ruta</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                                    <div>
                                        <p className="text-xs sm:text-sm text-slate-600 mb-1">Total de Tiendas</p>
                                        <p className="text-xl sm:text-2xl font-bold text-slate-900">{assignments.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-slate-600 mb-1">Progreso</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-slate-200 rounded-full h-2 sm:h-3">
                                                <div
                                                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 sm:h-3 rounded-full transition-all"
                                                    style={{ width: `${assignments.length > 0 ? (completedCount / assignments.length * 100) : 0}%` }}
                                                ></div>
                                            </div>
                                            <span className="font-bold text-slate-900 text-sm sm:text-base whitespace-nowrap">
                                                {assignments.length > 0 ? Math.round(completedCount / assignments.length * 100) : 0}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
};

export default MapPage;
