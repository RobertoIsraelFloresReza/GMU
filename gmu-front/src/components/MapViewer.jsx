import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapViewer = ({ latitude, longitude, name, address, height = '300px' }) => {
    // Si no hay coordenadas, no mostrar el mapa
    if (!latitude || !longitude) {
        return (
            <div
                style={{ height }}
                className="rounded-xl overflow-hidden border-2 border-slate-300 bg-slate-100 flex items-center justify-center"
            >
                <div className="text-center text-slate-500">
                    <p className="font-semibold">Ubicación no disponible</p>
                    <p className="text-sm">No se han configurado coordenadas para esta tienda</p>
                </div>
            </div>
        );
    }

    const position = [latitude, longitude];

    return (
        <div style={{ height }} className="rounded-xl overflow-hidden border-2 border-slate-300 leaflet-map-container">
            <MapContainer
                center={position}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
                dragging={true}
                zoomControl={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position}>
                    {name && (
                        <Popup>
                            <div className="text-center">
                                <strong>{name}</strong>
                                {address && <p className="text-sm text-slate-600 mt-1">{address}</p>}
                            </div>
                        </Popup>
                    )}
                </Marker>
            </MapContainer>
        </div>
    );
};

export default MapViewer;
