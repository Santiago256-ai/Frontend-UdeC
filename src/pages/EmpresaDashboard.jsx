import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom"; 
import API from "../services/api"; 
import { 
    LogOut, MessageSquare, Briefcase, PlusCircle, 
    Building2, Calendar, Users, Edit3, Trash2, Eye, MapPin, 
    FileText, CheckCircle, XCircle, Clock, ArrowLeft, BarChart3
} from 'lucide-react';
import "./EmpresaDashboard.css"; 
import ChatSidebar from "../components/ChatSidebar"; 
import VerCV from "../components/verCV";
// Importación del módulo de métricas (ajustada a tu estructura de carpetas)
import EmpresaMetricas from './EmpresaDashboard/EmpresaMetricas';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatPostulante, setChatPostulante] = useState(null); 
    const [perfilSeleccionado, setPerfilSeleccionado] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Estado para rastrear el conteo previo de postulaciones (Polling)
    const [prevTotalPostulaciones, setPrevTotalPostulaciones] = useState(0);

    // Estado para edición
    const [editandoVacante, setEditandoVacante] = useState(null);

    const [nuevaVacante, setNuevaVacante] = useState({
      titulo: "", descripcion: "", ubicacion: "", tipo: "",
      modalidad: "", salario: "", fechaCierre: "", limitePostulantes: "",
    });

    // Al inicio de tu componente EmpresaDashboard
