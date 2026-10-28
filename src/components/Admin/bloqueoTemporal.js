import { toast } from 'react-toastify';

// El servidor mantiene rutas del panel en un 403 temporal (bloqueoTemporal.js del
// backend) hasta que se habilite el rol de administrador. Ese 403 se reconoce por
// su texto; cualquier otro error se sigue mostrando como error. Cuando ocurre, el
// panel muestra un aviso general (Admin.jsx) y las acciones, un toast informativo.
const EVENTO = 'admin-bloqueo-temporal';

export const esBloqueoTemporal = (error) =>
    error?.response?.status === 403
    && /deshabilitad[ao] temporalmente/i.test(error.response?.data?.error || '');

export const avisarBloqueoTemporal = () => window.dispatchEvent(new Event(EVENTO));

export const escucharBloqueoTemporal = (alOcurrir) => {
    window.addEventListener(EVENTO, alOcurrir);
    return () => window.removeEventListener(EVENTO, alOcurrir);
};

/** Para una acción que el servidor rechazó con el 403 temporal: "Eliminar", "Cambiar el estado"… */
export const avisarAccionBloqueada = (accion) => {
    avisarBloqueoTemporal();
    toast.info(`${accion} está temporalmente deshabilitado mientras se habilita el acceso de administrador.`, {
        toastId: `bloqueo-${accion}`, // un solo aviso aunque se intente varias veces seguidas
    });
};
