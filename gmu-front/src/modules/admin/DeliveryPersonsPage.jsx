import { useState, useEffect } from 'react';
import { FaTruck, FaPlus, FaEdit, FaTrash, FaUser, FaEnvelope, FaPhone } from 'react-icons/fa';
import Layout from '../../components/Layout';
import { deliveryService } from '../../services/api';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../components/ConfirmDialog';

const DeliveryPersonsPage = () => {
    const [deliveryPersons, setDeliveryPersons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPerson, setEditingPerson] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, personId: null });
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: ''
    });

    useEffect(() => {
        loadDeliveryPersons();
    }, []);

    const loadDeliveryPersons = async () => {
        try {
            setLoading(true);
            const response = await deliveryService.getAll();
            setDeliveryPersons(response.data.data || []);
        } catch (error) {
            console.error('Error loading delivery persons:', error);
            toast.error('Error al cargar repartidores');
            setDeliveryPersons([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPerson) {
                // Si estamos editando, preservamos el role y no enviamos password si está vacío
                const dataToSend = {
                    ...formData,
                    role: editingPerson.role // Preservar el role existente
                };
                if (!dataToSend.password) {
                    delete dataToSend.password;
                }
                await deliveryService.update(editingPerson.idDeliveryPerson, dataToSend);
                toast.success('Repartidor actualizado');
            } else {
                await deliveryService.create(formData);
                toast.success('Repartidor creado');
            }
            setShowModal(false);
            resetForm();
            loadDeliveryPersons();
        } catch (error) {
            console.error('Error saving delivery person:', error);
            toast.error(error.response?.data?.message || 'Error al guardar repartidor');
        }
    };

    const handleEdit = (person) => {
        setEditingPerson(person);
        setFormData({
            firstName: person.firstName,
            lastName: person.lastName,
            email: person.email,
            password: '', // No mostramos la contraseña actual
            phone: person.phone || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        try {
            await deliveryService.delete(id);
            toast.success('Repartidor eliminado');
            loadDeliveryPersons();
        } catch (error) {
            console.error('Error deleting delivery person:', error);
            toast.error('Error al eliminar');
        }
    };

    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            phone: ''
        });
        setEditingPerson(null);
    };

    return (
        <Layout userRole="ADMIN">
            <div className="animate-fade-in">
                <div className="page-header mb-6">
                    <div>
                        <h2 className="page-title">Gestión de Repartidores</h2>
                        <p className="page-subtitle">Administra el equipo de entrega</p>
                    </div>
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary">
                        <FaPlus /> Nuevo Repartidor
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="spinner"></div>
                    </div>
                ) : deliveryPersons.length === 0 ? (
                    <div className="card">
                        <div className="card-body text-center py-12">
                            <FaTruck className="text-6xl text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 mb-2">No hay repartidores registrados</h3>
                            <p className="text-slate-500 mb-4">Comienza agregando tu primer repartidor</p>
                            <button onClick={() => setShowModal(true)} className="btn btn-primary">
                                <FaPlus /> Agregar Repartidor
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {deliveryPersons.map((person) => (
                            <div key={person.idDeliveryPerson} className="card hover:shadow-lg transition-all">
                                <div className="card-body">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                                <FaTruck className="text-2xl text-orange-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-900">
                                                    {person.firstName} {person.lastName}
                                                </h3>
                                                <span className={`badge ${person.status ? 'badge-success' : 'badge-error'}`}>
                                                    {person.status ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-slate-600 mb-4">
                                        <div className="flex items-center gap-2">
                                            <FaEnvelope className="text-blue-500" />
                                            <span className="truncate">{person.email}</span>
                                        </div>
                                        {person.phone && (
                                            <div className="flex items-center gap-2">
                                                <FaPhone className="text-green-500" />
                                                <span>{person.phone}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <FaUser className="text-purple-500" />
                                            <span className="text-xs">{person.role?.name || 'DELIVERY_PERSON'}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-slate-200">
                                        <button
                                            onClick={() => handleEdit(person)}
                                            className="btn btn-outline flex-1"
                                        >
                                            <FaEdit /> Editar
                                        </button>
                                        <button
                                            onClick={() => setConfirmDialog({ isOpen: true, personId: person.idDeliveryPerson })}
                                            className="btn bg-red-500 hover:bg-red-600 text-white flex-1"
                                        >
                                            <FaTrash /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b">
                                <h3 className="text-2xl font-bold">{editingPerson ? 'Editar' : 'Nuevo'} Repartidor</h3>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Nombre *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Apellido *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-span-2">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-span-2">
                                        <label className="form-label">
                                            Contraseña {editingPerson ? '(dejar vacío para mantener actual)' : '*'}
                                        </label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required={!editingPerson}
                                        />
                                    </div>
                                    <div className="form-group col-span-2">
                                        <label className="form-label">Teléfono</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button type="submit" className="btn btn-primary flex-1">Guardar</button>
                                    <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn btn-outline flex-1">Cancelar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Confirm Dialog */}
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    onClose={() => setConfirmDialog({ isOpen: false, personId: null })}
                    onConfirm={() => handleDelete(confirmDialog.personId)}
                    title="Eliminar Repartidor"
                    message="¿Estás seguro de que deseas eliminar este repartidor? Esta acción no se puede deshacer."
                    confirmText="Sí, eliminar"
                    cancelText="Cancelar"
                    type="danger"
                />
            </div>
        </Layout>
    );
};

export default DeliveryPersonsPage;
