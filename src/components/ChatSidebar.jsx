import React, { useState, useEffect, useRef } from 'react';
import API from "../services/api"; 

// 1. AGREGAR EXPORT DEFAULT AQUÍ
const ChatSidebar = ({ empresaId, postulante, vacanteId, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isChatEnabled, setIsChatEnabled] = useState(true); 
    const scrollRef = useRef(null);

    const postulanteId = postulante?.usuario?.id;
    const nombrePostulante = postulante?.usuario?.nombres || 'Candidato';

    // 2. CARGAR DATOS (Corregido res.data)
    useEffect(() => {
        const fetchData = async () => {
            if (!postulanteId || !empresaId || !vacanteId) return;
            try {
                const res = await API.get(`/mensajeria/historial/${postulanteId}/${empresaId}/${vacanteId}`);
                
                // Extraemos los datos correctamente del objeto que definimos en el backend
                if (res.data) {
                    setMessages(res.data.mensajes || []);
                    setIsChatEnabled(res.data.chatActivo);
                }
            } catch (err) {
                console.error("Error al cargar datos:", err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, [postulanteId, empresaId, vacanteId]);

    // 3. TOGGLE STATUS (Corregido endpoint y nombres de campos)
    const toggleChatStatus = async () => {
        const nuevoEstado = !isChatEnabled;
        try {
            // Ajustado a la ruta que creamos en el backend: /mensajeria/status-chat
            await API.patch(`/mensajeria/status-chat`, {
                usuarioId: postulanteId, // El backend espera usuarioId
                vacanteId: parseInt(vacanteId),
                activo: nuevoEstado
            });
            setIsChatEnabled(nuevoEstado);
        } catch (err) {
            console.error(err);
            alert("No se pudo cambiar el estado del chat");
        }
    };

    const handleSend = async () => {
        if (!currentMessage.trim() || loading || !isChatEnabled) return;

        setLoading(true);
        try {
            const payload = {
                senderId: empresaId,
                senderType: 'EMPRESA',
                receiverId: postulanteId,
                vacanteId: parseInt(vacanteId),
                contenido: currentMessage.trim()
            };
            const res = await API.post('/mensajeria/enviar', payload);
            setMessages(prev => [...prev, res.data]);
            setCurrentMessage('');
        } catch (err) {
            alert("Error al enviar el mensaje");
        } finally {
            setLoading(false);
        }
    };

    // Auto-scroll al recibir mensajes
    useEffect(() => {
        scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
    }, [messages]);

    return (
        <div className="chat-sidebar-container" style={styles.sidebar}>
            <div style={{...styles.header, backgroundColor: isChatEnabled ? '#28a745' : '#6c757d'}}>
                <div>
                    <h4 style={{ margin: 0, color: 'white' }}>💬 {nombrePostulante}</h4>
                    <label style={styles.switchLabel}>
                        <input 
                            type="checkbox" 
                            checked={isChatEnabled} 
                            onChange={toggleChatStatus} 
                        />
                        <span style={{marginLeft: '5px', fontSize: '12px', color: 'white'}}>
                            {isChatEnabled ? 'Chat Activo' : 'Chat Desactivado'}
                        </span>
                    </label>
                </div>
                <button onClick={onClose} style={styles.closeBtn}>&times;</button>
            </div>

            <div ref={scrollRef} style={styles.chatBody}>
                {!isChatEnabled && (
                    <div style={styles.disabledBanner}>
                        Has desactivado el chat para este postulante.
                    </div>
                )}
                
                {messages.map((m) => (
                    <div key={m.id} style={m.senderType === 'EMPRESA' ? styles.myMsg : styles.theirMsg}>
                        <div style={m.senderType === 'EMPRESA' ? styles.myBubble : styles.theirBubble}>
                            {m.contenido}
                        </div>
                    </div>
                ))}
            </div>

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

// IMPORTANTE: EXPORT DEFAULT
export default ChatSidebar;

const styles = {
    // Asegúrate de tener definidos aquí todos tus estilos (sidebar, header, chatBody, etc.)
    disabledBanner: {
        backgroundColor: '#fff3cd',
        color: '#856404',
        padding: '10px',
        textAlign: 'center',
        fontSize: '13px',
        borderRadius: '8px',
        marginBottom: '15px',
        border: '1px solid #ffeeba'
    },
    switchLabel: {
        display: 'flex',
        alignItems: 'center',
        marginTop: '5px',
        cursor: 'pointer'
    },
    // ... agrega el resto de tus estilos existentes aquí
};