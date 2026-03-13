import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api'; 
import { 
    LogOut, 
    MessageSquare, 
    Briefcase, 
    Building2, 
    PlusCircle, 
    Search, 
    Calendar, 
    Users
} from 'lucide-react';
import Mensajeria from '../components/Chat-Vacantes';
import CrearCV from '../pages/CrearCV'; 
import './VacantesDashboard.css'; 
import ConfirmacionLogout from '../components/ConfirmacionLogout';

export default function VacantesDashboard() {
    const location = useLocation();
    const navigate = useNavigate();

    // 1. ESTADOS
    const [usuario, setUsuario] = useState(() => {
        const storedUser = localStorage.getItem('usuario');
        return location.state?.usuario || (storedUser ? JSON.parse(storedUser) : null);
    });

    const [vacantes, setVacantes] = useState([]);
    const [chatsRecientes, setChatsRecientes] = useState([]); 
    const [selectedVacante, setSelectedVacante] = useState(null);
    const [chatActivo, setChatActivo] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [vistaActiva, setVistaActiva] = useState('vacantes'); 
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // 2. EFECTOS Y DATA FETCHING
    useEffect(() => {
        if (!usuario || !usuario.id) {
            navigate('/login');
        } else {
            fetchVacantes();
        }
    }, [usuario, navigate]);

    const fetchVacantes = async () => {
        try {
            const res = await API.get('/vacantes');
            setVacantes(res.data);
        } catch (err) {
            console.error("Error al cargar vacantes", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchChats = useCallback(async () => {
        if (!usuario?.id) return;
        try {
            const resChats = await API.get(`/mensajeria/mis-conversaciones/${usuario.id}`);
            setChatsRecientes(resChats.data);
        } catch (e) {
            console.error("Error al cargar chats", e);
        }
    }, [usuario?.id]); 

    useEffect(() => {
        let intervalo;
        if (vistaActiva === 'mensajes' && usuario?.id) {
            fetchChats();
            intervalo = setInterval(() => fetchChats(), 8000); 
        }
        return () => clearInterval(intervalo);
    }, [vistaActiva, usuario, fetchChats]);

    // 3. HANDLERS
    const handleLogout = () => {
        localStorage.clear();
        navigate('/', { replace: true });
    };

   const abrirChatDesdeVacante = (vacante) => {
    setChatActivo({
        vacanteId: vacante.id, // ✅ Cambiado de 'id' a 'vacanteId'
        empresaId: vacante.empresaId || vacante.empresa?.id,
        titulo: vacante.titulo,
        nombreEmpresa: vacante.empresa?.nombre || 'Empresa'
    });
    setVistaActiva('mensajes');                
};

    const formatDate = (dateString) => {
        if (!dateString) return "Indefinida";
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    // 4. LÓGICA DE FILTRADO
    const getFilteredData = () => {
        const term = searchTerm.toLowerCase();
        if (vistaActiva === 'vacantes') {
            return vacantes.filter(v => {
                const cumpleBusqueda = v.titulo.toLowerCase().includes(term) ||
                                     v.empresa?.nombre.toLowerCase().includes(term);
                const estaAbierta = v.estado === "ABIERTA";
                const fechaVencida = v.fechaCierre && new Date(v.fechaCierre) < new Date();
                const cupoLleno = v.limitePostulantes && (v._count?.postulaciones >= v.limitePostulantes);
                return cumpleBusqueda && estaAbierta && !fechaVencida && !cupoLleno;
            });
        }
        return Array.isArray(chatsRecientes) ? chatsRecientes.filter(c => 
            (c.nombreEmpresa || "").toLowerCase().includes(term) ||
            (c.tituloVacante || "").toLowerCase().includes(term)
        ) : [];
    };

    const dataFiltrada = getFilteredData();

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="dashboard-layout">
            <div className="unified-wrapper">
                {/* BARRA LATERAL */}
                <nav className="sidebar">
                    <div className="sidebar-top">
                        <div className="logo-text">UdeC <span className="text-olive">Jobs</span></div>
                        <div className="sidebar-menu">
                            <button 
                                className={`menu-item ${vistaActiva === 'vacantes' || vistaActiva === 'crear-cv' ? 'active' : ''}`} 
                                onClick={() => setVistaActiva('vacantes')}
                            >
                                <Briefcase size={20}/> <span>Vacantes</span>
                            </button>
                            <button 
                                className={`menu-item ${vistaActiva === 'mensajes' ? 'active' : ''}`} 
                                onClick={() => setVistaActiva('mensajes')}
                            >
                                <MessageSquare size={20}/> <span>Mensajes</span>
                            </button>
                        </div>
                    </div>
                    <button onClick={() => setShowLogoutConfirm(true)} className="logout-btn">
                        <LogOut size={18} /> <span>Cerrar Sesión</span>
                    </button>
                </nav>

                <div className="glass-container">
                    {/* ENCABEZADO */}
                    <header className="main-header">
                        {vistaActiva !== 'crear-cv' ? (
                            <div className="search-bar">
                                <Search size={18} color="#1a202c" />
                                <input 
                                    type="text" 
                                    placeholder={vistaActiva === 'mensajes' ? "Buscar en mensajes..." : "Buscar puesto o empresa..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        ) : <div className="header-spacer"></div>}

                        <div className="header-actions">
                            {vistaActiva !== 'crear-cv' && (
                                <div className="user-profile">
                                    <span className="user-name">{usuario?.nombre || 'Egresado'}</span>
                                    <div className="avatar">{usuario?.nombre?.charAt(0) || 'E'}</div>
                                </div>
                            )}
                        </div>
                    </header>

      <div className="content-inner">
    {/* CASO 1: VISTA DE MENSAJES */}
    {vistaActiva === 'mensajes' && (
        <div className="teams-layout">
            <div className="chats-list-sidebar">
                <h3 className="section-title">Chats</h3>
                <div className="chat-scroll">
                    {dataFiltrada.length > 0 ? dataFiltrada.map((chat, idx) => (
                        <div 
                            key={`chat-${idx}`} // ✅ Usamos idx (definido en el map) para evitar el ReferenceError
                            className={`chat-item-cola ${chatActivo?.vacanteId === chat.vacanteId && chatActivo?.empresaId === chat.empresaId ? 'active' : ''}`} 
                            onClick={() => setChatActivo({ 
                                vacanteId: chat.vacanteId, // ✅ Enviamos vacanteId (no id) para que Mensajeria.jsx lo reciba bien
                                empresaId: chat.empresaId, 
                                titulo: chat.tituloVacante, 
                                nombreEmpresa: chat.nombreEmpresa 
                            })}
                        >
                            <div className="avatar-cola">{chat.nombreEmpresa?.charAt(0)}</div>
                            <div className="info-cola">
                                <strong>{chat.nombreEmpresa}</strong>
                                <p className="last-msg">{chat.ultimoMensaje || "Sin mensajes"}</p>
                                <span className="vacante-tag">{chat.tituloVacante}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="no-chats-msg">No hay conversaciones.</div>
                    )}
                </div>
            </div>

            <div className="chat-main-window">
                {chatActivo ? (
                    <Mensajeria 
                        usuario={usuario} 
                        empresaId={chatActivo.empresaId} 
                        vacanteId={chatActivo.vacanteId} // ✅ Pasamos la prop exacta que espera el componente
                        onClose={() => setChatActivo(null)} 
                    />
                ) : (
                    <div className="empty-state">
                        <MessageSquare size={64} color="#e2e8f0" />
                        <h3>Bandeja de Entrada</h3>
                        <p>Selecciona un chat para ver la conversación.</p>
                    </div>
                )}
            </div>
        </div>
    )}

                        {/* CASO 2: VISTA DE CREAR CV */}
                        {vistaActiva === 'crear-cv' && (
                            <div className="full-width-cv-view">
                                <div className="cv-scroll-container">
                                    <div className="cv-content-wrapper">
                                        <CrearCV isInline={true} setVistaActiva={setVistaActiva} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CASO 3: VISTA DE VACANTES */}
                        {vistaActiva === 'vacantes' && (
                            <div className="grid-container">
                                <div className="vacantes-scroll-area">
                                    <div className="content-title-area">
                                        <h1>Oportunidades Laborales</h1>
                                        <p className="subtitle">Explora vacantes en tiempo real</p>
                                    </div>
                                    {dataFiltrada.map((v) => (
                                        <div 
                                            key={`vacante-${v.id}`} 
                                            onClick={() => setSelectedVacante(v)} 
                                            className={`vacante-card ${selectedVacante?.id === v.id ? 'active' : ''}`}
                                        >
                                            <div className="card-icon"><Building2 size={24}/></div>
                                            <div className="card-info">
                                                <h4>{v.titulo}</h4>
                                                <p className="company-name">{v.empresa?.nombre || 'Empresa Verificada'}</p>
                                                {v.limitePostulantes && (
                                                    <span className="badge-cupos">
                                                        {(v.limitePostulantes - (v._count?.postulaciones || 0))} cupos restantes
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <aside className="vacante-detail-view">
                                    {selectedVacante ? (
                                        <div className="detail-container">
                                            <h2 className="detail-title">{selectedVacante.titulo}</h2>
                                            <div className="vacancy-meta-info">
                                                <div className="meta-item"><Calendar size={16} /><span>Publicada: {formatDate(selectedVacante.fechaCreacion)}</span></div>
                                                <div className="meta-item deadline"><Calendar size={16} /><span>Cierre: {formatDate(selectedVacante.fechaCierre)}</span></div>
                                                {selectedVacante.limitePostulantes && (
                                                    <div className="meta-item"><Users size={16} /><span>Cupo: {selectedVacante._count?.postulaciones} / {selectedVacante.limitePostulantes}</span></div>
                                                )}
                                            </div>
                                            <div className="detail-section">
                                                <h5>Descripción del puesto</h5>
                                                <p className="detail-text">{selectedVacante.descripcion}</p>
                                            </div>
                                            <div className="action-box">
    {/* Botón para ir a editar el perfil digital */}
    <button onClick={() => setVistaActiva('crear-cv')} className="btn-outline">
        <PlusCircle size={18} /> MI PERFIL DIGITAL
    </button>

    {/* NUEVO: Botón de Postulación Directa */}
    <button 
        onClick={async () => {
            try {
                const res = await API.post(`/estudiantes/${selectedVacante.id}/postular`);
                alert(res.data.message);
                // Opcional: refrescar vacantes para ver el contador de cupos actualizado
                fetchVacantes(); 
            } catch (err) {
                alert(err.response?.data?.error || "Error al postularse");
            }
        }} 
        className="btn-primary"
    >
        <Briefcase size={18} /> POSTULARME AHORA
    </button>

    <button onClick={() => abrirChatDesdeVacante(selectedVacante)} className="btn-outline">
        <MessageSquare size={18} /> Preguntar por el puesto
    </button>
</div>
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            <Briefcase size={48} color="#cbd5e1" />
                                            <p>Selecciona una vacante para ver los detalles</p>
                                        </div>
                                    )}
                                </aside>
                            </div>
                        )}
                    </div>
                </div>
            
                <ConfirmacionLogout 
                    isOpen={showLogoutConfirm} 
                    onConfirm={handleLogout} 
                    onCancel={() => setShowLogoutConfirm(false)} 
                />
            </div>
        </div>
    );
}