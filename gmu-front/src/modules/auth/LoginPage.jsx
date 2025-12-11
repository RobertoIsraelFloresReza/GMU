import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEnvelope, FaLock, FaTruck, FaStore, FaEye, FaEyeSlash, FaBoxes, FaMapMarkedAlt, FaQrcode, FaRoute, FaClipboardList, FaWarehouse } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { cacheService } from '../../services/cacheService';
import AxiosClient from '../../config/http-gateway/http-client';

const LoginPage = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const formik = useFormik({
        initialValues: {
            email: '',
            password: ''
        },
        validationSchema: Yup.object({
            email: Yup.string()
                .email('Email inválido')
                .required('El email es obligatorio'),
            password: Yup.string()
                .min(6, 'La contraseña debe tener al menos 6 caracteres')
                .required('La contraseña es obligatoria')
        }),
        onSubmit: async (values) => {
            setLoading(true);
            try {
                const response = await AxiosClient.post('/auth/signin', values);

                if (response && response.data) {
                    const { token, user } = response.data;

                    console.log('Login Response:', response);
                    console.log('User:', user);
                    console.log('User Role:', user.role);

                    localStorage.setItem('token', token);
                    localStorage.setItem('user', JSON.stringify(user));

                    toast.success('¡Bienvenidoa GroceryDelivery Pro!', {
                        position: 'top-right',
                        autoClose: 1000
                    });

                    // Cachear datos para modo offline (NO bloquear el login)
                    const userRole = user.role?.name;
                    if (userRole) {
                        // Cachear en background sin bloquear
                        cacheService.cacheAllData(user.idUser, userRole).then(() => {
                            console.log('✅ Datos cacheados en background');
                        }).catch(err => {
                            console.warn('⚠️ Error cacheando datos (no crítico):', err);
                        });
                    }

                    // Redirect directly based on role
                    setTimeout(() => {
                        if (user.role && user.role.name === 'ADMIN') {
                            navigate('/admin/dashboard');
                        } else if (user.role && user.role.name === 'DELIVERY_PERSON') {
                            navigate('/delivery/qr-scan');
                        } else {
                            console.error('Unknown role:', user.role);
                            navigate('/login');
                        }
                    }, 1200);
                }
            } catch (error) {
                console.error('Error en login:', error);
                toast.error(
                    error.response?.data?.message || 'Credenciales incorrectas',
                    {
                        position: 'top-right',
                        autoClose: 3000
                    }
                );
            } finally {
                setLoading(false);
            }
        }
    });

    // Animated delivery truck
    const truckVariants = {
        animate: {
            x: [0, 20, 0],
            y: [0, -5, 0],
            transition: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    // Floating boxes animation
    const boxVariants = {
        animate: (i) => ({
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
            transition: {
                duration: 2 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3
            }
        })
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
            <ToastContainer />

            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Animated Grid */}
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                    transform: 'perspective(500px) rotateX(60deg)',
                    transformOrigin: 'center center'
                }}></div>

                {/* Floating Warehouse Icons */}
                <motion.div
                    className="absolute top-20 left-20 text-blue-400 opacity-20"
                    custom={0}
                    variants={boxVariants}
                    animate="animate"
                >
                    <FaWarehouse className="text-6xl" />
                </motion.div>

                <motion.div
                    className="absolute top-40 right-32 text-orange-400 opacity-20"
                    custom={1}
                    variants={boxVariants}
                    animate="animate"
                >
                    <FaBoxes className="text-7xl" />
                </motion.div>

                <motion.div
                    className="absolute bottom-32 left-40 text-emerald-400 opacity-20"
                    custom={2}
                    variants={boxVariants}
                    animate="animate"
                >
                    <FaRoute className="text-5xl" />
                </motion.div>

                <motion.div
                    className="absolute bottom-20 right-20 text-blue-400 opacity-20"
                    custom={3}
                    variants={boxVariants}
                    animate="animate"
                >
                    <FaQrcode className="text-6xl" />
                </motion.div>
            </div>

            <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">

                    {/* Left Side - Hero Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="hidden lg:block text-white space-y-8"
                    >
                        {/* Logo and Brand */}
                        <div className="space-y-6">
                            <motion.div
                                className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 rounded-2xl shadow-2xl"
                                variants={truckVariants}
                                animate="animate"
                            >
                                <FaTruck className="text-6xl text-white" />
                                <div>
                                    <h1 className="text-5xl font-black tracking-tight">
                                        Grocery<span className="text-orange-400">Delivery</span>
                                    </h1>
                                    <p className="text-blue-200 text-sm font-semibold tracking-wider uppercase">
                                        Sistema Inteligente de Distribución
                                    </p>
                                </div>
                            </motion.div>

                            <motion.p
                                className="text-2xl text-blue-100 font-light leading-relaxed"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                Optimiza tu red de distribución con tecnología de vanguardia
                            </motion.p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="group relative bg-gradient-to-br from-blue-600/30 to-blue-700/20 backdrop-blur-xl p-6 rounded-2xl border border-blue-400/30 hover:border-blue-400/60 transition-all duration-300 hover:scale-105"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative">
                                    <div className="bg-orange-500 w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                                        <FaQrcode className="text-2xl text-white" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">Escaneo QR</h3>
                                    <p className="text-blue-200 text-sm leading-relaxed">
                                        Identifica tiendas al instante con tu cámara
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="group relative bg-gradient-to-br from-emerald-600/30 to-emerald-700/20 backdrop-blur-xl p-6 rounded-2xl border border-emerald-400/30 hover:border-emerald-400/60 transition-all duration-300 hover:scale-105"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative">
                                    <div className="bg-emerald-500 w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                                        <FaRoute className="text-2xl text-white" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">Rutas Inteligentes</h3>
                                    <p className="text-blue-200 text-sm leading-relaxed">
                                        Optimización automática de recorridos
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="group relative bg-gradient-to-br from-orange-600/30 to-orange-700/20 backdrop-blur-xl p-6 rounded-2xl border border-orange-400/30 hover:border-orange-400/60 transition-all duration-300 hover:scale-105"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative">
                                    <div className="bg-blue-500 w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                                        <FaMapMarkedAlt className="text-2xl text-white" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">Geolocalización</h3>
                                    <p className="text-blue-200 text-sm leading-relaxed">
                                        Seguimiento GPS en tiempo real
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="group relative bg-gradient-to-br from-purple-600/30 to-purple-700/20 backdrop-blur-xl p-6 rounded-2xl border border-purple-400/30 hover:border-purple-400/60 transition-all duration-300 hover:scale-105"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative">
                                    <div className="bg-purple-500 w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                                        <FaClipboardList className="text-2xl text-white" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">Modo Offline</h3>
                                    <p className="text-blue-200 text-sm leading-relaxed">
                                        Trabaja sin conexión, sincroniza después
                                    </p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Stats Bar */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="flex items-center justify-around bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
                        >
                            <div className="text-center">
                                <div className="text-3xl font-black text-orange-400">PWA</div>
                                <div className="text-xs text-blue-200 uppercase mt-1">Instalable</div>
                            </div>
                            <div className="w-px h-12 bg-white/20"></div>
                            <div className="text-center">
                                <div className="text-3xl font-black text-emerald-400">Sync</div>
                                <div className="text-xs text-blue-200 uppercase mt-1">Automático</div>
                            </div>
                            <div className="w-px h-12 bg-white/20"></div>
                            <div className="text-center">
                                <div className="text-3xl font-black text-blue-400">Real-time</div>
                                <div className="text-xs text-blue-200 uppercase mt-1">Dashboard</div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right Side - Login Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-full"
                    >
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 border border-white/50">
                            {/* Mobile Logo */}
                            <div className="lg:hidden flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 sm:mb-8">
                                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                                    <FaTruck className="text-3xl sm:text-4xl text-white" />
                                </div>
                                <div className="text-center sm:text-left">
                                    <h1 className="text-2xl sm:text-3xl font-black text-gray-800">
                                        Grocery<span className="text-orange-500">Delivery</span>
                                    </h1>
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                                        Sistema de Distribución
                                    </p>
                                </div>
                            </div>

                            {/* Form Header */}
                            <div className="text-center mb-6 sm:mb-8">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                                    className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 shadow-xl"
                                >
                                    <FaStore className="text-3xl sm:text-4xl text-white" />
                                </motion.div>
                                <h2 className="text-2xl sm:text-3xl font-black text-gray-800 mb-2">
                                    Hola papu
                                </h2>
                                <p className="text-sm sm:text-base text-gray-600 font-medium">
                                    Ingresa tus credenciales para continuar
                                </p>
                            </div>

                            <form onSubmit={formik.handleSubmit} className="space-y-5 sm:space-y-6">
                                {/* Email Field */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                                        Correo Electrónico
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                                            <FaEnvelope className="text-lg sm:text-xl" />
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="tu@email.com"
                                            className={`w-full pl-11 sm:pl-14 pr-3 sm:pr-4 py-3 sm:py-4 text-sm sm:text-base border-2 rounded-lg sm:rounded-xl font-medium focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all ${
                                                formik.touched.email && formik.errors.email
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-gray-200 bg-gray-50 focus:bg-white'
                                            }`}
                                            {...formik.getFieldProps('email')}
                                        />
                                    </div>
                                    <AnimatePresence>
                                        {formik.touched.email && formik.errors.email && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="mt-2 text-sm text-red-600 font-semibold flex items-center gap-2"
                                            >
                                                <span className="text-lg">⚠️</span> {formik.errors.email}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Password Field */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                                        Contraseña
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                                            <FaLock className="text-lg sm:text-xl" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            placeholder="••••••••"
                                            className={`w-full pl-11 sm:pl-14 pr-11 sm:pr-14 py-3 sm:py-4 text-sm sm:text-base border-2 rounded-lg sm:rounded-xl font-medium focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all ${
                                                formik.touched.password && formik.errors.password
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-gray-200 bg-gray-50 focus:bg-white'
                                            }`}
                                            {...formik.getFieldProps('password')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                                        >
                                            {showPassword ? <FaEyeSlash className="text-lg sm:text-xl" /> : <FaEye className="text-lg sm:text-xl" />}
                                        </button>
                                    </div>
                                    <AnimatePresence>
                                        {formik.touched.password && formik.errors.password && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="mt-2 text-sm text-red-600 font-semibold flex items-center gap-2"
                                            >
                                                <span className="text-lg">⚠️</span> {formik.errors.password}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Submit Button */}
                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileHover={{ scale: loading ? 1 : 1.02 }}
                                    whileTap={{ scale: loading ? 1 : 0.98 }}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-black text-base sm:text-lg hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2 sm:gap-3">
                                            <div className="w-5 h-5 sm:w-6 sm:h-6 border-3 sm:border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span className="text-sm sm:text-base">Verificando...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 sm:gap-3">
                                            <FaMapMarkedAlt className="text-lg sm:text-xl" />
                                            <span className="text-sm sm:text-base">Ingresar al Sistema</span>
                                        </div>
                                    )}
                                </motion.button>
                            </form>

                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
