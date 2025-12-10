import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', type = 'danger' }) => {
    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    bg: 'bg-red-100',
                    icon: 'text-red-600',
                    btn: 'bg-red-600 hover:bg-red-700'
                };
            case 'warning':
                return {
                    bg: 'bg-orange-100',
                    icon: 'text-orange-600',
                    btn: 'bg-orange-600 hover:bg-orange-700'
                };
            case 'info':
                return {
                    bg: 'bg-blue-100',
                    icon: 'text-blue-600',
                    btn: 'bg-blue-600 hover:bg-blue-700'
                };
            default:
                return {
                    bg: 'bg-gray-100',
                    icon: 'text-gray-600',
                    btn: 'bg-gray-600 hover:bg-gray-700'
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scale-in">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 ${styles.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <FaExclamationTriangle className={`text-2xl ${styles.icon}`} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                            <p className="text-slate-600">{message}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>

                <div className="flex gap-3 p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="btn btn-outline flex-1"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`btn ${styles.btn} text-white flex-1`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
