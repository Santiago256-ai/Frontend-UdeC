import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, Minimize2, MessageSquareOff, Minus } from 'lucide-react';
import API from "../services/api";
import "./ChatSidebar.css"; // Comparten estilos de burbujas, pero usaremos clases específicas de Widget
import "./ChatWidget.css";

// ✅ AQUÍ DEBE IR EL PASO 1 (Fuera de la función principal)
const formatHeaderDate = (dateStr) => {
    const date = new Date(dateStr);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    if (date.toDateString() === hoy.toDateString()) return "Hoy";
    if (date.toDateString() === ayer.toDateString()) return "Ayer";
    
    return date.toLocaleDateString('es-ES', { 
        day: 'numeric', month: 'long', year: 'numeric' 
    });
};

const ChatWidget = ({ empresaId, postulante, vacanteId, onClose }) => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isChatEnabled, setIsChatEnabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    // Busca estas líneas al principio de tu componente ChatWidget
const postulanteId = postulante?.egresadoId || postulante?.egresado?.id;
const vacanteIdReal = vacanteId || postulante?.vacanteId;
const nombrePostulante = postulante?.egresado 
    ? `${postulante.egresado.nombres.split(' ')[0]} ${postulante.egresado.apellidos.split(' ')[0]}`
    : 'Candidato';

    // 1. CARGAR HISTORIAL Y ESTADO (Polling cada 3s)
    useEffect(() => {
        let interval;
        const fetchHistory = async () => {
            if (!postulanteId || !empresaId || !vacanteId) return;
            try {
                const res = await API.get(`/mensajeria/historial/${postulanteId}/${empresaId}/${vacanteId}`);
                if (res.data.mensajes) {
                    setMessages(res.data.mensajes);
                    setIsChatEnabled(res.data.chatActivo);
                } else {
                    setMessages(res.data);
                }
            } catch (err) {
                console.error("Error en Widget:", err);
            }
        };

        fetchHistory();
        interval = setInterval(fetchHistory, 3000);
        return () => clearInterval(interval);
    }, [postulanteId, empresaId, vacanteId]);

    // 2. AUTO-SCROLL
// 2. AUTO-SCROLL INTELIGENTE (Corregido para apertura y navegación)
// 2. AUTO-SCROLL INSTANTÁNEO AL ABRIR
useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
        const container = scrollRef.current;
        
        // Margen de seguridad para detectar si el usuario está al final
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;

        if (isFirstLoad) {
            // USAMOS 'auto' PARA QUE SEA INSTANTÁNEO AL ABRIR
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'auto' 
            });
            setIsFirstLoad(false); 
        } else if (isAtBottom) {
            // USAMOS 'smooth' SOLO PARA MENSAJES NUEVOS MIENTRAS ESTÁ ABIERTO
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }
    }
}, [messages, isFirstLoad]);

