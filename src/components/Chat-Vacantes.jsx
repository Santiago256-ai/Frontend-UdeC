import { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';
import API from '../services/api'; 
import './Estilo-Chat-Vacantes.css'; // Asegúrate de que el nombre coincida

export default function Mensajeria({ empresaId, vacanteId, onClose }) {
    const [usuario] = useState(() => JSON.parse(localStorage.getItem('usuario')));
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const scrollRef = useRef();

    // 1. MARCAR COMO LEÍDOS
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

    // 2. FUNCIÓN PARA CARGAR MENSAJES
    const cargarMensajes = async () => {
        if (!usuario?.id || !empresaId || !vacanteId) return;
        try {
            const { data } = await API.get(`/mensajeria/historial/${usuario.id}/${empresaId}/${vacanteId}`);
            setMensajes(data || []);
        } catch (err) {
            console.error("Error al cargar historial:", err);
        }
    };

    // 3. EFECTO PARA TIEMPO REAL
    useEffect(() => {
        cargarMensajes();
        const interval = setInterval(() => cargarMensajes(), 3000); 
        return () => clearInterval(interval);
    }, [empresaId, vacanteId, usuario?.id]); 

    // 4. AUTO-SCROLL
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes]);

    // 5. ENVIAR MENSAJE
    const handleEnviar = async (e) => {
        e.preventDefault();
        if (!nuevoMensaje.trim()) return;

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
            {/* Header */}
            <header className="chat-header">
                <div className="chat-header-info">
                    <MessageSquare size={20} />
                    <div>
                        <h2 className="chat-title">Chat de la Vacante</h2>
                        <div className="status-indicator">
                            <span className="online-dot"></span>
                            <span>Activo ahora</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="close-button">
                    <X size={20} />
                </button>
            </header>

            {/* Cuerpo del Chat */}
            <div className="chat-body">
                {mensajes.length === 0 ? (
                    <div className="empty-chat">
                        Inicia una conversación con la empresa.
                    </div>
                ) : (
                    mensajes.map((m) => (
                        <div 
                            key={m.id} 
                            className={`message-wrapper ${m.senderType === 'USUARIO' ? 'sent' : 'received'}`}
                        >
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

            {/* Footer / Input */}
            <form onSubmit={handleEnviar} className="chat-footer">
                <input 
                    type="text"
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    placeholder="Escribe tu duda..."
                    className="chat-input"
                />
                <button 
                    type="submit" 
                    disabled={!nuevoMensaje.trim()}
                    className="send-button"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
}