import Swal from 'sweetalert2';
import withReactContent  from 'sweetalert2-react-content';

const AlertClient = withReactContent(Swal);
//Mensajes definidos tanto para sucess,para error ,como para confirmar algo 

//Alerta definada de error,success,confirm
export const customAlert = (title,text,icon) =>{
    return AlertClient.fire({
        title,
        text,
        icon,
        confirmButtonText:'Aceptar',
        customClass: {
            title: 'text-purple-800',
            content: 'text-gray-600',
            confirmButton: 'bg-purple-500 text-white hover:bg-purple-700',
        }
    });
    
};