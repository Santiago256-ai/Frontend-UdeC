import React, { useState, useEffect } from 'react';
import API from '../services/api'; // Prueba con un solo '../'
import { 
    Bell, 
    MessageSquare, 
    Briefcase, 
    CheckCircle, 
    Clock, 
    Trash2,
    ChevronRight,
    Info,
    Check,
    Coffee
} from 'lucide-react';
import styles from './NotificacionesEgresado.module.css';

export default function NotificacionesEgresado({ usuarioId, setVistaActiva }) {
    const [notificaciones, setNotificaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [soloNoLeidos, setSoloNoLeidos] = useState(false);

    const fetchNotificaciones = async () => {
        try {
            // Traemos todas (el historial completo)
            const res = await API.get(`/notificaciones/egresado/${usuarioId}`);
            setNotificaciones(res.data);
        } catch (error) {
            console.error("Error al cargar notificaciones", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotificaciones();
        const interval = setInterval(fetchNotificaciones, 30000);
        return () => clearInterval(interval);
    }, [usuarioId]);

    const marcarComoLeida = async (id) => {
        try {
            await API.put(`/notificaciones/${id}/leer`);
            setNotificaciones(prev => 
                prev.map(n => n.id === id ? { ...n, vista: true } : n)
            );
        } catch (error) {
            console.error("Error al marcar como leída");
        }
    };

    const eliminarNotificacion = async (id, e) => {
        e.stopPropagation(); // Evita que se dispare el marcarComoLeida al borrar
        try {
            await API.delete(`/notificaciones/${id}`);
            setNotificaciones(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error("Error al eliminar");
        }
    };

    const handleAction = (notif) => {
    if (!notif.vista) marcarComoLeida(notif.id);

    if (notif.tipo === 'MENSAJE' || notif.tipo === 'MENSAJE_NUEVO') {
        setVistaActiva({
            vista: 'mensajes',
            chatData: {
                vacanteId: notif.referenciaId,
                mensajeId: notif.mensajeId 
            }
        });
    } 
    // --- ESTA ES LA PARTE NUEVA ---
    else if (notif.tipo === 'POSTULACION') {
        setVistaActiva({
            vista: 'solicitudes',
            postulacionData: {
                postulacionId: notif.postulacionId // Enviamos el ID para el borde naranja
            }
        });
    }
};

    const getIcon = (tipo) => {
        switch (tipo) {
            case 'MENSAJE':
            case 'MENSAJE_NUEVO': 
                return <MessageSquare size={18} className={styles.iconMsg} />;
            case 'POSTULACION': 
                return <Briefcase size={18} className={styles.iconPost} />;
            case 'SISTEMA': 
                return <Info size={18} className={styles.iconSys} />;
            default: 
                return <Bell size={18} />;
        }
    };

    if (loading) return <div className={styles.loader}>Cargando notificaciones...</div>;

    const notificacionesFiltradas = soloNoLeidos 
        ? notificaciones.filter(n => !n.vista) 
        : notificaciones;

    return (
        <div className={`${styles.notifContainer} fade-in`}>
            <div className={styles.notifHeader}>
                <div className={styles.titleGroup}>
                    <Bell className={styles.mainIcon} />
                    <h2>Centro de Notificaciones</h2>
                </div>
                {/* --- NUEVO: CONTENEDOR DEL FILTRO TOGGLE --- */}
                <div className={styles.filterWrapper}>
                    <span className={styles.filterLabel}>No leídos</span>
                    <button 
                        className={`${styles.toggleBtn} ${soloNoLeidos ? styles.toggleActive : ''}`}
                        onClick={() => setSoloNoLeidos(!soloNoLeidos)}
                    >
                        <div className={styles.toggleCircle}>
                            {soloNoLeidos && <Check size={12} className={styles.checkIcon} />}
                        </div>
                    </button>
                </div>
                <span className={styles.countBadge}>
                    {notificaciones.filter(n => !n.vista).length} nuevas
                </span>
            </div>

            <div className={styles.notifList}>
    {notificacionesFiltradas.length === 0 ? (
        <div className={styles.emptyState}>
            {soloNoLeidos ? (
                // ESTADO: Filtro "No leídos" activo y todo está leído
                <>
                    <Coffee size={48} color="#f39200" strokeWidth={1.5} />
                    <h3>¡Todo despejado por aquí!</h3>
                    <p>No tienes notificaciones nuevas sin leer.</p>
                </>
            ) : (
                // ESTADO: Historial totalmente vacío (filtro desactivado)
                <>
                    <CheckCircle size={48} color="#cbd5e0" strokeWidth={1.5} />
                    <h3>Bandeja vacía</h3>
                    <p>No tienes notificaciones en tu historial.</p>
                </>
            )}
        </div>
    ) : (
        // MAPEO: Si hay notificaciones según el filtro actual
        notificacionesFiltradas.map((n) => (
            <div 
                key={n.id} 
                className={`${styles.notifItem} ${!n.vista ? styles.unseen : styles.seen}`}
                onClick={() => handleAction(n)}
            >
                <div className={styles.iconWrapper}>
                    {getIcon(n.tipo)}
                    {!n.vista && <span className={styles.unreadDot}></span>}
                </div>
                
                <div className={styles.content}>
                    <p className={styles.message}>{n.contenido}</p>
                    <span className={styles.time}>
                        <Clock size={12} /> {new Date(n.fecha).toLocaleString('es-ES', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                    </span>
                </div>

                <div className={styles.actions}>
                    <button 
                        className={styles.deleteBtn}
                        onClick={(e) => eliminarNotificacion(n.id, e)}
                        title="Eliminar del historial"
                    >
                        <Trash2 size={16} />
                    </button>
                    <ChevronRight size={18} className={styles.arrow} />
                </div>
            </div>
        ))
    )}
</div>
        </div>
    );
}