import { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, Lock } from 'lucide-react'; // Añadimos Lock para el icono de bloqueo
import API from '../services/api'; 
import './Estilo-Chat-Vacantes.css';

export default function Mensajeria({ empresaId, vacanteId, onClose }) {
    const [usuario] = useState(() => JSON.parse(localStorage.getItem('usuario')));
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    // NUEVO: Estado para saber si la empresa bloqueó el chat
    const [isChatActivo, setIsChatActivo] = useState(true); 
    const scrollRef = useRef();

    // 1. MARCAR COMO LEÍDOS (Igual)
    useEffect(() => {
        const marcarLeidos = async () => {
            if (!usuario?.id || !empresaId) return;
            try {
                await API.put(`/mensajeria/leer/${usuario.id}/${empresaId}`);
            } catch (err) {
                console.error("Error al marcar mensajes como leídos", err);
            }
        };
        marcarLeidos();
    }, [empresaId, usuario?.id]);

    // 2. CARGAR MENSAJES Y ESTADO
    const cargarMensajes = async () => {
        if (!usuario?.id || !empresaId || !vacanteId) return;
        try {
            const { data } = await API.get(`/mensajeria/historial/${usuario.id}/${empresaId}/${vacanteId}`);
            
            // CORRECCIÓN AQUÍ:
            // Usamos 'data' que es lo que extrajimos del await
            setMensajes(data.mensajes || []); 
            
            if (data.chatActivo !== undefined) {
                setIsChatActivo(data.chatActivo);
            }
        } catch (err) {
            console.error("Error al cargar historial:", err);
        }
    };

    useEffect(() => {
        cargarMensajes();
        const interval = setInterval(() => cargarMensajes(), 3000); 
        return () => clearInterval(interval);
    }, [empresaId, vacanteId, usuario?.id]); 

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes]);

    const handleEnviar = async (e) => {
        e.preventDefault();
        // Bloqueo preventivo en la función
        if (!nuevoMensaje.trim() || !isChatActivo) return;

        try {
            const payload = {
                contenido: nuevoMensaje.trim(),
                senderType: 'USUARIO',
                senderId: usuario.id,
                receiverId: parseInt(empresaId),
                vacanteId: parseInt(vacanteId)
            };
            
            await API.post('/mensajeria/enviar', payload);
            setNuevoMensaje(""); 
            cargarMensajes(); 
        } catch (err) {
            console.error("Error al enviar:", err);
            alert("No se pudo enviar el mensaje");
        }
    };

    return (
        <div className="chat-window">
            <header className="chat-header">
                <div className="chat-header-info">
                    <MessageSquare size={20} />
                    <div>
                        <h2 className="chat-title">Chat de la Vacante</h2>
                        <div className="status-indicator">
                            <span className={isChatActivo ? "online-dot" : "offline-dot"}></span>
                            <span>{isChatActivo ? "Activo ahora" : "Chat finalizado"}</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="close-button">
                    <X size={20} />
                </button>
            </header>

            <div className="chat-body">
                {/* MENSAJE DE ADVERTENCIA CUANDO ESTÁ DESACTIVADO */}
                {!isChatActivo && (
                    <div className="chat-disabled-alert">
                        <Lock size={16} />
                        <p>Conversación desactivada por parte de la empresa. No podrás enviar ni recibir mensajes.</p>
                    </div>
                )}

                {mensajes.length === 0 ? (
                    <div className="empty-chat">Inicia una conversación con la empresa.</div>
                ) : (
                    mensajes.map((m) => (
                        <div key={m.id} className={`message-wrapper ${m.senderType === 'USUARIO' ? 'sent' : 'received'}`}>
                            <div className={`message-bubble ${m.senderType === 'USUARIO' ? 'sent' : 'received'}`}>
                                <p>{m.contenido}</p>
                                <span className="message-time">
                                    {m.fechaEnvio ? new Date(m.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={scrollRef} />
            </div>

            {/* FOOTER BLOQUEADO SI NO ESTÁ ACTIVO */}
            <form onSubmit={handleEnviar} className={`chat-footer ${!isChatActivo ? 'footer-disabled' : ''}`}>
                <input 
                    type="text"
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    placeholder={isChatActivo ? "Escribe tu duda..." : "Chat deshabilitado"}
                    className="chat-input"
                    disabled={!isChatActivo} // Deshabilita el input
                />
                <button 
                    type="submit" 
                    disabled={!nuevoMensaje.trim() || !isChatActivo} // Deshabilita el botón
                    className="send-button"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
}