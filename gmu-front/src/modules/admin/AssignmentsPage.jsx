import { useState, useEffect } from 'react';
import { FaTruck, FaStore, FaPlus, FaTrash, FaCalendar } from 'react-icons/fa';
import Layout from '../../components/Layout';
import { assignmentService, deliveryService, storeService } from '../../services/api';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../components/ConfirmDialog';
import Tooltip from '../../components/Tooltip';

const AssignmentsPage = () => {
    const [assignments, setAssignments] = useState([]);
    const [deliveryPersons, setDeliveryPersons] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, assignmentId: null });
    const [formData, setFormData] = useState({
        idDeliveryPerson: '',
        idStore: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [assignmentsRes, deliveryRes, storesRes] = await Promise.all([
                assignmentService.getAll(),
                deliveryService.getAll(),
                storeService.getAll()
            ]);

            setAssignments(assignmentsRes.data.data || []);
            setDeliveryPersons(deliveryRes.data.data || []);
            setStores(storesRes.data.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const assignmentData = {
                deliveryPerson: { idDeliveryPerson: parseInt(formData.idDeliveryPerson) },
                store: { idStore: parseInt(formData.idStore) },
                startDate: formData.startDate,
                endDate: formData.endDate,
                visited: false,
                status: true
            };

            await assignmentService.create(assignmentData);
            toast.success('Asignación creada exitosamente');
            setShowModal(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Error creating assignment:', error);
            toast.error(error.response?.data?.message || 'Error al crear asignación');
        }
    };

    const handleDelete = async (id) => {
        try {
            await assignmentService.delete(id);
            toast.success('Asignación eliminada');
            loadData();
        } catch (error) {
            console.error('Error deleting assignment:', error);
            toast.error('Error al eliminar asignación');
        }
    };

    const resetForm = () => {
        setFormData({
            idDeliveryPerson: '',
            idStore: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
        });
    };

    const getDeliveryPersonName = (id) => {
        const person = deliveryPersons.find(p => p.idDeliveryPerson === id);
        return person ? `${person.firstName} ${person.lastName}` : 'N/A';
    };

    const getStoreName = (id) => {
        const store = stores.find(s => s.idStore === id);
        return store ? store.name : 'N/A';
    };

    return (
        <Layout userRole="ADMIN">
            <div className="animate-fade-in">
                <div className="page-header mb-6">
                    <div>
                        <h2 className="page-title">Asignación de Tiendas</h2>
                        <p className="page-subtitle">Asigna tiendas a los repartidores para sus rutas</p>
                    </div>
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary">
                        <FaPlus /> Nueva Asignación
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <div className="card">
                        <div className="card-body">
                            {assignments.length === 0 ? (
                                <div className="text-center py-12">
                                    <FaTruck className="text-6xl text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-slate-700 mb-2">No hay asignaciones</h3>
                                    <p className="text-slate-500 mb-4">Comienza asignando tiendas a tus repartidores</p>
                                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                                        <FaPlus /> Crear Asignación
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Repartidor</th>
                                                <th>Tienda</th>
                                                <th>Fecha Asignación</th>
                                                <th>Estado</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {assignments.map((assignment) => (
                                                <tr key={assignment.idAssignment}>
                                                    <td>
                                                        <div className="flex items-center gap-2">
                                                            <FaTruck className="text-orange-600" />
                                                            <span>{assignment.deliveryPerson ? `${assignment.deliveryPerson.firstName} ${assignment.deliveryPerson.lastName}` : 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-2">
                                                            <FaStore className="text-blue-600" />
                                                            <span>{assignment.store?.name || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {assignment.startDate ? new Date(assignment.startDate).toLocaleDateString() : 'N/A'}
                                                        {assignment.endDate && assignment.startDate !== assignment.endDate && (
                                                            <span> - {new Date(assignment.endDate).toLocaleDateString()}</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {assignment.visited ? (
                                                            <span className="badge badge-success">Visitada</span>
                                                        ) : (
                                                            <span className="badge badge-warning">Pendiente</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <Tooltip content="Eliminar asignación">
                                                            <button
                                                                onClick={() => setConfirmDialog({ isOpen: true, assignmentId: assignment.idAssignment })}
                                                                className="btn bg-red-500 hover:bg-red-600 text-white btn-sm"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </Tooltip>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-2xl w-full">
                            <div className="p-6 border-b">
                                <h3 className="text-2xl font-bold">Nueva Asignación</h3>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="space-y-4">
                                    <div className="form-group">
                                        <label className="form-label flex items-center gap-2">
                                            Repartidor *
                                            <Tooltip content="Selecciona el repartidor que visitará esta tienda">
                                                <span className="text-xs text-slate-400 cursor-help">ⓘ</span>
                                            </Tooltip>
                                        </label>
                                        <select
                                            className="form-input"
                                            value={formData.idDeliveryPerson}
                                            onChange={(e) => setFormData({ ...formData, idDeliveryPerson: e.target.value })}
                                            required
                                        >
                                            <option value="">Selecciona un repartidor</option>
                                            {deliveryPersons.filter(p => p.status).map((person) => (
                                                <option key={person.idDeliveryPerson} value={person.idDeliveryPerson}>
                                                    {person.firstName} {person.lastName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label flex items-center gap-2">
                                            Tienda *
                                            <Tooltip content="Si la tienda ya tiene un repartidor asignado, se reemplazará automáticamente">
                                                <span className="text-xs text-slate-400 cursor-help">ⓘ</span>
                                            </Tooltip>
                                        </label>
                                        <select
                                            className="form-input"
                                            value={formData.idStore}
                                            onChange={(e) => setFormData({ ...formData, idStore: e.target.value })}
                                            required
                                        >
                                            <option value="">Selecciona una tienda</option>
                                            {stores.filter(s => s.status).map((store) => (
                                                <option key={store.idStore} value={store.idStore}>
                                                    {store.name} - {store.address}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Fecha de Inicio *</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Fecha de Fin *</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            min={formData.startDate}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button type="submit" className="btn btn-primary flex-1">
                                        <FaPlus /> Crear Asignación
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                        className="btn btn-outline flex-1"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Confirm Dialog */}
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    onClose={() => setConfirmDialog({ isOpen: false, assignmentId: null })}
                    onConfirm={() => handleDelete(confirmDialog.assignmentId)}
                    title="Eliminar Asignación"
                    message="¿Estás seguro de que deseas eliminar esta asignación? Esta acción no se puede deshacer."
                    confirmText="Sí, eliminar"
                    cancelText="Cancelar"
                    type="danger"
                />
            </div>
        </Layout>
    );
};

export default AssignmentsPage;
