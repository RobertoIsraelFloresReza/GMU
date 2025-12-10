import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente para manejar clicks en el mapa
function LocationMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            // e.latlng viene como objeto {lat, lng}, convertir a array [lat, lng]
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    return position === null ? null : <Marker position={position} />;
}

const MapPicker = ({ latitude, longitude, onLocationChange, height = '400px' }) => {
    // Default position: Cuernavaca, Morelos
    const defaultCenter = [18.9211, -99.2361];
    const [position, setPosition] = useState(
        latitude && longitude ? [latitude, longitude] : null
    );
    const [mapCenter, setMapCenter] = useState(
        latitude && longitude ? [latitude, longitude] : defaultCenter
    );

    useEffect(() => {
        if (position) {
            onLocationChange(position[0], position[1]);
        }
    }, [position]); // Removemos onLocationChange de las dependencias

    // Actualizar posición si cambian las props
    useEffect(() => {
        if (latitude && longitude) {
            const newPos = [latitude, longitude];
            setPosition(newPos);
            setMapCenter(newPos);
        }
    }, [latitude, longitude]);

    return (
        <div style={{ height }} className="rounded-xl overflow-hidden border-2 border-slate-300 leaflet-map-container">
            <MapContainer
                center={mapCenter}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
        </div>
    );
};

export default MapPicker;
