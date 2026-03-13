import React, { useState, useEffect, useRef } from 'react';
import API from "../services/api"; 

const ChatSidebar = ({ empresaId, postulante, vacanteId, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [loading, setLoading] = useState(false);
    // NUEVO: Estado para controlar si el chat está activo
    const [isChatEnabled, setIsChatEnabled] = useState(true); 
    const scrollRef = useRef(null);

    const postulanteId = postulante?.usuario?.id;
    const nombrePostulante = postulante?.usuario?.nombres || 'Candidato';

    // 1. Cargar historial y estado del chat
    useEffect(() => {
        const fetchHistory = async () => {
            if (!postulanteId || !empresaId || !vacanteId) return;
            try {
                const res = await API.get(`/mensajeria/historial/${postulanteId}/${empresaId}/${vacanteId}`);
                // Ajuste para manejar el objeto { mensajes, chatActivo } del backend
                if (res.data.mensajes) {
                    setMessages(res.data.mensajes);
                    setIsChatEnabled(res.data.chatActivo);
                } else {
                    setMessages(res.data);
                }
            } catch (err) {
                console.error("Error al cargar historial:", err);
            }
        };

        fetchHistory();
        const interval = setInterval(fetchHistory, 3000);
        return () => clearInterval(interval);
    }, [postulanteId, empresaId, vacanteId]);

    // NUEVO: Función para cambiar el estado del chat (Activar/Desactivar)
    const toggleChatStatus = async () => {
        const nuevoEstado = !isChatEnabled;
        try {
            await API.patch(`/mensajeria/status-chat`, {
                usuarioId: postulanteId,
                vacanteId: parseInt(vacanteId),
                activo: nuevoEstado
            });
            setIsChatEnabled(nuevoEstado);
        } catch (err) {
            alert("No se pudo cambiar el estado del chat");
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        // Bloqueo preventivo si el chat está desactivado
        if (!currentMessage.trim() || loading || !isChatEnabled) return;

        setLoading(true);
        const payload = {
            senderId: empresaId,
            senderType: 'EMPRESA',
            receiverId: postulanteId,
            vacanteId: parseInt(vacanteId),
            contenido: currentMessage.trim()
        };

        try {
            const res = await API.post('/mensajeria/enviar', payload);
            setMessages([...messages, res.data]);
            setCurrentMessage('');
        } catch (err) {
            alert("Error al enviar el mensaje");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-sidebar-container" style={styles.sidebar}>
            {/* Header con Switch agregado */}
            <div style={styles.header}>
                <div>
                    <h4 style={{ margin: 0 }}>💬 Chat con {nombrePostulante}</h4>
                    <label style={{ display: 'flex', alignItems: 'center', marginTop: '5px', cursor: 'pointer', fontSize: '12px' }}>
                        <input 
                            type="checkbox" 
                            checked={isChatEnabled} 
                            onChange={toggleChatStatus} 
                            style={{ marginRight: '5px' }}
                        />
                        {isChatEnabled ? 'Chat Activo' : 'Chat Desactivado'}
                    </label>
                </div>
                <button onClick={onClose} style={styles.closeBtn}>&times;</button>
            </div>

            {/* Cuerpo del Chat */}
            <div ref={scrollRef} style={styles.chatBody}>
                {/* Banner de aviso si está desactivado */}
                {!isChatEnabled && (
                    <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '10px', textAlign: 'center', fontSize: '12px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #ffeeba', position: 'sticky', // <--- LO MANTIENE ARRIBA
            top: '0',           // <--- SE PEGA AL TECHO DEL CUERPO
            zIndex: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                        Has desactivado el chat para este postulante.
                    </div>
                )}

                {messages.length === 0 ? (
                    <p style={styles.emptyText}>No hay mensajes aún. ¡Inicia la conversación!</p>
                ) : (
                    messages.map((m) => (
                        <div key={m.id} style={m.senderType === 'EMPRESA' ? styles.msgEmpresa : styles.msgUsuario}>
                            <div style={m.senderType === 'EMPRESA' ? styles.bubbleEmpresa : styles.bubbleUsuario}>
                                {m.contenido}
                            </div>
                            <span style={styles.time}>
                                {new Date(m.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* Input Footer - Deshabilitado si el chat está cerrado */}
            <div style={{...styles.footer, backgroundColor: isChatEnabled ? '#fff' : '#f8f9fa'}}>
                <input 
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isChatEnabled ? "Escribe un mensaje..." : "Chat desactivado"}
                    disabled={!isChatEnabled}
                    style={{...styles.input, backgroundColor: isChatEnabled ? '#fff' : '#e9ecef'}}
                />
                <button 
                    onClick={handleSend} 
                    disabled={loading || !isChatEnabled}
                    style={{...styles.sendBtn, opacity: (loading || !isChatEnabled) ? 0.6 : 1}}
                >
                    {loading ? '...' : 'Enviar'}
                </button>
            </div>
        </div>
    );
};

// Tus estilos originales sin cambios
const styles = {
    sidebar: {
        position: 'fixed', top: 0, right: 0, width: '350px', height: '100%',
        backgroundColor: '#fff', boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
        zIndex: 2000, display: 'flex', flexDirection: 'column'
    },
    header: {
        padding: '15px', backgroundColor: '#28a745', color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    closeBtn: { background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' },
    chatBody: { 
        flex: 1, padding: '15px', overflowY: 'auto', 
        backgroundColor: '#f4f7f6', display: 'flex', flexDirection: 'column' 
    },
    emptyText: { textAlign: 'center', color: '#888', marginTop: '20px', fontSize: '14px' },
    msgEmpresa: { alignSelf: 'flex-end', marginBottom: '15px', textAlign: 'right', maxWidth: '85%' },
    bubbleEmpresa: { backgroundColor: '#28a745', color: 'white', padding: '10px 14px', borderRadius: '15px 15px 0 15px', fontSize: '14px', boxShadow: '0 2px 5px rgba(40, 167, 69, 0.2)' },
    msgUsuario: { alignSelf: 'flex-start', marginBottom: '15px', textAlign: 'left', maxWidth: '85%' },
    bubbleUsuario: { backgroundColor: '#fff', color: '#333', padding: '10px 14px', borderRadius: '15px 15px 15px 0', fontSize: '14px', border: '1px solid #ddd', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
    time: { fontSize: '10px', color: '#999', marginTop: '4px', display: 'block' },
    footer: { padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '8px' },
    input: { flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ddd', outline: 'none' },
    sendBtn: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer' }
};

export default ChatSidebar;