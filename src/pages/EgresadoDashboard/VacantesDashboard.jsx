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
    User,        // <--- Asegúrate que esté aquí una sola vez
    UserCircle,  // <--- Añade los nuevos aquí
    Settings
} from 'lucide-react';

import Mensajeria from '../../components/Chat-Vacantes'; 
import CrearCV from '../CrearCV'; 
import ConfirmacionLogout from '../../components/ConfirmacionLogout'; 
import './VacantesDashboard.css'; 
import PerfilEgresado from '../../components/PerfilEgresado'; // Ajusta la ruta según tu carpeta
import SolicitudesEgresado from '../../components/SolicitudesEgresado';
import InicioEgresados from '../../components/InicioEgresados';
import NotificacionesEgresado from '../../components/NotificacionesEgresado';


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
    return diferenciaDias >= 0 && diferenciaDias <= 3;
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
        <div className={`dashboard-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            
            {/* SIDEBAR CORREGIDO (UN SOLO NAV) */}
            <nav className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-top">
                    <div className="logo-section">
    <div className="platform-logo-container">
        {isSidebarCollapsed ? (
            /* Logo tipo icono para sidebar cerrado */
            <img 
                src={logoPequeño} 
                alt="Icono" 
                className="logo-icon-collapsed fade-in" 
            />
        ) : (
            /* Logo completo para sidebar abierto */
            <img 
                src={logoGrande} 
                alt="Empres 360 Pro" 
                className="logo-full-expanded fade-in" 
            />
        )}
    </div>
</div>
                    <div className="sidebar-menu">
    {/* Inicio */}
    <button 
        className={`menu-item ${vistaActiva === 'inicio' ? 'active' : ''}`} 
        onClick={() => navegarAVista('inicio')}
    >
        <Home size={18}/> <span>INICIO</span>
    </button>

    {/* Solicitudes */}
    <button 
        className={`menu-item ${vistaActiva === 'solicitudes' ? 'active' : ''}`} 
        onClick={() => navegarAVista('solicitudes')}
    >
        <ClipboardList size={18}/> <span>MIS SOLICITUDES</span>
    </button>

    {/* Vacantes */}
    <button 
        className={`menu-item ${vistaActiva === 'vacantes' ? 'active' : ''}`} 
        onClick={() => navegarAVista('vacantes')}
    >
        <Briefcase size={18}/> <span>VACANTES DISPONIBLES</span>
    </button>

    {/* Hoja de Vida */}
    <button 
        className={`menu-item ${vistaActiva === 'crear-cv' ? 'active' : ''}`} 
        onClick={() => navegarAVista('crear-cv')}
    >
        <PlusCircle size={18}/> <span>MI HOJA DE VIDA</span>
    </button>

    {/* Notificaciones */}
    <button 
        className={`menu-item ${vistaActiva === 'notificaciones' ? 'active' : ''}`} 
        onClick={() => navegarAVista('notificaciones')}
    >
        <Bell size={18}/> <span>NOTIFICACIONES</span>
    </button>

    {/* Mensajes / Chat */}
    <button 
        className={`menu-item ${vistaActiva === 'mensajes' ? 'active' : ''}`} 
        onClick={() => {
            // Cuando el usuario hace clic manualmente, queremos que se limpie 
            // el chat activo para ver la lista completa de conversaciones.
            setChatActivo(null); 
            navegarAVista('mensajes');
        }}
    >
        <MessageSquare size={18}/> <span>MENSAJES / CHAT</span>
    </button>
</div>
                </div>

                <div className="sidebar-footer">
                    <button className="collapse-btn-footer" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
    <div className="btn-content">
        <ChevronRight size={20} className={`icon-transition ${isSidebarCollapsed ? "" : "rotate-180"}`} />
        {/* Este span es el que se convertirá en tooltip al contraer */}
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
    {/* Franja superior de colores */}
    <div className="header-top-bar">
        <div className="bar-green"></div>
        <div className="bar-orange"></div>
    </div>

    {/* Franja inferior blanca con contenido */}
    <div className="header-content">
    {/* LADO IZQUIERDO: LOGO (Se queda igual) */}
    <div className="header-left">
        <div className="udec-brand">
            <img src={logoUdec} alt="Logo UdeC" className="header-logo-img" />
        </div>
    </div>

    {/* CENTRO: BUSCADOR (Lo movimos aquí) */}
    <div className="header-center">
        <div className="search-wrapper">
            <Search size={18} className="search-icon-inside" />
            <input type="text" placeholder="Buscar" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
    </div>

    {/* LADO DERECHO: PERFIL Y SETTINGS (Lo movimos aquí) */}
    <div className="header-right">
    <div className="user-profile-info">
        <div className="user-details">
            <span className="user-full-name">
                {usuario?.nombres} {usuario?.apellidos}
            </span>
            <span className="user-career">
    Egresado - {usuario?.programa || "Sin programa registrado"}
</span>
        </div>
        
        {/* Contenedor del Avatar con Dropdown */}
        <div className="vdp-avatar-container" style={{ position: 'relative' }}>
            <div 
                className="user-avatar-initials" 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                style={{ cursor: 'pointer' }}
            >
                {usuario?.foto ? (
                    <img src={usuario.foto} alt="Avatar" />
                ) : (
                    <span>{obtenerIniciales(usuario?.nombres, usuario?.apellidos)}</span>
                )}
            </div>

            {/* Menú Desplegable */}
            {showProfileDropdown && (
                <div className="vdp-dropdown-menu">
                    <div className="vdp-dropdown-header">
                        <strong>Mi Cuenta</strong>
                    </div>
                    <button 
    className="vdp-dropdown-item" 
    onClick={() => {
        setVistaActiva('ver-perfil');
        setShowProfileDropdown(false);
    }}
>
    <User size={18} className="vdp-icon-green" /> 
    <span>Ver Perfil</span>
</button>

<button 
    className="vdp-dropdown-item" 
    onClick={() => {
        setVistaActiva('ajustes');
        setShowProfileDropdown(false);
    }}
>
    <Settings size={18} className="vdp-icon-green" /> 
    <span>Ajustes</span>
</button>
                    <hr className="vdp-dropdown-divider" />
                    <button 
                        className="vdp-dropdown-item vdp-logout" 
                        onClick={() => setShowLogoutModal(true)}
                    >
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
                        <div className="vacantes-view-container">
                            <section className="vacantes-list-panel">
    <div className="section-title-container">
    <Briefcase size={28} className="title-icon" />
    <h2>
        VACANTES DISPONIBLES 
        <span className="vacantes-count-badge">{dataFiltrada.length}</span>
    </h2>
</div>
                                <div className="scrollable-cards">
                                    {dataFiltrada.map((v) => {
                                        const cuposDisponibles = v.limitePostulantes ? (v.limitePostulantes - (v._count?.postulaciones || 0)) : null;
                                        const esUrgente = esFechaCercana(v.fechaCierre);

                                        return (
                                            <div key={v.id} className={`vacante-card-item ${selectedVacante?.id === v.id ? 'active' : ''}`} onClick={() => setSelectedVacante(v)}>
                                                <div className="card-main-info">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
    {/* Icono de Maletín para el Título de la Vacante */}
    <div className="card-role-icon" style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}>
        <Briefcase size={18} strokeWidth={2.5} />
    </div>
    
    <h4 style={{ 
        fontSize: '16px', 
        fontWeight: '700', 
        color: '#1a202c', 
        margin: '0',
        lineHeight: '1.2' 
    }}>
        {v.titulo}
    </h4>
</div>
                                                    {/* CONTENEDOR DE UNA SOLA LÍNEA (Empresa | Ubicación | Fecha) */}
<div className="card-info-row" style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px', 
    marginBottom: '10px',
    flexWrap: 'wrap' // Permite que baje si la pantalla es muy pequeña
}}>
    
    {/* 1. NOMBRE DE LA EMPRESA */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Building2 size={14} style={{ color: '#006b3f' }} />
        <span style={{ 
            fontSize: '13px', 
            fontWeight: '700', 
            color: '#1a202c', 
            textTransform: 'uppercase'
        }}>
            {v.empresa?.nombre || 'Empresa Aliada'}
        </span>
    </div>

    {/* Separador barra vertical */}
    <span style={{ color: '#cbd5e0', fontSize: '14px' }}>|</span>

    {/* 2. UBICACIÓN (Estilo limpio sin fondo para no saturar la línea) */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4a5568', fontSize: '12px', fontWeight: '500' }}>
        <MapPin size={13} style={{ color: '#3182ce' }} />
        <span>{v.ubicacion}</span>
    </div>

    {/* Separador barra vertical */}
    <span style={{ color: '#cbd5e0', fontSize: '14px' }}>|</span>

    {/* 3. FECHA DE PUBLICACIÓN */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#718096', fontSize: '12px' }}>
        <Calendar size={13} style={{ color: '#a0aec0' }} />
        <span>Publicado: {formatDate(v.fechaCreacion)}</span>
    </div>
</div>
                                                    <div className="card-meta-tags" style={{display: 'flex', gap: '6px', flexWrap: 'wrap'}}>
                                                        <span style={{display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569'}}>
                                                            <DollarSign size={12} style={{marginRight: '4px'}} />
                                                            {v.salario && !isNaN(parseFloat(v.salario)) ? `${parseFloat(v.salario).toLocaleString('es-CO')}` : 'A convenir'}
                                                        </span>
                                                        {/* Dentro de scrollable-cards -> dataFiltrada.map */}
{cuposDisponibles !== null && (
    <span 
        className={`badge-slots ${obtenerEstiloCupos(cuposDisponibles).clase}`} 
        style={{display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600'}}
    >
        <Users size={12} style={{marginRight: '4px'}} /> 
        {cuposDisponibles} cupos
        {obtenerEstiloCupos(cuposDisponibles).texto && (
            <b style={{marginLeft: '4px'}}>{obtenerEstiloCupos(cuposDisponibles).texto}</b>
        )}
    </span>
)}
                                                        <span 
    className={`badge-deadline ${esFechaCercana(v.fechaCierre) ? 'fecha-urgente' : ''}`} 
    style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500' }}
>
    <Clock size={12} style={{ marginRight: '6px' }} /> 
    
    {/* 1. Texto de urgencia en negrita al inicio */}
    {esFechaCercana(v.fechaCierre) ? (
        <>
            {/* 1. Primero la fecha con formato discreto */}
            <span style={{ marginRight: '4px' }}>
                ({formatDate(v.fechaCierre)})
            </span>

            {/* 2. Luego el aviso de urgencia en negrita */}
            <b style={{ fontWeight: '700', textTransform: 'uppercase' }}>
                ¡Pronto!
            </b>
        </>
    ) : (
        `Cierre: ${formatDate(v.fechaCierre)}`
    )}

    {/* 2. Icono de Alerta al FINAL (solo si es urgente) */}
    {esFechaCercana(v.fechaCierre) && (
        <AlertTriangle 
            size={13} 
            className="blink-icon" 
            style={{ marginLeft: '6px', color: '#dc2626' }} 
        />
    )}
</span>
                                                    </div>
                                                </div>
                                                <button className="btn-details-action" style={{marginTop: '12px', padding: '6px 12px', fontSize: '12px'}}>Ver Detalles</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            <aside className="vacante-detail-panel">
                                {selectedVacante ? (
                                    <div className="detail-content-wrapper fade-in" key={selectedVacante.id}>
                                        <div className="detail-header-info">
                                            <h3 style={{fontSize: '22px', color: '#1a202c', marginBottom: '15px'}}>{selectedVacante.titulo}</h3>
                                            
                                            
                                            <div className="detail-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
    
    {/* 1. UBICACIÓN */}
    <span className="meta-tag-badge badge-published">
        <MapPin size={14} style={{marginRight: '6px'}} /> <b>Ubicación:</b> {selectedVacante.ubicacion}
    </span>

    {/* 2. CONTRATO */}
    <span className="meta-tag-badge badge-published">
        <FileText size={14} style={{marginRight: '6px'}} /> <b>Contrato:</b> {selectedVacante.tipo}
    </span>

    {/* 3. MODALIDAD */}
    <span className="meta-tag-badge badge-published">
        <Globe size={14} style={{marginRight: '6px'}} /> <b>Modalidad:</b> {selectedVacante.modalidad}
    </span>

    {/* 4. SALARIO (Lógica mejorada con tipoSalario) */}
    <span className="meta-tag-badge badge-slots">
        <DollarSign size={14} style={{marginRight: '6px'}} /> 
        <b>SALARIO:</b> {selectedVacante.tipoSalario === 'A convenir' 
            ? 'A convenir' 
            : (selectedVacante.salario && !isNaN(parseFloat(selectedVacante.salario)) 
                ? `${parseFloat(selectedVacante.salario).toLocaleString('es-CO')}` 
                : (selectedVacante.tipoSalario || 'A convenir'))
        }
    </span>

    {/* 5. PUBLICADO */}
    <span className="meta-tag-badge badge-published">
        <Calendar size={14} style={{marginRight: '6px'}} /> <b>Publicado:</b> {formatDate(selectedVacante.fechaCreacion)}
    </span>

    {/* 6. JORNADA (Nuevo campo) */}
    <span className="meta-tag-badge badge-published">
        <Clock size={14} style={{marginRight: '6px'}} /> <b>Jornada:</b> {selectedVacante.jornada || 'No definida'}
    </span>

    {/* 7. CUPOS (Mantiene tu lógica original) */}
    {selectedVacante.limitePostulantes && (
        <span className={`meta-tag-badge badge-slots ${obtenerEstiloCupos(selectedVacante.limitePostulantes - (selectedVacante._count?.postulaciones || 0)).clase}`}>
            <Users size={14} style={{ marginRight: '6px' }} />
            <b>CUPOS:</b> {selectedVacante.limitePostulantes - (selectedVacante._count?.postulaciones || 0)}
            
            {obtenerEstiloCupos(selectedVacante.limitePostulantes - (selectedVacante._count?.postulaciones || 0)).texto && (
                <b style={{ marginLeft: '5px' }}>
                    {obtenerEstiloCupos(selectedVacante.limitePostulantes - (selectedVacante._count?.postulaciones || 0)).texto}
                </b>
            )}

            {obtenerEstiloCupos(selectedVacante.limitePostulantes - (selectedVacante._count?.postulaciones || 0)).texto && (
                <AlertTriangle 
                    size={16} 
                    className={(selectedVacante.limitePostulantes - (selectedVacante._count?.postulaciones || 0)) <= 2 ? "blink-icon" : ""} 
                    style={{ 
                        marginLeft: '8px', 
                        color: (selectedVacante.limitePostulantes - (selectedVacante._count?.postulaciones || 0)) <= 2 ? '#dc2626' : '#a16207' 
                    }} 
                />
            )}
        </span>
    )}

    {/* 8. CIERRE (Mantiene tu lógica de urgencia y tooltip) */}
    <span className={`meta-tag-badge badge-deadline ${esFechaCercana(selectedVacante.fechaCierre) ? 'urgent' : ''}`}>
    <Clock size={14} style={{ marginRight: '6px' }} />
    <b>Cierre:</b> <span>{formatDate(selectedVacante.fechaCierre)}</span>

    {esFechaCercana(selectedVacante.fechaCierre) && (
        <div className="tooltip-container">
            <AlertTriangle 
                size={16} 
                className="blink-icon" 
                style={{ marginLeft: '6px', color: '#dc2626', cursor: 'pointer' }} 
            />
            <span className="tooltip-text">¡Esta vacante cierra muy pronto!</span>
        </div>
    )}
</span>

    {/* 9. HORARIO (Nuevo campo) */}
    <span className="meta-tag-badge badge-published">
        <Calendar size={14} style={{marginRight: '6px'}} /> <b>Horario:</b> {selectedVacante.horario || 'Ver descripción'}
    </span>
</div>
                                        </div>

                                        <div className="detail-body-text" style={{background: '#fcfcfc', border: '1px solid #f0f0f0', borderRadius: '12px', padding: '20px'}}>
                                            <strong style={{display: 'block', marginBottom: '10px', color: '#2d3748', fontSize: '15px'}}>Descripción de la vacante:</strong>
                                            <p style={{fontSize: '14px', lineHeight: '1.7', color: '#4a5568'}}>{selectedVacante.descripcion}</p>
                                        </div>

                                        <div className="actions-footer" style={{marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
    
    {yaPostulado ? (
        /* Este bloque evita que el usuario haga clic de nuevo */
        <div className="already-applied-banner">
            <div className="applied-content">
                <div className="applied-icon-wrapper">
                    <FileText size={18} style={{ color: '#16a34a' }} />
                </div>
                <div className="applied-text">
                    <span className="applied-title">Postulación enviada</span>
                    <p>Ya estás participando en este proceso de selección.</p>
                </div>
            </div>
            <div className="applied-status-tag">Enviado</div>
        </div>
    ) : (
        /* Solo mostramos el botón si NO está postulado */
        <button className="btn-apply-main" onClick={handlePostulacion}>
            POSTULARME AHORA
        </button>
    )}

    <button className="btn-cv-secondary" onClick={() => setVistaActiva('crear-cv')}>
        MI HOJA DE VIDA
    </button>
                                            <div className="drag-drop-area" style={{border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center', background: '#f9fafb'}}>
                                                <span style={{fontSize: '13px', color: '#718096'}}>Subir archivos adicionales</span>
                                                <small style={{display: 'block', color: '#a0aec0', marginTop: '4px'}}>Drag and drop</small>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="no-selection-state">
            {dataFiltrada.length > 0 ? (
                /* CASO A: Hay vacantes en la lista, pero no ha tocado ninguna */
                <div className="empty-selection-content fade-in">
                    <div className="icon-pulse-container">
                        <Search size={60} color="#006b3f" strokeWidth={1.5} />
                    </div>
                    <h3>Explora las Vacantes</h3>
                    <p>
                        Hay <strong>{dataFiltrada.length}</strong> ofertas esperando por ti. 
                        Selecciona una de la lista para ver los detalles y postularte.
                    </p>
                    <div className="selection-hint">
                        <span>Haz clic en una vacante de la izquierda</span>
                    </div>
                </div>
            ) : (
                /* CASO B: Realmente no hay vacantes disponibles (Tu código original) */
                <div className="no-vacantes-content fade-in">
                    <Briefcase size={60} color="#cbd5e0" strokeWidth={1} />
                    <h3>No hay vacantes disponibles</h3>
                    <p>Por el momento no tenemos nuevas ofertas o ya te has postulado a todas las activas.</p>
                    <button className="btn-refresh" onClick={fetchVacantes}>
                        Actualizar lista
                    </button>
                </div>
            )}
        </div>
    )}
</aside>
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