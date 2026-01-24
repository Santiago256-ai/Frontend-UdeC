import React, { useState, useEffect, useRef } from 'react';
import API from "../services/api";
// Corregido: Quitamos el "ring" que causaba el error de sintaxis
import { MessageSquare, Bell } from 'lucide-react';

const NotificationBadge = ({ empresaId }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [showToast, setShowToast] = useState(false); // Estado para el cartelito
    const prevCountRef = useRef(0);

    const playNotificationSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => {});
    };

    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (!empresaId) return;
            try {
                const res = await API.get(`/mensajeria/contadores-empresa/${empresaId}`);
                const newCount = res.data.unreadCount;

                // Si hay mensajes nuevos
                if (newCount > prevCountRef.current) {
                    playNotificationSound();
                    setShowToast(true); // Mostrar el mensaje emergente
                    
                    // Ocultar el cartelito automáticamente tras 4 segundos
                    setTimeout(() => setShowToast(false), 4000);
                }

                prevCountRef.current = newCount;
                setUnreadCount(newCount);
            } catch (err) {
                console.error("Error en NotificationBadge:", err);
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 5000);
        return () => clearInterval(interval);
    }, [empresaId]);

    return (
        <div style={styles.container}>
            {/* Animaciones CSS */}
            <style>
                {`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes pulse-badge {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.3); }
                    100% { transform: scale(1); }
                }
                .toast-notification {
                    animation: slideIn 0.5s ease-out forwards;
                }
                .badge-animate {
                    animation: pulse-badge 0.6s ease-in-out;
                }
                `}
            </style>

            {/* --- EL TOAST (MENSAJE EMERGENTE) --- */}
            {showToast && (
                <div className="toast-notification" style={styles.toast}>
                    <div style={styles.toastContent}>
                        <MessageSquare size={18} style={{ marginRight: '10px' }} />
                        <span>¡Nuevo mensaje recibido!</span>
                    </div>
                </div>
            )}

            {/* --- ICONO Y BADGE --- */}
            <div style={styles.iconWrapper}>
                <MessageSquare size={24} color="#4f46e5" />
                {unreadCount > 0 && (
                    <div key={unreadCount} className="badge-animate" style={styles.badge}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', alignItems: 'center', position: 'relative' },
    iconWrapper: { position: 'relative', cursor: 'pointer' },
    badge: {
        position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#ef4444',
        color: 'white', borderRadius: '50%', padding: '2px', fontSize: '10px',
        fontWeight: 'bold', minWidth: '18px', height: '18px', display: 'flex',
        alignItems: 'center', justifyContent: 'center', border: '2px solid white'
    },
    toast: {
        position: 'fixed',
        top: '80px', // Debajo del Navbar
        right: '20px',
        backgroundColor: '#4f46e5',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
        zIndex: 9999,
        fontWeight: '600',
        fontSize: '14px'
    },
    toastContent: { display: 'flex', alignItems: 'center' }
};

export default NotificationBadge;