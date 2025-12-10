import React, { useState, useEffect } from 'react';
import AxiosClient from '../config/http-gateway/http-client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import BitacoraDetailModal from './BitacoraDetailModal';
import { FiRefreshCw, FiDownload } from 'react-icons/fi';
import { saveAs } from 'file-saver';

const BitacoraTable = () => {
    // Estados principales
    const [bitacoraData, setBitacoraData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    // Estados para filtros y paginación
    const [filters, setFilters] = useState({
        tabla: '',
        operacion: '',
        usuario: '',
        fechaDesde: '',
        fechaHasta: ''
    });

    const [pagination, setPagination] = useState({
        page: 1,
        perPage: 15
    });

    // Fetch data con manejo de errores
    useEffect(() => {
        const fetchBitacoraData = async () => {
            try {
                setIsLoading(true);
                const response = await AxiosClient({
                    url: "/bitacora/",
                    method: "GET"
                });

                if (response.error) {
                    throw new Error(response.message || "Error al obtener datos de bitácora");
                }

                setBitacoraData(response.data || []);
                setFilteredData(response.data || []);
                setInitialLoad(false);
            } catch (err) {
                console.error("Error fetching bitacora data:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (initialLoad) fetchBitacoraData();
    }, [initialLoad]);

    // Aplicar filtros
    useEffect(() => {
        let result = [...bitacoraData];

        if (filters.tabla) {
            result = result.filter(entry =>
                entry.tablaAfectada.toLowerCase().includes(filters.tabla.toLowerCase())
            );
        }

        if (filters.operacion) {
            result = result.filter(entry =>
                entry.operacion === filters.operacion
            );
        }

        if (filters.usuario) {
            result = result.filter(entry =>
                entry.usuario.toLowerCase().includes(filters.usuario.toLowerCase())
            );
        }

        if (filters.fechaDesde) {
            result = result.filter(entry =>
                new Date(entry.fechaOperacion) >= new Date(filters.fechaDesde)
            );
        }

        if (filters.fechaHasta) {
            result = result.filter(entry =>
                new Date(entry.fechaOperacion) <= new Date(filters.fechaHasta + 'T23:59:59')
            );
        }

        setFilteredData(result);
        setPagination(prev => ({ ...prev, page: 1 })); // Resetear a primera página
    }, [filters, bitacoraData]);

    // Funciones utilitarias
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleRefresh = () => {
        setInitialLoad(true);
        setFilters({
            tabla: '',
            operacion: '',
            usuario: '',
            fechaDesde: '',
            fechaHasta: ''
        });
    };

    const formatDate = (dateString) => {
        return format(new Date(dateString), 'PPPpp', { locale: es });
    };

    const getOperationColor = (operation) => {
        switch (operation) {
            case 'INSERT': return 'bg-green-100 text-green-800';
            case 'UPDATE': return 'bg-blue-100 text-blue-800';
            case 'DELETE': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Exportar a CSV
    const exportToCSV = () => {
        const headers = ['ID', 'Tabla', 'Operación', 'Usuario', 'Fecha', 'Datos'];
        const csvContent = [
            headers.join(','),
            ...filteredData.map(row => [
                row.id,
                `"${row.tablaAfectada}"`,
                row.operacion,
                `"${row.usuario}"`,
                `"${formatDate(row.fechaOperacion)}"`,
                `"${JSON.stringify(row.datosNuevos || {}).replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `bitacora_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    // Renderizado condicional
    if (isLoading && initialLoad) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <div className="flex items-center">
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                        <button
                            onClick={handleRefresh}
                            className="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center"
                        >
                            <FiRefreshCw className="mr-1" /> Reintentar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            {/* Sección de Filtros */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Filtros de Búsqueda</h2>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleRefresh}
                            className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                            title="Recargar datos"
                        >
                            <FiRefreshCw className="mr-1" />
                        </button>
                        <button
                            onClick={exportToCSV}
                            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
                        >
                            <FiDownload className="mr-1" /> Exportar
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tabla Afectada</label>
                        <input
                            type="text"
                            name="tabla"
                            value={filters.tabla}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej: ventanillas"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Operación</label>
                        <select
                            name="operacion"
                            value={filters.operacion}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Todas</option>
                            <option value="INSERT">INSERT</option>
                            <option value="UPDATE">UPDATE</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                        <input
                            type="text"
                            name="usuario"
                            value={filters.usuario}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej: root@localhost"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
                        <input
                            type="date"
                            name="fechaDesde"
                            value={filters.fechaDesde}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
                        <input
                            type="date"
                            name="fechaHasta"
                            value={filters.fechaHasta}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Tabla de Resultados */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tabla</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operación</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredData.length > 0 ? (
                                filteredData
                                    .slice(
                                        (pagination.page - 1) * pagination.perPage,
                                        pagination.page * pagination.perPage
                                    )
                                    .map((entry) => (
                                        <tr key={entry.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.tablaAfectada}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getOperationColor(entry.operacion)}`}>
                                                    {entry.operacion}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.usuario}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(entry.fechaOperacion)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => {
                                                        setSelectedEntry(entry);
                                                        setIsDetailOpen(true); // <- Falta esta línea
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Ver detalles
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                        {isLoading ? 'Cargando...' : 'No se encontraron registros'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {filteredData.length > pagination.perPage && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Mostrando {(pagination.page - 1) * pagination.perPage + 1}-
                            {Math.min(pagination.page * pagination.perPage, filteredData.length)} de {filteredData.length} registros
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 bg-gray-200 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page * pagination.perPage >= filteredData.length}
                                className="px-4 py-2 bg-gray-200 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Detalles */}
            {isDetailOpen && selectedEntry && (
                <BitacoraDetailModal
                    entry={selectedEntry}
                    onClose={() => setIsDetailOpen(false)}
                    formatDate={formatDate}
                />
            )}
        </div>
    );
};

export default BitacoraTable;