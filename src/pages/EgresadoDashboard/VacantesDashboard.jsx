import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../../services/api'; 
import logoUdec from '../../assets/UdeC2.png';
import logoGrande from '../../assets/Logo2.png'; 
import logoPequeño from '../../assets/Logo3.png';

// Fusionamos todos los iconos en un solo bloque de lucide-react
import { 
    LogOut, 
    MessageSquare, 
    Briefcase, 
    Building2, 
    PlusCircle, 
    Search, 
    ArrowLeft,
    Calendar, 
    Users,
    ChevronRight,
    Home,
    Bell,
    ClipboardList,
    Clock,
    MapPin, 
    FileText, 
    Globe, 
    DollarSign,
    AlertTriangle,
    User,
    UserCircle,
    Settings,
    XCircle, // 👈 ¡AGREGA ESTE AQUÍ!
    CheckCircle
} from 'lucide-react';

import Mensajeria from '../../components/Chat-Vacantes'; 
import CrearCV from '../CrearCV'; 
import ConfirmacionLogout from '../../components/ConfirmacionLogout'; 
import './VacantesDashboard.css'; 
import PerfilEgresado from '../../components/PerfilEgresado'; // Ajusta la ruta según tu carpeta
import SolicitudesEgresado from '../../components/SolicitudesEgresado';
import InicioEgresados from '../../components/InicioEgresados';
import NotificacionesEgresado from '../../components/NotificacionesEgresado';
import 'react-quill-new/dist/quill.snow.css'; // Esto asegura que las clases de Quill funcionen
import Quill from 'quill';

// Esto es vital: le dice a Quill que use CLASES (ql-align-center) 
// en lugar de estilos en línea, para que el CSS de arriba las detecte.
const AlignStyle = Quill.import('attributors/class/align');
Quill.register(AlignStyle, true);

// También registraremos el tamaño para evitar que se guarden tamaños diminutos
const SizeStyle = Quill.import('attributors/style/size');
Quill.register(SizeStyle, true);


export default function VacantesDashboard() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    // ... otros estados
const [showProfileDropdown, setShowProfileDropdown] = useState(false);
const [resaltarPostulacionId, setResaltarPostulacionId] = useState(null);

    // 1. ESTADOS
    const [usuario, setUsuario] = useState(() => {
    const storedUser = localStorage.getItem('usuario');
    // Priorizamos el localStorage siempre para mantener consistencia al recargar
    return storedUser ? JSON.parse(storedUser) : (location.state?.usuario || null);
});

    const [vacantes, setVacantes] = useState([]);
    const [chatsRecientes, setChatsRecientes] = useState([]); 
    const [selectedVacante, setSelectedVacante] = useState(null);
    const [chatActivo, setChatActivo] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [vistaActiva, setVistaActiva] = useState('vacantes'); 
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    // Agrega esto junto a tus otros estados (como el de usuario o vacantes)
const [showLogoutModal, setShowLogoutModal] = useState(false);

    // 2. EFECTOS
    useEffect(() => {
        if (!usuario || !usuario.id) {
            navigate('/'); // Cámbialo a '/' para que si falla el login, vuelvan a la Landing profesional
        } else {
            fetchVacantes();
        }
    }, [usuario, navigate]);

    useEffect(() => {
    // Cada vez que el usuario haga clic en "MIS SOLICITUDES", 
    // forzamos una petición al servidor para traer los estados actualizados.
    if (vistaActiva === 'solicitudes' || vistaActiva === 'vacantes') {
        fetchVacantes();
    }
}, [vistaActiva]);

