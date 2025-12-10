import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaQrcode, FaCheckCircle, FaStore, FaMapMarkerAlt, FaClock, FaCamera, FaKeyboard, FaShoppingCart } from 'react-icons/fa';
import Layout from '../../components/Layout';
import { storeService, assignmentService } from '../../services/api';
import { toast } from 'react-toastify';
import QRScanner from '../../components/QRScanner';
import MapViewer from '../../components/MapViewer';
import { cacheService } from '../../services/cacheService';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const QRScanPage = () => {
    const navigate = useNavigate();
    const [qrCode, setQrCode] = useState('');
    const [scannedStore, setScannedStore] = useState(null);
    const [loading, setLoading] = useState(false);
    const [recentScans, setRecentScans] = useState([]);
    const [scanMode, setScanMode] = useState('camera'); // 'camera' o 'manual'
    const [scannedQRCode, setScannedQRCode] = useState('');
    const [showOrderPrompt, setShowOrderPrompt] = useState(false);
    const [scannerKey, setScannerKey] = useState(0); // Para forzar remontaje del scanner
    const isOnline = useOnlineStatus();

    useEffect(() => {
        loadRecentScans();
    }, []);

    // Limpiar cuando se desmonte el componente o cambie de modo
    useEffect(() => {
        return () => {
            // Cleanup cuando se desmonta el componente
            console.log('QRScanPage desmontado, limpiando recursos...');
        };
    }, []);

    // Forzar remontaje del scanner cuando cambia el modo
    const handleModeChange = (mode) => {
        console.log(`Cambiando modo a: ${mode}`);

        // Si cambiamos de camera a manual, detener todas las cámaras
        if (scanMode === 'camera' && mode === 'manual') {
            console.log('🛑 Deteniendo todas las cámaras antes de cambiar a manual...');

            // Detener todos los streams de media activos usando window.stream
            try {
                if (window.stream) {
                    window.stream.getTracks().forEach(track => {
                        track.stop();
                        console.log('✅ Track detenido:', track.label);
                    });
                    window.stream = null;
                }
            } catch (e) {
                console.log('Error deteniendo streams:', e);
            }

            // Forzar incremento de key para desmontar el componente QRScanner
            setScannerKey(prev => prev + 1);
        }

        setScanMode(mode);

        if (mode === 'camera') {
            // Incrementar key para forzar remontaje y reinicio del scanner
            console.log('Reiniciando scanner con nueva key');
            setScannerKey(prev => prev + 1);
        }
    };

    const loadRecentScans = () => {
        // Cargar escaneos recientes del localStorage
        const scans = JSON.parse(localStorage.getItem('recentScans') || '[]');
        setRecentScans(scans);
    };

    const processQRCode = async (code) => {
        if (!code) return;

        setLoading(true);
        try {
            // Buscar la tienda por código QR (funciona offline con cache)
            console.log(`🔍 Buscando tienda con QR: ${code} (Online: ${isOnline})`);
            const store = await cacheService.findStoreByQR(code.trim());

            if (!store) {
                toast.error('Tienda no encontrada. Asegúrate de tener conexión al menos una vez.');
                setScannedStore(null);
                return;
            }

            setScannedStore(store);
            console.log('🏪 Store guardado en state:', store);

            // Guardar en escaneos recientes
            const newScan = {
                storeId: store.idStore,
                storeName: store.name,
                address: store.address,
                timestamp: new Date().toISOString(),
                qrCode: code.trim()
            };

            const updatedScans = [newScan, ...recentScans.slice(0, 4)];
            localStorage.setItem('recentScans', JSON.stringify(updatedScans));
            setRecentScans(updatedScans);

            toast.success(`Tienda escaneada: ${store.name}`);

            // Marcar como visitada (si hay asignación)
            try {
                // Obtener todas las asignaciones del repartidor
                const user = JSON.parse(localStorage.getItem('user'));
                if (user?.idDeliveryPerson) {
                    const assignmentsResponse = await assignmentService.getByDeliveryPerson(user.idDeliveryPerson);
                    const assignment = assignmentsResponse.data.data?.find(a =>
                        a.store?.idStore === store.idStore && !a.visited
                    );

                    if (assignment) {
                        await assignmentService.markVisited(assignment.idAssignment);
                        toast.success('Visita registrada exitosamente');
                    }
                }
            } catch (error) {
                console.error('Error marking visited:', error);
            }

            // Guardar el código QR escaneado
            setScannedQRCode(code.trim());
            console.log('🔢 QR Code guardado en state:', code.trim());

            // Mostrar modal bonito en lugar de alert feo
            setTimeout(() => {
                console.log('📋 Mostrando prompt de pedido...');
                console.log('📊 Estado actual - scannedStore:', store);
                console.log('📊 Estado actual - scannedQRCode:', code.trim());
                setShowOrderPrompt(true);
            }, 500);

        } catch (error) {
            console.error('Error scanning QR:', error);
            toast.error('Error al escanear código QR');
        } finally {
            setLoading(false);
        }
    };

    const handleScan = async (e) => {
        e.preventDefault();
        if (!qrCode.trim()) {
            toast.error('Ingresa un código QR');
            return;
        }
        await processQRCode(qrCode);
    };

    const handleQRScan = async (decodedText) => {
        await processQRCode(decodedText);
    };


    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now - date) / 60000);

        if (diffMinutes < 1) return 'Ahora';
        if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
        if (diffMinutes < 1440) return `Hace ${Math.floor(diffMinutes / 60)} hrs`;
        return date.toLocaleDateString();
    };

    return (
        <Layout userRole="DELIVERY_PERSON">
            <div className="animate-fade-in">
                <div className="page-header mb-6">
                    <div>
                        <h2 className="page-title">Escanear QR</h2>
                        <p className="page-subtitle">Registra tu visita a cada tienda</p>
                    </div>
                </div>

                {/* Mode Selector */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={() => handleModeChange('camera')}
                        className={`btn flex-1 ${scanMode === 'camera' ? 'btn-primary' : 'btn-outline'}`}
                    >
                        <FaCamera /> Usar Cámara
                    </button>
                    <button
                        onClick={() => handleModeChange('manual')}
                        className={`btn flex-1 ${scanMode === 'manual' ? 'btn-primary' : 'btn-outline'}`}
                    >
                        <FaKeyboard /> Ingreso Manual
                    </button>
                </div>

                {/* Scanner Section */}
                <div className="card mb-6">
                    <div className="card-body">
                        <div className="text-center mb-6">
                            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-4 animate-pulse">
                                {scanMode === 'camera' ? <FaCamera className="text-6xl text-white" /> : <FaQrcode className="text-6xl text-white" />}
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">
                                {scanMode === 'camera' ? 'Escanea con la cámara' : 'Ingresa el código QR'}
                            </h3>
                            <p className="text-slate-600">
                                {scanMode === 'camera' ? 'Apunta la cámara al código QR de la tienda' : 'Escribe el código de la tienda que estás visitando'}
                            </p>
                        </div>

                        {scanMode === 'camera' ? (
                            <div className="max-w-md mx-auto">
                                <QRScanner
                                    key={scannerKey}
                                    onScan={handleQRScan}
                                    onError={(error) => toast.error(error)}
                                />
                                <div className="mt-4 text-center">
                                    <p className="text-sm text-slate-600">
                                        El escaneo se realizará automáticamente cuando detecte un código QR
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleScan} className="max-w-md mx-auto">
                                <div className="form-group mb-4">
                                    <input
                                        type="text"
                                        className="form-input text-center text-xl font-mono"
                                        placeholder="Código QR"
                                        value={qrCode}
                                        onChange={(e) => setQrCode(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        className="btn btn-primary flex-1"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="spinner w-5 h-5 border-2"></div>
                                                Escaneando...
                                            </>
                                        ) : (
                                            <>
                                                <FaQrcode /> Escanear
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Scanned Store Info */}
                        {scannedStore && (
                            <div className="mt-6 p-6 bg-green-50 rounded-xl border-2 border-green-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <FaCheckCircle className="text-3xl text-green-600" />
                                    <div>
                                        <h4 className="font-bold text-lg text-green-900">Tienda Verificada</h4>
                                        <p className="text-sm text-green-700">Visita registrada correctamente</p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <FaStore className="text-blue-600" />
                                        <span className="font-semibold">{scannedStore.name}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-slate-600">
                                        <FaMapMarkerAlt className="mt-1 text-orange-600" />
                                        <span>{scannedStore.address}</span>
                                    </div>
                                    {scannedStore.contactName && (
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <span className="font-semibold">Contacto:</span>
                                            <span>{scannedStore.contactName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Scans */}
                {recentScans.length > 0 && (
                    <div className="card">
                        <div className="card-body">
                            <h3 className="text-lg font-bold mb-4">Escaneos Recientes</h3>
                            <div className="space-y-3">
                                {recentScans.map((scan, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <FaStore className="text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{scan.storeName}</p>
                                                <p className="text-xs text-slate-500">{scan.address}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                <FaClock />
                                                <span>{formatTime(scan.timestamp)}</span>
                                            </div>
                                            <span className="text-xs font-mono text-slate-400">{scan.qrCode}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="card mt-6 bg-gradient-to-br from-blue-50 to-purple-50">
                    <div className="card-body">
                        <h4 className="font-bold text-slate-900 mb-3">Instrucciones</h4>
                        <ul className="space-y-2 text-sm text-slate-700">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold">1.</span>
                                <span>Llega a la tienda asignada</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold">2.</span>
                                <span>Localiza el código QR en la entrada o mostrador</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold">3.</span>
                                <span>Ingresa el código en el campo de arriba</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold">4.</span>
                                <span>Confirma que la información sea correcta</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold">5.</span>
                                <span>Tu visita quedará registrada automáticamente</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Order Prompt Modal - Bonito */}
                {showOrderPrompt && scannedStore && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="bg-white rounded-2xl max-w-sm sm:max-w-md w-full animate-scale-in">
                            <div className="p-6 border-b bg-gradient-to-r from-green-500 to-green-600">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                                        <FaCheckCircle className="text-3xl text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">¡Visita Registrada!</h3>
                                        <p className="text-green-100 text-sm">Tienda verificada correctamente</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <FaStore className="text-2xl text-blue-600" />
                                        <div>
                                            <p className="font-bold text-lg">{scannedStore.name}</p>
                                            <p className="text-sm text-slate-600">{scannedStore.address}</p>
                                        </div>
                                    </div>

                                    {/* Mapa de la tienda */}
                                    <MapViewer
                                        latitude={scannedStore.latitude}
                                        longitude={scannedStore.longitude}
                                        name={scannedStore.name}
                                        address={scannedStore.address}
                                        height="250px"
                                    />
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                                    <p className="text-center text-slate-700">
                                        ¿Deseas <strong>levantar un pedido</strong> para esta tienda ahora?
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            console.log('Navegando a crear pedido con:', {
                                                store: scannedStore,
                                                qrCode: scannedQRCode
                                            });

                                            if (!scannedStore) {
                                                toast.error('Error: No hay tienda seleccionada');
                                                return;
                                            }

                                            if (!scannedQRCode) {
                                                toast.error('Error: No hay código QR');
                                                return;
                                            }

                                            navigate('/delivery/create-order', {
                                                state: {
                                                    store: scannedStore,
                                                    qrCode: scannedQRCode
                                                }
                                            });
                                        }}
                                        className="btn btn-primary flex-1"
                                    >
                                        <FaShoppingCart /> Sí, Levantar Pedido
                                    </button>
                                    <button
                                        onClick={() => {
                                            console.log('Usuario canceló levantar pedido');
                                            setShowOrderPrompt(false);
                                            setScannedStore(null);
                                            setQrCode('');
                                            setScannedQRCode('');
                                        }}
                                        className="btn btn-outline flex-1"
                                    >
                                        Ahora No
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default QRScanPage;
