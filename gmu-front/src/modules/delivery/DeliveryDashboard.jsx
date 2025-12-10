import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaQrcode, FaMapMarkerAlt, FaClipboardList, FaRoute, FaCheck, FaClock, FaExclamationCircle } from 'react-icons/fa';
import Layout from '../../components/Layout';
import { assignmentService } from '../../services/api';
import { toast } from 'react-toastify';

const DeliveryDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState([]);
    const [stats, setStats] = useState({
        assigned: 0,
        completed: 0,
        pending: 0
    });

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

                // Calcular estadísticas
                const completed = assignmentsData.filter(a => a.visited).length;
                const pending = assignmentsData.filter(a => !a.visited).length;

                setStats({
                    assigned: assignmentsData.length,
                    completed: completed,
                    pending: pending
                });
            }
        } catch (error) {
            console.error('Error loading assignments:', error);
            toast.error('Error al cargar asignaciones');
        } finally {
            setLoading(false);
        }
    };

    const getStatusFromAssignment = (assignment) => {
        if (assignment.visited) return 'completed';
        if (assignment.status) return 'in_progress';
        return 'pending';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <FaCheck className="text-green-600" />;
            case 'in_progress':
                return <FaClock className="text-orange-600" />;
            default:
                return <FaExclamationCircle className="text-blue-600" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'completed':
                return 'Completada';
            case 'in_progress':
                return 'En Proceso';
            default:
                return 'Pendiente';
        }
    };

    return (
        <Layout userRole="DELIVERY_PERSON">
            <div className="animate-fade-in">
                <div className="page-header">
                    <h2 className="page-title">Mis Rutas de Entrega</h2>
                    <p className="page-subtitle">Tienes {stats.pending} tiendas pendientes para hoy</p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid - Optimizado para móvil */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
                            <div className="stat-card">
                                <div className="stat-card-header">
                                    <div className="stat-card-icon orange">
                                        <FaClipboardList />
                                    </div>
                                </div>
                                <div className="stat-card-value">{stats.assigned}</div>
                                <div className="stat-card-label text-xs sm:text-sm">Tiendas Asignadas</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-card-header">
                                    <div className="stat-card-icon green">
                                        <FaCheck />
                                    </div>
                                </div>
                                <div className="stat-card-value">{stats.completed}</div>
                                <div className="stat-card-label text-xs sm:text-sm">Visitadas</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-card-header">
                                    <div className="stat-card-icon">
                                        <FaRoute />
                                    </div>
                                </div>
                                <div className="stat-card-value">{stats.pending}</div>
                                <div className="stat-card-label text-xs sm:text-sm">Pendientes</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-card-header">
                                    <div className="stat-card-icon orange">
                                        <FaMapMarkerAlt />
                                    </div>
                                </div>
                                <div className="stat-card-value text-2xl sm:text-3xl">{Math.round((stats.completed / stats.assigned) * 100) || 0}%</div>
                                <div className="stat-card-label text-xs sm:text-sm">Completado</div>
                            </div>
                        </div>

                        {assignments.length === 0 ? (
                            <div className="card mt-6">
                                <div className="card-body text-center py-12">
                                    <FaRoute className="text-6xl text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-slate-700 mb-2">No tienes asignaciones</h3>
                                    <p className="text-slate-500">Espera a que te asignen tiendas para comenzar tu ruta</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mt-6">
                                {/* Stores Cards */}
                                <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Tiendas Asignadas</h3>
                                    {assignments.map((assignment, index) => {
                                        const store = assignment.store;
                                        const status = getStatusFromAssignment(assignment);

                                        return (
                                            <div key={assignment.idAssignment} className="card hover:shadow-lg transition-all">
                                                <div className="card-body p-3 sm:p-4 md:p-6">
                                                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-0">
                                                        <div className="flex-1 w-full">
                                                            <div className="flex items-start gap-2 sm:gap-3 mb-2">
                                                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-sm sm:text-base flex-shrink-0">
                                                                    {index + 1}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-bold text-base sm:text-lg text-slate-900 break-words">{store?.name}</h4>
                                                                    <p className="text-xs sm:text-sm text-slate-500 break-words mt-1">{store?.address}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm text-slate-600 ml-10 sm:ml-13">
                                                                <span className="flex items-center gap-1 sm:gap-2">
                                                                    {getStatusIcon(status)}
                                                                    <span className="whitespace-nowrap">{getStatusText(status)}</span>
                                                                </span>
                                                                {assignment.visitDate && (
                                                                    <>
                                                                        <span className="hidden sm:inline">•</span>
                                                                        <span className="text-xs break-all">{new Date(assignment.visitDate).toLocaleString()}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-row sm:flex-col lg:flex-row gap-2 w-full sm:w-auto sm:ml-4">
                                                            {status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => navigate('/delivery/scan')}
                                                                        className="btn btn-orange flex-1 sm:flex-none text-xs sm:text-sm py-2 sm:py-3 px-3 sm:px-4"
                                                                    >
                                                                        <FaQrcode className="text-sm sm:text-base" /> <span className="hidden sm:inline">Escanear</span><span className="sm:hidden">QR</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => navigate('/delivery/map')}
                                                                        className="btn btn-outline flex-1 sm:flex-none text-xs sm:text-sm py-2 sm:py-3 px-3 sm:px-4"
                                                                    >
                                                                        <FaMapMarkerAlt className="text-sm sm:text-base" /> <span className="hidden md:inline">Mapa</span>
                                                                    </button>
                                                                </>
                                                            )}
                                                            {status === 'in_progress' && (
                                                                <button
                                                                    onClick={() => navigate('/delivery/scan')}
                                                                    className="btn btn-success w-full sm:w-auto text-xs sm:text-sm py-2 sm:py-3 px-3 sm:px-4"
                                                                >
                                                                    <FaQrcode className="text-sm sm:text-base" /> Finalizar
                                                                </button>
                                                            )}
                                                            {status === 'completed' && (
                                                                <span className="badge badge-success text-xs sm:text-base px-3 sm:px-4 py-1 sm:py-2 whitespace-nowrap">
                                                                    <FaCheck /> Completada
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Sidebar Actions */}
                                <div className="space-y-4 lg:space-y-6">
                                    <div className="card">
                                        <div className="card-header p-3 sm:p-4">
                                            <h3 className="card-title text-sm sm:text-base">Acciones Rápidas</h3>
                                        </div>
                                        <div className="card-body space-y-2 sm:space-y-3 p-3 sm:p-4">
                                            <button
                                                onClick={() => navigate('/delivery/scan')}
                                                className="btn btn-primary w-full justify-start text-sm sm:text-base py-2 sm:py-3"
                                            >
                                                <FaQrcode /> Escanear QR
                                            </button>
                                            <button
                                                onClick={() => navigate('/delivery/map')}
                                                className="btn btn-orange w-full justify-start text-sm sm:text-base py-2 sm:py-3"
                                            >
                                                <FaMapMarkerAlt /> Ver Mapa Completo
                                            </button>
                                        </div>
                                    </div>

                                    <div className="card">
                                        <div className="card-header p-3 sm:p-4">
                                            <h3 className="card-title text-sm sm:text-base">Progreso del Día</h3>
                                        </div>
                                        <div className="card-body p-3 sm:p-4">
                                            <div className="text-center mb-3 sm:mb-4">
                                                <div className="text-4xl sm:text-5xl font-black text-blue-600">
                                                    {Math.round((stats.completed / stats.assigned) * 100) || 0}%
                                                </div>
                                                <p className="text-slate-600 text-xs sm:text-sm mt-1">Completado</p>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2 sm:h-3">
                                                <div
                                                    className="bg-gradient-to-r from-blue-600 to-blue-500 h-2 sm:h-3 rounded-full transition-all duration-500"
                                                    style={{ width: `${stats.assigned > 0 ? (stats.completed / stats.assigned) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                            <div className="mt-3 sm:mt-4 space-y-2 text-xs sm:text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600">Completadas:</span>
                                                    <span className="font-bold text-green-600">{stats.completed}/{stats.assigned}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600">Pendientes:</span>
                                                    <span className="font-bold text-orange-600">{stats.pending}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {stats.pending > 0 && (
                                        <div className="card bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                                            <div className="card-body text-center p-4 sm:p-6">
                                                <FaMapMarkerAlt className="text-4xl sm:text-5xl mx-auto mb-2 sm:mb-3 opacity-80" />
                                                <h4 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">¡Sigue Adelante!</h4>
                                                <p className="text-blue-100 text-xs sm:text-sm">
                                                    Te quedan {stats.pending} tiendas por visitar hoy.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

export default DeliveryDashboard;
