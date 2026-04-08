import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Briefcase, MessageSquareOff, MessageSquare, User } from 'lucide-react';
import API from "../services/api";
import "./ChatSidebar.css";

// 1. FUNCIÓN DE FORMATEO (Fuera del componente)
const formatSidebarDate = (dateStr) => {
    const date = new Date(dateStr);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    if (date.toDateString() === hoy.toDateString()) return "Hoy";
    if (date.toDateString() === ayer.toDateString()) return "Ayer";
    
    return date.toLocaleDateString('es-ES', { 
        day: 'numeric', month: 'long', year: 'numeric' 
    });
};

const ChatSidebar = ({ empresaId }) => {
    const [listaChats, setListaChats] = useState([]); 
    const [chatSeleccionado, setChatSeleccionado] = useState(null);
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isChatEnabled, setIsChatEnabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const scrollRef = useRef(null);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    // 1. CARGAR LISTA DE CHATS
// ASÍ DEBE QUEDAR TU PUNTO 1 (CARGAR LISTA DE CHATS):
useEffect(() => {
    const fetchMisChats = async () => {
        if (!empresaId) return;
        try {
            const res = await API.get(`/mensajeria/mis-chats/empresa/${empresaId}`);
            setListaChats(res.data); // Solo actualizamos la lista
        } catch (err) {
            console.error("Error al cargar chats:", err);
        }
    };

    fetchMisChats();
    const interval = setInterval(fetchMisChats, 5000);
    return () => clearInterval(interval);
}, [empresaId]); // Quitamos totalPendientesPrev de aquí también

    // 2. CARGAR HISTORIAL
    useEffect(() => {
        let interval;
        const fetchHistory = async () => {
            if (!chatSeleccionado || !empresaId) return;
            
            const postulanteId = chatSeleccionado.usuarioId || chatSeleccionado.usuario?.id;
            const vacanteId = chatSeleccionado.vacanteId;

            try {
                const res = await API.get(`/mensajeria/historial/${postulanteId}/${empresaId}/${vacanteId}`);
                
                // --- CAMBIO AQUÍ: Limpiar el globo de pendientes en la lista de la izquierda ---
                setListaChats(prev => prev.map(chat => 
                    (chat.usuarioId === chatSeleccionado.usuarioId && chat.vacanteId === chatSeleccionado.vacanteId)
                    ? { ...chat, pendientes: 0 } 
                    : chat
                ));
                // ----------------------------------------------------------------------------

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

        if (chatSeleccionado) {
            fetchHistory();
            interval = setInterval(fetchHistory, 3000);
        }
        return () => clearInterval(interval);
    }, [chatSeleccionado, empresaId]);

// --- SISTEMA DE SCROLL UNIFICADO (ESTILO WIDGET) ---

// 1. Resetear la llave cuando cambias de conversación
useEffect(() => {
    setIsFirstLoad(true);
    // Opcional: Limpiar mensajes viejos al cambiar para que no se vea el "salto"
    setMessages([]); 
}, [chatSeleccionado?.usuarioId, chatSeleccionado?.vacanteId]);

// 2. Control maestro del Scroll
useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
        const container = scrollRef.current;
        
        // Margen para detectar si el usuario está al final
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;

        if (isFirstLoad) {
            // SI ES LA PRIMERA CARGA DE ESTE CHAT:
            // Usamos un pequeño delay para asegurar que las burbujas ya existen en el DOM
            const timer = setTimeout(() => {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'auto' // Instantáneo
                });
                setIsFirstLoad(false); // Cerramos llave
            }, 50); // 50ms es suficiente para que el DOM procese los mensajes
            return () => clearTimeout(timer);
        } else if (isAtBottom) {
            // SI NO ES LA PRIMERA CARGA PERO ESTÁ ABAJO (MENSAJES NUEVOS):
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }
    }
}, [messages, isFirstLoad]);

useEffect(() => {
    // CADA VEZ que el ID de la empresa cambie (login/logout/switch)
    // reseteamos los estados para que no se filtren datos visuales
    setListaChats([]);
    setChatSeleccionado(null);
    setMessages([]);
    setSearchTerm("");
}, [empresaId]);

    // ACTIVAR/DESACTIVAR
    const toggleChatStatus = async () => {
        if (!chatSeleccionado) return;
        const nuevoEstado = !isChatEnabled;
        try {
            await API.put(`/mensajeria/status-chat`, {
                usuarioId: chatSeleccionado.usuarioId || chatSeleccionado.usuario?.id,
                vacanteId: parseInt(chatSeleccionado.vacanteId),
                activo: nuevoEstado
            });
            setIsChatEnabled(nuevoEstado);
        } catch (err) {
            console.error("Error al cambiar estado:", err);
        }
    };

    // ENVIAR MENSAJE
    const handleSend = async () => {
        if (!currentMessage.trim() || loading || !isChatEnabled) return;

        const payload = {
            contenido: currentMessage.trim(),
            senderType: 'EMPRESA',
            senderEmpresaId: parseInt(empresaId),
            receiverId: chatSeleccionado.usuarioId || chatSeleccionado.usuario?.id,
            vacanteId: parseInt(chatSeleccionado.vacanteId)
        };

        setLoading(true);
        try {
            const res = await API.post('/mensajeria/enviar', payload);
            setMessages(prev => [...prev, res.data]);
            setCurrentMessage('');
        } catch (err) {
            alert("Error al enviar el mensaje");
        } finally {
            setLoading(false);
        }
    };

    const chatsFiltrados = listaChats.filter(chat => 
        chat.usuario?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // DENTRO DE ChatSidebar.jsx
const seleccionarChat = async (chat) => {
    setChatSeleccionado(chat);
    
    // Si el chat tiene mensajes pendientes, avisamos al backend para que los marque como leídos
    if (chat.pendientes > 0) {
        try {
            await API.put(`/mensajeria/leer-mensajes`, {
                egresadoId: chat.usuarioId,
                empresaId: empresaId,
                vacanteId: chat.vacanteId
            });
            
            // Actualizamos la lista localmente para que el número desaparezca al instante
            setListaChats(prev => prev.map(c => 
                (c.usuarioId === chat.usuarioId && c.vacanteId === chat.vacanteId)
                ? { ...c, pendientes: 0 }
                : c
            ));
        } catch (err) {
            console.error("Error al marcar como leído:", err);
        }
    }
};

    return (
    <div className="mensajes-container fade-in">
        {/* BARRA IZQUIERDA: LISTA DE CHATS */}
        <aside className="chats-sidebar">
            <div className="chats-header">
    <h3>Conversaciones</h3> {/* "Mensajes" es muy simple, esto suena más pro */}
    <div className="search-chat">
        <Search size={20} className="search-icon" />
        <input 
            type="text" 
            placeholder="Buscar por nombre..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
    </div>
</div>
            <div className="chats-list">
    {chatsFiltrados.length > 0 ? (
        chatsFiltrados.map((chat) => (
            <div 
    key={`${chat.usuarioId}-${chat.vacanteId}`} 
    className={`chat-item ${chatSeleccionado?.usuarioId === chat.usuarioId && chatSeleccionado?.vacanteId === chat.vacanteId ? 'active' : ''}`}
    
    // CAMBIA ESTO:
    onClick={() => seleccionarChat(chat)} 
>
                {/* 1. AVATAR CIRCULAR */}
                <div className="chat-avatar">
                    {chat.usuario?.nombre?.charAt(0).toUpperCase()}
                </div>

                {/* 2. INFORMACIÓN DEL USUARIO Y VACANTE */}
                <div className="chat-info">
                    <span className="user-name">{chat.usuario?.nombre}</span>
                    <div className="vacante-tag">
                        <span>{chat.vacante?.titulo || "Vacante"}</span>
                    </div>
                </div>

                {/* 3. CONTADOR DE PENDIENTES (Badge) */}
                {/* Asegúrate de que tu backend devuelva la propiedad 'pendientes' o 'unreadCount' */}
                {chat.pendientes > 0 && (
                    <div className="chat-badge-count">
                        {chat.pendientes > 9 ? '9+' : chat.pendientes}
                    </div>
                )}
            </div>
        ))
    ) : (
        <div className="empty-state-sidebar">
    <div className="icon-container animate-vibe">
        <User size={32} />
    </div>
    <h4>Sin conversaciones</h4>
    <p>No se encontraron mensajes que coincidan con tu búsqueda.</p>
</div>
)}
</div>
        </aside>

        {/* PANEL DERECHO: VISTA DE CONVERSACIÓN */}
        <main className="chat-view">
            {chatSeleccionado ? (
                <>
                    <header className="chat-view-header">
    <div className="header-user">
        {/* Usamos la clase avatar-small que acabamos de blindar */}
        <div className="avatar-small">
            {chatSeleccionado.usuario?.nombre?.charAt(0).toUpperCase()}
        </div>
        <div>
            <h4>{chatSeleccionado.usuario?.nombre}</h4>
            <div className={isChatEnabled ? "status-online" : "status-offline"}>
                {isChatEnabled ? "Chat Activo" : "Chat Desactivado"}
            </div>
        </div>
    </div>

    {/* BOTÓN REFORMADO: Más grande y con texto */}
    <button 
        className={`u-sidebar-toggle-badge ${isChatEnabled ? 'enabled' : 'disabled'}`} 
        onClick={toggleChatStatus}
        title={isChatEnabled ? "Click para cerrar el chat" : "Click para habilitar el chat"}
    >
        {isChatEnabled ? (
            <>
                <MessageSquare size={16} />
                <span>Desactivar Chat</span>
            </>
        ) : (
            <>
                <MessageSquareOff size={16} />
                <span>Activar Chat</span>
            </>
        )}
    </button>
</header>

                    {/* CUERPO DE MENSAJES (ZONA CON SCROLL) */}
                    <div className="messages-body" ref={scrollRef}>
    {messages.map((m, index) => {
        const fechaActual = new Date(m.fechaEnvio).toDateString();
        const fechaAnterior = index > 0 
            ? new Date(messages[index - 1].fechaEnvio).toDateString() 
            : null;
        const mostrarSeparador = fechaActual !== fechaAnterior;

        // --- NUEVA LÓGICA DE AGRUPACIÓN ---
        const esMismoEmisor = index > 0 && messages[index - 1].senderType === m.senderType && !mostrarSeparador;
        // ----------------------------------

        return (
            <React.Fragment key={m.id}>
                {mostrarSeparador && (
                    <div className="u-sidebar-date-container">
                        <div className="u-sidebar-date-bubble">
                            {formatSidebarDate(m.fechaEnvio)}
                        </div>
                    </div>
                )}
                
                {/* Añadimos la clase condicional 'same-sender' */}
                <div className={`message-bubble ${m.senderType === 'EMPRESA' ? 'empresa' : 'estudiante'} ${esMismoEmisor ? 'same-sender' : ''}`}>
                    <div className="bubble-content">
                        <p style={{ margin: 0 }}>{m.contenido}</p>
                        <span className="msg-time">
                            {new Date(m.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            </React.Fragment>
        );
    })}
    
    {/* Banner de chat bloqueado (si existe) */}
    {!isChatEnabled && (
        <div className="u-sidebar-status-banner-floating">
            <MessageSquareOff size={16} style={{ marginRight: '8px' }} />
            El chat ha sido desactivado para esta vacante.
        </div>
    )}
</div>

                    {/* FOOTER: INPUT Y BOTÓN */}
                    <footer className="u-sidebar-footer-container"> 
                        <div className="chat-input-area-wrapper">
                            <input 
                                type="text" 
                                disabled={!isChatEnabled}
                                placeholder={isChatEnabled ? "Escribe un mensaje..." : "Chat deshabilitado por la empresa"}
                                value={currentMessage}
                                onChange={(e) => setCurrentMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button 
                                className="send-btn" 
                                onClick={handleSend} 
                                disabled={!isChatEnabled || loading || !currentMessage.trim()}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </footer>
                </>
            ) : (
                <div className="no-chat-selected">
        {/* Este contenedor es el que tiene la sombra y genera las olas */}
        <div className="icon-container">
            {/* El icono central que vibra */}
            <MessageSquare size={48} strokeWidth={1} />
        </div>
        <h3>Bandeja de Entrada</h3>
        <p>Selecciona un candidato para gestionar la comunicación.</p>
    </div>
)}
        </main>
    </div>
);
};

export default ChatSidebar;