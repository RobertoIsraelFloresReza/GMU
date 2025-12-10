import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import AxiosClient from '../config/http-gateway/http-client';
import { Spinner } from 'flowbite-react';
import { FiX, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import { motion } from 'framer-motion';

const ChangePasswordModal = ({ showPasswordModal, dataWorker, closeModal }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!showPasswordModal) {
      formik.resetForm();
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [showPasswordModal]);

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .max(20, 'La contraseña no debe exceder los 20 caracteres')
        .matches(/^[^<>=()\/\\{}[\]]*$/, 'Contiene caracteres no permitidos')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 'La contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número y un carácter especial')
        .trim('No debe comenzar o terminar con espacios')
        .strict(true)
        .required('Campo obligatorio'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Las contraseñas deben coincidir')
        .required('Campo obligatorio'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      const confirmSave = await Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas cambiar la contraseña del administrador?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#7e22ce',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        background: 'rgba(248, 250, 252, 0.95)',
        backdrop: `
          rgba(109, 40, 217, 0.3)
          left top
          no-repeat
        `,
        showClass: {
          popup: 'animate-fade-in'
        }
      });

      if (confirmSave.isConfirmed) {
        try {
          const payload = {
            idUser: dataWorker.idUser,
            email: dataWorker.email,
            password: values.password,
            persons: {
              idPerson: dataWorker.persons.idPerson, 
              name: dataWorker.persons.name,
              lastname: dataWorker.persons.lastname,
              email: dataWorker.persons.email,
              address: dataWorker.persons.address || "",
              phone: dataWorker.persons.phone || "", 
              status: dataWorker.persons.status 
            },
          };
          
          await AxiosClient({
            url: `/users/${dataWorker.idUser}`,
            method: 'PUT',
            data: payload,
          });

          closeModal();
          Swal.fire({
            icon: 'success',
            title: '¡Contraseña actualizada!',
            text: 'La contraseña del administrador ha sido actualizada correctamente.',
            confirmButtonColor: '#7e22ce',
            background: 'rgba(248, 250, 252, 0.95)',
            backdrop: `
              rgba(109, 40, 217, 0.3)
              left top
              no-repeat
            `,
            showClass: {
              popup: 'animate-fade-in'
            }
          });
        } catch (error) {
          console.error('Error:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error al actualizar contraseña',
            text: 'Hubo un error al cambiar la contraseña del administrador. Por favor, inténtalo de nuevo más tarde.',
            confirmButtonColor: '#7e22ce',
            background: 'rgba(248, 250, 252, 0.95)',
            showClass: {
              popup: 'animate-fade-in'
            }
          });
        } finally {
          setSubmitting(false);
        }
      } else {
        setSubmitting(false);
      }
    },
  });

  if (!showPasswordModal) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md border border-white/20"
      >
        {/* Header */}
        <div className="p-6 pb-4 flex justify-between items-center border-b border-gray-200/30">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Actualizar Contraseña
            </h3>
            <p className="text-sm text-purple-700/80 mt-1">Ingrese la nueva contraseña para el administrador</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={closeModal}
            type="button"
            className="text-gray-400 hover:text-purple-600 transition-colors p-1 rounded-full"
            aria-label="Cerrar modal"
          >
            <FiX size={24} />
          </motion.button>
        </div>

        {/* Formulario */}
        <form onSubmit={formik.handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-400">
                  <FiLock />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border ${formik.touched.password && formik.errors.password ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm`}
                  placeholder="Mínimo 8 caracteres"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </motion.button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {formik.errors.password}
                </p>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-400">
                  <FiLock />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm`}
                  placeholder="Repita la nueva contraseña"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </motion.button>
              </div>
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {formik.errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Requisitos de contraseña */}
            <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100">
              <h4 className="text-xs font-medium text-purple-800 mb-1">La contraseña debe contener:</h4>
              <ul className="text-xs text-purple-700/80 space-y-1">
                <li className="flex items-center">
                  <svg className="w-3 h-3 mr-1 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Mínimo 8 caracteres
                </li>
                <li className="flex items-center">
                  <svg className="w-3 h-3 mr-1 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Al menos una mayúscula
                </li>
                <li className="flex items-center">
                  <svg className="w-3 h-3 mr-1 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Al menos una minúscula
                </li>
                <li className="flex items-center">
                  <svg className="w-3 h-3 mr-1 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Al menos un número
                </li>
                <li className="flex items-center">
                  <svg className="w-3 h-3 mr-1 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Al menos un carácter especial (@$!%*?&)
                </li>
              </ul>
            </div>

            {/* Botón Guardar */}
            <div className="pt-2">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={formik.isSubmitting || !formik.isValid}
                className="w-full py-2.5 text-sm text-white font-medium rounded-lg shadow-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {formik.isSubmitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" color="white" />
                    Procesando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </motion.button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ChangePasswordModal;