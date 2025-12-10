import React, { useEffect, useState, useContext } from "react";
import AxiosClient from "../config/http-gateway/http-client";
import { Spinner } from "flowbite-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthContext from "../config/context/auth-context";

const HistorialGastos = ({ isOpen, onClose, grupoId }) => {
  const [gastos, setGastos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");

  const [idUser, setIdUser] = useState(0)

  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (isOpen && grupoId) {
      setIdUser(user.user.idUser);
      setLoading(true);
      AxiosClient.get(`/gastos/grupo/${grupoId}`)
        .then((res) => setGastos(res.data || []))
        .catch(() => setGastos([]))
        .finally(() => setLoading(false));
      AxiosClient.get("/categorias/")
        .then((res) => setCategorias(res|| []))
        .catch(() => setCategorias([]));
    }
    if (isOpen) {
      setFiltroCategoria("");
      setFiltroFecha("");
    }
  }, [isOpen, grupoId]);

  const handlePagoChange = async (expenseId) => {
    try {
      // Lógica para actualizar el estado de pago en el backend
      await AxiosClient({
        url: `/gastos/${expenseId}`,
        method: "PUT",
      });
      // Actualiza localmente el gasto pagado
      setGastos((prevGastos) =>
        prevGastos.map((g) =>
          g.idGasto === expenseId ? { ...g, pagado: !g.pagado } : g
        )
      );
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo actualizar el estado de pago',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        customClass: {
          confirmButton: 'bg-purple-500 text-white hover:bg-purple-700',
        }
      });
    }
  };

  const gastosFiltrados = gastos.filter((g) => {
    // Filtro por categoría (usar g.category.id y comparar como string)
    const coincideCategoria = filtroCategoria
      ? String(g.categoria?.name) === String(filtroCategoria)
      : true;
    // Filtro por fecha (usar g.date y startsWith con filtroFecha)
    const coincideFecha = filtroFecha
      ? g.fechaInicial?.startsWith(filtroFecha)
      : true;
    return coincideCategoria && coincideFecha;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-6 w-[95%] max-w-2xl max-h-[80vh] overflow-y-auto"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-indigo-700">
              Historial de Gastos
            </h2>
            <button
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <input
              type="date"
              className="border rounded px-3 py-2"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
            />
            <select
              className="border rounded px-3 py-2"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Spinner size="xl" color="purple" />
            </div>
          ) : gastosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 14l2-2 4 4m0 0l-4-4-2 2m6 2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-6" />
              </svg>
              No hay gastos registrados para este grupo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/50">
                <thead className="bg-indigo-50/70">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-800 uppercase tracking-wider">Categoria</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-800 uppercase tracking-wider">Monto</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-800 uppercase tracking-wider">Creado por:</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-800 uppercase tracking-wider">Fecha de creación</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-800 uppercase tracking-wider">Fecha fin</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-800 uppercase tracking-wider">Pagado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200/30">
                  {gastosFiltrados.map((g) => (
                    <tr key={g.id}>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {g.categoria.name || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-semibold">
                        ${Number(g.monto).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {g.creadoPor ?? "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {g.fechaInicial ? new Date(g.fechaInicial).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {g.fechaLimite ? new Date(g.fechaLimite).toLocaleDateString() : "-"}
                      </td>

                      { idUser == g.idUsuario
                        ? (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <label className="inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={g.pagado || false}
                                onChange={idUser == g.idUsuario ? (e) => handlePagoChange(g.idGasto) : undefined}
                                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                            </label>
                          </td>
                        ) 
                        : (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${g.pagado ? 'bg-green-500' : 'bg-red-500'}`}>
                                {g.pagado ? 'Pagado' : 'Debe'}
                            </span>
                          </td>
                        )
                      }
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HistorialGastos;