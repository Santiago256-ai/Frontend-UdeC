import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare, Lock, Search, MousePointer2 } from 'lucide-react'; 
import API from '../services/api'; 
import './Estilo-Chat-Vacantes.css';

export default function Mensajeria({ activeChat, usuario }) {
    const [conversaciones, setConversaciones] = useState([]);
    const [seleccionado, setSeleccionado] = useState(null); // Empezamos en null
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMsg, setNuevoMsg] = useState("");
    const [isChatActivo, setIsChatActivo] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const chatBodyRef = useRef(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    

    // 1. Cargar conversaciones
    const fetchConversaciones = useCallback(async () => {
        if (!usuario?.id) return;
        try {
            const res = await API.get(`/mensajeria/mis-chats/egresado/${usuario.id}`);
            setConversaciones(res.data);
            
            // Solo auto-seleccionar si viene de una vacante específica (activeChat)
            if (activeChat && !seleccionado) {
                setSeleccionado(activeChat);
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
        
        // Calculamos si el usuario está "casi al final" (margen de 100px)
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;

        // Bajamos el scroll solo si es la primera carga del chat O si el usuario ya estaba abajo
        if (isInitialLoad || isAtBottom) {
            container.scrollTop = container.scrollHeight;
            setIsInitialLoad(false); 
        }
    }
}, [mensajes, isInitialLoad]);

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
    
    return fecha.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
};

// --- NUEVO: EFECTO DE RESALTADO PARA NOTIFICACIONES ---
useEffect(() => {
    // Si activeChat trae un ID de mensaje y ya hay mensajes cargados
    if (activeChat?.resaltarMensajeId && mensajes.length > 0) {
        let intentos = 0;
        const maxIntentos = 10; // Reintentar durante 5 segundos

        const buscarYResaltar = () => {
            const idBuscado = `msg-${activeChat.resaltarMensajeId}`;
            const elemento = document.getElementById(idBuscado);

            if (elemento) {
                // 1. Llevar la vista al mensaje
                elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // 2. Aplicar la clase de animación
                elemento.classList.add('udec-msg-highlight');
                
                // 3. Limpiar después de unos segundos
                setTimeout(() => {
                    elemento.classList.remove('udec-msg-highlight');
                    activeChat.resaltarMensajeId = null; // Evitar que se repita innecesariamente
                }, 4000);
            } else if (intentos < maxIntentos) {
                intentos++;
                setTimeout(buscarYResaltar, 500); // Reintentar si el DOM no está listo
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
      // 1. DEFINIMOS LA LÓGICA DE PENDIENTES
      // Usamos los nombres exactos que vienen del Backend: ultimoMsgSenderType y leido
      const tienePendientes = conv.ultimoMsgSenderType === 'EMPRESA' && conv.leido === false;

      return (
        <div 
          key={`${conv.vacanteId}-${conv.empresaId}`}
          // 2. APLICAMOS LA CLASE udec-pending SI TIENE PENDIENTES
          className={`udec-chat-item ${seleccionado?.vacanteId === conv.vacanteId ? 'active' : ''} ${tienePendientes ? 'udec-pending' : ''}`}
          onClick={() => {
            setSeleccionado(conv);
            if (conv.ultimoMsgSenderType === 'EMPRESA' && !conv.leido) {
            marcarComoLeido(conv); // <--- Llamamos a la función aquí
        }
          }}
        >
          <div className="udec-chat-avatar">
            {conv.nombreEmpresa?.charAt(0)}
            {/* 3. MOSTRAMOS EL PUNTO ROJO SI HAY PENDIENTES */}
            {tienePendientes && <span className="udec-unread-dot"></span>}
          </div>
          
          <div className="udec-chat-info-preview">
            <span>{conv.tituloVacante}</span>
            <strong>{conv.nombreEmpresa}</strong>
            {/* 4. PONEMOS EL TEXTO EN NEGRITA SI ES PENDIENTE */}
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
                            
                            {/* AQUÍ ESTÁ EL CAMBIO: Agregamos id={`msg-${m.id}`} */}
                            <div 
                                id={`msg-${m.id}`} 
                                className={`udec-msg-wrapper ${m.senderType === 'USUARIO' ? 'own' : 'other'}`}
                            >
                                <div className="udec-msg-bubble">
                                    {m.contenido}
                                </div>
                                <span className="udec-msg-time">
                                    {new Date(m.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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