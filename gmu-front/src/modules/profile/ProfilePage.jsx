import { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaKey, FaSave, FaUserCircle } from 'react-icons/fa';
import Layout from '../../components/Layout';
import { toast } from 'react-toastify';
import { userService, deliveryService } from '../../services/api';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = () => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
            setUser(userData);
            setUserRole(userData.role?.name || 'USER');

            // Para repartidores
            if (userData.firstName && userData.lastName) {
                setFormData(prev => ({
                    ...prev,
                    name: `${userData.firstName} ${userData.lastName}`,
                    email: userData.email || ''
                }));
            } else {
                // Para admins u otros usuarios
                setFormData(prev => ({
                    ...prev,
                    name: userData.name || userData.username || '',
                    email: userData.email || ''
                }));
            }
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        // Validar si se quiere cambiar contraseña
        if (formData.newPassword) {
            if (formData.newPassword !== formData.confirmPassword) {
                toast.error('Las contraseñas no coinciden');
                return;
            }
            if (!formData.currentPassword) {
                toast.error('Ingresa tu contraseña actual');
                return;
            }
            if (formData.newPassword.length < 6) {
                toast.error('La nueva contraseña debe tener al menos 6 caracteres');
                return;
            }

            try {
                const passwords = {
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                };

                // Determinar si es usuario admin o repartidor
                if (user.idUser) {
                    await userService.updatePassword(user.idUser, passwords);
                } else if (user.idDeliveryPerson) {
                    await deliveryService.updatePassword(user.idDeliveryPerson, passwords);
                }

                toast.success('Contraseña actualizada exitosamente');

                // Limpiar campos de contraseña
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));
            } catch (error) {
                console.error('Error updating password:', error);
                toast.error(error.response?.data?.message || 'Error al actualizar contraseña');
            }
        } else {
            toast.info('No hay cambios para guardar');
        }
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'ADMIN':
                return 'badge-primary';
            case 'DELIVERY_PERSON':
                return 'badge-orange';
            default:
                return 'badge-info';
        }
    };

    const getRoleDisplayName = (role) => {
        switch (role) {
            case 'ADMIN':
                return 'Administrador';
            case 'DELIVERY_PERSON':
                return 'Repartidor';
            default:
                return 'Usuario';
        }
    };

    return (
        <Layout userRole={userRole}>
            <div className="animate-fade-in">
                <div className="page-header">
                    <h2 className="page-title">Mi Perfil</h2>
                    <p className="page-subtitle">Gestiona tu información personal</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Profile Info Card */}
                    <div className="card">
                        <div className="card-body text-center p-4 sm:p-6">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                <FaUserCircle className="text-5xl sm:text-6xl text-white" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 break-words px-2">
                                {formData.name || 'Usuario'}
                            </h3>
                            <p className="text-slate-600 text-xs sm:text-sm mb-3 break-all px-2">{formData.email}</p>
                            <span className={`badge ${getRoleBadgeClass(userRole)} text-xs sm:text-sm`}>
                                {getRoleDisplayName(userRole)}
                            </span>

                            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200">
                                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">ID:</span>
                                        <span className="font-bold">
                                            {user?.idUser || user?.idDeliveryPerson || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Estado:</span>
                                        <span className="badge badge-success text-xs">Activo</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Edit Profile Form */}
                    <div className="lg:col-span-2 card">
                        <div className="card-header p-3 sm:p-4">
                            <h3 className="card-title text-sm sm:text-base">Editar Información</h3>
                        </div>
                        <div className="card-body p-3 sm:p-4 md:p-6">
                            <form onSubmit={handleUpdateProfile}>
                                <div className="space-y-4 sm:space-y-6">
                                    {/* Información Personal */}
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                                            <FaUser className="text-blue-600" />
                                            Información Personal
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                            <div className="form-group">
                                                <label className="form-label text-xs sm:text-sm">Nombre Completo</label>
                                                <input
                                                    type="text"
                                                    className="form-input text-xs sm:text-sm p-2 sm:p-3"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    disabled
                                                />
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Contacta al administrador para cambiar tu nombre
                                                </p>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label text-xs sm:text-sm">Email</label>
                                                <input
                                                    type="email"
                                                    className="form-input text-xs sm:text-sm p-2 sm:p-3 break-all"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    disabled
                                                />
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Contacta al administrador para cambiar tu email
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cambiar Contraseña */}
                                    <div className="pt-4 sm:pt-6 border-t border-slate-200">
                                        <h4 className="font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                                            <FaKey className="text-orange-600" />
                                            Cambiar Contraseña
                                        </h4>
                                        <div className="space-y-3 sm:space-y-4">
                                            <div className="form-group">
                                                <label className="form-label text-xs sm:text-sm">Contraseña Actual</label>
                                                <input
                                                    type="password"
                                                    className="form-input text-xs sm:text-sm p-2 sm:p-3"
                                                    value={formData.currentPassword}
                                                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                                    placeholder="Ingresa tu contraseña actual"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                                <div className="form-group">
                                                    <label className="form-label text-xs sm:text-sm">Nueva Contraseña</label>
                                                    <input
                                                        type="password"
                                                        className="form-input text-xs sm:text-sm p-2 sm:p-3"
                                                        value={formData.newPassword}
                                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                                        placeholder="Mínimo 6 caracteres"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label text-xs sm:text-sm">Confirmar Contraseña</label>
                                                    <input
                                                        type="password"
                                                        className="form-input text-xs sm:text-sm p-2 sm:p-3"
                                                        value={formData.confirmPassword}
                                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                        placeholder="Repite la nueva contraseña"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
                                        <button type="submit" className="btn btn-primary text-sm sm:text-base py-2 sm:py-3">
                                            <FaSave /> Guardar Cambios
                                        </button>
                                        <button
                                            type="button"
                                            onClick={loadUserData}
                                            className="btn btn-outline text-sm sm:text-base py-2 sm:py-3"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ProfilePage;