// NUEVO: EFECTO DE ACTUALIZACIÓN AUTOMÁTICA PARA SOLICITUDES
useEffect(() => {
    let intervaloVacantes;

    // Solo activamos el "refresco" si el usuario está viendo Vacantes o Solicitudes
    if (vistaActiva === 'solicitudes' || vistaActiva === 'vacantes') {
        
        // 1. Ejecutamos una carga inicial inmediata al entrar a la pestaña
        fetchVacantes();

        // 2. Configuramos el intervalo para que se repita cada 10 segundos
        intervaloVacantes = setInterval(() => {
            
            fetchVacantes();
        }, 10000); // 10000 ms = 10 segundos
    }

    // 3. LIMPIEZA: Muy importante para que no se sature la memoria al cambiar de pestaña
    return () => {
        if (intervaloVacantes) {
            clearInterval(intervaloVacantes);
        }
    };
}, [vistaActiva]);

const fetchVacantes = async () => {
    try {
        const res = await API.get('/vacantes');
        const todasLasVacantes = res.data;

        const vacantesLibres = todasLasVacantes.filter(v => 
            !v.postulaciones?.some(p => p.egresadoId === usuario?.id)
        );

        setVacantes(todasLasVacantes);

        // MODIFICADO: Ya no seleccionamos la primera por defecto.
        // Solo limpiamos si realmente no hay nada.
        if (vacantesLibres.length === 0) {
            setSelectedVacante(null);
        }
        // Eliminamos el else que ponía vacantesLibres[0]

    } catch (err) {
        console.error("Error al cargar vacantes", err);
    } finally {
        setLoading(false);
    }
};

    const fetchChats = useCallback(async () => {
    if (!usuario?.id) return;
    try {
        // CAMBIA /mis-conversaciones/ por /mis-chats/
        const resChats = await API.get(`/mensajeria/mis-chats/egresado/${usuario.id}`);
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

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 1024) setIsSidebarCollapsed(true);
            else setIsSidebarCollapsed(false);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 3. UTILIDADES Y HANDLERS
    const formatDate = (dateString) => {
    if (!dateString) return "Indefinida";
    const date = new Date(dateString);
    // Añadimos el offset para que la fecha visual coincida con la guardada
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return utcDate.toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
};

    const esFechaCercana = (fechaCierre) => {
    if (!fechaCierre) return false;
    
    // Normalizamos "Hoy" a las 00:00:00
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Normalizamos el Cierre a las 00:00:00
    const cierre = new Date(fechaCierre);
    // Ajuste de offset para evitar el salto de día por zona horaria
    const cierreAjustado = new Date(cierre.getTime() + cierre.getTimezoneOffset() * 60000);
    cierreAjustado.setHours(0, 0, 0, 0);

    const diferenciaDias = (cierreAjustado - hoy) / (1000 * 60 * 60 * 24);
    
    // Es urgente si es hoy, mañana, o hasta en 3 días.
    return diferenciaDias >= 0 && diferenciaDias <= 2;
};

    // Función para determinar el estilo y texto de los cupos
const obtenerEstiloCupos = (cupos) => {
    const n = parseInt(cupos);
    if (isNaN(n)) return { clase: '', texto: '' }; // Manejo de error

    if (n <= 2) {
        return { clase: 'cupos-critico', texto: '¡Alerta!' }; // Rojo + Icono parpadeante
    } else if (n === 3) {
        return { clase: 'cupos-warning', texto: '¡Pocos!' }; // Amarillo/Naranja
    }
    // Para 4 o más, no hay texto extra ni color especial
    return { clase: '', texto: '' }; 
};

    const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setShowLogoutModal(false); 
    navigate('/'); 
};

    const abrirChatDesdeVacante = (vacante) => {
    setChatActivo({
        vacanteId: vacante.id,
        empresaId: vacante.empresaId || vacante.empresa?.id,
        titulo: vacante.titulo,
        nombreEmpresa: vacante.empresa?.nombre || 'Empresa'
    });
    setVistaActiva('mensajes');                
};

    const handlePostulacion = async () => {
    if (!selectedVacante) return;
    
    try {
        const res = await API.post(`/estudiantes/${selectedVacante.id}/postular`);
        alert(res.data.message);
        
        // 1. Refrescamos la lista de vacantes (esto la quitará de la izquierda)
        await fetchVacantes(); 
        
        // 2. LA CLAVE: Limpiamos la vacante seleccionada para que el panel 
        // de la derecha vuelva al estado inicial (el de "Selecciona una vacante")
        setSelectedVacante(null); 

    } catch (err) {
        alert(err.response?.data?.error || "Error al postularse");
    }
};

    const getFilteredData = () => {
    const term = searchTerm.toLowerCase();
    if (vistaActiva === 'vacantes') {
        return vacantes.filter(v => 
            (v.titulo.toLowerCase().includes(term) || v.empresa?.nombre.toLowerCase().includes(term)) 
            && v.estado === "ABIERTA"
            // NUEVA LÓGICA: Solo mostrar si el usuario NO está en la lista de postulaciones
            && !v.postulaciones?.some(p => p.egresadoId === usuario?.id)
        );
    }
        return Array.isArray(chatsRecientes) ? chatsRecientes.filter(c => 
            (c.nombreEmpresa || "").toLowerCase().includes(term) ||
            (c.tituloVacante || "").toLowerCase().includes(term)
        ) : [];
    };

    // --- AGREGA ESTO ANTES DE dataFiltrada ---
const navegarAVista = (config) => {
    if (typeof config === 'object') {
        setVistaActiva(config.vista);

        // 1. Lógica para CHATS (Sombra en mensajes)
        if (config.chatData) {
            const vComp = vacantes.find(v => v.id === config.chatData.vacanteId);
            setChatActivo({
                vacanteId: config.chatData.vacanteId,
                empresaId: vComp?.empresaId,
                titulo: vComp?.titulo,
                nombreEmpresa: vComp?.empresa?.nombre,
                resaltarMensajeId: config.chatData.mensajeId 
            });
        }

        // 2. Lógica para POSTULACIONES (Sombra naranja en la tarjeta)
        if (config.postulacionData) {
            // Guardamos el ID en el estado que declaraste al principio
            setResaltarPostulacionId(config.postulacionData.postulacionId);
        }

    } else {
        setVistaActiva(config);
    }
};

    const dataFiltrada = getFilteredData();
    // Coloca esto justo antes del return del componente
// En tu VacantesDashboard.js
const yaPostulado = selectedVacante?.postulaciones?.some(p => p.egresadoId === usuario?.id);

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    const obtenerIniciales = (nombres, apellidos) => {
    if (!nombres) return "U";
    // Toma la primera de nombres y la primera de apellidos
    const inicialNombre = nombres.trim()[0] || "";
    const inicialApellido = apellidos ? apellidos.trim()[0] : "";
    return (inicialNombre + inicialApellido).toUpperCase();
};

return (
    <div className="dashboard-layout">
        {/* SIDEBAR: Diseño Expandible y Sutil */}
        <nav 
            className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}
            onMouseEnter={() => setIsSidebarCollapsed(false)}
            onMouseLeave={() => setIsSidebarCollapsed(true)}
        >
            <div className="sidebar-top">
                <div className="sidebar-menu">
                    <button className={`menu-item ${vistaActiva === 'inicio' ? 'active' : ''}`} onClick={() => navegarAVista('inicio')}>
                        <Home size={20}/> <span>INICIO</span>
                    </button>

                    <button className={`menu-item ${vistaActiva === 'solicitudes' ? 'active' : ''}`} onClick={() => navegarAVista('solicitudes')}>
                        <ClipboardList size={20}/> <span>MIS SOLICITUDES</span>
                    </button>

                    <button className={`menu-item ${vistaActiva === 'vacantes' ? 'active' : ''}`} onClick={() => navegarAVista('vacantes')}>
                        <Briefcase size={20}/> <span>VACANTES DISPONIBLES</span>
                    </button>

                    <button className={`menu-item ${vistaActiva === 'crear-cv' ? 'active' : ''}`} onClick={() => navegarAVista('crear-cv')}>
                        <PlusCircle size={20}/> <span>MI HOJA DE VIDA</span>
                    </button>

                    <button className={`menu-item ${vistaActiva === 'notificaciones' ? 'active' : ''}`} onClick={() => navegarAVista('notificaciones')}>
                        <Bell size={20}/> <span>NOTIFICACIONES</span>
                    </button>

                    <button className={`menu-item ${vistaActiva === 'mensajes' ? 'active' : ''}`} onClick={() => { setChatActivo(null); navegarAVista('mensajes'); }}>
                        <MessageSquare size={20}/> <span>MENSAJES / CHAT</span>
                    </button>
                </div>
            </div>
        </nav>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="glass-container">
            <header className="main-header-container">
                <div className="header-top-bar">
                    <div className="bar-green"></div>
                    <div className="bar-orange"></div>
                </div>
                <div className="header-content">
                    {/* Logos integrados UdeC + Empres360 */}
                    <div className="header-left-brands">
                        <img src={logoGrande} alt="Empres 360 Pro" className="header-brand-logo" />
                        <div className="brand-divider"></div>
                        <img src={logoUdec} alt="UdeC" className="header-udec-logo" />
                    </div>

                    <div className="header-right">
                        <div className="user-profile-info" style={{ position: 'relative' }}>
                            <div className="user-details">
                                <span className="user-full-name">{usuario?.nombres} {usuario?.apellidos}</span>
                                <span className="user-career">Egresado - {usuario?.programa || "UdeC"}</span>
                            </div>
                            <div className="vdp-avatar-container">
                                <div className="user-avatar-initials" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                                    {usuario?.foto ? <img src={usuario.foto} alt="Avatar" /> : <span>{obtenerIniciales(usuario?.nombres, usuario?.apellidos)}</span>}
                                </div>
                                {showProfileDropdown && (
                                    <div className="vdp-dropdown-menu fade-in">
                                        <button className="vdp-dropdown-item" onClick={() => { setVistaActiva('ver-perfil'); setShowProfileDropdown(false); }}>
                                            <User size={18} /> <span>Ver Perfil</span>
                                        </button>
                                        <div className="dropdown-divider"></div>
                                        <button className="vdp-dropdown-item vdp-logout" onClick={() => setShowLogoutModal(true)}>
                                            <LogOut size={16} /> Cerrar Sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

                <main className="content-inner">
                    {vistaActiva === 'notificaciones' && (
    <div className="full-view">
        <NotificacionesEgresado 
            usuarioId={usuario?.id} 
            // Pasamos nuestra nueva función mediadora
            setVistaActiva={navegarAVista} 
        />
    </div>
)}
                    {vistaActiva === 'inicio' && (
        <InicioEgresados 
            usuario={usuario} 
            vacantes={vacantes} 
        />
    )}
                    {vistaActiva === 'solicitudes' && (
    <SolicitudesEgresado 
        vacantes={vacantes} 
        usuarioId={usuario?.id} 
        resaltarPostulacionId={resaltarPostulacionId} // <-- El ID a resaltar
        setResaltarPostulacionId={setResaltarPostulacionId} // <-- Para quitar el brillo luego
    />
)}
                {vistaActiva === 'vacantes' && (
    <div className="vacantes-grid-wrapper fade-in">
        
        {/* 1. CABECERA ESTILO HUB (Toda la pantalla) */}
        <header className="vacantes-grid-header">
            <div className="hub-left">
                <div className="hub-icon-wrapper">
                    <Briefcase size={28} />
                </div>
                <div className="hub-title-text">
                    <h2>Vacantes Disponibles</h2>
                    <p>Explora las mejores oportunidades para tu perfil profesional</p>
                </div>
            </div>
            <div className="hub-right">
                <div className="hub-stat-card">
                    <span className="stat-label">Ofertas encontradas</span>
                    <span className="stat-number">{dataFiltrada.length}</span>
                </div>
            </div>
        </header>

        {/* 2. REJILLA DE TARJETAS (Grid Layout - Ocupa todo el ancho) */}
<div className="vacantes-main-grid">
    {dataFiltrada.length > 0 ? (
        dataFiltrada.map((v) => {
            const cuposDisponibles = v.limitePostulantes ? (v.limitePostulantes - (v._count?.postulaciones || 0)) : null;
            const esUrgente = esFechaCercana(v.fechaCierre);
            const estiloCupos = obtenerEstiloCupos(cuposDisponibles);

 return (
    <div key={v.id} className="vacante-card-compact" onClick={() => setSelectedVacante(v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '20px' }}>
        <div className="card-content-left" style={{ flex: '1 1 auto', maxWidth: 'calc(100% - 70px)' }}>
            
            {/* 1. Encabezado: Icono con fondo y Título Verde UdeC */}
            <div className="card-header-mini" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <div className="hub-icon-wrapper-mini" style={{ background: 'rgba(0, 72, 43, 0.1)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={20} style={{ color: '#00482b' }} />
                </div>
                <h4 className="titulo-vacante" style={{ color: '#00482b', fontWeight: '800', margin: 0, fontSize: '1.15rem', letterSpacing: '-0.5px' }}>
                    {v.titulo}
                </h4>
            </div>

            {/* 2. Info secundaria (Empresa, Ciudad, Publicación) - Limpia y sin fecha de cierre aquí */}
<div className="card-details-row" style={{ 
    display: 'flex', 
    gap: '15px', 
    marginBottom: '15px', 
    color: '#64748b', 
    fontSize: '0.85rem', // Lo bajé un pelín para dar más aire
    alignItems: 'center',
    whiteSpace: 'nowrap' // 👈 Evita que el texto se salte de línea
}}>
    <div className="detail-group" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Building2 size={14} />
        <span>{v.empresa?.nombre || 'Empresa Aliada'}</span>
    </div>
    <span style={{ opacity: 0.3 }}>•</span>
    <div className="detail-group" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <MapPin size={14} />
        <span>{v.ubicacion}</span>
    </div>
    <span style={{ opacity: 0.3 }}>•</span>
    <div className="detail-group" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Calendar size={14} />
        <span>{formatDate(v.fechaCreacion)}</span>
    </div>
</div>

            {/* 3. Fila de Badges UNIFICADA (Salario + Cierre + Cupos) */}
{/* Fila de Badges con texto más pequeño y elegante */}
{/* Fila de Badges con Tooltips (Titles) */}
<div className="card-badges-row" style={{ 
    display: 'flex', 
    gap: '8px', 
    alignItems: 'center', 
    marginTop: '12px',
    flexWrap: 'nowrap' 
}}>
    {/* 1. SALARIO */}
 <div className="badge-salary" title="Salario mensual ofrecido">
    <DollarSign size={12} strokeWidth={2.5} />
    <span style={{ fontWeight: '700' }}>
        {v.salario && !isNaN(parseFloat(v.salario)) 
            ? parseFloat(v.salario).toLocaleString('es-CO') 
            : 'A convenir'}
    </span>
</div>

    {/* 2. FECHA DE CIERRE con Title dinámico */}
{/* 2. FECHA DE CIERRE */}
{v.fechaCierre && (
    <div 
        className={`badge-pill ${esFechaCercana(v.fechaCierre) ? 'fecha-alerta' : 'fecha-normal'}`} 
        title={esFechaCercana(v.fechaCierre) ? "¡Cierra pronto esta vacante!" : "Fecha límite de postulación"}
        style={{ 
            padding: '4px 12px', 
            fontSize: '0.75rem', 
            cursor: 'help',
            display: 'flex',      // 👈 Alinea icono y texto
            alignItems: 'center', // 👈 Los centra verticalmente
            gap: '8px'            // 👈 El espacio que necesitabas
        }}
    >
        <Clock size={12} />
        <span style={{ fontWeight: '700' }}>
            Cierre: {formatDate(v.fechaCierre)}
        </span>
    </div>
)}

{/* 3. CUPOS */}
{cuposDisponibles !== null && (
    <div 
        className={`badge-pill ${estiloCupos.clase}`} 
        title={cuposDisponibles <= 3 ? "¡Quedan pocas vacantes!" : "Cupos disponibles para esta oferta"}
        style={{ 
            padding: '4px 12px', 
            fontSize: '0.75rem', 
            cursor: 'help',
            display: 'flex',      // 👈 Alinea icono y texto
            alignItems: 'center', // 👈 Los centra verticalmente
            gap: '8px'            // 👈 El espacio que necesitabas
        }}
    >
        <Users size={12} />
        <span style={{ fontWeight: '700' }}>
            {cuposDisponibles} {cuposDisponibles === 1 ? 'Vacante' : 'Vacantes'}
        </span>
    </div>
)}
</div>
        </div>

        {/* 4. Acción lateral con la flecha minimalista */}
        <div className="card-action-right" style={{ flex: '0 0 50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="action-circle">
                <ChevronRight size={22} strokeWidth={3} />
            </div>
        </div>
    </div>
);
        })
    ) : (
                <div className="empty-grid-state">
                    <Search size={60} color="#cbd5e0" strokeWidth={1} />
                    <h3>No hay vacantes disponibles</h3>
                    <p>Por el momento no tenemos nuevas ofertas. Intenta actualizar la lista.</p>
                    <button className="btn-refresh-grid" onClick={fetchVacantes}>Actualizar lista</button>
                </div>
            )}
        </div>

        {/* 3. MODAL DE DETALLES (Mantiene todo tu diseño original pero centrado) */}
        {selectedVacante && (
            <div className="vdp-modal-overlay fade-in" onClick={() => setSelectedVacante(null)}>
                <div className="vdp-modal-content scale-up" onClick={(e) => e.stopPropagation()}>
                    
                    <button className="vdp-btn-close" onClick={() => setSelectedVacante(null)}>
                        <XCircle size={28} />
                    </button>

                    <div className="detail-content-wrapper">
                        <div className="detail-header-info">
                            <h3 style={{fontSize: '26px', fontWeight: '800', color: '#1a202c', marginBottom: '20px', letterSpacing: '-0.5px'}}>
                                {selectedVacante.titulo}
                            </h3>
                            
                            {/* Tu Rejilla de Fichas Técnicas original */}
                            {/* Rejilla de Fichas Técnicas dentro del Modal */}
<div className="detail-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '25px' }}>
    
    {/* CUPOS (Añadido aquí) */}
{/* Reemplaza el bloque de CUPOS dentro del Modal por este */}
{selectedVacante.limitePostulantes && (
<span className={`meta-tag-badge ${obtenerEstiloCupos(selectedVacante.limitePostulantes - (selectedVacante._count?.postulaciones || 0)).clase}`}>
    <Users size={14} /> 
    <b>Cupos:</b> {selectedVacante.limitePostulantes - (selectedVacante._count?.postulaciones || 0)} 
    
    {/* CAMBIO AQUÍ: Usamos span con clase específica */}
    <span className="text-alerta-inner">
        { (selectedVacante.limitePostulantes - (selectedVacante._count?.postulaciones || 0)) === 1 
            ? '¡Última vacante!' 
            : (obtenerEstiloCupos(selectedVacante.limitePostulantes - (selectedVacante._count?.postulaciones || 0)).texto) 
        }
    </span>
</span>
)}

    <span className="meta-tag-badge badge-published">
        <MapPin size={14} /> <b>Ubicación:</b> {selectedVacante.ubicacion}
    </span>
    
    <span className="meta-tag-badge badge-published">
        <FileText size={14} /> <b>Contrato:</b> {selectedVacante.tipo}
    </span>
    
    <span className="meta-tag-badge badge-published">
        <Globe size={14} /> <b>Modalidad:</b> {selectedVacante.modalidad}
    </span>
    
    <span className="meta-tag-badge badge-slots">
        <DollarSign size={14} /> 
        <b>SALARIO:</b> {selectedVacante.tipoSalario === 'A convenir' ? 'A convenir' : `$${parseFloat(selectedVacante.salario).toLocaleString('es-CO')}`}
    </span>
    
    <span className="meta-tag-badge badge-published">
        <Clock size={14} /> <b>Jornada:</b> {selectedVacante.jornada || 'No definida'}
    </span>

{/* Reemplaza el span de Cierre por este */}
{selectedVacante.fechaCierre && (
    <span className={`meta-tag-badge ${esFechaCercana(selectedVacante.fechaCierre) ? 'fecha-alerta' : 'badge-published'}`}>
        <Clock size={14} /> 
        <b>{esFechaCercana(selectedVacante.fechaCierre) ? '¡CIERRA PRONTO!:' : 'Cierre:'}</b> 
        <span style={{ marginLeft: '4px' }}>{formatDate(selectedVacante.fechaCierre)}</span>
    </span>
)}

    {/* HORARIO Y PUBLICACIÓN */}
    <span className="meta-tag-badge badge-published">
        <Calendar size={14} /> <b>Publicado:</b> {formatDate(selectedVacante.fechaCreacion)}
    </span>
    <span className="meta-tag-badge badge-published">
        <Clock size={14} /> <b>Horario:</b> {selectedVacante.horario || 'Lunes a Viernes'}
    </span>
</div>
                        </div>

<div className="detail-body-text" style={{background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '30px', marginBottom: '20px'}}>
    <strong style={{display: 'block', marginBottom: '12px', color: '#1e293b', fontSize: '17px'}}>
        Descripción de la vacante:
    </strong>

    {/* Bloque de descripción optimizado */}
    <div 
        className="ql-editor-view" 
        dangerouslySetInnerHTML={{ __html: selectedVacante.descripcion || "Sin descripción disponible." }} 
    />
</div>

                        <div className="actions-footer" style={{marginTop: '10px', display: 'flex', gap: '15px'}}>
                            {yaPostulado ? (
                                <div className="already-applied-banner" style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#f0fdf4', color: '#166534', padding: '15px', borderRadius: '12px', border: '1px solid #bbf7d0', fontWeight: '600'}}>
                                    <CheckCircle size={20} /> <span>Ya estás participando en este proceso</span>
                                </div>
                            ) : (
                                <button className="btn-apply-main" onClick={handlePostulacion} style={{flex: 1, padding: '16px', fontWeight: '700', fontSize: '15px'}}>
                                    POSTULARME AHORA
                                </button>
                            )}
                            <button className="btn-cv-secondary" onClick={() => setVistaActiva('crear-cv')} style={{padding: '16px', fontWeight: '600'}}>
                                VER MI HOJA DE VIDA
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
)}

                    {vistaActiva === 'crear-cv' && <div className="full-view"><CrearCV isInline={true} setVistaActiva={setVistaActiva} /></div>}
                    
    {vistaActiva === 'ver-perfil' && (
        <div className="vdp-full-screen-view">
            <PerfilEgresado />
        </div>
    )}
{vistaActiva === 'mensajes' && (
    <div style={{ 
        height: 'calc(100vh - 140px)', // Ajusta el '140px' según el alto de tu header azul
        width: '100%',
        padding: '20px', // Espaciado para que no toque los bordes de la pantalla
        boxSizing: 'border-box'
    }}>
        <Mensajeria 
            usuario={usuario} 
            activeChat={chatActivo} 
            onClose={() => setChatActivo(null)} 
        />
    </div>
)}
                </main>
            </div>

            <ConfirmacionLogout 
                isOpen={showLogoutConfirm} 
                onConfirm={handleLogout} 
                onCancel={() => setShowLogoutConfirm(false)} 
            />

            {showLogoutModal && (
    <div className="modal-overlay">
        <div className="logout-modal">
            <div className="modal-icon">
                <LogOut size={40} />
            </div>
            <h3>¿Cerrar sesión?</h3>
            <p>Se cerrará tu sesión actual y tendrás que volver a ingresar.</p>
            <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowLogoutModal(false)}>
                    Cancelar
                </button>
                <button className="btn-confirm" onClick={handleLogout}>
                    Cerrar sesión
                </button>
            </div>
        </div>
    </div>
)}
        </div>
    );
}