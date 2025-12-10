import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import AxiosClient from "../config/http-gateway/http-client";
import { Spinner } from "flowbite-react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

const schema = yup.object().shape({
  monto: yup
    .number()
    .typeError("El monto es obligatorio")
    .positive("El monto debe ser mayor a 0")
    .required("El monto es obligatorio"),
  descripcion: yup
    .string()
    .max(255, "Máximo 255 caracteres")
    .nullable()
    .test(
      "no-espacios-blancos",
      "La descripción no puede ser solo espacios en blanco",
      (value) => {
        if (value === undefined || value === null || value === "") return true; // Permitir vacío
        return value.trim().length > 0;
      }
    ),
  categoria: yup.string().required("Selecciona una categoría"),
});

const GastoForm = ({ isOpen, onClose, grupoId, onGastoGuardado }) => {
  const [categorias, setCategorias] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      monto: "",
      descripcion: "",
      categoria: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      setLoadingCategorias(true);
      AxiosClient({
        url: "/categorias/",
        method: "GET",
      })
        .then((res) => {
          setCategorias(res || []);
        })
        .catch(() => {
          setCategorias([]);
        })
        .finally(() => setLoadingCategorias(false));
    }
    // Limpiar formulario al abrir/cerrar
    if (isOpen) reset();
  }, [isOpen, reset]);

  const onSubmit = async (data) => {
    console.log("Datos del formulario:", data);
    console.log("Datos del formulario:", data.categoria);
    setSubmitting(true);
    try {
      await AxiosClient({
        url: "/gastos/",
        method: "POST",
        data: {
          idGroup: grupoId,
          amount: data.monto,
          description: data.descripcion,
          idCategory: data.categoria
        },
      });
      if (onGastoGuardado) onGastoGuardado();
      reset();
      onClose();
      Swal.fire({
        icon: "success",
        title: "Gasto creado",
        text: "El gasto fue creado exitosamente.",
        confirmButtonColor: "#7c3aed",
        customClass: {
          confirmButton: 'bg-purple-500 text-white hover:bg-purple-700',
        }
      });
    } catch (err) {
      window.Swal &&
        window.Swal.fire({
          icon: "error",
          title: "Error al guardar gasto",
          text: err?.response?.data?.message || "Intenta nuevamente",
          confirmButtonColor: "#7e22ce",
          customClass: {
            confirmButton: 'bg-purple-500 text-white hover:bg-purple-700',
          }
        });
    } finally {
      setSubmitting(false);
    }
  };

  // No renderizar si no está abierto
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
          className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        >
          <h2 className="text-xl font-semibold text-purple-700 mb-4">
            Agregar Gasto
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Monto <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register("monto")}
                className={`w-full border rounded px-3 py-2 mt-1 ${
                  errors.monto ? "border-red-400" : ""
                }`}
                placeholder="Ej: 100.00"
              />
              {errors.monto && (
                <span className="text-xs text-red-500">{errors.monto.message}</span>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                {...register("descripcion")}
                className={`w-full border rounded px-3 py-2 mt-1 ${errors.descripcion ? "border-red-400" : ""}`}
                placeholder="Descripción del gasto"
              />
              {errors.descripcion && (
                <span className="text-xs text-red-500">{errors.descripcion.message}</span>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Categoría <span className="text-red-500">*</span>
              </label>
              {loadingCategorias ? (
                <div className="flex items-center gap-2 text-purple-500">
                  <Spinner size="sm" color="purple" /> Cargando categorías...
                </div>
              ) : (
                <select
                  {...register("categoria")}
                  className={`w-full border rounded px-3 py-2 mt-1 ${
                    errors.categoria ? "border-red-400" : ""
                  }`}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Selecciona una categoría
                  </option>
                  {categorias.map((cat) => (
                    <option key={cat.idCategory} value={cat.idCategory}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.categoria && (
                <span className="text-xs text-red-500">{errors.categoria.message}</span>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                onClick={() => {
                  reset();
                  onClose();
                }}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 transition ${
                  (!isValid || submitting || loadingCategorias) && "opacity-60 cursor-not-allowed"
                }`}
                disabled={!isValid || submitting || loadingCategorias}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" color="purple" /> Guardando...
                  </span>
                ) : (
                  "Guardar Gasto"
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GastoForm;