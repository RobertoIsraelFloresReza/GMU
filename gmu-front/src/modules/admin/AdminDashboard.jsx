import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStore, FaTruck, FaBoxes, FaChartLine, FaArrowUp } from 'react-icons/fa';
import Layout from '../../components/Layout';
import { storeService, deliveryService, productService, orderService, assignmentService } from '../../services/api';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        stores: 0,
        delivery: 0,
        products: 0,
        orders: 0,
        assignments: 0,
        visitedStores: 0
    });

    const [recentOrders, setRecentOrders] = useState([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Cargar datos en paralelo
            const [storesRes, deliveryRes, productsRes, ordersRes, assignmentsRes] = await Promise.all([
                storeService.getAll(),
                deliveryService.getAll(),
                productService.getAll(),
                orderService.getAll().catch(() => ({ data: { data: [] } })),
                assignmentService.getAll().catch(() => ({ data: { data: [] } }))
            ]);

            const stores = storesRes.data.data || [];
            const deliveryPersons = deliveryRes.data.data || [];
            const products = productsRes.data.data || [];
            const orders = ordersRes.data.data || [];
            const assignments = assignmentsRes.data.data || [];

            // Calcular visitadas
            const visitedCount = assignments.filter(a => a.visited).length;

            setStats({
                stores: stores.filter(s => s.status).length,
                delivery: deliveryPersons.filter(d => d.status).length,
                products: products.filter(p => p.status).length,
                orders: orders.length,
                assignments: assignments.length,
                visitedStores: visitedCount
            });

            // Tomar las últimas 5 órdenes
            setRecentOrders(orders.slice(0, 5));

        } catch (error) {
            console.error('Error loading dashboard:', error);
            toast.error('Error al cargar datos del dashboard');
        } finally {
            setLoading(false);
        }
    };

    const calculatePercentage = (part, total) => {
        if (total === 0) return 0;
        return Math.round((part / total) * 100);
    };

    return (
        <Layout userRole="ADMIN">
            <div className="animate-fade-in">
                <div className="page-header">
                    <h2 className="page-title">Bienvenido al Sistema</h2>
                    <p className="page-subtitle">Gestiona tu red de distribución de abarrotes</p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid - Optimizado para móvil */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
                            <div className="stat-card p-3 sm:p-4 md:p-6">
                                <div className="stat-card-header mb-2 sm:mb-3">
                                    <div className="stat-card-icon w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-lg sm:text-xl md:text-2xl">
                                        <FaStore />
                                    </div>
                                </div>
                                <div className="stat-card-value text-xl sm:text-2xl md:text-3xl">{stats.stores}</div>
                                <div className="stat-card-label text-xs sm:text-sm">Tiendas Activas</div>
                                <div className="stat-card-change positive text-xs hidden sm:flex">
                                    <FaArrowUp />
                                    <span>Total registradas</span>
                                </div>
                            </div>

                            <div className="stat-card p-3 sm:p-4 md:p-6">
                                <div className="stat-card-header mb-2 sm:mb-3">
                                    <div className="stat-card-icon orange w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-lg sm:text-xl md:text-2xl">
                                        <FaTruck />
                                    </div>
                                </div>
                                <div className="stat-card-value text-xl sm:text-2xl md:text-3xl">{stats.delivery}</div>
                                <div className="stat-card-label text-xs sm:text-sm">Repartidores</div>
                                <div className="stat-card-change positive text-xs hidden sm:flex">
                                    <FaArrowUp />
                                    <span>Activos en sistema</span>
                                </div>
                            </div>

                            <div className="stat-card p-3 sm:p-4 md:p-6">
                                <div className="stat-card-header mb-2 sm:mb-3">
                                    <div className="stat-card-icon green w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-lg sm:text-xl md:text-2xl">
                                        <FaBoxes />
                                    </div>
                                </div>
                                <div className="stat-card-value text-xl sm:text-2xl md:text-3xl">{stats.products}</div>
                                <div className="stat-card-label text-xs sm:text-sm">Productos</div>
                                <div className="stat-card-change positive text-xs hidden sm:flex">
                                    <FaArrowUp />
                                    <span>En catálogo</span>
                                </div>
                            </div>

                            <div className="stat-card p-3 sm:p-4 md:p-6">
                                <div className="stat-card-header mb-2 sm:mb-3">
                                    <div className="stat-card-icon w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-lg sm:text-xl md:text-2xl">
                                        <FaChartLine />
                                    </div>
                                </div>
                                <div className="stat-card-value text-xl sm:text-2xl md:text-3xl">{stats.assignments}</div>
                                <div className="stat-card-label text-xs sm:text-sm">Asignaciones</div>
                                <div className="stat-card-change positive text-xs hidden sm:flex">
                                    <FaArrowUp />
                                    <span>Total activas</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Orders Table */}
                        {recentOrders.length > 0 && (
                            <div className="card mt-6">
                                <div className="card-header">
                                    <h3 className="card-title">Órdenes Recientes</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Tienda</th>
                                                <th>Total</th>
                                                <th>Estado</th>
                                                <th>Fecha</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentOrders.map((order) => (
                                                <tr key={order.idOrder}>
                                                    <td className="font-semibold">#{order.idOrder}</td>
                                                    <td>{order.store?.name || 'N/A'}</td>
                                                    <td className="font-bold text-slate-900">${order.total?.toFixed(2) || '0.00'}</td>
                                                    <td>
                                                        {order.status === 'COMPLETED' && (
                                                            <span className="badge badge-success">Completado</span>
                                                        )}
                                                        {order.status === 'IN_PROGRESS' && (
                                                            <span className="badge badge-warning">En Proceso</span>
                                                        )}
                                                        {order.status === 'PENDING' && (
                                                            <span className="badge badge-info">Pendiente</span>
                                                        )}
                                                        {order.status === 'CANCELLED' && (
                                                            <span className="badge badge-error">Cancelado</span>
                                                        )}
                                                    </td>
                                                    <td>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
                            <div className="card">
                                <div className="card-header p-3 sm:p-4">
                                    <h3 className="card-title text-sm sm:text-base">Acciones Rápidas</h3>
                                </div>
                                <div className="card-body space-y-2 sm:space-y-3 p-3 sm:p-4">
                                    <button
                                        onClick={() => navigate('/admin/stores')}
                                        className="btn btn-primary w-full justify-start text-xs sm:text-sm md:text-base py-2 sm:py-3"
                                    >
                                        <FaStore /> Gestionar Tiendas
                                    </button>
                                    <button
                                        onClick={() => navigate('/admin/delivery')}
                                        className="btn btn-orange w-full justify-start text-xs sm:text-sm md:text-base py-2 sm:py-3"
                                    >
                                        <FaTruck /> Gestionar Repartidores
                                    </button>
                                    <button
                                        onClick={() => navigate('/admin/products')}
                                        className="btn btn-success w-full justify-start text-xs sm:text-sm md:text-base py-2 sm:py-3"
                                    >
                                        <FaBoxes /> Gestionar Productos
                                    </button>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header p-3 sm:p-4">
                                    <h3 className="card-title text-sm sm:text-base">Estadísticas del Sistema</h3>
                                </div>
                                <div className="card-body p-3 sm:p-4">
                                    <div className="space-y-3 sm:space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 text-xs sm:text-sm">Tiendas Visitadas</span>
                                            <span className="font-bold text-base sm:text-lg md:text-xl">{stats.visitedStores}/{stats.assignments}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all"
                                                style={{ width: `${calculatePercentage(stats.visitedStores, stats.assignments)}%` }}
                                            ></div>
                                        </div>

                                        <div className="flex justify-between items-center mt-3 sm:mt-4">
                                            <span className="text-slate-600 text-xs sm:text-sm">Productos Activos</span>
                                            <span className="font-bold text-base sm:text-lg md:text-xl">{stats.products}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                            <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                                        </div>

                                        <div className="flex justify-between items-center mt-3 sm:mt-4">
                                            <span className="text-slate-600 text-xs sm:text-sm">Repartidores Activos</span>
                                            <span className="font-bold text-base sm:text-lg md:text-xl">{stats.delivery}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                            <div className="bg-orange-600 h-2 rounded-full" style={{ width: '100%' }}></div>
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

export default AdminDashboard;
