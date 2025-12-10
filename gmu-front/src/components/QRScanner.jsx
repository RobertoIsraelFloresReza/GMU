import { useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QRScanner = ({ onScan, onError }) => {
    const scannerRef = useRef(null);
    const onScanRef = useRef(onScan);
    const onErrorRef = useRef(onError);

    // Mantener las refs actualizadas sin causar re-renders
    useEffect(() => {
        onScanRef.current = onScan;
        onErrorRef.current = onError;
    }, [onScan, onError]);

    useEffect(() => {
        let scanner = null;
        let isActive = true;

        const startScanner = async () => {
            try {
                console.log('📷 Iniciando scanner QR...');
                scanner = new Html5Qrcode("qr-reader");
                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    (decodedText) => {
                        if (isActive && onScanRef.current) {
                            onScanRef.current(decodedText);
                        }
                    },
                    () => {
                        // Ignorar errores de escaneo continuo
                    }
                );

                console.log('✅ Scanner QR iniciado');
            } catch (err) {
                console.error("❌ Error al iniciar scanner QR:", err);
                if (isActive && onErrorRef.current) {
                    onErrorRef.current(err.message || "Error al iniciar la cámara");
                }
            }
        };

        startScanner();

        // Cleanup: detener cámara al desmontar
        return () => {
            isActive = false;
            console.log('🛑 Limpiando scanner QR...');

            if (scanner) {
                scanner.stop()
                    .then(() => {
                        console.log('✅ Scanner QR detenido correctamente');
                        return scanner.clear();
                    })
                    .catch((err) => {
                        console.log('⚠️ Error al detener scanner:', err.message);
                    });
            }
            scannerRef.current = null;
        };
    }, []); // Sin dependencias - solo se ejecuta una vez

    return (
        <div className="w-full max-w-md mx-auto px-2 sm:px-0">
            <div
                id="qr-reader"
                className="rounded-lg sm:rounded-xl overflow-hidden shadow-lg border-2 sm:border-4 border-blue-500"
            ></div>
        </div>
    );
};

export default QRScanner;