useEffect(() => {
    const handleFirstInteraction = () => {
        // Ejecutamos un sonido silencioso de 0.1 segundos para habilitar el canal de audio
        const context = new (window.AudioContext || window.webkitAudioContext)();
        if (context.state === 'suspended') {
            context.resume();
        }
        console.log("🔊 Audio desbloqueado para esta sesión");
        // Quitamos el evento para que no se ejecute cada vez que hagas clic
        window.removeEventListener('click', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
}, []);

    // --- Efectos y Redirección ---
    useEffect(() => {
        if (!empresa) {
            localStorage.removeItem('usuario');
            navigate('/'); 
        } else {
            setLoading(false);
        }
    }, [empresa, navigate]);

    // Función base para cargar vacantes
// 1. Modifica cargarVacantes para que solo establezca el estado inicial una vez
const cargarVacantes = useCallback(() => {
    if (empresa?.id) {
        API.get(`/vacantes/empresa/${empresa.id}`)
            .then((res) => {
                setVacantes(res.data);
                const total = res.data.reduce((acc, v) => acc + (v._count?.postulaciones || 0), 0);
                
                // IMPORTANTE: Solo inicializamos si es 0 para que checkNewPostulaciones 
                // pueda detectar el incremento después.
                setPrevTotalPostulaciones(prev => prev === 0 ? total : prev);
            })
            .catch((err) => console.error("Error al cargar vacantes:", err));
    }
}, [empresa?.id]);

// 2. Modifica checkNewPostulaciones para que sea más sensible
const checkNewPostulaciones = useCallback(async () => {
    if (!empresa?.id || vacantes.length === 0) return;
    
    try {
        // En lugar de confiar en el conteo del dashboard, 
        // consultamos los detalles de cada vacante activa
        const promesas = vacantes.map(v => API.get(`/postulaciones/vacante/${v.id}`));
        const resultados = await Promise.all(promesas);
        
        // Sumamos el total de items que vienen en cada respuesta
        const totalActual = resultados.reduce((acc, res) => acc + (res.data?.length || 0), 0);

        console.log(`🔍 VERIFICACIÓN REAL: Anterior: ${prevTotalPostulaciones} | Actual: ${totalActual}`);

        if (prevTotalPostulaciones > 0 && totalActual > prevTotalPostulaciones) {
    toast.info("🚀 ¡Nueva postulación recibida!");
    
    // Crear el objeto de audio
    const audio = new Audio('/sounds/notification.mp3');
    
    // Forzar la carga y luego reproducir
    audio.load(); 
    audio.play()
        .then(() => console.log("🔊 Sonido emitido con éxito"))
        .catch(e => {
            console.warn("🔔 Notificación visual enviada, pero el audio requiere un clic previo en la página.");
        });

    cargarVacantes();
}
        
        setPrevTotalPostulaciones(totalActual);
    } catch (error) {
        console.error("Error en el escaneo de postulaciones:", error);
    }
}, [empresa?.id, vacantes, prevTotalPostulaciones, cargarVacantes]);

    // Intervalo de Polling cada 30 segundos
useEffect(() => {
    const interval = setInterval(() => {
        checkNewPostulaciones();
    }, 5000); // 5 segundos para pruebas
    return () => clearInterval(interval);
}, [checkNewPostulaciones]);

    useEffect(() => {
      if (empresa) cargarVacantes();
    }, [empresa, cargarVacantes]); 

    // --- Handlers ---
    const handleSubmit = async (e) => {
        e.preventDefault(); 
        try {
            const vacanteData = { 
                ...nuevaVacante, 
                empresaId: empresa.id,
                limitePostulantes: nuevaVacante.limitePostulantes ? parseInt(nuevaVacante.limitePostulantes) : null 
            };
            await API.post(`/vacantes`, vacanteData);
            toast.success("Vacante publicada con éxito.");
            setNuevaVacante({ titulo: "", descripcion: "", ubicacion: "", tipo: "", modalidad: "", salario: "", fechaCierre: "", limitePostulantes: "" });
            cargarVacantes();
            setActiveTab("gestion");
        } catch (err) { toast.error("Error al publicar la vacante"); }
    };

    const handlePrepararEdicion = (vacante) => {
        setEditandoVacante({
            ...vacante,
            fechaCierre: vacante.fechaCierre ? vacante.fechaCierre.split('T')[0] : ""
        });
        setActiveTab("edicion");
    };

    const handleActualizarVacante = async (e) => {
        e.preventDefault();
        try {
            await API.put(`/vacantes/${editandoVacante.id}`, editandoVacante);
            toast.success("Vacante actualizada correctamente");
            setEditandoVacante(null);
            setActiveTab("gestion");
            cargarVacantes();
        } catch (err) { toast.error("Error al actualizar la vacante"); }
    };

    const handleEliminarVacante = async (vacanteId, titulo) => {
        if (!window.confirm(`¿Eliminar la vacante: "${titulo}"?`)) return;
        try {
            await API.delete(`/vacantes/${vacanteId}`);
            toast.success("Vacante eliminada");
            cargarVacantes();
            if (vacanteSeleccionadaId === vacanteId) setVacanteSeleccionadaId(null);
        } catch (err) { toast.error("Fallo al eliminar."); }
    };
    
    const handleVerPostulaciones = async (vacanteId) => {
        setVacanteSeleccionadaId(vacanteId);
        setFiltroEstado("TODOS");
        setIsChatOpen(false); 
        try {
            const res = await API.get(`/postulaciones/vacante/${vacanteId}`);
            setPostulaciones(res.data);
        } catch (err) {
            setPostulaciones([]);
            toast.warning("No hay postulaciones aún.");
        }
    };

    const handleUpdateEstado = async (postulacionId, nuevoEstado) => {
        try {
            await API.patch(`/postulaciones/${postulacionId}/estado`, { estado: nuevoEstado.toUpperCase() });
            setPostulaciones(prev => prev.map(p => p.id === postulacionId ? { ...p, estado: nuevoEstado.toUpperCase() } : p));
            toast.success(`Estado actualizado a ${nuevoEstado}`);
        } catch (err) { toast.error("Error al actualizar estado."); }
    };

    const getStatusIcon = (estado) => {
        switch (estado?.toUpperCase()) {
            case 'ACEPTADA': return <CheckCircle size={16} color="#10b981" />;
            case 'RECHAZADA': return <XCircle size={16} color="#ef4444" />;
            case 'REVISADO': return <Clock size={16} color="#f59e0b" />;
            default: return <Clock size={16} color="#64748b" />;
        }
    };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    const vacanteActual = vacantes.find(v => v.id === vacanteSeleccionadaId);

    return (
        <div className="empresa-dashboard-layout">
            <nav className="empresa-sidebar">
                <div className="sidebar-brand">
                    <Building2 size={24} /> <span>UdeC <small>Empresas</small></span>
                </div>
                <div className="sidebar-links">
                    <button className={activeTab === "gestion" ? "active" : ""} onClick={() => { setActiveTab("gestion"); setVacanteSeleccionadaId(null); }}>
                        <Briefcase size={20} /> Gestión de Vacantes
                    </button>
                    <button className={activeTab === "creacion" ? "active" : ""} onClick={() => setActiveTab("creacion")}>
                        <PlusCircle size={20} /> Publicar Vacante
                    </button>
                    <button className={activeTab === "metricas" ? "active" : ""} onClick={() => setActiveTab("metricas")}>
                        <BarChart3 size={20} /> Métricas y Reportes
                    </button>
                </div>
                <button className="logout-btn" onClick={() => { localStorage.clear(); navigate('/'); }}>
                    <LogOut size={18} /> Cerrar Sesión
                </button>
            </nav>

            <main className="empresa-main-content">
                <header className="main-header">
                    <div className="header-title">
                        <h2>
                            {activeTab === 'creacion' && 'Nueva Oferta Laboral'}
                            {activeTab === 'gestion' && 'Panel de Gestión'}
                            {activeTab === 'edicion' && 'Editar Vacante'}
                            {activeTab === 'metricas' && 'Métricas y Reportes Empresariales'}
                        </h2>
                        <p>{empresa?.nombre || "Bienvenido al portal empresarial"}</p>
                    </div>
                    <div className="header-user">
                        <div className="avatar">{empresa?.nombre?.charAt(0)}</div>
                    </div>
                </header>

                <div className="content-scrollable">
                    {/* VISTA: MÉTRICAS */}
                    {activeTab === "metricas" && (
                        <EmpresaMetricas empresaId={empresa?.id} />
                    )}

                    {/* VISTA: CREACIÓN */}
                    {activeTab === "creacion" && (
                        <div className="form-card-container animate-fade-in">
                            <form onSubmit={handleSubmit} className="professional-form">
                                <div className="form-grid-layout">
                                    <div className="field-group full">
                                        <label>Título de la Vacante *</label>
                                        <input type="text" required value={nuevaVacante.titulo} onChange={(e) => setNuevaVacante({ ...nuevaVacante, titulo: e.target.value })} placeholder="Ej: Desarrollador Fullstack" />
                                    </div>
                                    <div className="field-group full">
                                        <label>Descripción del Puesto *</label>
                                        <textarea required rows="4" value={nuevaVacante.descripcion} onChange={(e) => setNuevaVacante({ ...nuevaVacante, descripcion: e.target.value })} placeholder="Requisitos, responsabilidades..." />
                                    </div>
                                    <div className="field-group">
                                        <label>Ubicación *</label>
                                        <input type="text" required value={nuevaVacante.ubicacion} onChange={(e) => setNuevaVacante({ ...nuevaVacante, ubicacion: e.target.value })} placeholder="Ciudad o Remoto" />
                                    </div>
                                    <div className="field-group">
                                        <label>Tipo de Contrato</label>
                                        <select value={nuevaVacante.tipo} onChange={(e) => setNuevaVacante({ ...nuevaVacante, tipo: e.target.value })}>
                                            <option value="">Selecciona</option>
                                            <option value="Tiempo completo">Tiempo completo</option>
                                            <option value="Medio tiempo">Medio tiempo</option>
                                            <option value="Prácticas">Prácticas</option>
                                        </select>
                                    </div>
                                    <div className="field-group">
                                        <label>Modalidad</label>
                                        <select value={nuevaVacante.modalidad} onChange={(e) => setNuevaVacante({ ...nuevaVacante, modalidad: e.target.value })}>
                                            <option value="">Selecciona</option>
                                            <option value="Presencial">Presencial</option>
                                            <option value="Remoto">Remoto</option>
                                            <option value="Hibrido">Híbrido</option>
                                        </select>
                                    </div>
                                    <div className="field-group">
                                        <label>Salario (Opcional)</label>
                                        <input type="text" value={nuevaVacante.salario} onChange={(e) => setNuevaVacante({ ...nuevaVacante, salario: e.target.value })} />
                                    </div>
                                    <div className="field-group">
                                        <label>Fecha Límite</label>
                                        <input type="date" value={nuevaVacante.fechaCierre} onChange={(e) => setNuevaVacante({ ...nuevaVacante, fechaCierre: e.target.value })} />
                                    </div>
                                    <div className="field-group">
                                        <label>Límite Candidatos</label>
                                        <input type="number" value={nuevaVacante.limitePostulantes} onChange={(e) => setNuevaVacante({ ...nuevaVacante, limitePostulantes: e.target.value })} />
                                    </div>
                                </div>
                                <button type="submit" className="btn-publish">Publicar Vacante Ahora</button>
                            </form>
                        </div>
                    )}

                    {/* VISTA: EDICIÓN */}
                    {activeTab === "edicion" && editandoVacante && (
                        <div className="form-card-container animate-fade-in">
                            <button className="btn-back" onClick={() => setActiveTab("gestion")}>
                                <ArrowLeft size={16} /> Volver al listado
                            </button>
                            <form onSubmit={handleActualizarVacante} className="professional-form">
                                <div className="form-grid-layout">
                                    <div className="field-group full">
                                        <label>Título de la Vacante</label>
                                        <input type="text" required value={editandoVacante.titulo} onChange={(e) => setEditandoVacante({ ...editandoVacante, titulo: e.target.value })} />
                                    </div>
                                    <div className="field-group full">
                                        <label>Descripción del Puesto</label>
                                        <textarea required rows="4" value={editandoVacante.descripcion} onChange={(e) => setEditandoVacante({ ...editandoVacante, descripcion: e.target.value })} />
                                    </div>
                                    <div className="field-group">
                                        <label>Ubicación</label>
                                        <input type="text" required value={editandoVacante.ubicacion} onChange={(e) => setEditandoVacante({ ...editandoVacante, ubicacion: e.target.value })} />
                                    </div>
                                    <div className="field-group">
                                        <label>Tipo de Contrato</label>
                                        <select value={editandoVacante.tipo} onChange={(e) => setEditandoVacante({ ...editandoVacante, tipo: e.target.value })}>
                                            <option value="Tiempo completo">Tiempo completo</option>
                                            <option value="Medio tiempo">Medio tiempo</option>
                                            <option value="Prácticas">Prácticas</option>
                                        </select>
                                    </div>
                                    <div className="field-group">
                                        <label>Modalidad</label>
                                        <select value={editandoVacante.modalidad} onChange={(e) => setEditandoVacante({ ...editandoVacante, modalidad: e.target.value })}>
                                            <option value="Presencial">Presencial</option>
                                            <option value="Remoto">Remoto</option>
                                            <option value="Hibrido">Híbrido</option>
                                        </select>
                                    </div>
                                    <div className="field-group">
                                        <label>Salario</label>
                                        <input type="text" value={editandoVacante.salario} onChange={(e) => setEditandoVacante({ ...editandoVacante, salario: e.target.value })} />
                                    </div>
                                    <div className="field-group">
                                        <label>Fecha Límite</label>
                                        <input type="date" value={editandoVacante.fechaCierre} onChange={(e) => setEditandoVacante({ ...editandoVacante, fechaCierre: e.target.value })} />
                                    </div>
                                    <div className="field-group">
                                        <label>Límite Candidatos</label>
                                        <input type="number" value={editandoVacante.limitePostulantes} onChange={(e) => setEditandoVacante({ ...editandoVacante, limitePostulantes: e.target.value })} />
                                    </div>
                                </div>
                                <button type="submit" className="btn-update">Guardar Cambios</button>
                            </form>
                        </div>
                    )}

                    {/* VISTA: GESTIÓN */}
                    {activeTab === "gestion" && (
                        <div className="management-container">
                            <div className="vacantes-grid">
                                {vacantes.length === 0 ? (
                                    <p className="empty-state">No hay vacantes publicadas.</p>
                                ) : (
                                    vacantes.map((v) => (
                                        <div key={v.id} className={`v-card ${vacanteSeleccionadaId === v.id ? 'v-active' : ''}`}>
                                            <div className="v-header">
                                                <div className="v-title-group">
                                                    <h4>{v.titulo}</h4>
                                                    <span className="v-tag">{v.modalidad}</span>
                                                </div>
                                            </div>
                                            <div className="v-body">
                                                <div className="info-item"><MapPin size={14}/> {v.ubicacion}</div>
                                                <div className="info-item"><Users size={14}/> {v._count?.postulaciones || 0} postulantes</div>
                                            </div>
                                            <div className="v-footer-actions">
                                                <button className="btn-action-icon edit" onClick={() => handlePrepararEdicion(v)} title="Editar"><Edit3 size={18} /></button>
                                                <button className="btn-main-center" onClick={() => handleVerPostulaciones(v.id)} title="Ver Postulaciones"><Eye size={20} /> <span>Ver Postulaciones</span></button>
                                                <button className="btn-action-icon delete" onClick={() => handleEliminarVacante(v.id, v.titulo)} title="Eliminar"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {vacanteSeleccionadaId && (
                                <div className="postulantes-section animate-fade-in">
                                    <div className="section-header">
                                        <h3>Candidatos: {vacanteActual?.titulo}</h3>
                                        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                                            <option value="TODOS">Todos</option>
                                            <option value="PENDIENTE">Pendientes</option>
                                            <option value="ACEPTADA">Aceptadas</option>
                                            <option value="RECHAZADA">Rechazadas</option>
                                        </select>
                                    </div>
                                    <div className="candidatos-list">
                                        {postulaciones.filter(p => filtroEstado === "TODOS" || p.estado === filtroEstado).map((p) => (
                                            <div key={p.id} className="candidato-row">
                                                <div className="c-info">
                                                    <span className="c-name" onClick={() => { setPerfilSeleccionado(p.usuario); setIsModalOpen(true); }}>
                                                        {p.usuario?.nombres} {p.usuario?.apellidos}
                                                    </span>
                                                    <div className="c-status">
                                                        {getStatusIcon(p.estado)} {p.estado}
                                                    </div>
                                                </div>
                                                <div className="c-actions">
                                                    <button className="c-btn-cv" onClick={() => { setPerfilSeleccionado(p.usuario); setIsModalOpen(true); }} title="Ver CV"><FileText size={16}/> CV</button>
                                                    <button className="c-btn-chat" onClick={() => { setChatPostulante(p); setIsChatOpen(true); }} title="Abrir Chat"><MessageSquare size={16}/></button>
                                                    <button className="c-btn-ok" onClick={() => handleUpdateEstado(p.id, 'ACEPTADA')} title="Aceptar">✅</button>
                                                    <button className="c-btn-no" onClick={() => handleUpdateEstado(p.id, 'RECHAZADA')} title="Rechazar">❌</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Modales y Notificaciones */}
            {isModalOpen && perfilSeleccionado && <VerCV perfil={perfilSeleccionado} onClose={() => setIsModalOpen(false)} />}
            {isChatOpen && <ChatSidebar empresaId={empresa?.id} postulante={chatPostulante} vacanteId={vacanteActual?.id} onClose={() => setIsChatOpen(false)} />}
            <ToastContainer position="bottom-right" theme="colored" />
        </div>
    );
}