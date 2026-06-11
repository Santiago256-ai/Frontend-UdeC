import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare, Lock, Search, MousePointer2 } from 'lucide-react'; 
import API from '../services/api'; 
import './Estilo-Chat-Vacantes.css';

export default function Mensajeria({ activeChat, usuario }) {
    const [conversaciones, setConversaciones] = useState([]);
    const [seleccionado, setSeleccionado] = useState(null); 
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMsg, setNuevoMsg] = useState("");
    const [isChatActivo, setIsChatActivo] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const chatBodyRef = useRef(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    
    // 🟢 NUEVO: Función para marcar los mensajes como leídos y quitar el punto rojo
    const marcarComoLeido = async (conv) => {
        if (!usuario?.id || !conv?.empresaId || !conv?.vacanteId) return;
        try {
            await API.put('/mensajeria/leer-mensajes-egresado', {
                egresadoId: parseInt(usuario.id),
                empresaId: parseInt(conv.empresaId),
                vacanteId: parseInt(conv.vacanteId)
            });
            
            // Actualizamos la lista local para que el punto rojo desaparezca al instante
            setConversaciones(prev => prev.map(c => 
                (c.vacanteId === conv.vacanteId && c.empresaId === conv.empresaId) 
                ? { ...c, leido: true } 
                : c
            ));
        } catch (error) {
            console.error("Error al marcar como leído:", error);
        }
    };

    // 1. Cargar conversaciones
    const fetchConversaciones = useCallback(async () => {
        if (!usuario?.id) return;
        try {
            const res = await API.get(`/mensajeria/mis-chats/egresado/${usuario.id}`);
            setConversaciones(res.data);
            
            // Auto-seleccionar si viene de una vacante específica (ej. desde el correo)
            if (activeChat && !seleccionado) {
                // Buscamos si el chat existe en la lista para pasarle todos los datos completos
                const chatCoincidente = res.data.find(c => c.vacanteId === activeChat.vacanteId);
                
                if (chatCoincidente) {
                    setSeleccionado(chatCoincidente);
                    // Si entramos directo desde el correo y hay pendientes, los marcamos como leídos
                    if (chatCoincidente.ultimoMsgSenderType === 'EMPRESA' && !chatCoincidente.leido) {
                        marcarComoLeido(chatCoincidente);
                    }
                } else {
                    // Si es un chat totalmente nuevo, usamos los datos básicos
                    setSeleccionado(activeChat);
                }
            }
        } catch (err) { 
            console.error("Error al cargar conversaciones:", err); 
        }
    }, [usuario?.id, seleccionado, activeChat]);

    // 2. Cargar historial
    const cargarMensajes = useCallback(async () => {
        if (!usuario?.id || !seleccionado?.empresaId || !seleccionado?.vacanteId) return; 
        try {
            const { data } = await API.get(`/mensajeria/historial/${usuario.id}/${seleccionado.empresaId}/${seleccionado.vacanteId}`);
            setMensajes(data.mensajes || []);
            setIsChatActivo(data.chatActivo);
        } catch (err) { 
            console.error("Error al cargar historial:", err); 
        }
    }, [usuario?.id, seleccionado]);

    useEffect(() => { fetchConversaciones(); }, [fetchConversaciones]);

    useEffect(() => {
        if (seleccionado) {
            cargarMensajes();
            const interval = setInterval(cargarMensajes, 4000);
            return () => clearInterval(interval);
        }
    }, [seleccionado, cargarMensajes]);

    useEffect(() => {
        setIsInitialLoad(true);
    }, [seleccionado]);

    useEffect(() => {
        if (chatBodyRef.current && mensajes.length > 0) {
            const container = chatBodyRef.current;
            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;

            if ((isInitialLoad || isAtBottom) && !activeChat?.resaltarMensajeId) {
                container.scrollTop = container.scrollHeight;
                setIsInitialLoad(false); 
            } else if (activeChat?.resaltarMensajeId) {
                setIsInitialLoad(false);
            }
        }
    }, [mensajes, isInitialLoad, activeChat?.resaltarMensajeId]);

    const handleEnviar = async (e) => {
        e.preventDefault();
        if (!nuevoMsg.trim() || !isChatActivo || !seleccionado?.empresaId) return;

        try {
            const payload = {
                contenido: nuevoMsg.trim(),
                senderType: 'USUARIO',
                senderEgresadoId: parseInt(usuario.id), 
                receiverId: parseInt(seleccionado.empresaId), 
                vacanteId: parseInt(seleccionado.vacanteId)
            };
            const res = await API.post('/mensajeria/enviar', payload);
            setMensajes(prev => [...prev, res.data]);
            setNuevoMsg("");
        } catch (err) {
            console.error("Error al enviar mensaje:", err.response?.data);
        }
    };

    const filtradas = conversaciones.filter(c => 
        c.nombreEmpresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tituloVacante?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatearFechaDivisor = (fechaStr) => {
        const fecha = new Date(fechaStr);
        const hoy = new Date();
        const ayer = new Date();
        ayer.setDate(hoy.getDate() - 1);

        if (fecha.toDateString() === hoy.toDateString()) return "Hoy";
        if (fecha.toDateString() === ayer.toDateString()) return "Ayer";
        
        return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // --- EFECTO DE RESALTADO PARA NOTIFICACIONES ---
    useEffect(() => {
        if (activeChat?.resaltarMensajeId && mensajes.length > 0) {
            let intentos = 0;
            const maxIntentos = 10; 

            const buscarYResaltar = () => {
                const idBuscado = `msg-${activeChat.resaltarMensajeId}`;
                const elemento = document.getElementById(idBuscado);

                if (elemento) {
                    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    elemento.classList.add('udec-msg-highlight');
                    
                    setTimeout(() => {
                        elemento.classList.remove('udec-msg-highlight');
                        activeChat.resaltarMensajeId = null; 
                    }, 4000);
                } else if (intentos < maxIntentos) {
                    intentos++;
                    setTimeout(buscarYResaltar, 500); 
                }
            };

            buscarYResaltar();
        }
    }, [activeChat?.resaltarMensajeId, mensajes]);

    return (
        <div className="udec-chat-main-wrapper fade-in">
            {/* --- LISTA DE CHATS --- */}
            <aside className="udec-chat-sidebar">
                <div className="udec-chat-sidebar-header">
                    <h3>Mensajes</h3>
                    <div className="udec-chat-search-container">
                        <Search size={18} color="#94a3b8" />
                        <input 
                            type="text" 
                            placeholder="Buscar empresa o vacante..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="udec-chat-list">
                    {filtradas.length > 0 ? (
                        filtradas.map((conv) => {
                            const tienePendientes = conv.ultimoMsgSenderType === 'EMPRESA' && conv.leido === false;

                            return (
                                <div 
                                    key={`${conv.vacanteId}-${conv.empresaId}`}
                                    className={`udec-chat-item ${seleccionado?.vacanteId === conv.vacanteId ? 'active' : ''} ${tienePendientes ? 'udec-pending' : ''}`}
                                    onClick={() => {
                                        setSeleccionado(conv);
                                        // Ahora esta función ya existe y quitará el punto rojo
                                        if (conv.ultimoMsgSenderType === 'EMPRESA' && !conv.leido) {
                                            marcarComoLeido(conv); 
                                        }
                                    }}
                                >
                                    <div className="udec-chat-avatar">
                                        {conv.nombreEmpresa?.charAt(0)}
                                        {tienePendientes && <span className="udec-unread-dot"></span>}
                                    </div>
                                    
                                    <div className="udec-chat-info-preview">
                                        <span>{conv.tituloVacante}</span>
                                        <strong>{conv.nombreEmpresa}</strong>
                                        <p className={`udec-chat-last-msg ${tienePendientes ? 'pending-text' : ''}`}>
                                            {conv.ultimoMensaje || "Sin mensajes aún"}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="no-results-chat">
                            <p>{searchTerm ? "Sin resultados" : "No tienes chats activos"}</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* --- PANEL DE CONVERSACIÓN --- */}
            <main className="udec-chat-window">
                {seleccionado ? (
                    <>
                        <header className="udec-chat-window-header">
                            <div className="udec-chat-header-info">
                                <div className="udec-chat-avatar" style={{width: '40px', height: '40px'}}>
                                    {seleccionado.nombreEmpresa?.charAt(0)}
                                </div>
                                <div>
                                    <h4 style={{margin: 0, fontSize: '1rem'}}>{seleccionado.nombreEmpresa}</h4>
                                    <small style={{color: '#64748b'}}>{seleccionado.tituloVacante}</small>
                                </div>
                            </div>
                            <div className={`udec-chat-status-indicator ${isChatActivo ? 'online' : 'locked'}`}>
                                {isChatActivo ? "● Chat Abierto" : <><Lock size={12}/> Finalizado</>}
                            </div>
                        </header>

                        <div className="udec-chat-messages-container" ref={chatBodyRef}>
                            {mensajes.map((m, index) => {
                                const fechaActual = new Date(m.fechaEnvio).toDateString();
                                const fechaAnterior = index > 0 ? new Date(mensajes[index - 1].fechaEnvio).toDateString() : null;
                                const mostrarDivisor = fechaActual !== fechaAnterior;

                                return (
                                    <div key={m.id} style={{ display: 'contents' }}>
                                        {mostrarDivisor && (
                                            <div className="udec-chat-date-divider">
                                                <span>{formatearFechaDivisor(m.fechaEnvio)}</span>
                                            </div>
                                        )}
                                        
                                        <div 
                                            id={`msg-${m.id}`} 
                                            className={`udec-msg-wrapper ${m.senderType === 'USUARIO' ? 'own' : 'other'}`}
                                        >
                                            <div className="udec-msg-bubble">
                                                {m.contenido}
                                            </div>
                                            <span className="udec-msg-time">
                                                {new Date(m.fechaEnvio).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <footer className="udec-chat-footer">
                            <form onSubmit={handleEnviar} className="udec-chat-input-form">
                                <input 
                                    type="text"
                                    value={nuevoMsg}
                                    onChange={(e) => setNuevoMsg(e.target.value)}
                                    placeholder={isChatActivo ? "Escribe un mensaje..." : "Este chat ha sido cerrado por la empresa."}
                                    disabled={!isChatActivo}
                                />
                                <button type="submit" className="udec-send-btn" disabled={!isChatActivo || !nuevoMsg.trim()}>
                                    <Send size={20} />
                                </button>
                            </form>
                        </footer>
                    </>
                ) : (
                    <div className="udec-no-selection-state">
                        <div style={{ background: '#f1f5f9', padding: '30px', borderRadius: '50%' }}>
                            <MousePointer2 size={48} color="#cbd5e1" />
                        </div>
                        <h3>Bandeja de Entrada</h3>
                        <p>Selecciona una conversación de la lista <br/> para ver los detalles y mensajes.</p>
                    </div>
                )}
            </main>
        </div>
    );
}