// Resetear la "llave" al cerrar/abrir o cambiar de persona
useEffect(() => {
    setIsFirstLoad(true);
}, [postulanteId]);

    // 3. CAMBIAR ESTADO (Activar/Desactivar)
    const toggleChatStatus = async () => {
    const nuevoEstado = !isChatEnabled;
    try {
        // CAMBIAR .patch por .put 👇
        await API.put(`/mensajeria/status-chat`, {
            usuarioId: postulanteId,
            vacanteId: parseInt(vacanteIdReal),
            activo: nuevoEstado
        });
        setIsChatEnabled(nuevoEstado);
    } catch (err) {
        alert("No se pudo cambiar el estado");
    }
};

    // 4. ENVIAR MENSAJE
    const handleSend = async () => {
    if (!currentMessage.trim() || loading || !isChatEnabled) return;

    const payload = {
    contenido: currentMessage,
    senderType: 'EMPRESA',
    senderEmpresaId: empresaId, // 💡 Nombre exacto
    receiverId: postulanteId,    // 💡 Nombre exacto
    vacanteId: vacanteId
};

    console.log("Enviando payload ajustado:", payload);

    setLoading(true);
    try {
        const res = await API.post('/mensajeria/enviar', payload);
        setMessages(prev => [...prev, res.data]);
        setCurrentMessage('');
    } catch (err) {
        console.error("Error al enviar:", err.response?.data);
        alert("Error al enviar el mensaje");
    } finally {
        setLoading(false);
    }
};

    return (
        <div className={`chat-widget-container fade-in ${isMinimized ? 'minimized' : ''}`}>
            
            <header className="widget-header" onClick={() => isMinimized && setIsMinimized(false)} style={{ cursor: isMinimized ? 'pointer' : 'default' }}>
                <div className="header-info">
                    <div className="avatar-mini">
                        {nombrePostulante.charAt(0)}
                    </div>
                    <div className="text-container">
                        <h4>{nombrePostulante}</h4>
                        <span className={`status-dot ${isChatEnabled ? 'online' : 'offline'}`}>
                            {isChatEnabled ? 'Chat Activo' : 'Cerrado'}
                        </span>
                    </div>
                </div>
                <div className="header-buttons">
                    {/* BOTÓN DE ACTIVAR/DESACTIVAR (Ocultar si está minimizado para limpieza) */}
                    {!isMinimized && (
                        <button 
                            className={`action-icon-btn ${isChatEnabled ? 'active' : 'inactive'}`} 
                            onClick={(e) => { e.stopPropagation(); toggleChatStatus(); }}
                            title={isChatEnabled ? "Desactivar chat" : "Activar chat"} // <--- AQUÍ
                        >
                            {isChatEnabled ? <MessageSquare size={16} /> : <MessageSquareOff size={16} />}
                        </button>
                    )}

                    {/* 4. NUEVO BOTÓN DE MINIMIZAR (EL GUION _) */}
                    <button 
        className="minimize-icon-btn" 
        onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
        title={isMinimized ? "Maximizar chat" : "Minimizar chat"} // <--- AQUÍ
    >
        <Minus size={18} />
    </button>

                    <button 
        className="close-icon-btn" 
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        title="Cerrar chat" // <--- AQUÍ
    >
        <X size={18} />
    </button>
                </div>
            </header>

            {/* Cuerpo de mensajes e Input inferior (Solo se ven si NO está minimizado) */}
{!isMinimized && (
    <>
        {/* 1. CUERPO DE MENSAJES: Solo mensajes y fechas */}
        <div className="widget-messages-body" ref={scrollRef}>
            {messages.length === 0 ? (
                <p className="widget-empty-text">No hay mensajes aún.</p>
            ) : (
                messages.map((m, index) => {
                    const fechaActual = new Date(m.fechaEnvio).toDateString();
                    const fechaAnterior = index > 0 
                        ? new Date(messages[index - 1].fechaEnvio).toDateString() 
                        : null;
                    const mostrarSeparador = fechaActual !== fechaAnterior;

                    return (
                        <React.Fragment key={m.id}>
                            {mostrarSeparador && (
                                <div className="chat-date-sticky">
                                    <span>{formatHeaderDate(m.fechaEnvio)}</span>
                                </div>
                            )}
                            
                            <div className={`message-bubble ${m.senderType === 'EMPRESA' ? 'empresa' : 'estudiante'}`}>
                                <div className="bubble-text">
                                    <p className="message-content">{m.contenido}</p>
                                    <span className="bubble-time">
                                        {new Date(m.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })
            )}
        </div>

        {/* 2. FOOTER: Aviso de estado + Input */}
        <footer className="widget-footer-container">
            {/* Aviso estático sobre el input si el chat está cerrado */}
            {!isChatEnabled && (
                <div className="widget-status-banner">
                    <MessageSquareOff size={14} style={{ marginRight: '8px' }} />
                    Chat desactivado para este proceso.
                </div>
            )}

            <div className="widget-input-row">
                <input 
                    type="text" 
                    value={currentMessage}
                    disabled={!isChatEnabled}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isChatEnabled ? "Escribe un mensaje..." : "Chat bloqueado"}
                />
                <button 
                    className="widget-send-btn" 
                    onClick={handleSend}
                    disabled={!isChatEnabled || loading}
                >
                    <Send size={16} />
                </button>
            </div>
        </footer>
    </>
)}
        </div>
    );
};

export default ChatWidget;