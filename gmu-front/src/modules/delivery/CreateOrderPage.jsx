import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPlus, FaTrash, FaStore, FaShoppingCart, FaMapMarkerAlt, FaWifi, FaCloudUploadAlt } from 'react-icons/fa';
import Layout from '../../components/Layout';
import { orderService, productService, deliveryService } from '../../services/api';
import { toast } from 'react-toastify';
import MapViewer from '../../components/MapViewer';
import { offlineStorage } from '../../db/database';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { cacheService } from '../../services/cacheService';

const CreateOrderPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { store, qrCode } = location.state || {};

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [orderItems, setOrderItems] = useState([]);
    const [notes, setNotes] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [deliveryPersonId, setDeliveryPersonId] = useState(null);
    const isOnline = useOnlineStatus();

    useEffect(() => {
        console.log('CreateOrderPage montado con:', { store, qrCode, locationState: location.state });

        if (!store) {
            console.error('No hay store en location.state');
            toast.error('No se ha seleccionado una tienda');
            setTimeout(() => {
                navigate('/delivery/qr-scan');
            }, 2000);
            return;
        }

        console.log('Cargando datos iniciales...');
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            console.log('📦 Cargando productos...');
            // Cargar productos desde cache (funciona offline)
            const productsData = await cacheService.getProducts();
            setProducts(productsData.filter(p => p.status) || []);
            console.log(`✅ ${productsData.length} productos cargados`);

            // Primero intentar obtener deliveryPersonId del localStorage (cacheado en login)
            const cachedDeliveryPersonId = localStorage.getItem('deliveryPersonId');

            if (cachedDeliveryPersonId) {
                console.log('✅ DeliveryPersonId obtenido de localStorage:', cachedDeliveryPersonId);
                setDeliveryPersonId(parseInt(cachedDeliveryPersonId));
                return;
            }

            // Si no está cacheado, intentar obtenerlo del backend (solo si hay conexión)
            if (!navigator.onLine) {
                console.error('❌ Sin conexión y no hay deliveryPersonId cacheado');
                toast.error('No se puede crear pedido offline. Por favor, inicia sesión con conexión al menos una vez.');
                setTimeout(() => {
                    navigate('/delivery/dashboard');
                }, 3000);
                return;
            }

            // Obtener del backend (solo si hay conexión)
            const user = JSON.parse(localStorage.getItem('user'));
            console.log('👤 Usuario del localStorage:', user);

            if (user && user.email) {
                console.log('📧 Buscando repartidor con email:', user.email);

                try {
                    // Buscar el delivery person por email
                    const deliveryResponse = await deliveryService.getAll();
                    console.log('👷 Repartidores disponibles:', deliveryResponse.data.data);

                    const deliveryPerson = deliveryResponse.data.data.find(
                        dp => dp.email === user.email
                    );

                    console.log('🔍 Repartidor encontrado:', deliveryPerson);

                    if (deliveryPerson) {
                        setDeliveryPersonId(deliveryPerson.idDeliveryPerson);
                        // Cachear para uso offline
                        localStorage.setItem('deliveryPersonId', deliveryPerson.idDeliveryPerson);
                        console.log('✅ DeliveryPersonId establecido y cacheado:', deliveryPerson.idDeliveryPerson);
                    } else {
                        console.error('❌ NO se encontró repartidor con email:', user.email);
                        toast.error('No se encontró información del repartidor');
                        setTimeout(() => {
                            navigate('/delivery/dashboard');
                        }, 3000);
                    }
                } catch (error) {
                    console.error('❌ Error obteniendo delivery person:', error);
                    toast.error('Error al obtener información del repartidor');
                }
            } else {
                console.error('❌ No hay usuario en localStorage o no tiene email');
                toast.error('No hay sesión de usuario');
                navigate('/login');
            }
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            toast.error('Error al cargar datos iniciales: ' + error.message);
        }
    };

    const addItem = () => {
        if (!selectedProduct) {
            toast.error('Selecciona un producto');
            return;
        }

        const product = products.find(p => p.idProduct === parseInt(selectedProduct));
        if (!product) return;

        const existingItem = orderItems.find(item => item.productId === product.idProduct);
        if (existingItem) {
            toast.warning('Este producto ya está en el pedido');
            return;
        }

        const newItem = {
            productId: product.idProduct,
            productName: product.name,
            quantity: quantity,
            unitPrice: product.price,
            subtotal: product.price * quantity
        };

        setOrderItems([...orderItems, newItem]);
        setSelectedProduct('');
        setQuantity(1);
        toast.success('Producto agregado');
    };

    const removeItem = (productId) => {
        setOrderItems(orderItems.filter(item => item.productId !== productId));
        toast.info('Producto eliminado');
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) return;
        setOrderItems(orderItems.map(item => {
            if (item.productId === productId) {
                return {
                    ...item,
                    quantity: newQuantity,
                    subtotal: item.unitPrice * newQuantity
                };
            }
            return item;
        }));
    };

    const calculateTotal = () => {
        return orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (orderItems.length === 0) {
            toast.error('Agrega al menos un producto al pedido');
            return;
        }

        if (!deliveryPersonId) {
            toast.error('No se pudo identificar al repartidor');
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                items: orderItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                })),
                notes: notes
            };

            console.log('Creating order with:', {
                qrCode,
                deliveryPersonId,
                orderData,
                isOnline
            });

            // Si NO hay internet, guardar offline
            if (!isOnline) {
                console.log('📵 Sin conexión - guardando pedido offline...');

                // Guardar pedido offline (esto ya agrega a syncQueue automáticamente)
                const localOrderId = await offlineStorage.saveOrderOffline({
                    storeId: store.idStore,
                    storeName: store.name,
                    deliveryPersonId: deliveryPersonId,
                    orderDate: new Date().toISOString(),
                    totalAmount: calculateTotal(),
                    notes: notes,
                    status: 'PENDING',
                    synced: false,
                    qrCode: qrCode,
                    orderData: orderData
                });

                // Guardar items del pedido
                await offlineStorage.saveOrderItemsOffline(localOrderId, orderItems);

                toast.success('📵 Pedido guardado offline. Se sincronizará cuando haya conexión.');
                console.log(`✅ Pedido guardado offline con ID local: ${localOrderId}`);

                setTimeout(() => {
                    navigate('/delivery/orders');
                }, 1500);
                return;
            }

            // Si HAY internet, crear normalmente
            console.log('📶 Con conexión - creando pedido online...');
            await orderService.createByQR(qrCode, deliveryPersonId, orderData);
            toast.success('✅ Pedido creado exitosamente');
            navigate('/delivery/orders');

        } catch (error) {
            console.error('❌ Error creating order:', error);

            // Si falla por error de red, intentar guardar offline
            if (!navigator.onLine || error.message === 'Network Error') {
                console.log('📵 Error de red detectado - guardando offline...');

                try {
                    // Guardar pedido offline (esto ya agrega a syncQueue automáticamente)
                    const localOrderId = await offlineStorage.saveOrderOffline({
                        storeId: store.idStore,
                        storeName: store.name,
                        deliveryPersonId: deliveryPersonId,
                        orderDate: new Date().toISOString(),
                        totalAmount: calculateTotal(),
                        notes: notes,
                        status: 'PENDING',
                        synced: false,
                        qrCode: qrCode,
                        orderData: {
                            items: orderItems.map(item => ({
                                productId: item.productId,
                                quantity: item.quantity
                            })),
                            notes: notes
                        }
                    });

                    // Guardar items del pedido
                    await offlineStorage.saveOrderItemsOffline(localOrderId, orderItems);

                    toast.warning('⚠️ Sin conexión. Pedido guardado offline para sincronizar después.');
                    setTimeout(() => {
                        navigate('/delivery/orders');
                    }, 1500);
                } catch (offlineError) {
                    console.error('❌ Error guardando offline:', offlineError);
                    toast.error('Error al guardar pedido offline');
                }
            } else {
                const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error al crear pedido';
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!store) return null;

    return (
        <Layout userRole="DELIVERY_PERSON">
            <div className="animate-fade-in">
                {/* Indicador de modo offline/online */}
                {!isOnline && (
                    <div className="mb-4 p-3 sm:p-4 bg-orange-50 border-2 border-orange-300 rounded-xl flex items-center gap-3 animate-pulse">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <FaWifi className="text-white text-lg sm:text-xl" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-orange-900 text-sm sm:text-base">📵 Modo Offline</h4>
                            <p className="text-xs sm:text-sm text-orange-700">
                                Los pedidos se guardarán localmente y se sincronizarán cuando haya conexión
                            </p>
                        </div>
                    </div>
                )}

                <div className="page-header mb-6">
                    <div>
                        <h2 className="page-title flex items-center gap-2">
                            Levantar Pedido
                            {!isOnline && (
                                <span className="text-xs sm:text-sm bg-orange-500 text-white px-2 sm:px-3 py-1 rounded-full font-normal">
                                    📵 Offline
                                </span>
                            )}
                        </h2>
                        <p className="page-subtitle">Registra los productos solicitados</p>
                    </div>
                </div>

                {/* Store Info */}
                <div className="card mb-4 sm:mb-6 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="card-body p-3 sm:p-4">
                        <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                <FaStore className="text-2xl sm:text-3xl text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 break-words">{store.name}</h3>
                                <div className="flex items-start gap-1 sm:gap-2 text-slate-600 mt-1">
                                    <FaMapMarkerAlt className="mt-1 flex-shrink-0 text-sm sm:text-base" />
                                    <span className="text-xs sm:text-sm break-words">{store.address}</span>
                                </div>
                                {store.contactName && (
                                    <p className="text-xs sm:text-sm text-slate-600 mt-2 break-words">
                                        <strong>Contacto:</strong> {store.contactName}
                                        {store.phone && ` - ${store.phone}`}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Mapa de ubicación */}
                        <MapViewer
                            latitude={store.latitude}
                            longitude={store.longitude}
                            name={store.name}
                            address={store.address}
                            height="300px"
                        />
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Add Product Section */}
                    <div className="card mb-4 sm:mb-6">
                        <div className="card-body p-3 sm:p-4">
                            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Agregar Productos</h3>
                            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                <div className="form-group">
                                    <label className="form-label text-xs sm:text-sm">Producto</label>
                                    <select
                                        className="form-input text-xs sm:text-sm p-2 sm:p-3"
                                        value={selectedProduct}
                                        onChange={(e) => setSelectedProduct(e.target.value)}
                                    >
                                        <option value="">Selecciona un producto</option>
                                        {products.map(product => (
                                            <option key={product.idProduct} value={product.idProduct}>
                                                {product.name} - ${product.price.toFixed(2)} / {product.unit}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label text-xs sm:text-sm">Cantidad</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            className="form-input flex-1 text-xs sm:text-sm p-2 sm:p-3"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                        />
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="btn btn-primary py-2 px-4 sm:px-6 text-sm sm:text-base whitespace-nowrap"
                                        >
                                            <FaPlus /> Agregar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="card mb-4 sm:mb-6">
                        <div className="card-body p-3 sm:p-4">
                            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                                <FaShoppingCart className="text-lg sm:text-xl" /> Productos del Pedido ({orderItems.length})
                            </h3>

                            {orderItems.length === 0 ? (
                                <div className="text-center py-6 sm:py-8 text-slate-500">
                                    <FaShoppingCart className="text-4xl sm:text-5xl mx-auto mb-3 text-slate-300" />
                                    <p className="text-sm sm:text-base">No hay productos agregados</p>
                                    <p className="text-xs sm:text-sm">Agrega productos para comenzar</p>
                                </div>
                            ) : (
                                <>
                                    {/* Vista móvil - Cards */}
                                    <div className="block sm:hidden space-y-3">
                                        {orderItems.map((item) => (
                                            <div key={item.productId} className="border-2 border-slate-200 rounded-lg p-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-sm flex-1 break-words pr-2">{item.productName}</h4>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(item.productId)}
                                                        className="text-red-600 hover:text-red-800 p-1"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                                    <div>
                                                        <span className="text-slate-600">Precio:</span>
                                                        <span className="font-semibold ml-1">${item.unitPrice.toFixed(2)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-600">Subtotal:</span>
                                                        <span className="font-bold text-green-600 ml-1">${item.subtotal.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs text-slate-600">Cantidad:</label>
                                                    <input
                                                        type="number"
                                                        className="form-input w-20 p-2 text-sm"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <div className="bg-slate-100 rounded-lg p-3 font-bold flex justify-between items-center">
                                            <span className="text-slate-700">TOTAL:</span>
                                            <span className="text-green-600 text-lg">${calculateTotal().toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Vista desktop - Tabla */}
                                    <div className="hidden sm:block overflow-x-auto">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th className="text-xs md:text-sm">Producto</th>
                                                    <th className="text-xs md:text-sm">Precio Unit.</th>
                                                    <th className="text-xs md:text-sm">Cantidad</th>
                                                    <th className="text-xs md:text-sm">Subtotal</th>
                                                    <th className="text-xs md:text-sm">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orderItems.map((item) => (
                                                    <tr key={item.productId}>
                                                        <td className="font-semibold text-xs md:text-sm">{item.productName}</td>
                                                        <td className="text-xs md:text-sm">${item.unitPrice.toFixed(2)}</td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                className="form-input w-16 md:w-20 p-2 text-xs md:text-sm"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                                                            />
                                                        </td>
                                                        <td className="font-bold text-green-600 text-xs md:text-sm">
                                                            ${item.subtotal.toFixed(2)}
                                                        </td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItem(item.productId)}
                                                                className="text-red-600 hover:text-red-800 p-1"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-slate-50 font-bold">
                                                    <td colSpan="3" className="text-right text-xs md:text-sm">TOTAL:</td>
                                                    <td className="text-green-600 text-base md:text-lg">${calculateTotal().toFixed(2)}</td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="card mb-4 sm:mb-6">
                        <div className="card-body p-3 sm:p-4">
                            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Notas del Pedido</h3>
                            <textarea
                                className="form-input text-xs sm:text-sm p-2 sm:p-3"
                                rows="3"
                                placeholder="Observaciones, comentarios, productos faltantes, etc."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                            type="submit"
                            className={`btn flex-1 text-sm sm:text-base py-3 sm:py-4 ${
                                !isOnline ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'btn-primary'
                            }`}
                            disabled={loading || orderItems.length === 0}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner w-4 h-4 sm:w-5 sm:h-5 border-2"></div>
                                    <span className="text-xs sm:text-sm">
                                        {!isOnline ? 'Guardando Offline...' : 'Creando Pedido...'}
                                    </span>
                                </>
                            ) : (
                                <>
                                    {!isOnline ? <FaCloudUploadAlt /> : <FaShoppingCart />}
                                    <span className="text-sm sm:text-base">
                                        {!isOnline ? 'Guardar Offline' : 'Crear Pedido'}
                                    </span>
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="btn btn-outline flex-1 text-sm sm:text-base py-3 sm:py-4"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default CreateOrderPage;
