import React, { useState, useEffect, useRef } from 'react';
import API from "../services/api"; 

const ChatSidebar = ({ empresaId, postulante, vacanteId, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [loading, setLoading] = useState(false);
    // NUEVO: Estado para controlar si el chat está habilitado
    const [isChatEnabled, setIsChatEnabled] = useState(true); 
    const scrollRef = useRef(null);

    const postulanteId = postulante?.usuario?.id;
    const nombrePostulante = postulante?.usuario?.nombres || 'Candidato';

    // 1. Cargar historial y estado del chat
    useEffect(() => {
        const fetchData = async () => {
            if (!postulanteId || !empresaId || !vacanteId) return;
            try {
                // Asumiendo que tu API devuelve el estado del chat junto al historial o en otro endpoint
                const res = await API.get(`/mensajeria/historial/${postulanteId}/${empresaId}/${vacanteId}`);
                setMessages(res.data.mensajes);
setIsChatEnabled(res.data.chatActivo);
                
                // Si el backend envía el estado de la postulación, actualizamos aquí:
                // setIsChatEnabled(res.data.chatActivo); 
            } catch (err) {
                console.error("Error al cargar datos:", err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, [postulanteId, empresaId, vacanteId]);

    // 2. Función para activar/desactivar chat (Hacia el Backend)
    const toggleChatStatus = async () => {
        const nuevoEstado = !isChatEnabled;
        try {
            // Ajusta esta ruta según tu API. Ejemplo: /postulaciones/toggle-chat
            await API.patch(`/postulaciones/status-chat`, {
                postulanteId,
                vacanteId,
                activo: nuevoEstado
            });
            setIsChatEnabled(nuevoEstado);
        } catch (err) {
            alert("No se pudo cambiar el estado del chat");
        }
    };

    const handleSend = async () => {
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
            {/* Header con Switch */}
            <div style={{...styles.header, backgroundColor: isChatEnabled ? '#28a745' : '#6c757d'}}>
                <div>
                    <h4 style={{ margin: 0 }}>💬 {nombrePostulante}</h4>
                    <label style={styles.switchLabel}>
                        <input 
                            type="checkbox" 
                            checked={isChatEnabled} 
                            onChange={toggleChatStatus} 
                        />
                        <span style={{marginLeft: '5px', fontSize: '12px'}}>
                            {isChatEnabled ? 'Chat Activo' : 'Chat Desactivado'}
                        </span>
                    </label>
                </div>
                <button onClick={onClose} style={styles.closeBtn}>&times;</button>
            </div>

            {/* Cuerpo del Chat */}
            <div ref={scrollRef} style={styles.chatBody}>
                {!isChatEnabled && (
                    <div style={styles.disabledBanner}>
                        Has desactivado el chat para este postulante.
                    </div>
                )}
                {/* ... (mapeo de mensajes igual al tuyo) */}
            </div>

            {/* Input Footer - Bloqueado si el chat está desactivado */}
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
                    style={{
                        ...styles.sendBtn, 
                        opacity: (loading || !isChatEnabled) ? 0.5 : 1,
                        backgroundColor: isChatEnabled ? '#28a745' : '#6c757d'
                    }}
                >
                    {loading ? '...' : 'Enviar'}
                </button>
            </div>
        </div>
    );
};

// Nuevos Estilos a agregar
const additionalStyles = {
    switchLabel: {
        display: 'flex',
        alignItems: 'center',
        marginTop: '5px',
        cursor: 'pointer',
        fontSize: '12px'
    },
    disabledBanner: {
        backgroundColor: '#fff3cd',
        color: '#856404',
        padding: '10px',
        textAlign: 'center',
        fontSize: '13px',
        borderRadius: '8px',
        marginBottom: '15px',
        border: '1px solid #ffeeba'
    }
};

// Mezclar con tus estilos existentes
const styles = { ...existingStyles, ...additionalStyles };