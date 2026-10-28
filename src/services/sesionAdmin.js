// Sesión del panel de administración (DESIGN.md §8, "Acceso de administrador").
// Una sola clave, "admin-sesion", en sessionStorage: desaparece al cerrar la pestaña
// o el navegador (equipos compartidos) y no comparte nombre con token/usuario de
// egresado y empresa, así que las dos sesiones conviven en el mismo navegador.
// Leer "exp" del token sólo sirve para no mostrar un panel que el servidor va a
// rechazar: el navegador no verifica la firma; quien autoriza es el servidor.

const CLAVE = 'admin-sesion';
export const MARGEN_VENCIMIENTO_MS = 30_000; // se da por vencida 30 s antes
export const ACCESO_ADMIN = '/admin/acceso';
export const ACCESO_ADMIN_EXPIRADA = '/admin/acceso?motivo=expirada';

// "exp" (en segundos) del payload de un JWT, en milisegundos; null si no se puede leer.
const leerExp = (token) => {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')));
        return Number.isFinite(payload.exp) ? payload.exp * 1000 : null;
    } catch {
        return null;
    }
};

export const leerSesionAdmin = () => {
    try {
        const sesion = JSON.parse(sessionStorage.getItem(CLAVE));
        if (sesion && typeof sesion.token === 'string' && sesion.usuario?.rol === 'admin' && Number.isFinite(sesion.exp)) {
            return sesion;
        }
    } catch { /* sin almacenamiento o valor corrupto: no hay sesión */ }
    return null;
};

/** Guarda la respuesta de POST /auth/admin/login. Devuelve la sesión o null si no es válida. */
export const guardarSesionAdmin = ({ token, usuario } = {}) => {
    const exp = typeof token === 'string' ? leerExp(token) : null;
    if (!exp || usuario?.rol !== 'admin') return null;
    const sesion = { token, usuario, exp };
    try {
        sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
    } catch {
        return null;
    }
    return sesion;
};

export const cerrarSesionAdmin = () => {
    try { sessionStorage.removeItem(CLAVE); } catch { /* nada que borrar */ }
};

export const sesionVencida = (sesion, ahora = Date.now()) => !sesion || ahora >= sesion.exp - MARGEN_VENCIMIENTO_MS;
