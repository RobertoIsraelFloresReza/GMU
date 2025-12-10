import { useState, useEffect } from 'react';
import { FaBoxes, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import Layout from '../../components/Layout';
import { productService } from '../../services/api';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../components/ConfirmDialog';
import Tooltip from '../../components/Tooltip';

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, productId: null });
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        unit: 'PIEZA',
        category: '',
        sku: '',
        stock: ''
    });

    const units = ['PIEZA', 'KILO', 'LITRO', 'PAQUETE', 'CAJA'];
    const categories = ['ABARROTES', 'LACTEOS', 'BEBIDAS', 'LIMPIEZA', 'SNACKS', 'OTROS'];

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await productService.getAll();
            setProducts(response.data.data || []);
        } catch (error) {
            console.error('Error loading products:', error);
            toast.error('Error al cargar productos');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock)
            };

            if (editingProduct) {
                await productService.update(editingProduct.idProduct, data);
                toast.success('Producto actualizado');
            } else {
                await productService.create(data);
                toast.success('Producto creado');
            }
            setShowModal(false);
            resetForm();
            loadProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('Error al guardar producto');
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price,
            unit: product.unit,
            category: product.category || '',
            sku: product.sku || '',
            stock: product.stock || 0
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        try {
            await productService.delete(id);
            toast.success('Producto eliminado');
            loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Error al eliminar');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            unit: 'PIEZA',
            category: '',
            sku: '',
            stock: ''
        });
        setEditingProduct(null);
    };

    return (
        <Layout userRole="ADMIN">
            <div className="animate-fade-in">
                <div className="page-header mb-6">
                    <div>
                        <h2 className="page-title">Catálogo de Productos</h2>
                        <p className="page-subtitle">Gestiona el inventario de productos</p>
                    </div>
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary">
                        <FaPlus /> Nuevo Producto
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <div className="card">
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>SKU</th>
                                        <th>Producto</th>
                                        <th>Categoría</th>
                                        <th>Precio</th>
                                        <th>Unidad</th>
                                        <th>Stock</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-8">
                                                <FaBoxes className="text-5xl text-slate-300 mx-auto mb-2" />
                                                <p className="text-slate-500">No hay productos registrados</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        products.map((product) => (
                                            <tr key={product.idProduct}>
                                                <td className="font-mono text-sm">{product.sku || 'N/A'}</td>
                                                <td>
                                                    <div className="font-semibold">{product.name}</div>
                                                    <div className="text-xs text-slate-500">{product.description}</div>
                                                </td>
                                                <td><span className="badge badge-primary">{product.category}</span></td>
                                                <td className="font-bold text-green-600">${product.price.toFixed(2)}</td>
                                                <td>{product.unit}</td>
                                                <td>
                                                    <span className={`badge ${product.stock > 10 ? 'badge-success' : 'badge-warning'}`}>
                                                        {product.stock}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <Tooltip content="Editar producto">
                                                            <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-800">
                                                                <FaEdit />
                                                            </button>
                                                        </Tooltip>
                                                        <Tooltip content="Eliminar producto">
                                                            <button onClick={() => setConfirmDialog({ isOpen: true, productId: product.idProduct })} className="text-red-600 hover:text-red-800">
                                                                <FaTrash />
                                                            </button>
                                                        </Tooltip>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b">
                                <h3 className="text-2xl font-bold">{editingProduct ? 'Editar' : 'Nuevo'} Producto</h3>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 form-group">
                                        <label className="form-label">Nombre *</label>
                                        <input type="text" className="form-input" value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                    </div>
                                    <div className="col-span-2 form-group">
                                        <label className="form-label">Descripción</label>
                                        <textarea className="form-input" rows="2" value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label flex items-center gap-2">
                                            SKU
                                            <Tooltip content="Código único de identificación del producto (opcional)">
                                                <span className="text-xs text-slate-400 cursor-help">ⓘ</span>
                                            </Tooltip>
                                        </label>
                                        <input type="text" className="form-input" value={formData.sku}
                                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                            placeholder="Ej: PROD-001"/>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Categoría *</label>
                                        <select className="form-input" value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
                                            <option value="">Seleccionar</option>
                                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Precio *</label>
                                        <input type="number" step="0.01" className="form-input" value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Unidad *</label>
                                        <select className="form-input" value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })} required>
                                            {units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group col-span-2">
                                        <label className="form-label">Stock Inicial</label>
                                        <input type="number" className="form-input" value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
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
                    onClose={() => setConfirmDialog({ isOpen: false, productId: null })}
                    onConfirm={() => handleDelete(confirmDialog.productId)}
                    title="Eliminar Producto"
                    message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
                    confirmText="Sí, eliminar"
                    cancelText="Cancelar"
                    type="danger"
                />
            </div>
        </Layout>
    );
};

export default ProductsPage;
