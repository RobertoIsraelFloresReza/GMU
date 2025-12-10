import { useState, useEffect } from 'react';
import { FaShoppingCart, FaStore, FaClock, FaCheckCircle, FaTimesCircle, FaSpinner, FaEye } from 'react-icons/fa';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { orderService, deliveryService } from '../../services/api';
import { toast } from 'react-toastify';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filter, setFilter] = useState('ALL'); // ALL, PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, orderId: null, newStatus: null });

    useEffect(() => {
        loadOrders();

        // Escuchar evento de sincronización exitosa
        const handleOrdersSynced = (event) => {
            console.log('🔔 Pedidos sincronizados, recargando lista...', event.detail);
            toast.info('Actualizando lista de pedidos...');
            loadOrders();
        };

        window.addEventListener('orders-synced', handleOrdersSynced);

        // Cleanup
        return () => {
            window.removeEventListener('orders-synced', handleOrdersSynced);
        };
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('user'));

            // Obtener el delivery person por email
            const deliveryResponse = await deliveryService.getAll();
            const deliveryPerson = deliveryResponse.data.data.find(
                dp => dp.email === user.email
            );

            if (deliveryPerson) {
                const response = await orderService.getByDeliveryPerson(deliveryPerson.idDeliveryPerson);
                setOrders(response.data.data || []);
            } else {
                toast.error('No se encontró información del repartidor');
                setOrders([]);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            toast.error('Error al cargar pedidos');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChangeRequest = (orderId, newStatus) => {
        // Mostrar confirmación antes de cambiar
        setConfirmDialog({ isOpen: true, orderId, newStatus });
    };

    const handleStatusChange = async () => {
        const { orderId, newStatus } = confirmDialog;
        try {
            await orderService.updateStatus(orderId, newStatus);
            toast.success('Estado actualizado exitosamente');
            loadOrders();
            // Si está en el modal, actualizar también el estado del pedido seleccionado
            if (selectedOrder && selectedOrder.idOrder === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
            setConfirmDialog({ isOpen: false, orderId: null, newStatus: null });
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Error al actualizar estado');
            setConfirmDialog({ isOpen: false, orderId: null, newStatus: null });
        }
    };

    const getStatusName = (status) => {
        const names = {
            PENDING: 'Pendiente',
            IN_PROGRESS: 'En Proceso',
            COMPLETED: 'Completado',
            CANCELLED: 'Cancelado'
        };
        return names[status] || status;
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

    const filteredOrders = filter === 'ALL'
        ? orders
        : orders.filter(order => order.status === filter);

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

    return (
        <Layout userRole="DELIVERY_PERSON">
            <div className="animate-fade-in">
                <div className="page-header mb-6">
                    <div>
                        <h2 className="page-title">Mis Pedidos</h2>
                        <p className="page-subtitle">Historial de pedidos levantados</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`btn btn-sm whitespace-nowrap ${
                                filter === status ? 'btn-primary' : 'btn-outline'
                            }`}
                        >
                            {status === 'ALL' ? 'Todos' : getStatusBadge(status)}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="spinner"></div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="card">
                        <div className="card-body text-center py-12">
                            <FaShoppingCart className="text-6xl text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 mb-2">
                                No hay pedidos
                            </h3>
                            <p className="text-slate-500">
                                {filter === 'ALL'
                                    ? 'No has levantado ningún pedido aún'
                                    : `No hay pedidos con estado: ${getStatusBadge(filter)}`}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredOrders.map((order) => (
                            <div key={order.idOrder} className="card hover:shadow-lg transition-shadow">
                                <div className="card-body">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                                <FaStore className="text-2xl text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg text-slate-900">
                                                    {order.store?.name || 'Tienda Desconocida'}
                                                </h3>
                                                <p className="text-sm text-slate-600">
                                                    {order.store?.address}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                    <FaClock />
                                                    <span>{formatDate(order.orderDate)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="mb-2">{getStatusBadge(order.status)}</div>
                                            <div className="text-2xl font-bold text-green-600">
                                                ${order.total?.toFixed(2) || '0.00'}
                                            </div>
                                        </div>
                                    </div>

                                    {order.notes && (
                                        <div className="bg-slate-50 rounded-lg p-3 mb-3">
                                            <p className="text-sm text-slate-700">
                                                <strong>Notas:</strong> {order.notes}
                                            </p>
                                        </div>
                                    )}

                                    {/* Cambiar Estado */}
                                    <div className="mb-3">
                                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                                            Cambiar Estado:
                                        </label>
                                        <select
                                            className="form-input w-full"
                                            value={order.status}
                                            onChange={(e) => handleStatusChangeRequest(order.idOrder, e.target.value)}
                                        >
                                            <option value="PENDING">Pendiente</option>
                                            <option value="IN_PROGRESS">En Proceso</option>
                                            <option value="COMPLETED">Completado</option>
                                            <option value="CANCELLED">Cancelado</option>
                                        </select>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="btn btn-sm btn-outline flex-1"
                                        >
                                            <FaEye /> Ver Detalles
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                                {/* Store Info */}
                                <div className="mb-6">
                                    <h4 className="font-bold text-slate-900 mb-3">Información de la Tienda</h4>
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <FaStore className="text-blue-600" />
                                            <span className="font-semibold">{selectedOrder.store?.name}</span>
                                        </div>
                                        <p className="text-sm text-slate-600">{selectedOrder.store?.address}</p>
                                    </div>
                                </div>

                                {/* Order Info */}
                                <div className="mb-6">
                                    <h4 className="font-bold text-slate-900 mb-3">Información del Pedido</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-slate-600">Fecha del Pedido</p>
                                            <p className="font-semibold">{formatDate(selectedOrder.orderDate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600 mb-2">Estado Actual</p>
                                            <div className="mb-2">{getStatusBadge(selectedOrder.status)}</div>
                                            <select
                                                className="form-input text-sm"
                                                value={selectedOrder.status}
                                                onChange={(e) => handleStatusChangeRequest(selectedOrder.idOrder, e.target.value)}
                                            >
                                                <option value="PENDING">Pendiente</option>
                                                <option value="IN_PROGRESS">En Proceso</option>
                                                <option value="COMPLETED">Completado</option>
                                                <option value="CANCELLED">Cancelado</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-sm text-slate-600">Total</p>
                                            <p className="text-3xl font-bold text-green-600">
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

                {/* Confirm Dialog */}
                {confirmDialog.isOpen && (
                    <ConfirmDialog
                        isOpen={confirmDialog.isOpen}
                        onClose={() => setConfirmDialog({ isOpen: false, orderId: null, newStatus: null })}
                        onConfirm={handleStatusChange}
                        title="Confirmar Cambio de Estado"
                        message={`¿Estás seguro de cambiar el estado del pedido a "${getStatusName(confirmDialog.newStatus)}"?`}
                        confirmText="Sí, cambiar"
                        cancelText="Cancelar"
                        type="warning"
                    />
                )}
            </div>
        </Layout>
    );
};

export default OrdersPage;
