import { useNavigate } from "react-router-dom";
import ImagenLogo from "../assets/img/logo.png";
import { motion } from "framer-motion";
import { FaArrowLeft, FaHome, FaLifeRing, FaSignOutAlt } from "react-icons/fa";
import { RiErrorWarningFill } from "react-icons/ri";
import Swal from "sweetalert2";

const NotFound = () => {
  const navigate = useNavigate();

  // Función para confirmar y cerrar sesión
  const confirmLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: "Al ir al inicio cerrarás tu sesión actual. ¿Estás seguro?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#7e22ce',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
      background: '#ffffff',
      backdrop: `
        rgba(125, 34, 206, 0.1)
        left top
        no-repeat
      `,
      customClass: {
        title: 'text-purple-800',
        content: 'text-gray-600'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Limpiar localStorage
        localStorage.removeItem('userToken');
        localStorage.removeItem('user');
        
        // Redirigir al inicio
        navigate("/");
        
        Swal.fire({
          title: 'Sesión cerrada',
          text: 'Has cerrado sesión correctamente.',
          icon: 'success',
          confirmButtonColor: '#7e22ce',
          background: '#ffffff'
        });
      }
    });
  };

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 10,
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-25 p-4 relative overflow-hidden">
      {/* Efectos de fondo premium */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-purple-100 opacity-10 blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 rounded-full bg-purple-200 opacity-5 blur-3xl animate-float-slower"></div>
        <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-indigo-100 opacity-8 blur-2xl animate-float"></div>
      </div>

      {/* Tarjeta principal */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-lg p-8 space-y-6 bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl border border-purple-100/50 mx-2 text-center relative overflow-hidden"
      >
        {/* Efecto de borde sutil */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none border-2 border-purple-200/30"></div>
        
        {/* Logo */}
        <motion.div 
          variants={itemVariants}
          className="relative mb-6"
        >
          <img 
            src={ImagenLogo} 
            alt="Logo" 
            className="h-28 mx-auto drop-shadow-lg" 
          />
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="absolute -bottom-2 -right-2 bg-gradient-to-br from-purple-600 to-purple-400 rounded-full p-2 shadow-lg"
          >
            <RiErrorWarningFill className="h-6 w-6 text-white animate-pulse" />
          </motion.div>
        </motion.div>

        {/* Contenido */}
        <motion.div variants={itemVariants}>
          <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-purple-400 mb-2 tracking-tighter">
            404
          </h1>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">
            ¡Ups! Página no encontrada
          </h2>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="mb-6 text-purple-500/80">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-24 w-24 mx-auto"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={1.2}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <p className="text-gray-600 mb-8 px-6 text-lg leading-relaxed">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
        </motion.div>

        {/* Botones */}
        <motion.div 
          variants={itemVariants}
          className="w-full space-y-4"
        >
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 px-6 bg-gradient-to-br from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            <FaArrowLeft />
            <span>Volver atrás</span>
          </button>
          
          <button
            onClick={confirmLogout}
            className="w-full py-3 px-6 bg-white text-purple-600 hover:text-purple-800 hover:bg-purple-50 border-2 border-purple-100 font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2"
          >
            <FaSignOutAlt />
            <span>Ir al inicio (Cerrar sesión)</span>
          </button>
        </motion.div>

        {/* Soporte */}
        <motion.div 
          variants={itemVariants}
          className="pt-6 mt-6 border-t border-purple-100/50"
        >
          <button className="text-purple-500 hover:text-purple-700 transition-colors flex items-center justify-center gap-2 mx-auto text-sm">
            <FaLifeRing />
            <span>Contactar soporte técnico</span>
          </button>
        </motion.div>
      </motion.div>

      {/* Efecto de partículas */}
      <div className="absolute inset-0 overflow-hidden -z-20">
        {[...Array(10)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-purple-300/20"
            style={{
              width: Math.random() * 10 + 5 + 'px',
              height: Math.random() * 10 + 5 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: Math.random() * 5 + 's'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default NotFound;