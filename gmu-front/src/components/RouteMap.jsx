import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;

// Definir iconos personalizados para diferentes estados
const createCustomIcon = (color) => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div style="
                background-color: ${color};
                width: 30px;
                height: 30px;
                border-radius: 50% 50% 50% 0;
                border: 3px solid white;
                transform: rotate(-45deg);
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            ">
                <div style="
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transform: rotate(45deg);
                    color: white;
                    font-size: 14px;
                    font-weight: bold;
                ">
                    ●
                </div>
            </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
};

// Iconos para diferentes estados
const icons = {
    visited: createCustomIcon('#10b981'), // Verde - Visitada
    pending: createCustomIcon('#ef4444'),  // Rojo - Pendiente
    current: createCustomIcon('#3b82f6')   // Azul - Actual
};

const RouteMap = ({ stores = [], currentStoreId = null, showRoute = false, height = '500px' }) => {
    // Si no hay tiendas, mostrar mensaje
    if (!stores || stores.length === 0) {
        return (
            <div
                style={{ height }}
                className="rounded-xl overflow-hidden border-2 border-slate-300 bg-slate-100 flex items-center justify-center"
            >
                <div className="text-center text-slate-500 p-6">
                    <p className="font-semibold text-lg mb-2">No hay tiendas asignadas</p>
                    <p className="text-sm">Contacta al administrador para que te asigne rutas</p>
                </div>
            </div>
        );
    }

    // Filtrar tiendas que tengan coordenadas válidas
    const validStores = stores.filter(store =>
        store.latitude &&
        store.longitude &&
        !isNaN(store.latitude) &&
        !isNaN(store.longitude)
    );

    if (validStores.length === 0) {
        return (
            <div
                style={{ height }}
                className="rounded-xl overflow-hidden border-2 border-slate-300 bg-slate-100 flex items-center justify-center"
            >
                <div className="text-center text-slate-500 p-6">
                    <p className="font-semibold text-lg mb-2">Sin coordenadas</p>
                    <p className="text-sm">Las tiendas asignadas no tienen ubicaciones configuradas</p>
                </div>
            </div>
        );
    }

    // Calcular el centro del mapa (promedio de todas las coordenadas)
    const centerLat = validStores.reduce((sum, store) => sum + store.latitude, 0) / validStores.length;
    const centerLng = validStores.reduce((sum, store) => sum + store.longitude, 0) / validStores.length;
    const center = [centerLat, centerLng];

    // Preparar coordenadas para la ruta (líneas entre puntos)
    const routeCoordinates = showRoute
        ? validStores.map(store => [store.latitude, store.longitude])
        : [];

    // Determinar el ícono para cada tienda
    const getIcon = (store) => {
        if (store.idStore === currentStoreId) {
            return icons.current;
        }
        return store.visited ? icons.visited : icons.pending;
    };

    // Determinar el zoom apropiado basado en la dispersión de puntos
    const calculateZoom = () => {
        if (validStores.length === 1) return 14;

        const lats = validStores.map(s => s.latitude);
        const lngs = validStores.map(s => s.longitude);
        const latDiff = Math.max(...lats) - Math.min(...lats);
        const lngDiff = Math.max(...lngs) - Math.min(...lngs);
        const maxDiff = Math.max(latDiff, lngDiff);

        if (maxDiff > 0.5) return 10;
        if (maxDiff > 0.2) return 11;
        if (maxDiff > 0.1) return 12;
        return 13;
    };

    return (
        <div style={{ height }} className="rounded-xl overflow-hidden border-2 border-slate-300 leaflet-map-container">
            <MapContainer
                center={center}
                zoom={calculateZoom()}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                dragging={true}
                zoomControl={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Dibujar líneas de ruta si está habilitado */}
                {showRoute && routeCoordinates.length > 1 && (
                    <Polyline
                        positions={routeCoordinates}
                        color="#3b82f6"
                        weight={3}
                        opacity={0.6}
                        dashArray="10, 10"
                    />
                )}

                {/* Marcadores para cada tienda */}
                {validStores.map((store, index) => (
                    <Marker
                        key={store.idStore || index}
                        position={[store.latitude, store.longitude]}
                        icon={getIcon(store)}
                    >
                        <Popup>
                            <div className="p-2 min-w-[200px]">
                                <div className="flex items-center gap-2 mb-2">
                                    {store.visited ? (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                                            ✓ Visitada
                                        </span>
                                    ) : (
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
                                            ⏱ Pendiente
                                        </span>
                                    )}
                                    {store.idStore === currentStoreId && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                                            📍 Actual
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-bold text-base mb-1">{store.name}</h3>
                                <p className="text-sm text-slate-600 mb-2">{store.address}</p>
                                {store.phone && (
                                    <p className="text-xs text-slate-500">
                                        <strong>Tel:</strong> {store.phone}
                                    </p>
                                )}
                                {store.contactName && (
                                    <p className="text-xs text-slate-500">
                                        <strong>Contacto:</strong> {store.contactName}
                                    </p>
                                )}
                                {store.qrCode && (
                                    <p className="text-xs text-slate-400 mt-1">
                                        <strong>QR:</strong> {store.qrCode}
                                    </p>
                                )}
                                {store.lastVisit && (
                                    <p className="text-xs text-green-600 mt-2">
                                        <strong>Última visita:</strong> {new Date(store.lastVisit).toLocaleDateString('es-MX')}
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default RouteMap;
