import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Building2, MessageSquare, ArrowLeft, Lock, MoreVertical } from 'lucide-react'; 
import API from '../services/api'; 
import './Estilo-Chat-Vacantes.css';

export default function Mensajeria({ activeChat, onClose, usuario }) {
    const [conversaciones, setConversaciones] = useState([]);
    const [seleccionado, setSeleccionado] = useState(activeChat || null);
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMsg, setNuevoMsg] = useState("");
    const [isChatActivo, setIsChatActivo] = useState(true);
    const chatBodyRef = useRef(null);

    const fetchConversaciones = useCallback(async () => {
        if (!usuario?.id) return;
        try {
            const res = await API.get(`/mensajeria/mis-conversaciones/${usuario.id}`);
            setConversaciones(res.data);
            // Si no hay seleccionado pero hay conversaciones, seleccionamos la primera
            if (!seleccionado && res.data.length > 0) setSeleccionado(res.data[0]);
        } catch (err) { console.error(err); }
    }, [usuario?.id, seleccionado]);

    const cargarMensajes = useCallback(async () => {
        if (!usuario?.id || !seleccionado) return;
        try {
            const { data } = await API.get(`/mensajeria/historial/${usuario.id}/${seleccionado.empresaId}/${seleccionado.vacanteId}`);
            setMensajes(data.mensajes || []);
            setIsChatActivo(data.chatActivo !== undefined ? data.chatActivo : true);
        } catch (err) { console.error(err); }
    }, [usuario, seleccionado]);

    useEffect(() => { fetchConversaciones(); }, [fetchConversaciones]);

    useEffect(() => {
        if (seleccionado) {
            cargarMensajes();
            const interval = setInterval(() => cargarMensajes(), 4000);
            return () => clearInterval(interval);
        }
    }, [seleccionado, cargarMensajes]);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [mensajes]);

    const handleEnviar = async (e) => {
    e.preventDefault();
    if (!nuevoMsg.trim() || !isChatActivo || !seleccionado) return;

    // Log para depuración
    console.log("Datos del chat seleccionado:", seleccionado);

    try {
        const payload = {
            contenido: nuevoMsg.trim(),
            senderType: 'USUARIO',
            senderId: parseInt(usuario.id),
            // IMPORTANTE: Asegúrate de que este ID sea el que espera el backend
            receiverId: parseInt(seleccionado.empresaId), 
            vacanteId: parseInt(seleccionado.vacanteId)
        };

        console.log("Enviando este payload:", payload);

        const res = await API.post('/mensajeria/enviar', payload);
        setMensajes(prev => [...prev, res.data]);
        setNuevoMsg("");
    } catch (err) {
        // Esto nos dirá qué dice el servidor exactamente
        console.error("Error detallado del servidor:", err.response?.data);
        alert("Error: " + (err.response?.data?.error || "Fallo en el servidor"));
    }
};

    return (
        <div className="chat-container-main">
            {/* COLUMNA IZQUIERDA: LISTA DE CHATS */}
            <aside className="chat-sidebar">
                <div className="sidebar-header-chat">
                    <MessageSquare size={20} className="text-green-udec" />
                    <h3>Bandeja de Entrada</h3>
                </div>
                <div className="conversations-list">
                    {conversaciones.map((conv) => (
                        <div 
                            key={`${conv.vacanteId}-${conv.empresaId}`}
                            className={`conv-item ${seleccionado?.vacanteId === conv.vacanteId ? 'active' : ''}`}
                            onClick={() => setSeleccionado(conv)}
                        >
                            <div className="conv-icon">
                                <Building2 size={18} />
                            </div>
                            <div className="conv-info">
                                <div className="conv-info-top">
                                    <span className="conv-name">{conv.nombreEmpresa}</span>
                                </div>
                                <span className="conv-subject">{conv.tituloVacante}</span>
                                <p className="conv-last-msg">{conv.ultimoMensaje}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* COLUMNA DERECHA: VENTANA DE CHAT */}
            <main className="chat-window-main">
                {seleccionado ? (
                    <>
                        <header className="chat-header-top">
                            <div className="chat-header-user">
                                <div className="user-avatar-placeholder">
                                    {seleccionado.nombreEmpresa.charAt(0)}
                                </div>
                                <div className="user-status-info">
                                    <h4>{seleccionado.nombreEmpresa}</h4>
                                    <p>{seleccionado.tituloVacante}</p>
                                </div>
                            </div>
                            <div className="chat-header-actions">
                                <MoreVertical size={20} className="icon-btn" />
                            </div>
                        </header>

                        <div className="chat-messages-area" ref={chatBodyRef}>
                            {!isChatActivo && (
                                <div className="chat-locked-banner">
                                    <Lock size={14} /> Esta conversación ha finalizado
                                </div>
                            )}
                            <div className="messages-list-wrapper">
                                {mensajes.map((m) => (
                                    <div key={m.id} className={`msg-group ${m.senderType === 'USUARIO' ? 'own' : 'other'}`}>
                                        <div className="msg-bubble">
                                            <p>{m.contenido}</p>
                                            <span className="msg-time">
                                                {new Date(m.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <footer className="chat-input-area">
                            <form onSubmit={handleEnviar} className="input-form-wrapper">
                                <input 
                                    type="text"
                                    value={nuevoMsg}
                                    onChange={(e) => setNuevoMsg(e.target.value)}
                                    placeholder={isChatActivo ? "Escribe un mensaje..." : "Chat deshabilitado"}
                                    disabled={!isChatActivo}
                                />
                                <button type="submit" className="send-msg-btn" disabled={!isChatActivo || !nuevoMsg.trim()}>
                                    <Send size={18} />
                                </button>
                            </form>
                        </footer>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <MessageSquare size={64} />
                        <p>Selecciona una conversación para empezar</p>
                    </div>
                )}
            </main>
        </div>
    );
}