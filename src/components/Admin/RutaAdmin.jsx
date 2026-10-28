import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
    ACCESO_ADMIN, ACCESO_ADMIN_EXPIRADA, MARGEN_VENCIMIENTO_MS,
    cerrarSesionAdmin, leerSesionAdmin, sesionVencida,
} from '../../services/sesionAdmin';

// Guardia de /admin: exige admin-sesion con rol "admin" y token sin vencer. Sin
// sesión → /admin/acceso; vencida → la borra y lleva a ?motivo=expirada. Con el
// panel abierto, un temporizador hace lo mismo al llegar el vencimiento. Es sólo
// experiencia de uso: los datos del panel los protege el servidor.
export default function RutaAdmin({ children }) {
    const [estado] = useState(() => {
        const sesion = leerSesionAdmin();
        if (!sesion) return { tipo: 'sin-sesion' };
        if (sesionVencida(sesion)) {
            cerrarSesionAdmin();
            return { tipo: 'vencida' };
        }
        return { tipo: 'valida', sesion };
    });

    useEffect(() => {
        if (estado.tipo !== 'valida') return undefined;
        const espera = estado.sesion.exp - MARGEN_VENCIMIENTO_MS - Date.now();
        const temporizador = setTimeout(() => {
            cerrarSesionAdmin();
            window.location.assign(ACCESO_ADMIN_EXPIRADA); // recarga completa: no queda estado del panel
        }, Math.max(0, espera));
        return () => clearTimeout(temporizador);
    }, [estado]);

    if (estado.tipo === 'sin-sesion') return <Navigate to={ACCESO_ADMIN} replace />;
    if (estado.tipo === 'vencida') return <Navigate to={ACCESO_ADMIN_EXPIRADA} replace />;
    return children;
}
