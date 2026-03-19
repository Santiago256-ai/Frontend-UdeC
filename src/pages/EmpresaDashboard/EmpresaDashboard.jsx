import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom"; 
import API from "../../services/api"; 
import logoUdec from '../../assets/UdeC2.png';
import logoGrande from '../../assets/Logo2.png'; 
import logoPequeño from '../../assets/Logo3.png';

import { 
    LogOut, MessageSquare, Briefcase, PlusCircle, 
    Building2, Users, Edit3, Trash2, Eye, MapPin, 
    FileText, CheckCircle, XCircle, Clock, ArrowLeft, BarChart3,
    Search, ChevronRight, Home, Bell, ClipboardList, User, Calendar
} from 'lucide-react';

import "./EmpresaDashboard.css"; 
import ChatSidebar from "../../components/ChatSidebar"; 
import VerCV from "../../components/verCV";
import EmpresaMetricas from './EmpresaMetricas';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function EmpresaDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // --- ESTADOS ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
    const [loading, setLoading] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatPostulante, setChatPostulante] = useState(null); 
    const [perfilSeleccionado, setPerfilSeleccionado] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [prevTotalPostulaciones, setPrevTotalPostulaciones] = useState(0);
    const [editandoVacante, setEditandoVacante] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [nuevaVacante, setNuevaVacante] = useState({
    titulo: "", 
    descripcion: "", 
    ubicacion: "", 
    tipo: "",
    modalidad: "", 
    salario: "", 
    fechaCierre: "",      // Asegúrate que esté aquí
    limitePostulantes: "", // Asegúrate que esté aquí
});

    // --- LÓGICA DE DATOS ---
    const cargarVacantes = useCallback(() => {
        if (empresa?.id) {
            API.get(`/vacantes/empresa/${empresa.id}`)
                .then((res) => {
                    setVacantes(res.data);
                    const total = res.data.reduce((acc, v) => acc + (v._count?.postulaciones || 0), 0);
                    setPrevTotalPostulaciones(prev => prev === 0 ? total : prev);
                })
                .catch((err) => console.error("Error al cargar vacantes:", err));
        }
    }, [empresa?.id]);

    const checkNewPostulaciones = useCallback(async () => {
        if (!empresa?.id || vacantes.length === 0) return;
        try {
            // Consultamos los detalles reales para comparar
            const promesas = vacantes.map(v => API.get(`/postulaciones/vacante/${v.id}`));
            const resultados = await Promise.all(promesas);
            const totalActual = resultados.reduce((acc, res) => acc + (res.data?.length || 0), 0);

            // Si detectamos incremento, suena y avisa
            if (prevTotalPostulaciones > 0 && totalActual > prevTotalPostulaciones) {
                toast.info("🚀 ¡Nueva postulación recibida!");
                const audio = new Audio('public/sounds/notification.mp3');
                audio.play().catch(e => console.log("Audio esperando interacción", e));
                cargarVacantes(); 
            }
            setPrevTotalPostulaciones(totalActual);
        } catch (error) {
            console.error("Error en polling:", error);
        }
    }, [empresa?.id, vacantes, prevTotalPostulaciones, cargarVacantes]);

    // 3. --- EFECTOS (Van DESPUÉS de las funciones) ---

    // Desbloquear audio con el primer clic
    useEffect(() => {
        const unlock = () => {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            if (context.state === 'suspended') context.resume();
            console.log("🔊 Audio desbloqueado");
            window.removeEventListener('click', unlock);
        };
        window.addEventListener('click', unlock);
        return () => window.removeEventListener('click', unlock);
    }, []);

    // Intervalo de revisión (Polling)
    useEffect(() => {
        const interval = setInterval(() => {
            checkNewPostulaciones();
        }, 30000); 
        return () => clearInterval(interval);
    }, [checkNewPostulaciones]);

    // Carga inicial
    useEffect(() => {
        if (!empresa) {
            navigate('/'); 
        } else {
            cargarVacantes();
            setLoading(false);
        }
    }, [empresa, navigate, cargarVacantes]);

    // Control de Sidebar Responsive
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 1024) setIsSidebarCollapsed(true);
            else setIsSidebarCollapsed(false);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleVerPostulaciones = async (vacanteId) => {
        setVacanteSeleccionadaId(vacanteId);
        try {
            const res = await API.get(`/postulaciones/vacante/${vacanteId}`);
            setPostulaciones(res.data);
        } catch (err) {
            setPostulaciones([]);
        }
    };

    const handleVerPerfil = (usuario) => {
        console.log("🔍 Datos enviados al modal VerCV:", usuario); 
        setPerfilSeleccionado(usuario);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        try {
            const vacanteData = { 
    ...nuevaVacante, 
    empresaId: empresa.id,
    // Esto es clave para que la base de datos no reciba un string vacío
    limitePostulantes: nuevaVacante.limitePostulantes ? parseInt(nuevaVacante.limitePostulantes) : null 
};
            await API.post(`/vacantes`, vacanteData);
            toast.success("¡Oferta publicada exitosamente!");
            setNuevaVacante({ titulo: "", descripcion: "", ubicacion: "", tipo: "", modalidad: "", salario: "", fechaCierre: "", limitePostulantes: "" });
            cargarVacantes();
            setActiveTab("gestion");
        } catch (err) { 
            toast.error("Error al publicar la vacante"); 
        }
    };

    const handleLogout = () => {
        localStorage.clear(); // Esto borra token y usuario
        setShowLogoutModal(false);
        navigate('/'); 
    };

    const handlePrepararEdicion = (vacante) => {
        setEditandoVacante({ ...vacante, fechaCierre: vacante.fechaCierre ? vacante.fechaCierre.split('T')[0] : "" });
        setActiveTab("edicion");
    };

    const handleEliminarVacante = async (vacanteId, titulo) => {
        if (!window.confirm(`¿Deseas eliminar la vacante: "${titulo}"?`)) return;
        try {
            await API.delete(`/vacantes/${vacanteId}`);
            toast.success("Vacante eliminada");
            cargarVacantes();
            if (vacanteSeleccionadaId === vacanteId) setVacanteSeleccionadaId(null);
        } catch (err) { toast.error("Error al eliminar."); }
    };

    useEffect(() => {
        if (!empresa) {
            navigate('/'); 
        } else {
            cargarVacantes();
            setLoading(false);
        }
    }, [empresa, navigate, cargarVacantes]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 1024) setIsSidebarCollapsed(true);
            else setIsSidebarCollapsed(false);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const obtenerIniciales = (nombre) => {
        if (!nombre) return "E";
        return nombre.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    const vacanteActual = vacantes.find(v => v.id === vacanteSeleccionadaId);

    return (
        <div className={`dashboard-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            
            <nav className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-top">
                    <div className="logo-section">
                        <div className="platform-logo-container">
                            {isSidebarCollapsed ? (
                                <img src={logoPequeño} alt="Icono" className="logo-icon-collapsed fade-in" />
                            ) : (
                                <img src={logoGrande} alt="Empres 360 Pro" className="logo-full-expanded fade-in" />
                            )}
                        </div>
                    </div>
                    <div className="sidebar-menu">
                        <button className={`menu-item ${activeTab === 'gestion' ? 'active' : ''}`} onClick={() => { setActiveTab('gestion'); setVacanteSeleccionadaId(null); }}>
                            <Home size={18}/> <span>PANEL DE GESTIÓN</span>
                        </button>
                        <button className={`menu-item ${activeTab === 'creacion' ? 'active' : ''}`} onClick={() => setActiveTab('creacion')}>
                            <PlusCircle size={18}/> <span>PUBLICAR VACANTE</span>
                        </button>
                        <button className={`menu-item ${activeTab === 'metricas' ? 'active' : ''}`} onClick={() => setActiveTab('metricas')}>
                            <BarChart3 size={18}/> <span>MÉTRICAS Y REPORTES</span>
                        </button>
                        <button className={`menu-item ${activeTab === 'mensajes' ? 'active' : ''}`} onClick={() => setActiveTab('mensajes')}>
                            <MessageSquare size={18}/> <span>MENSAJES / CHAT</span>
                        </button>
                    </div>
                </div>

                <div className="sidebar-footer">
                    <button className="collapse-btn-footer" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                        <div className="btn-content">
                            <ChevronRight size={20} className={`icon-transition ${isSidebarCollapsed ? "" : "rotate-180"}`} />
                            <span>{isSidebarCollapsed ? "ABRIR MENÚ" : "CONTRAER MENÚ"}</span>
                        </div>
                    </button>
                    <div className="menu-item logout-item" onClick={() => setShowLogoutModal(true)}>
                        <LogOut size={20} className="sidebar-icon" />
                        {!isSidebarCollapsed && <span className="menu-label">CERRAR SESIÓN</span>}
                    </div>
                </div>
            </nav>

            <div className="glass-container">
                <header className="main-header-container">
                    <div className="header-top-bar">
                        <div className="bar-green"></div>
                        <div className="bar-orange"></div>
                    </div>
                    <div className="header-content">
                        <div className="header-left"><div className="udec-brand"><img src={logoUdec} alt="Logo UdeC" className="header-logo-img" /></div></div>
                        <div className="header-center">
                            <div className="search-wrapper">
                                <Search size={18} className="search-icon-inside" />
                                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                        <div className="header-right">
                            <div className="user-profile-info">
                                <div className="user-details"><span className="user-full-name">{empresa?.nombre}</span><span className="user-career">Empresa Aliada</span></div>
                                <div className="user-avatar-initials"><span>{obtenerIniciales(empresa?.nombre)}</span></div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="content-inner">
                    {/* VISTA GESTIÓN */}
                    {activeTab === 'gestion' && (
                        <div className="vacantes-view-container fade-in">
                            <section className="vacantes-list-panel">
                                <div className="section-title-container">
                                    <Briefcase size={28} className="title-icon" />
                                    <h2>MIS VACANTES <span className="vacantes-count-badge">{vacantes.length}</span></h2>
                                </div>
                                <div className="scrollable-cards">
                                    {vacantes.map((v) => (
                                        <div key={v.id} className={`vacante-card-item ${vacanteSeleccionadaId === v.id ? 'active' : ''}`} onClick={() => handleVerPostulaciones(v.id)}>
                                            <div className="card-main-info">
                                                <h4 style={{fontWeight:'700'}}>{v.titulo}</h4>
                                                <p>{v.modalidad} • {v.ubicacion}</p>
                                                <div className="card-meta-tags"><span className="badge-slots"><Users size={12} /> {v._count?.postulaciones || 0} postulantes</span></div>
                                            </div>
                                            <div className="card-actions-row" style={{display:'flex', gap:'5px', marginTop:'10px'}}>
                                                <button className="btn-details-action" onClick={(e) => { e.stopPropagation(); handlePrepararEdicion(v); }}>Editar</button>
                                                <button className="btn-details-action" style={{background:'#fee2e2', color:'#991b1b'}} onClick={(e) => { e.stopPropagation(); handleEliminarVacante(v.id, v.titulo); }}>Eliminar</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <aside className="vacante-detail-panel">
                                {vacanteSeleccionadaId ? (
                                    <div className="detail-content-wrapper fade-in">
                                        <h3>Postulantes para: {vacanteActual?.titulo}</h3>
                                        <div className="candidatos-list" style={{display:'flex', flexDirection:'column', gap:'10px', marginTop: '20px'}}>
                                            {postulaciones.length > 0 ? postulaciones.map(p => (
                                                <div key={p.id} className="vacante-card-item" style={{cursor:'default'}}>
                                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                                        <div>
                                                            <span style={{fontWeight:'600', display:'block'}}>{p.usuario?.nombres} {p.usuario?.apellidos}</span>
                                                            <span className="badge-published" style={{fontSize:'10px', marginTop:'4px'}}>{p.estado}</span>
                                                        </div>
                                                        <div style={{display:'flex', gap:'8px'}}>
                                                            <button className="btn-details-action" onClick={() => handleVerPerfil(p.usuario)} title="Ver Hoja de Vida"><Eye size={14}/></button>
                                                            <button className="btn-details-action" onClick={() => { setChatPostulante(p); setIsChatOpen(true); }} title="Abrir Chat"><MessageSquare size={14}/></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : <p className="no-data">No hay postulaciones aún para esta vacante.</p>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="no-selection-state">
                                        <Users size={50} color="#cbd5e0" />
                                        <p>Selecciona una vacante para gestionar candidatos.</p>
                                    </div>
                                )}
                            </aside>
                        </div>
                    )}

                    {/* VISTA MÉTRICAS */}
                    {activeTab === "metricas" && <div className="full-view fade-in"><EmpresaMetricas empresaId={empresa?.id} /></div>}

                    {/* VISTA CREACIÓN PROFESIONAL */}
                    {activeTab === 'creacion' && (
                        <div className="form-view-container fade-in">
                            <div className="form-header-box">
                                <div className="title-icon-group">
                                    <PlusCircle size={32} className="title-icon" />
                                    <div><h2>Publicar Nueva Oferta Laboral</h2><p>Atrae al mejor talento de la Universidad de Cundinamarca</p></div>
                                </div>
                            </div>
                            <div className="professional-form-card">
                                <form onSubmit={handleSubmit}>
                                    <div className="form-section">
                                        <div className="section-subtitle"><FileText size={18} /> <span>Información General</span></div>
                                        <div className="form-grid">
                                            <div className="form-group full"><label>Título de la Vacante *</label><input type="text" required value={nuevaVacante.titulo} onChange={(e)=>setNuevaVacante({...nuevaVacante, titulo: e.target.value})} placeholder="Ej: Desarrollador Web Junior" /></div>
                                            <div className="form-group full"><label>Descripción del Cargo *</label><textarea rows="6" required value={nuevaVacante.descripcion} onChange={(e)=>setNuevaVacante({...nuevaVacante, descripcion: e.target.value})} placeholder="Responsabilidades, requisitos..." /></div>
                                        </div>
                                    </div>
                                    <div className="form-section">
                                        <div className="section-subtitle"><MapPin size={18} /> <span>Ubicación y Modalidad</span></div>
                                        <div className="form-grid">
                                            <div className="form-group"><label>Ubicación *</label><input type="text" required value={nuevaVacante.ubicacion} onChange={(e)=>setNuevaVacante({...nuevaVacante, ubicacion: e.target.value})} /></div>
                                            <div className="form-group">
                                                <label>Modalidad</label>
                                                <select value={nuevaVacante.modalidad} onChange={(e)=>setNuevaVacante({...nuevaVacante, modalidad: e.target.value})}>
                                                    <option value="">Selecciona</option><option value="Presencial">Presencial</option><option value="Remoto">Remoto</option><option value="Híbrido">Híbrido</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Tipo de Contrato</label>
                                                <select value={nuevaVacante.tipo} onChange={(e)=>setNuevaVacante({...nuevaVacante, tipo: e.target.value})}>
                                                    <option value="">Selecciona</option><option value="Tiempo Completo">Tiempo Completo</option><option value="Prácticas">Prácticas</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Salario (Opcional)</label>
                                                <div className="input-with-icon"><span>$</span><input type="text" value={nuevaVacante.salario} onChange={(e)=>setNuevaVacante({...nuevaVacante, salario: e.target.value})} /></div>
                                            </div>
                                            {/* --- Agrega esto justo después del campo Salario --- */}
<div className="form-group">
    <label>Fecha de Cierre *</label>
    <div className="input-with-icon">
        <Calendar size={18} style={{marginRight: '8px', color: '#666'}} />
        <input 
            type="date" 
            required 
            value={nuevaVacante.fechaCierre} 
            onChange={(e) => setNuevaVacante({...nuevaVacante, fechaCierre: e.target.value})} 
        />
    </div>
</div>

<div className="form-group">
    <label>Límite de Cupos (Postulantes) *</label>
    <div className="input-with-icon">
        <Users size={18} style={{marginRight: '8px', color: '#666'}} />
        <input 
            type="number" 
            required 
            placeholder="Ej: 20"
            value={nuevaVacante.limitePostulantes} 
            onChange={(e) => setNuevaVacante({...nuevaVacante, limitePostulantes: e.target.value})} 
        />
    </div>
</div>
                                        </div>
                                    </div>
                                    <div className="form-actions-footer">
                                        <button type="button" className="btn-secondary" onClick={()=>setActiveTab('gestion')}>Cancelar</button>
                                        <button type="submit" className="btn-primary-udec"><PlusCircle size={18} /> Publicar Oferta</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* MODAL LOGOUT */}
            {showLogoutModal && (
                <div className="modal-overlay">
                    <div className="logout-modal">
                        <div className="modal-icon"><LogOut size={40} /></div>
                        <h3>¿Cerrar sesión?</h3>
                        <p>Se cerrará tu sesión de empresa.</p>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowLogoutModal(false)}>Cancelar</button>
                            <button className="btn-confirm" onClick={handleLogout}>Cerrar sesión</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALES EXTERNOS */}
            {isModalOpen && perfilSeleccionado && <VerCV perfil={perfilSeleccionado} onClose={() => setIsModalOpen(false)} />}
            {isChatOpen && <ChatSidebar empresaId={empresa?.id} postulante={chatPostulante} vacanteId={vacanteActual?.id} onClose={() => setIsChatOpen(false)} />}
            <ToastContainer position="bottom-right" theme="colored" />
        </div>
    );
}