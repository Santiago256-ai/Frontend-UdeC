import React, { useState, useEffect, useRef } from 'react';
import API from "../services/api";
import { MessageSquare, User, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationBadge = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentMessages, setRecentMessages] = useState([]);
    const [showToast, setShowToast] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const prevCountRef = useRef(0);
    const menuRef = useRef(null);
    const navigate = useNavigate();
    
    const usuario = JSON.parse(localStorage.getItem('usuario'));

    const playNotificationSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => {});
    };

    // Cerrar el menú si se hace clic fuera de él
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchData = async () => {
        if (!usuario?.id) return;
        try {
            // Endpoint que devuelve contador y lista de mensajes no leídos
            const res = await API.get(`/mensajeria/resumen/${usuario.id}`);
            const { count, messages } = res.data;

            if (count > prevCountRef.current) {
                playNotificationSound();
                setShowToast(true);
                setTimeout(() => setShowToast(false), 4000);
            }

            prevCountRef.current = count;
            setUnreadCount(count);
            setRecentMessages(messages || []);
        } catch (err) {
            console.error("Error en NotificationBadge:", err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 6000);
        return () => clearInterval(interval);
    }, [usuario?.id]);

    return (
        <div style={styles.container} ref={menuRef}> 
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
                .toast-notification { animation: slideIn 0.5s ease-out forwards; }
                .badge-animate { animation: pulse-badge 0.6s ease-in-out; }
                .message-item:hover { background-color: #f3f4f6; }
                `}
            </style>

            {showToast && (
                <div className="toast-notification" style={styles.toast}>
                    <div style={styles.toastContent}>
                        <MessageSquare size={18} style={{ marginRight: '10px' }} />
                        <span>¡Tienes un nuevo mensaje!</span>
                    </div>
                </div>
            )}

            {/* ICONO PRINCIPAL */}
            <div style={styles.iconWrapper} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <MessageSquare size={24} color="#4f46e5" />
                {unreadCount > 0 && (
                    <div key={unreadCount} className="badge-animate" style={styles.badge}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                )}
            </div>

            {/* MENU DESPLEGABLE TIPO FACEBOOK */}
            {isMenuOpen && (
                <div style={styles.dropdown}>
                    <div style={styles.dropdownHeader}>
                        <span>Mensajes Pendientes</span>
                        <span style={styles.unreadTag}>{unreadCount} nuevos</span>
                    </div>
                    
                    <div style={styles.messageList}>
                        {recentMessages.length > 0 ? (
                            recentMessages.map((msg) => (
                                <div 
                                    key={msg.id} 
                                    className="message-item"
                                    style={styles.messageItem}
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        navigate(`/mensajeria/${msg.senderId}`);
                                    }}
                                >
                                    <div style={styles.avatar}>
                                        <User size={16} color="#4f46e5" />
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <p style={styles.senderName}>{msg.senderNombre}</p>
                                        <p style={styles.previewText}>{msg.contenido}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={styles.emptyState}>
                                <p>No tienes mensajes sin leer</p>
                            </div>
                        )}
                    </div>

                    <div 
                        style={styles.dropdownFooter}
                        onClick={() => {
                            setIsMenuOpen(false);
                            navigate('/mensajeria/1');
                        }}
                    >
                        Ver todos los mensajes
                        <ExternalLink size={14} style={{ marginLeft: '5px' }} />
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { display: 'flex', alignItems: 'center', position: 'relative' },
    iconWrapper: { position: 'relative', cursor: 'pointer', padding: '5px' },
    badge: {
        position: 'absolute', top: '-2px', right: '-2px', backgroundColor: '#ef4444',
        color: 'white', borderRadius: '50%', padding: '2px', fontSize: '10px',
        fontWeight: 'bold', minWidth: '18px', height: '18px', display: 'flex',
        alignItems: 'center', justifyContent: 'center', border: '2px solid white'
    },
    dropdown: {
        position: 'absolute', top: '45px', right: '0', width: '300px',
        backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb', zIndex: 1000, overflow: 'hidden'
    },
    dropdownHeader: {
        padding: '12px 15px', fontWeight: 'bold', borderBottom: '1px solid #f3f4f6',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px'
    },
    unreadTag: { backgroundColor: '#eef2ff', color: '#4f46e5', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' },
    messageList: { maxHeight: '350px', overflowY: 'auto' },
    messageItem: {
        display: 'flex', padding: '12px 15px', gap: '12px', cursor: 'pointer',
        transition: 'background 0.2s', borderBottom: '1px solid #f9fafb', alignItems: 'center'
    },
    avatar: {
        width: '36px', height: '36px', backgroundColor: '#e0e7ff', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    },
    senderName: { fontSize: '13px', fontWeight: '700', color: '#111827', margin: 0 },
    previewText: { 
        fontSize: '12px', color: '#6b7280', margin: 0, 
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
    },
    dropdownFooter: {
        padding: '12px', textAlign: 'center', fontSize: '13px', color: '#4f46e5',
        fontWeight: '600', cursor: 'pointer', backgroundColor: '#f9fafb',
        display: 'flex', justifyContent: 'center', alignItems: 'center', borderTop: '1px solid #f3f4f6'
    },
    emptyState: { padding: '30px 15px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' },
    toast: {
        position: 'fixed', top: '80px', right: '20px', backgroundColor: '#4f46e5',
        color: 'white', padding: '12px 20px', borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)', zIndex: 9999,
        fontWeight: '600', fontSize: '14px'
    },
    toastContent: { display: 'flex', alignItems: 'center' }
};

export default NotificationBadge;