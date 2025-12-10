import { useState, useEffect } from 'react';
import { FaShoppingCart, FaStore, FaTruck, FaClock, FaCheckCircle, FaTimesCircle, FaSpinner, FaEye, FaFilter } from 'react-icons/fa';
import Layout from '../../components/Layout';
import { orderService } from '../../services/api';
import { toast } from 'react-toastify';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filter, setFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await orderService.getAll();
            setOrders(response.data.data || []);
        } catch (error) {
            console.error('Error loading orders:', error);
            toast.error('Error al cargar pedidos');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            PENDING: { color: 'warning', text: 'Pendiente', icon: FaClock },
            IN_PROGRESS: { color: 'info', text: 'En Proceso', icon: FaSpinner },
            COMPLETED: { color: 'success', text: 'Completado', icon: FaCheckCircle },
            CANCELLED: { color: 'danger', text: 'Cancelado', icon: FaTimesCircle }
        };
        const badge = badges[status] || badges.PENDING;
        const Icon = badge.icon;
        return (
            <span className={`badge badge-${badge.color} flex items-center gap-1`}>
                <Icon /> {badge.text}
            </span>
        );
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await orderService.updateStatus(orderId, newStatus);
            toast.success('Estado actualizado');
            loadOrders();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Error al actualizar estado');
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesFilter = filter === 'ALL' || order.status === filter;
        const matchesSearch = searchTerm === '' ||
            order.store?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.deliveryPerson?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.deliveryPerson?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.idOrder.toString().includes(searchTerm);
        return matchesFilter && matchesSearch;
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTotalsByStatus = () => {
        return {
            ALL: orders.length,
            PENDING: orders.filter(o => o.status === 'PENDING').length,
            IN_PROGRESS: orders.filter(o => o.status === 'IN_PROGRESS').length,
            COMPLETED: orders.filter(o => o.status === 'COMPLETED').length,
            CANCELLED: orders.filter(o => o.status === 'CANCELLED').length
        };
    };

    const totals = getTotalsByStatus();

    return (
        <Layout userRole="ADMIN">
            <div className="animate-fade-in">
                <div className="page-header mb-6">
                    <div>
                        <h2 className="page-title">Gestión de Pedidos</h2>
                        <p className="page-subtitle">Administra todos los pedidos del sistema</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="rounded-2xl shadow-lg overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #3b82f6, #2563eb)' }}>
                        <div className="p-6 text-center">
                            <p className="text-sm mb-1" style={{ color: '#ffffff', fontWeight: '500' }}>Total</p>
                            <p className="text-3xl font-bold" style={{ color: '#ffffff' }}>{totals.ALL}</p>
                        </div>
                    </div>
                    <div className="rounded-2xl shadow-lg overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #eab308, #ca8a04)' }}>
                        <div className="p-6 text-center">
                            <p className="text-sm mb-1" style={{ color: '#ffffff', fontWeight: '500' }}>Pendientes</p>
                            <p className="text-3xl font-bold" style={{ color: '#ffffff' }}>{totals.PENDING}</p>
                        </div>
                    </div>
                    <div className="rounded-2xl shadow-lg overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #a855f7, #9333ea)' }}>
                        <div className="p-6 text-center">
                            <p className="text-sm mb-1" style={{ color: '#ffffff', fontWeight: '500' }}>En Proceso</p>
                            <p className="text-3xl font-bold" style={{ color: '#ffffff' }}>{totals.IN_PROGRESS}</p>
                        </div>
                    </div>
                    <div className="rounded-2xl shadow-lg overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #10b981, #059669)' }}>
                        <div className="p-6 text-center">
                            <p className="text-sm mb-1" style={{ color: '#ffffff', fontWeight: '500' }}>Completados</p>
                            <p className="text-3xl font-bold" style={{ color: '#ffffff' }}>{totals.COMPLETED}</p>
                        </div>
                    </div>
                    <div className="rounded-2xl shadow-lg overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #ef4444, #dc2626)' }}>
                        <div className="p-6 text-center">
                            <p className="text-sm mb-1" style={{ color: '#ffffff', fontWeight: '500' }}>Cancelados</p>
                            <p className="text-3xl font-bold" style={{ color: '#ffffff' }}>{totals.CANCELLED}</p>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="card mb-6">
                    <div className="card-body">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Buscar por tienda, repartidor o # de pedido..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto">
                                {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilter(status)}
                                        className={`btn btn-sm whitespace-nowrap ${
                                            filter === status ? 'btn-primary' : 'btn-outline'
                                        }`}
                                    >
                                        {status === 'ALL' ? (
                                            <>
                                                <FaFilter /> Todos
                                            </>
                                        ) : (
                                            getStatusBadge(status)
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="spinner"></div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="card">
                        <div className="card-body text-center py-12">
                            <FaShoppingCart className="text-6xl text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 mb-2">No hay pedidos</h3>
                            <p className="text-slate-500">
                                {searchTerm ? 'No se encontraron pedidos con ese criterio de búsqueda' : 'No hay pedidos registrados'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="card">
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Tienda</th>
                                        <th>Repartidor</th>
                                        <th>Fecha</th>
                                        <th>Total</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map((order) => (
                                        <tr key={order.idOrder}>
                                            <td className="font-mono text-sm">#{order.idOrder}</td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <FaStore className="text-blue-600" />
                                                    <div>
                                                        <div className="font-semibold">{order.store?.name}</div>
                                                        <div className="text-xs text-slate-500">{order.store?.address}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <FaTruck className="text-orange-600" />
                                                    <span>
                                                        {order.deliveryPerson?.firstName} {order.deliveryPerson?.lastName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-sm">{formatDate(order.orderDate)}</td>
                                            <td className="font-bold text-green-600">
                                                ${order.total?.toFixed(2) || '0.00'}
                                            </td>
                                            <td>
                                                <select
                                                    className="form-input text-sm"
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.idOrder, e.target.value)}
                                                >
                                                    <option value="PENDING">Pendiente</option>
                                                    <option value="IN_PROGRESS">En Proceso</option>
                                                    <option value="COMPLETED">Completado</option>
                                                    <option value="CANCELLED">Cancelado</option>
                                                </select>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="btn btn-sm btn-outline"
                                                >
                                                    <FaEye /> Ver
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Order Details Modal */}
                {selectedOrder && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-sm sm:max-w-2xl lg:max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600">
                                <h3 className="text-2xl font-bold text-white">Detalles del Pedido</h3>
                                <p className="text-blue-100 text-sm mt-1">
                                    Pedido #{selectedOrder.idOrder}
                                </p>
                            </div>
                            <div className="p-6">
                                {/* Store and Delivery Info */}
                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-3">Tienda</h4>
                                        <div className="bg-slate-50 rounded-lg p-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <FaStore className="text-blue-600" />
                                                <span className="font-semibold">{selectedOrder.store?.name}</span>
                                            </div>
                                            <p className="text-sm text-slate-600">{selectedOrder.store?.address}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-3">Repartidor</h4>
                                        <div className="bg-slate-50 rounded-lg p-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <FaTruck className="text-orange-600" />
                                                <span className="font-semibold">
                                                    {selectedOrder.deliveryPerson?.firstName} {selectedOrder.deliveryPerson?.lastName}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600">{selectedOrder.deliveryPerson?.email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className="mb-6">
                                    <h4 className="font-bold text-slate-900 mb-3">Resumen</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-slate-50 rounded-lg p-4">
                                            <p className="text-sm text-slate-600">Fecha</p>
                                            <p className="font-semibold text-sm">{formatDate(selectedOrder.orderDate)}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-4">
                                            <p className="text-sm text-slate-600">Estado</p>
                                            <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-4">
                                            <p className="text-sm text-green-700">Total</p>
                                            <p className="text-2xl font-bold text-green-600">
                                                ${selectedOrder.total?.toFixed(2) || '0.00'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Products */}
                                {selectedOrder.items && selectedOrder.items.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="font-bold text-slate-900 mb-3">Productos</h4>
                                        <div className="overflow-x-auto">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Producto</th>
                                                        <th>Cantidad</th>
                                                        <th>Precio Unit.</th>
                                                        <th>Subtotal</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedOrder.items.map((item, index) => (
                                                        <tr key={index}>
                                                            <td>{item.product?.name}</td>
                                                            <td>{item.quantity}</td>
                                                            <td>${item.unitPrice?.toFixed(2)}</td>
                                                            <td>${item.subtotal?.toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                {selectedOrder.notes && (
                                    <div className="mb-6">
                                        <h4 className="font-bold text-slate-900 mb-3">Notas</h4>
                                        <div className="bg-slate-50 rounded-lg p-4">
                                            <p className="text-slate-700">{selectedOrder.notes}</p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="btn btn-primary w-full"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default OrdersPage;
