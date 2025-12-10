import React, { useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import AxiosClient from '../config/http-gateway/http-client';
import { Spinner } from 'flowbite-react';
import { FiX, FiUser, FiMail, FiPhone } from 'react-icons/fi';
import { motion } from 'framer-motion';

// Función para sanitizar inputs
const sanitizeInput = (input) => {
  if (!input) return input;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
};

// Función para sanitizar teléfono (solo números)
const sanitizePhone = (phone) => {
  return phone.replace(/[^\d]/g, '').slice(0, 10);
};

// Función para validar email seguro
const validateSecureEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email) && 
         !email.includes('<') && 
         !email.includes('>') && 
         !email.includes('javascript:');
};

const EditUserModel = ({ showModalEdit, closeModalEdit, clienteEditando, refreshClients }) => {
    const formik = useFormik({
        initialValues: {
            idUser: '',
            name: '',
            lastname: '',
            email: '',
            phone: ''
        },
        validationSchema: Yup.object({
            name: Yup.string()
                .max(50, 'No debe exceder los 50 caracteres')
                .required('Campo obligatorio')
                .test(
                    'safe-input',
                    'El nombre contiene caracteres no permitidos',
                    value => !value || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/.test(value)
                ),
            lastname: Yup.string()
                .max(50, 'No debe exceder los 50 caracteres')
                .required('Campo obligatorio')
                .test(
                    'safe-input',
                    'El apellido contiene caracteres no permitidos',
                    value => !value || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/.test(value)
                ),
            email: Yup.string()
                .email('Correo electrónico inválido')
                .required('Campo obligatorio')
                .test(
                    'safe-email',
                    'El correo contiene caracteres no permitidos',
                    value => validateSecureEmail(value)
                ),
            phone: Yup.string()
                .matches(/^\d{10}$/, 'Debe tener 10 dígitos')
                .required('Campo obligatorio')
                .test(
                    'no-zeros',
                    'El número no puede ser todos ceros',
                    value => !/^0+$/.test(value)
                )
                .test(
                    'no-repeats',
                    'El número no puede ser una secuencia repetida',
                    value => !/(\d)\1{9}/.test(value)
                ),
        }),
        onSubmit: async (values, { setSubmitting }) => {
            const confirmSave = await Swal.fire({
                title: '¿Actualizar Usuario?',
                text: '¿Confirmas que deseas guardar los cambios?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#7e22ce',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Sí, guardar',
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
                    // Sanitizar todos los inputs antes de enviar
                    const payload = {
                        idUser: values.idUser,
                        email: sanitizeInput(values.email),
                        persons: {
                            idPerson: clienteEditando.persons.idPerson,
                            name: sanitizeInput(values.name),
                            lastname: sanitizeInput(values.lastname),
                            phone: sanitizePhone(values.phone),
                            email: sanitizeInput(values.email),
                        },
                        role: {
                            idRole: clienteEditando.role.idRole
                        }
                    };

                    const response = await AxiosClient({
                        url: `/users/${values.idUser}`,
                        method: 'PUT',
                        data: payload,
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    });

                    if (response.status === "OK") {
                        refreshClients();
                        closeModalEdit();
                        Swal.fire({
                            icon: 'success',
                            title: '¡Usuario actualizado!',
                            text: 'La información se ha guardado correctamente.',
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
                    }
                } catch (error) {
                    console.error('Error:', error);
                    let errorMessage = 'Hubo un problema al guardar los cambios. Por favor intente nuevamente.';
                    
                    if (error.response) {
                        errorMessage = error.response.data?.message || errorMessage;
                    }
                    
                    Swal.fire({
                        icon: 'error',
                        title: 'Error al actualizar',
                        text: errorMessage,
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

    // Actualizar valores cuando cambia clienteEditando
    useEffect(() => {
        if (clienteEditando && clienteEditando.persons) {
            formik.setValues({
                idUser: clienteEditando.idUser,
                name: clienteEditando.persons.name || '',
                lastname: clienteEditando.persons.lastname || '',
                email: clienteEditando.email || '',
                phone: clienteEditando.persons.phone || ''
            });
        }
    }, [clienteEditando]);

    const handleNameChange = (e) => {
        const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]/g, '');
        formik.setFieldValue('name', value);
    };

    const handleLastnameChange = (e) => {
        const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]/g, '');
        formik.setFieldValue('lastname', value);
    };

    const handleEmailChange = (e) => {
        const value = e.target.value.replace(/[<>"'`]/g, '');
        formik.setFieldValue('email', value);
    };

    if (!showModalEdit) return null;

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
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            Editar Usuario
                        </h3>
                        <p className="text-sm text-purple-700/80 mt-1">Actualice la información del Usuario</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={closeModalEdit}
                        type="button"
                        className="text-gray-400 hover:text-purple-600 transition-colors p-1 rounded-full"
                        aria-label="Cerrar modal"
                        disabled={formik.isSubmitting}
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
                                    onChange={handleNameChange}
                                    onBlur={formik.handleBlur}
                                    maxLength={50}
                                    disabled={formik.isSubmitting}
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
                                    onChange={handleLastnameChange}
                                    onBlur={formik.handleBlur}
                                    maxLength={50}
                                    disabled={formik.isSubmitting}
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
                                    onChange={handleEmailChange}
                                    onBlur={formik.handleBlur}
                                    disabled={formik.isSubmitting}
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
                                    placeholder="Ej: 0987654321"
                                    value={formik.values.phone}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        formik.setFieldValue('phone', value);
                                    }}
                                    onBlur={formik.handleBlur}
                                    maxLength={10}
                                    disabled={formik.isSubmitting}
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

                        {/* Botones */}
                        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                            <motion.button
                                type="button"
                                onClick={closeModalEdit}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                                disabled={formik.isSubmitting}
                            >
                                Cancelar
                            </motion.button>
                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                disabled={formik.isSubmitting || !formik.isValid || !formik.dirty}
                                className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all text-sm font-medium flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {formik.isSubmitting ? (
                                    <>
                                        <Spinner size="sm" className="mr-2" color="white" />
                                        Guardando...
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

export default EditUserModel;