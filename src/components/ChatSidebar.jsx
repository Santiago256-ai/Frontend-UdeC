import React, { useState, useEffect, useRef } from 'react';
import API from "../services/api"; 

const ChatSidebar = ({ empresaId, postulante, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    const postulanteId = postulante?.usuario?.id;
    const nombrePostulante = postulante?.usuario?.nombres || 'Candidato';

    // 1. Cargar historial al montar el componente
    useEffect(() => {
        const fetchHistory = async () => {
            if (!postulanteId) return;
            try {
                const res = await API.get(`/mensajeria/historial/${postulanteId}/${empresaId}`);
                setMessages(res.data);
            } catch (err) {
                console.error("Error al cargar historial:", err);
            }
        };
        fetchHistory();
    }, [postulanteId, empresaId]);

    // 2. Auto-scroll al final cuando llegan mensajes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // 3. Función para enviar mensaje
    const handleSend = async () => {
        if (!currentMessage.trim() || loading) return;

        setLoading(true);
        const payload = {
            senderId: empresaId,
            senderType: 'EMPRESA',
            receiverId: postulanteId,
            contenido: currentMessage.trim()
        };

        try {
            const res = await API.post('/mensajeria/enviar', payload);
            setMessages([...messages, res.data]); // Actualizar lista visual
            setCurrentMessage(''); // Limpiar input
        } catch (err) {
            alert("Error al enviar el mensaje");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-sidebar-container" style={styles.sidebar}>
            {/* Header */}
            <div style={styles.header}>
                <h4 style={{ margin: 0 }}>💬 Chat con {nombrePostulante}</h4>
                <button onClick={onClose} style={styles.closeBtn}>&times;</button>
            </div>

            {/* Cuerpo del Chat */}
            <div ref={scrollRef} style={styles.chatBody}>
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

            {/* Input Footer */}
            <div style={styles.footer}>
                <input 
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escribe un mensaje..."
                    style={styles.input}
                />
                <button 
                    onClick={handleSend} 
                    disabled={loading}
                    style={{...styles.sendBtn, opacity: loading ? 0.6 : 1}}
                >
                    {loading ? '...' : 'Enviar'}
                </button>
            </div>
        </div>
    );
};

// Estilos en JS para no depender de archivos externos (puedes pasarlos a CSS)
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
    chatBody: { flex: 1, padding: '15px', overflowY: 'auto', backgroundColor: '#f4f7f6', display: 'flex', flexDirection: 'column' },
    emptyText: { textAlign: 'center', color: '#888', marginTop: '20px', fontSize: '14px' },
    msgEmpresa: { alignSelf: 'flex-end', marginBottom: '12px', textAlign: 'right', maxWidth: '85%' },
    msgUsuario: { alignSelf: 'flex-start', marginBottom: '12px', textAlign: 'left', maxWidth: '85%' },
    bubbleEmpresa: { backgroundColor: '#28a745', color: 'white', padding: '10px', borderRadius: '15px 15px 0 15px', fontSize: '14px' },
    bubbleUsuario: { backgroundColor: '#fff', color: '#333', padding: '10px', borderRadius: '15px 15px 15px 0', fontSize: '14px', border: '1px solid #ddd' },
    time: { fontSize: '10px', color: '#999', marginTop: '4px', display: 'block' },
    footer: { padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '8px' },
    input: { flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ddd', outline: 'none' },
    sendBtn: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer' }
};

export default ChatSidebar;