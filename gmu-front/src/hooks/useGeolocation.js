import { useState, useEffect } from 'react';

export const useGeolocation = (options = {}) => {
    const [location, setLocation] = useState({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: null,
        loading: true
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocation(prev => ({
                ...prev,
                error: 'Geolocalización no soportada por el navegador',
                loading: false
            }));
            return;
        }

        const successHandler = (position) => {
            setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                error: null,
                loading: false
            });
        };

        const errorHandler = (error) => {
            let errorMessage = 'Error desconocido';

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Permiso de ubicación denegado';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Ubicación no disponible';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Tiempo de espera agotado';
                    break;
                default:
                    errorMessage = error.message;
            }

            setLocation(prev => ({
                ...prev,
                error: errorMessage,
                loading: false
            }));
        };

        const geoOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
            ...options
        };

        navigator.geolocation.getCurrentPosition(
            successHandler,
            errorHandler,
            geoOptions
        );

    }, []);

    return location;
};

export const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocalización no soportada'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
};

export const watchPosition = (callback, errorCallback) => {
    if (!navigator.geolocation) {
        errorCallback(new Error('Geolocalización no soportada'));
        return null;
    }

    const watchId = navigator.geolocation.watchPosition(
        (position) => {
            callback({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            });
        },
        (error) => {
            errorCallback(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );

    return watchId;
};

export const clearWatch = (watchId) => {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
    }
};

export default useGeolocation;
