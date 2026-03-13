import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, MessageSquare, Lock } from 'lucide-react'; 
import API from '../services/api'; 
import './Estilo-Chat-Vacantes.css';

export default function Mensajeria({ empresaId, vacanteId, onClose, usuario }) {
    
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const [isChatActivo, setIsChatActivo] = useState(true); 
    
    // 1. Referencia al contenedor de mensajes (chat-body)
    const chatBodyRef = useRef(null);

    // --- CORRECCIÓN 1: Memoizar cargarMensajes ---
    const cargarMensajes = useCallback(async (isInitialLoad = false) => {
        if (!usuario?.id || !empresaId || !vacanteId) return;
        
        try {
            const { data } = await API.get(`/mensajeria/historial/${usuario.id}/${empresaId}/${vacanteId}`);
            
            const nuevosMensajes = data.mensajes || [];

            // Solo actualizar si hay mensajes nuevos para evitar re-renderizados innecesarios
            setMensajes(prev => {
                if (JSON.stringify(prev) === JSON.stringify(nuevosMensajes)) {
                    return prev;
                }
                return nuevosMensajes;
            });

            if (data.chatActivo !== undefined) {
                setIsChatActivo(data.chatActivo);
            }
        } catch (err) {
            // console.error("Error al cargar historial:", err);
        }
    }, [usuario, empresaId, vacanteId]);

    // 2. EFECTOS: Cargar historial
    useEffect(() => {
        cargarMensajes(true);
        const interval = setInterval(() => cargarMensajes(), 3000); 
        return () => clearInterval(interval);
    }, [cargarMensajes]); 

    // Marcar mensajes como leídos
    useEffect(() => {
        if (!usuario?.id || !empresaId) return;
        API.put(`/mensajeria/leer/${usuario.id}/${empresaId}`).catch(() => {});
    }, [empresaId, usuario?.id]);

    // --- CORRECCIÓN 2: Lógica de Scroll Inteligente ---
    useEffect(() => {
        const container = chatBodyRef.current;
        if (!container) return;

        // Comprobar si el usuario está cerca del fondo
        const isUserAtBottom = 
            container.scrollHeight - container.scrollTop <= container.clientHeight + 100;

        // Si el usuario estaba abajo, o si estamos cargando los mensajes por primera vez
        // (y no hay mensajes previos), entonces hacemos scroll al fondo.
        if (isUserAtBottom || mensajes.length === 0) {
            container.scrollTop = container.scrollHeight;
        }
        // Si no estaba abajo, no hacemos nada, así el usuario puede leer tranquilos.
        
    }, [mensajes]);

    // 3. ENVIAR MENSAJE
    const handleEnviar = async (e) => {
        e.preventDefault();
        
        if (!usuario || !usuario.id) return;
        if (!nuevoMensaje.trim() || !isChatActivo) return;

        try {
            await API.post('/mensajeria/enviar', {                
                senderId: usuario.id,
                receiverId: empresaId,
                contenido: nuevoMensaje,
                senderType: 'USUARIO',
                vacanteId: vacanteId
            });
            setNuevoMensaje("");
            cargarMensajes(); // Actualizar inmediatamente
        } catch (error) {
            // console.error("Error al enviar:", error);
        }
    };

    return (
        <div className="chat-window">
            <header className="chat-header">
                <div className="chat-header-info">
                    <MessageSquare size={20} className="text-olive" />
                    <div className="header-text-group">
                        <h2 className="chat-title">Conversación</h2>
                        <div className="status-indicator">
                            <span className={isChatActivo ? "online-dot" : "offline-dot"}></span>
                            <span className="status-text">{isChatActivo ? "Chat Abierto" : "Finalizado"}</span>
                        </div>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="close-button">
                        <X size={20} />
                    </button>
                )}
            </header>

            {/* --- CORRECCIÓN 3: Asignar la referencia aquí --- */}
            <div className="chat-body" ref={chatBodyRef}>
                {!isChatActivo && (
                    <div className="chat-disabled-alert">
                        <Lock size={16} />
                        <p>Esta conversación ha sido cerrada.</p>
                    </div>
                )}

                {mensajes.length === 0 ? (
                    <div className="empty-chat-placeholder">
                        <p>Aún no hay mensajes. ¡Inicia la conversación!</p>
                    </div>
                ) : (
                    mensajes.map((m) => (
                        <div 
                            key={m.id} 
                            className={`message-wrapper ${m.senderType === 'USUARIO' ? 'sent' : 'received'}`}
                        >
                            <div className={`message-bubble ${m.senderType === 'USUARIO' ? 'sent' : 'received'}`}>
                                <p className="message-content">{m.contenido}</p>
                                <span className="message-time">
                                    {m.fechaEnvio ? new Date(m.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                {/* --- SE ELIMINÓ EL DIV REF TEMPORAL --- */}
            </div>

            <form onSubmit={handleEnviar} className={`chat-footer ${!isChatActivo ? 'footer-disabled' : ''}`}>
                <input 
                    type="text"
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    placeholder={isChatActivo ? "Escribe un mensaje..." : "Chat deshabilitado"}
                    className="chat-input"
                    disabled={!isChatActivo}
                />
                <button 
                    type="submit" 
                    disabled={!nuevoMensaje.trim() || !isChatActivo || !usuario?.id} 
                    className={`send-button ${!isChatActivo ? 'btn-disabled' : ''}`}
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}