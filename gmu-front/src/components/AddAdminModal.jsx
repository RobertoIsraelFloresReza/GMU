import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import AxiosClient from '../config/http-gateway/http-client';
import { Spinner } from 'flowbite-react';
import { FiX, FiEye, FiEyeOff, FiUser, FiMail, FiPhone, FiLock } from 'react-icons/fi';
import { motion } from 'framer-motion';

const AddUserModal = ({ showModal, closeModal, refreshClients }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = (setter) => setter(prev => !prev);

  const obtenerUsuarios = async () => {
    try {
      const response = await AxiosClient.get('/users/');
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return [];
    }
  };

  useEffect(() => {
    if (!showModal) {
      formik.resetForm();
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [showModal]);

  const formik = useFormik({
    initialValues: {
      name: '',
      lastname: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .max(50, 'No debe exceder los 50 caracteres')
        .matches(/^[^<>$=()\/\\{}[\]*+!@#%^&]*$/, 'Contiene caracteres no permitidos')
        .trim()
        .matches(
          /^(?![\s.-]*$)(?!.*\s{2,})[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/,
          'Solo debe contener letras y espacios, no puede estar vacío'
        )
        .required('Campo obligatorio'),

      lastname: Yup.string()
        .max(50, 'No debe exceder los 50 caracteres')
        .matches(/^[^<>$=()\/\\{}[\]*+!@#%^&]*$/, 'Contiene caracteres no permitidos')
        .trim()
        .matches(
          /^(?![\s.-]*$)(?!.*\s{2,})[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/,
          'Solo debe contener letras y espacios, no puede estar vacío'
        )
        .required('Campo obligatorio'),

      email: Yup.string()
        .email('Correo electrónico inválido')
        .max(100, 'No debe exceder los 100 caracteres')
        .matches(/^[^<>$=()\/\\{}[\]]*$/, 'Contiene caracteres no permitidos')
        .test(
          'correo-existente',
          'Este correo ya está registrado',
          async function (value) {
            if (!value) return true;

            try {
              const usuarios = await obtenerUsuarios();
              const correoExiste = usuarios.some(user => user.email === value);
              return !correoExiste;
            } catch (error) {
              return true;
            }
          }
        )
        .required('Campo obligatorio'),

      phone: Yup.string()
        .matches(/^[0-9]+$/, 'Solo se permiten números')
        .matches(/^\d{10}$/, 'Debe tener 10 dígitos')
        .matches(/^[^<>$=()\/\\{}[\]*+!@#%^&]*$/, 'Contiene caracteres no permitidos')
        .test(
          'no-8-repetidos',
          'No puede contener 8 dígitos iguales seguidos',
          (value) => {
            if (!value) return true;
            return !/(\d)\1{7}/.test(value);
          }
        )
        .required('Campo obligatorio'),

      password: Yup.string()
        .min(8, 'Debe tener al menos 8 caracteres')
        .matches(/^[^<>=()\/\\{}[\]]*$/, 'Contiene caracteres no permitidos')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]{8,}$/,
          'Debe contener al menos una mayúscula, una minúscula, un número y un carácter especial (!@#$%^&*)'
        )
        .required('Campo obligatorio'),

      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Las contraseñas deben coincidir')
        .required('Campo obligatorio'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      const confirmSave = await Swal.fire({
        title: '¿Agregar administrador?',
        text: '¿Confirmas que deseas registrar este nuevo administrador?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#7e22ce',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, registrar',
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
            email: values.email,
            password: values.password,
            role: { idRole: 2, name: 'ADMIN_GRUPAL' },
            persons: {
              name: values.name,
              lastname: values.lastname,
              email: values.email,
              phone: values.phone,
              status: true,
            },
          };

          await AxiosClient({
            url: '/users/',
            method: 'POST',
            data: payload,
          });

          refreshClients();
          closeModal();
          Swal.fire({
            icon: 'success',
            title: '¡ADMIN registrado!',
            text: 'El administrador se ha agregado correctamente al sistema.',
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
            title: 'Error al registrar',
            text: error.response?.data?.message || 'Hubo un problema al registrar el administrador. Por favor intente nuevamente.',
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

  if (!showModal) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center p-4 backdrop-blur-sm overflow-y-auto"
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
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Nuevo Administrador'
            </h3>
            <p className="text-sm text-purple-700/80 mt-1">Complete todos los campos requeridos</p>
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
            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-400">
                  <FiUser />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border ${formik.touched.name && formik.errors.name ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm`}
                  placeholder="Ej: Juan"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  maxLength={50}
                />
              </div>
              {formik.touched.name && formik.errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {formik.errors.name}
                </p>
              )}
            </div>

            {/* Apellido */}
            <div>
              <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-2">
                Apellido <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-400">
                  <FiUser />
                </div>
                <input
                  type="text"
                  id="lastname"
                  name="lastname"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border ${formik.touched.lastname && formik.errors.lastname ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm`}
                  placeholder="Ej: Pérez"
                  value={formik.values.lastname}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  maxLength={50}
                />
              </div>
              {formik.touched.lastname && formik.errors.lastname && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {formik.errors.lastname}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-400">
                  <FiMail />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border ${formik.touched.email && formik.errors.email ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm`}
                  placeholder="Ej: ejemplo@dominio.com"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {formik.errors.email}
                </p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-400">
                  <FiPhone />
                </div>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border ${formik.touched.phone && formik.errors.phone ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm`}
                  placeholder="Ej: 7773438732"
                  value={formik.values.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    formik.setFieldValue('phone', value);
                  }}
                  onBlur={formik.handleBlur}
                  maxLength={10}
                />
              </div>
              {formik.touched.phone && formik.errors.phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {formik.errors.phone}
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña <span className="text-red-500">*</span>
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
                  onClick={() => togglePasswordVisibility(setShowPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </motion.button>
              </div>
              {formik.touched.password && formik.errors.password ? (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {formik.errors.password}
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Debe contener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (!@#$%^&*)
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
                  placeholder="Repita la contraseña"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600"
                  onClick={() => togglePasswordVisibility(setShowConfirmPassword)}
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

            {/* Botones */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={closeModal}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
              >
                Cancelar
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={formik.isSubmitting || !formik.isValid}
                className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all text-sm font-medium flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {formik.isSubmitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" color="white" />
                    Registrando...
                  </>
                ) : (
                  'Registrar Administrador'
                )}
              </motion.button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddUserModal;