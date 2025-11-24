import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom"; 
import API from "../services/api"; // ⚡ Usar la URL configurada de Railway
import "./EmpresaDashboard.css"; // Asegúrate de que este CSS exista

// =========================================================
// ⚡ COMPONENTE CHAT LATERAL (Sidebar) con Lógica de Envío
// =========================================================

const ChatSidebar = ({ empresaId, postulante, onClose }) => {
    // 1. Estado para el input del mensaje
    const [currentMessage, setCurrentMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    // Extraer solo el primer nombre para un saludo más corto
    const nombrePostulante = postulante.usuario?.nombres?.split(' ')[0] || 'Candidato';
    const postulanteId = postulante.usuario?.id;
    
    const handleSendMessage = async () => {
        if (!currentMessage.trim() || isSending) return;

        setIsSending(true);
        
        // Datos que se enviarán a tu API de Railway
        const messageData = {
            senderId: empresaId,       // ID de la empresa (Tú)
            receiverId: postulanteId,  // ID del estudiante/egresado
            content: currentMessage.trim(),
        };

        try {
            // 🚀 LLAMADA A LA API PARA ENVIAR EL MENSAJE
            // Debes implementar un endpoint en Railway que gestione esto:
            // 1. Guardar el mensaje. 
            // 2. Crear una notificación para el receiverId.
            await API.post(`/mensajes/empresa`, messageData);

            alert(`Mensaje enviado a ${nombrePostulante}. Recuerda: el backend DEBE registrarlo y crear la notificación.`);
            setCurrentMessage(''); // Limpiar el input

        } catch (error) {
            console.error('Error al enviar mensaje:', error.response?.data || error);
            alert(`Fallo al enviar el mensaje: ${error.response?.data?.error || 'Error de conexión.'}`);
        } finally {
            setIsSending(false);
        }
    };

    if (!postulante) return null;

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: '350px',
                height: '100%',
                backgroundColor: 'white',
                boxShadow: '-4px 0 10px rgba(0,0,0,0.2)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease-in-out',
            }}
        >
            {/* Header del Chat */}
            <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e0f7ff' }}>
                <h4 style={{ margin: 0, color: '#333', fontSize: '1.1em', fontWeight: 'bold' }}>💬 Chat con {nombrePostulante}</h4>
                <button 
                    onClick={onClose} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.8em', color: '#555', lineHeight: 1 }}
                >
                    &times;
                </button>
            </div>

            {/* Historial de Mensajes (Placeholder) */}
            <div style={{ flexGrow: 1, padding: '15px', overflowY: 'auto', backgroundColor: '#f9f9f9' }}>
                <p style={{ color: '#888', textAlign: 'center', marginTop: '50px', fontSize: '0.9em' }}>
                    *Aquí se cargaría el historial de chat con la API.
                </p>
                {/* Simulación de un mensaje reciente de la Empresa */}
                {currentMessage.trim() && (
                    <div style={{ textAlign: 'right', marginBottom: '10px' }}>
                        <span style={{ backgroundColor: '#007bff', color: 'white', padding: '8px 12px', borderRadius: '15px 15px 0 15px', maxWidth: '80%', display: 'inline-block', fontSize: '0.9em' }}>
                            {currentMessage}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.7em', color: '#aaa', marginTop: '2px' }}>{new Date().toLocaleTimeString()} (Preview)</span>
                    </div>
                )}
            </div>

            {/* Input para Enviar Mensaje */}
            <div style={{ padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
                <input 
                    type="text" 
                    placeholder="Escribe un mensaje..." 
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                    }}
                    style={{ flexGrow: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '0.9em' }}
                    disabled={isSending}
                />
                <button 
                    className="secondary-button" 
                    onClick={handleSendMessage}
                    style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: '1px solid #28a745' }}
                    disabled={!currentMessage.trim() || isSending}
                >
                    {isSending ? 'Enviando...' : 'Enviar'}
                </button>
            </div>
        </div>
    );
};

// =========================================================
// COMPONENTE PRINCIPAL: EmpresaDashboard
// =========================================================

