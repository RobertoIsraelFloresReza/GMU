import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const BitacoraDetailModal = ({ entry, onClose, formatDate }) => {
  // Función para determinar el color según el tipo de operación
  const getOperationColor = (operation) => {
    switch (operation) {
      case 'INSERT': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Componente para mostrar datos en formato de tarjeta
  const DataCard = ({ title, data, emptyMessage = "No hay datos disponibles" }) => {
    if (!data) {
      return (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-500 mb-1">{title}</h3>
          <p className="text-sm italic text-gray-400">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h3 className="font-medium text-gray-700">{title}</h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-gray-500 font-medium capitalize">{key.replace(/_/g, ' ')}:</div>
                <div className="col-span-2 text-gray-800 break-words">
                  {value === null ? 'NULL' : (typeof value === 'object' ? JSON.stringify(value) : value.toString())}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Encabezado */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Operación #{entry.id}</h2>
              <p className="text-sm text-gray-500">Detalles completos del registro</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Cerrar modal"
            >
              <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Contenido principal */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tabla afectada</p>
              <p className="mt-1 font-medium text-gray-900">{entry.tablaAfectada}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de operación</p>
              <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOperationColor(entry.operacion)}`}>
                {entry.operacion}
              </span>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha y hora</p>
              <p className="mt-1 font-medium text-gray-900">{formatDate(entry.fechaOperacion)}</p>
            </div>
          </div>

          <div className="space-y-1 mb-2">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</p>
              <p className="mt-1 font-medium text-gray-900 break-all">{entry.usuario}</p>
            </div>
          </div>

          {/* Datos anteriores vs nuevos */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DataCard 
              title="Datos anteriores" 
              data={entry.datosAnteriores}
              emptyMessage="No existían datos anteriores (operación INSERT)"
            />
            <DataCard 
              title="Datos nuevos" 
              data={entry.datosNuevos}
              emptyMessage="No se generaron nuevos datos (operación DELETE)"
            />
          </div>
        </div>
        
        {/* Pie del modal */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cerrar ventana
          </button>
        </div>
      </div>
    </div>
  );
};

export default BitacoraDetailModal;