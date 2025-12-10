import { useState, useEffect, useCallback } from 'react';
import { FaStore, FaPlus, FaEdit, FaTrash, FaQrcode, FaMapMarkerAlt } from 'react-icons/fa';
import Layout from '../../components/Layout';
import { storeService } from '../../services/api';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../components/ConfirmDialog';
import MapPicker from '../../components/MapPicker';

const StoresPage = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStore, setEditingStore] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, storeId: null });
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        phone: '',
        contactName: '',
        qrCode: ''
    });

    useEffect(() => {
        loadStores();
    }, []);

    const loadStores = async () => {
        try {
            setLoading(true);
            const response = await storeService.getAll();
            setStores(response.data.data || []);
        } catch (error) {
            console.error('Error loading stores:', error);
            toast.error('Error al cargar tiendas');
            setStores([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingStore) {
                await storeService.update(editingStore.idStore, formData);
            } else {
                await storeService.create(formData);
            }

            // Cerrar modal PRIMERO
            setShowModal(false);
            resetForm();

            // Mostrar toast DESPUÉS de cerrar el modal
            if (editingStore) {
                toast.success('Tienda actualizada exitosamente');
            } else {
                toast.success('Tienda creada exitosamente');
            }

            // Recargar datos
            loadStores();
        } catch (error) {
            console.error('Error saving store:', error);
            toast.error('Error al guardar tienda');
        }
    };

    const handleEdit = (store) => {
        setEditingStore(store);
        setFormData({
            name: store.name,
            address: store.address,
            latitude: store.latitude || '',
            longitude: store.longitude || '',
            phone: store.phone || '',
            contactName: store.contactName || '',
            qrCode: store.qrCode || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        try {
            await storeService.delete(id);
            toast.success('Tienda eliminada exitosamente');
            loadStores();
        } catch (error) {
            console.error('Error deleting store:', error);
            toast.error('Error al eliminar tienda');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            address: '',
            latitude: '',
            longitude: '',
            phone: '',
            contactName: '',
            qrCode: ''
        });
        setEditingStore(null);
    };

    const handleLocationChange = useCallback((lat, lng) => {
        setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
        }));
    }, []);

    return (
        <Layout userRole="ADMIN">
            <div className="animate-fade-in">
                <div className="page-header mb-6">
                    <div>
                        <h2 className="page-title">Gestión de Tiendas</h2>
                        <p className="page-subtitle">Administra todas las tiendas del sistema</p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                        className="btn btn-primary"
                    >
                        <FaPlus /> Nueva Tienda
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="spinner"></div>
                    </div>
                ) : stores.length === 0 ? (
                    <div className="card">
                        <div className="card-body text-center py-12">
                            <FaStore className="text-6xl text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 mb-2">No hay tiendas registradas</h3>
                            <p className="text-slate-500 mb-4">Comienza agregando tu primera tienda</p>
                            <button onClick={() => setShowModal(true)} className="btn btn-primary">
                                <FaPlus /> Agregar Tienda
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stores.map((store) => (
                            <div key={store.idStore} className="card hover:shadow-lg transition-all">
                                <div className="card-body">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                                <FaStore className="text-2xl text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-900">{store.name}</h3>
                                                <span className="badge badge-success">Activa</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-slate-600 mb-4">
                                        <div className="flex items-start gap-2">
                                            <FaMapMarkerAlt className="mt-1 text-orange-500" />
                                            <span>{store.address}</span>
                                        </div>
                                        {store.phone && (
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">Tel:</span>
                                                <span>{store.phone}</span>
                                            </div>
                                        )}
                                        {store.contactName && (
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">Contacto:</span>
                                                <span>{store.contactName}</span>
                                            </div>
                                        )}
                                        {store.qrCode && (
                                            <div className="flex items-center gap-2">
                                                <FaQrcode className="text-blue-500" />
                                                <span className="text-xs">QR: {store.qrCode}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-slate-200">
                                        <button
                                            onClick={() => handleEdit(store)}
                                            className="btn btn-outline flex-1"
                                        >
                                            <FaEdit /> Editar
                                        </button>
                                        <button
                                            onClick={() => setConfirmDialog({ isOpen: true, storeId: store.idStore })}
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
                            <div className="p-6 border-b border-slate-200">
                                <h3 className="text-2xl font-bold text-slate-900">
                                    {editingStore ? 'Editar Tienda' : 'Nueva Tienda'}
                                </h3>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Nombre *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Teléfono</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group md:col-span-2">
                                        <label className="form-label">Dirección *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Nombre Contacto</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.contactName}
                                            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Código QR</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.qrCode}
                                            onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group md:col-span-2">
                                        <label className="form-label">Ubicación en el Mapa</label>
                                        <p className="text-sm text-slate-600 mb-3">
                                            Haz clic en el mapa para seleccionar la ubicación de la tienda
                                        </p>
                                        <MapPicker
                                            latitude={formData.latitude ? parseFloat(formData.latitude) : null}
                                            longitude={formData.longitude ? parseFloat(formData.longitude) : null}
                                            onLocationChange={handleLocationChange}
                                            height="300px"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Latitud</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="form-input bg-slate-50"
                                            value={formData.latitude}
                                            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                            placeholder="Selecciona en el mapa"
                                            readOnly
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Longitud</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="form-input bg-slate-50"
                                            value={formData.longitude}
                                            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                            placeholder="Selecciona en el mapa"
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button type="submit" className="btn btn-primary flex-1">
                                        {editingStore ? 'Actualizar' : 'Crear'} Tienda
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            resetForm();
                                        }}
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
                    onClose={() => setConfirmDialog({ isOpen: false, storeId: null })}
                    onConfirm={() => handleDelete(confirmDialog.storeId)}
                    title="Eliminar Tienda"
                    message="¿Estás seguro de que deseas eliminar esta tienda? Esta acción no se puede deshacer."
                    confirmText="Sí, eliminar"
                    cancelText="Cancelar"
                    type="danger"
                />
            </div>
        </Layout>
    );
};

export default StoresPage;