export default function EmpresaDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // --- Estados de la Aplicación ---
    const [empresa, setEmpresa] = useState(() => {
        const storedUser = localStorage.getItem('usuario');
        const initialUser = location.state?.usuario || (storedUser ? JSON.parse(storedUser) : null);
        if (initialUser && initialUser.rol === 'empresa') {
          localStorage.setItem('usuario', JSON.stringify(initialUser));
          return initialUser;
        }
        return null;
    });

    const [activeTab, setActiveTab] = useState("gestion");
    const [vacantes, setVacantes] = useState([]);
    const [postulaciones, setPostulaciones] = useState([]);
    const [vacanteSeleccionadaId, setVacanteSeleccionadaId] = useState(null); 
    const [filtroEstado, setFiltroEstado] = useState("TODOS"); 
    const [loading, setLoading] = useState(true);
    
    // ⚡ ESTADOS PARA EL CHAT ⚡
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatPostulante, setChatPostulante] = useState(null); // Postulante con el que chateamos
    
    const [nuevaVacante, setNuevaVacante] = useState({
      titulo: "",
      descripcion: "",
      ubicacion: "",
      tipo: "",
      modalidad: "",
      salario: "",
    });

    // 🔹 Redirección si la sesión no es válida
    useEffect(() => {
        if (!empresa) {
            localStorage.removeItem('usuario');
            navigate('/'); 
        } else {
            setLoading(false);
        }
    }, [empresa, navigate]);

    // --- Funciones de Data ---
    const cargarVacantes = useCallback(() => {
      if (empresa?.id) {
        API.get(`/vacantes/empresa/${empresa.id}`)
          .then((res) => setVacantes(res.data))
          .catch((err) => console.error("Error al cargar vacantes:", err));
      }
    }, [empresa]); 

    useEffect(() => {
      if (empresa) cargarVacantes();
    }, [empresa, cargarVacantes]); 

    // 🌟 Manejar envío de nueva vacante
    const handleSubmit = async (e) => {
        e.preventDefault(); 
        if (!empresa?.id) {
            alert("Error: ID de empresa no encontrado. Reinicia la sesión.");
            return;
        }

        try {
            const vacanteData = { ...nuevaVacante, empresaId: empresa.id };
            const res = await API.post(`/vacantes`, vacanteData);

            alert(`Vacante "${res.data.titulo}" publicada con éxito.`);
            setNuevaVacante({ titulo: "", descripcion: "", ubicacion: "", tipo: "", modalidad: "", salario: "" });
            cargarVacantes();
            setActiveTab("gestion");

        } catch (err) {
            console.error("Error al publicar la vacante:", err.response?.data?.error || err);
            alert(`Error al publicar la vacante: ${err.response?.data?.error || "Error de conexión o validación."}`);
        }
    };

    // 🌟 Manejar eliminación de vacante
    const handleEliminarVacante = async (vacanteId, titulo) => {
        if (!window.confirm(`¿Eliminar la vacante: "${titulo}"?`)) return;

        try {
            await API.delete(`/vacantes/${vacanteId}`);
            alert(`Vacante "${titulo}" eliminada con éxito.`);
            cargarVacantes();
            if (vacanteSeleccionadaId === vacanteId) {
                setVacanteSeleccionadaId(null);
                setPostulaciones([]);
            }

        } catch (err) {
            console.error("Error al eliminar la vacante:", err);
            alert(`Fallo al eliminar la vacante: ${err.response?.data?.error || "Error desconocido."}`);
        }
    };
    
    // Cargar postulaciones de una vacante
    const handleVerPostulaciones = async (vacanteId) => {
        setVacanteSeleccionadaId(vacanteId);
        setFiltroEstado("TODOS");
        // Asegúrate de cerrar el chat al cambiar de vacante
        setIsChatOpen(false); 
        setChatPostulante(null);
        
        try {
            const res = await API.get(`/postulaciones/vacante/${vacanteId}`);
            setPostulaciones(res.data);
        } catch (err) {
            console.error(err);
            setPostulaciones([]);
            alert("Error al cargar postulaciones o no hay ninguna.");
        }
    };

    // Actualizar estado de postulaciones
    const handleUpdateEstado = async (postulacionId, nuevoEstado) => {
        const tituloVacante = vacantes.find(v => v.id === vacanteSeleccionadaId)?.titulo || 'esta vacante';
        const postulacion = postulaciones.find(p => p.id === postulacionId);
        const nombreCandidato = `${postulacion?.usuario?.nombres} ${postulacion?.usuario?.apellidos}`.trim() || 'el candidato';
        
        if (!window.confirm(`Cambiar estado de ${nombreCandidato} para "${tituloVacante}" a: ${nuevoEstado}?`)) return;
        
        try {
            await API.patch(`/postulaciones/${postulacionId}/estado`, { estado: nuevoEstado.toUpperCase() });
            setPostulaciones(prev => prev.map(p => p.id === postulacionId ? { ...p, estado: nuevoEstado.toUpperCase() } : p));
            alert(`Estado actualizado a: ${nuevoEstado.toUpperCase()}`);
        } catch (err) {
            console.error("Error al actualizar estado:", err);
            alert(`Fallo al actualizar el estado: ${err.response?.data?.error || "Error desconocido."}`);
        }
    };
    
    // 🌟 Función para abrir el chat
    const handleOpenChat = (postulacion) => {
        setChatPostulante(postulacion);
        setIsChatOpen(true);
    };

    // Filtrar postulaciones
    const postulacionesFiltradas = postulaciones.filter(p => {
        const estado = p.estado?.toUpperCase() || "PENDIENTE"; 
        return filtroEstado === "TODOS" || estado === filtroEstado;
    });

    const getStatusTag = (estado) => {
        const status = estado?.toUpperCase() || 'PENDIENTE';
        let specificClass = '';
        switch (status) {
            case 'ACEPTADA': specificClass = 'status-aceptada'; break;
            case 'RECHAZADA': specificClass = 'status-rechazada'; break;
            case 'REVISADO': specificClass = 'status-revisado'; break;
            default: specificClass = 'status-pendiente'; break;
        }
        return <span className={`status-tag ${specificClass}`}>{status}</span>;
    };

    if (loading) return <div className="dashboard-layout"><h1>Cargando panel de empresa...</h1></div>;
    if (!empresa) return null;

    const vacanteActual = vacantes.find(v => v.id === vacanteSeleccionadaId);

    // Ajustamos el estilo principal para desplazar el contenido cuando el chat está abierto
    const mainContentStyle = isChatOpen 
        ? { marginRight: '350px', transition: 'margin-right 0.3s ease-in-out' }
        : { marginRight: '0', transition: 'margin-right 0.3s ease-in-out' };

    return (
        <div className="dashboard-layout" style={mainContentStyle}>
            <header className="dashboard-header">
                <span className="logo-placeholder">💼</span>
                <div className="welcome-info">
                    <h2>Panel de Control Empresarial</h2>
                    <h3>Bienvenida, {empresa?.nombre || empresa?.razonSocial || "Empresa"}</h3>
                    <button className="logout-button" onClick={() => {
                        localStorage.removeItem('usuario');
                        navigate('/');
                    }}>Cerrar Sesión</button>
                </div>
            </header>

            <hr className="divider" />

            <nav className="dashboard-tabs">
                <button 
                    className={activeTab === "gestion" ? "active" : ""} 
                    onClick={() => {
                        setActiveTab("gestion"); 
                        setVacanteSeleccionadaId(null); 
                        setPostulaciones([]); 
                        setFiltroEstado("TODOS");
                        setIsChatOpen(false); // Cierra el chat al cambiar de pestaña
                        setChatPostulante(null);
                    }}
                >
                    📝 Gestión de Vacantes ({vacantes.length})
                </button>
                <button 
                    className={activeTab === "creacion" ? "active" : ""} 
                    onClick={() => {
                        setActiveTab("creacion");
                        setIsChatOpen(false); // Cierra el chat al cambiar de pestaña
                        setChatPostulante(null);
                    }}
                >
                    ✨ Publicar Nueva Vacante
                </button>
            </nav>

            <main className="dashboard-content">
                {activeTab === "creacion" && (
                    <section className="dashboard-card form-card">
                        <h3>Formulario de Publicación</h3>
                        <form onSubmit={handleSubmit} className="form-grid">
                            <div className="form-group">
                                <label>Título de la Vacante *</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Desarrollador Full-Stack"
                                    value={nuevaVacante.titulo}
                                    onChange={(e) => setNuevaVacante({ ...nuevaVacante, titulo: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>Descripción del Puesto *</label>
                                <textarea
                                    placeholder="Detalla las responsabilidades, requisitos y beneficios..."
                                    value={nuevaVacante.descripcion}
                                    onChange={(e) => setNuevaVacante({ ...nuevaVacante, descripcion: e.target.value })}
                                    rows="4"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Ubicación *</label>
                                <input
                                    type="text"
                                    placeholder="Ciudad, País"
                                    value={nuevaVacante.ubicacion}
                                    onChange={(e) => setNuevaVacante({ ...nuevaVacante, ubicacion: e.target.value })}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Tipo de Contrato *</label>
                                <select
                                    value={nuevaVacante.tipo}
                                    onChange={(e) => setNuevaVacante({ ...nuevaVacante, tipo: e.target.value })}
                                    required
                                >
                                    <option value="">Selecciona el tipo</option>
                                    <option value="Tiempo completo">Tiempo completo</option>
                                    <option value="Medio tiempo">Medio tiempo</option>
                                    <option value="Prácticas">Prácticas</option>
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Modalidad *</label>
                                <select
                                    value={nuevaVacante.modalidad}
                                    onChange={(e) => setNuevaVacante({ ...nuevaVacante, modalidad: e.target.value })}
                                    required
                                >
                                    <option value="">Selecciona la modalidad</option>
                                    <option value="Presencial">Presencial</option>
                                    <option value="Remoto">Remoto</option>
                                    <option value="Hibrido">Híbrido</option>
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Salario (Opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Ej: $1200 USD/mes"
                                    value={nuevaVacante.salario}
                                    onChange={(e) => setNuevaVacante({ ...nuevaVacante, salario: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="primary-button full-width">
                                Publicar Vacante Ahora
                            </button>
                        </form>
                    </section>
                )}

                {activeTab === "gestion" && (
                    <section className="dashboard-card management-view">
                        <h3>Listado de Vacantes Activas</h3>
                        {vacantes.length === 0 ? (
                            <p className="empty-state">Aún no has publicado ninguna vacante. ¡Comienza en la pestaña "Publicar Nueva Vacante"!</p>
                        ) : (
                            <div className="vacantes-list-grid">
                                {vacantes.map((v) => (
                                    <div key={v.id} className={`vacante-item ${vacanteSeleccionadaId === v.id ? 'selected' : ''}`}>
                                        <h4>{v.titulo}</h4>
                                        <p className="vacante-meta">
                                            📍 {v.ubicacion} | 💻 {v.modalidad} | 💰 {v.salario || 'A Convenir'}
                                        </p>
                                        <div className="vacante-actions">
                                            <button className="secondary-button" onClick={() => handleVerPostulaciones(v.id)}>Ver Postulaciones</button>
                                            <button className="delete-button" onClick={() => handleEliminarVacante(v.id, v.titulo)}>Eliminar</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {vacanteSeleccionadaId && (
                            <div className="postulaciones-detail">
                                <h4>Candidatos para: {vacanteActual?.titulo || 'Vacante'}</h4>
                                
                                <div className="filter-controls">
                                    <label htmlFor="estado-filter">Filtrar por Estado:</label>
                                    <select id="estado-filter" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                                        <option value="TODOS">Todos ({postulaciones.length})</option>
                                        <option value="PENDIENTE">Pendiente</option>
                                        <option value="REVISADO">Revisado</option>
                                        <option value="ACEPTADA">Aceptada</option> 
                                        <option value="RECHAZADA">Rechazada</option>
                                    </select>
                                </div>

                                {postulaciones.length > 0 ? (
                                    postulacionesFiltradas.length > 0 ? (
                                        <ul className="postulaciones-list">
                                            {postulacionesFiltradas.map((p) => (
                                            <li key={p.id} className="postulacion-item">
                                                <div className="candidate-info">
                                                    <span className="candidate-name">
                                                        {`${p.usuario?.nombres} ${p.usuario?.apellidos}`.trim() || 'Estudiante Sin Nombre'}
                                                    </span>
                                                    {getStatusTag(p.estado)}
                                                    <span className="candidate-contact">📧 {p.usuario?.correo || 'Sin correo'}</span>
                                                    <span className="candidate-contact">📞 {p.telefono || 'Sin teléfono'}</span>
                                                </div>

                                                <div className="action-links">
                                                    <a href={p.cv_url || '#'} target="_blank" rel="noopener noreferrer" className="cv-link">📥 Ver CV</a>
                                                    
                                                    {/* ⚡ BOTÓN DE CHAT */}
                                                    <button 
                                                        className="action-button" 
                                                        onClick={() => handleOpenChat(p)}
                                                        style={{ backgroundColor: '#28a745', borderColor: '#28a745', color: 'white', fontWeight: 'bold' }}
                                                    >
                                                        💬 Enviar Mensaje
                                                    </button>

                                                    <button className="action-button accept-button" onClick={() => handleUpdateEstado(p.id, 'ACEPTADA')} disabled={p.estado?.toUpperCase() === 'ACEPTADA'}>✅ Aceptar</button>
                                                    <button className="action-button reject-button" onClick={() => handleUpdateEstado(p.id, 'RECHAZADA')} disabled={p.estado?.toUpperCase() === 'RECHAZADA'}>❌ Rechazar</button>
                                                </div>
                                            </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="empty-state">No hay postulaciones con el estado "{filtroEstado}".</p>
                                    )
                                ) : (
                                    <p className="empty-state">Aún no hay postulaciones para esta vacante.</p>
                                )}
                            </div>
                        )}
                    </section>
                )}
            </main>
            
            {/* ⚡ INTEGRACIÓN DEL CHAT LATERAL */}
            {isChatOpen && (
                <ChatSidebar 
                    empresaId={empresa.id} // ID de la empresa para saber quién envía
                    postulante={chatPostulante} 
                    onClose={() => setIsChatOpen(false)}
                />
            )}

        </div>
    );
}