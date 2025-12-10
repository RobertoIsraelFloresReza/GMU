import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUser, FiMail, FiPhone, FiCheckCircle, FiAlertCircle, FiShield, FiCalendar, FiInfo } from 'react-icons/fi';

const UserDetailsModal = ({ showModal, closeModal, user }) => {
  if (!showModal || !user) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-md"
      >
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-2xl overflow-hidden w-full max-w-2xl border border-white/20 flex flex-col"
          style={{ maxHeight: '90vh' }} // Altura máxima para el modal
        >
          {/* Header */}
          <div className="bg-white/30 backdrop-blur-lg border-b border-white/20 p-6 flex justify-between items-start shrink-0">
            <div className="min-w-0">
              <motion.h2 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent truncate"
              >
                Detalles de {user.persons.name}
              </motion.h2>
              <motion.p 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-purple-600/80 text-sm mt-1 truncate"
              >
                {user.email}
              </motion.p>
            </div>
            
            <motion.button
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={closeModal}
              className="text-purple-600 hover:text-purple-800 p-1 rounded-full hover:bg-purple-100/50 transition-all shrink-0 ml-4"
            >
              <FiX className="h-6 w-6" />
            </motion.button>
          </div>

          {/* Contenido con scroll */}
          <div className="overflow-y-auto flex-1 p-6 grid md:grid-cols-2 gap-6">
            {/* Sección izquierda - Scroll independiente */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/20 h-full min-h-[200px] overflow-hidden flex flex-col"
            >
              <div className="flex items-center mb-4 shrink-0">
                <div className="p-3 bg-purple-100 rounded-full mr-4">
                  <FiUser className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 truncate">Datos Personales</h3>
              </div>

              <div className="space-y-4 overflow-y-auto">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="min-w-[120px] text-sm font-medium text-purple-700 flex items-start">
                    <FiUser className="mr-2 mt-0.5 flex-shrink-0" />
                    Nombre completo:
                  </div>
                  <div className="text-gray-700 break-words flex-1">
                    {user.persons.name} {user.persons.lastname}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="min-w-[120px] text-sm font-medium text-purple-700 flex items-start">
                    <FiPhone className="mr-2 mt-0.5 flex-shrink-0" />
                    Teléfono:
                  </div>
                  <div className="text-gray-700 break-words flex-1">
                    {user.persons.phone || 'No especificado'}
                  </div>
                </div>

              </div>
            </motion.div>

            {/* Sección derecha - Scroll independiente */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/20 h-full min-h-[200px] overflow-hidden flex flex-col"
            >
              <div className="flex items-center mb-4 shrink-0">
                <div className="p-3 bg-indigo-100 rounded-full mr-4">
                  <FiShield className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 truncate">Cuenta</h3>
              </div>

              <div className="space-y-4 overflow-y-auto">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="min-w-[120px] text-sm font-medium text-purple-700 flex items-start">
                    <FiMail className="mr-2 mt-0.5 flex-shrink-0" />
                    Email:
                  </div>
                  <div className="text-gray-700 break-words flex-1">
                    {user.email}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="min-w-[120px] text-sm font-medium text-purple-700 flex items-start">
                    <FiShield className="mr-2 mt-0.5 flex-shrink-0" />
                    Estado:
                  </div>
                  <div className="flex items-center">
                    {user.status ? (
                      <>
                        <FiCheckCircle className="mr-2 text-green-500 shrink-0" />
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Activo</span>
                      </>
                    ) : (
                      <>
                        <FiAlertCircle className="mr-2 text-red-500 shrink-0" />
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Inactivo</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="min-w-[120px] text-sm font-medium text-purple-700 flex items-start">
                    <FiShield className="mr-2 mt-0.5 flex-shrink-0" />
                    Rol:
                  </div>
                  <div className="text-gray-700">
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full break-words max-w-full">
                      {user.role?.name || 'Usuario'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="bg-white/30 backdrop-blur-lg border-t border-white/20 p-4 flex justify-end shrink-0">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={closeModal}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              Cerrar
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserDetailsModal;