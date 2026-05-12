import React, { useEffect, useState } from 'react';
import { Bell, MessageSquare, UserPlus, Clock, ChevronRight, CheckCircle2, Trash2 } from 'lucide-react';
import API from '../../services/api';
import styles from './NotificacionesEmpresa.module.css';

// 👇 1. Agregamos actualizarPendientes a los parámetros (props)
const NotificacionesEmpresa = ({ empresaId, setVistaActiva, actualizarPendientes }) => {
    const [notificaciones, setNotificaciones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarNotificaciones();
    }, [empresaId]);

    const cargarNotificaciones = async () => {
        console.log("Consultando notificaciones para empresa ID:", empresaId);
        try {
            const res = await API.get(`/notificaciones/empresa/${empresaId}`);
            console.log("Respuesta del servidor:", res.data);
            setNotificaciones(res.data);
        } catch (error) {
            console.error("Error al cargar notificaciones:", error);
        } finally {
            setLoading(false);
        }
    };

    const marcarComoVista = async (id) => {
        try {
            await API.put(`/notificaciones/${id}/leer`); 
            
            // Actualizamos la lista local
            setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, vista: true } : n));
            
            // 👇 2. LÍNEA CLAVE: Le avisamos al Dashboard que recalcule el punto naranja
            if (actualizarPendientes) {
                actualizarPendientes();
            }

        } catch (error) {
            console.error("Error al marcar como vista:", error);
        }
    };

    const handleAction = async (notif) => {
        if (!notif.vista) await marcarComoVista(notif.id);

        if (notif.tipo === 'POSTULACION') {
            setVistaActiva({
                vista: 'gestion',
                vacanteId: notif.referenciaId,
                postulacionId: notif.postulacionId 
            });
        } else if (notif.tipo === 'MENSAJE') {
            setVistaActiva({
                vista: 'mensajes',
                chatData: {
                    vacanteId: notif.referenciaId,
                    mensajeId: notif.mensajeId,
                    usuarioId: notif.egresadoId
                }
            });
        }
    };

    const formatTime = (date) => {
        const d = new Date(date);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <div className={styles.neLoading}><div className={styles.neSpinner}></div></div>;

    return (
        <div className={styles.neContainer}>
            <header className={styles.neHeader}>
                <div className={styles.neTitleGroup}>
                    <Bell className={styles.neBellIcon} size={28} />
                    <div>
                        <h2>Notificaciones de Empresa</h2>
                        <p>Seguimiento de postulaciones y mensajes nuevos</p>
                    </div>
                </div>
                <span className={styles.neCountBadge}>
                    {notificaciones.filter(n => !n.vista).length} nuevas
                </span>
            </header>

            <div className={styles.neList}>
                {notificaciones.length === 0 ? (
                    <div className={styles.neEmpty}>
                        <CheckCircle2 size={48} color="#cbd5e1" />
                        <p>Tu bandeja está limpia. No hay notificaciones pendientes.</p>
                    </div>
                ) : (
                    notificaciones.map((n) => (
                        <div 
                            key={n.id} 
                            className={`${styles.neItem} ${!n.vista ? styles.neUnread : ''}`}
                            onClick={() => handleAction(n)}
                        >
                            <div className={styles.neIconBox}>
                                {n.tipo === 'POSTULACION' ? (
                                    <UserPlus className={styles.neIconPostu} size={20} />
                                ) : (
                                    <MessageSquare className={styles.neIconMsg} size={20} />
                                )}
                            </div>
                            
                            <div className={styles.neContent}>
                                <p className={styles.neText}>{n.contenido}</p>
                                <span className={styles.neTime}>
                                    <Clock size={12} /> {formatTime(n.fecha)}
                                </span>
                            </div>

                            <div className={styles.neAction}>
                                {!n.vista && <div className={styles.neDot}></div>}
                                <ChevronRight size={18} className={styles.neChevron} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificacionesEmpresa;