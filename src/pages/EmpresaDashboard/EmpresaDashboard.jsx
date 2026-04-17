import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom"; 
import API from "../../services/api"; 
import logoUdec from '../../assets/UdeC2.png';
import logoGrande from '../../assets/Logo2.png'; 
import logoPequeño from '../../assets/Logo3.png';
import ListaPostulacionesTable from "../../components/ListaPostulacionesTable";
import TotalPostulaciones from "./TotalPostulaciones"; // Ajusta la ruta si es necesario


import { 
    LogOut, MessageSquare, Briefcase, PlusCircle, 
    Building2, Users, Edit3, Trash2, Eye, MapPin, 
    FileText, CheckCircle, XCircle, Clock, ArrowLeft, BarChart3,
    Search, ChevronRight, Home, Bell, ClipboardList, User, Calendar, AlertTriangle
} from 'lucide-react';

import "./EmpresaDashboard.css"; 
import ChatSidebar from "../../components/ChatSidebar"; 
import ChatWidget from "../../components/ChatWidget";
import VerCV from "../../components/verCV";
import PerfilEmpresa from "../../components/PerfilEmpresa";
import EmpresaMetricas from './EmpresaMetricas';
import { toast } from 'react-toastify';

export default function EmpresaDashboard() {
    const location = useLocation();
    const navigate = useNavigate();

    const [fechaDesde, setFechaDesde] = useState("");
const [fechaHasta, setFechaHasta] = useState("");
const [showFilters, setShowFilters] = useState(true); 
// --- ESTADOS ---
const [showProfileMenu, setShowProfileMenu] = useState(false); // 👈 Nuevo estado
const [confirmarEliminar, setConfirmarEliminar] = useState({ visible: false, vacanteId: null, titulo: "" });
const [vacanteAnimadaId, setVacanteAnimadaId] = useState(null);
const conteoReferencia = React.useRef({});
    
    const PIPELINE_STAGES = {
    PENDIENTE: { label: 'pendiente', color: '#64748b', bg: '#f1f5f9' },    // Gris
    REVISION: { label: 'Revisión CV', color: '#0ea5e9', bg: '#e0f2fe' }, // Azul
    ENTREVISTA: { label: 'Entrevista', color: '#8b5cf6', bg: '#f5f3ff' },  // Morado
    PRUEBA: { label: 'Prueba', color: '#f59e0b', bg: '#fffbeb' },  // Naranja
    FINALISTA: { label: 'Finalista', color: '#10b981', bg: '#ecfdf5' },    // Esmeralda
    CONTRATADO: { label: 'Contratado', color: '#006b3f', bg: '#f0fdf4' },  // Verde UdeC
    RECHAZADO: { label: 'Descartado', color: '#ef4444', bg: '#fef2f2' }    // Rojo
};
    // --- ESTADOS ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
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
    const [openDropdown, setOpenDropdown] = useState(null); 
    const [avisoSalida, setAvisoSalida] = useState({ visible: false, proximaTab: null });

    const [nuevaVacante, setNuevaVacante] = useState({
    titulo: "", 
    descripcion: "", 
    ubicacion: "", 
    tipo: "",        // Tipo de Contrato
    modalidad: "", 
    salario: "", 
    tipoSalario: "",
    mostrarOtroContrato: false, // <-- Nuevo
    mostrarOtraJornada: false,  // <-- Nuevo
    mostrarOtroSalario: false,   // <-- Nuevo
    jornada: "",       // <-- Nuevo
    horario: "",       // <-- Nuevo
    fechaCierre: "", 
    limitePostulantes: "",
});

const limpiarFiltros = () => {
    setSearchTerm("");
    setFechaDesde("");
    setFechaHasta("");
    toast.info("Filtros restablecidos");
};

    // --- LÓGICA DE DATOS ---
const cargarVacantes = useCallback(() => {
    if (empresa?.id) {
        API.get(`/vacantes/empresa/${empresa.id}`)
            .then((res) => {
                setVacantes(res.data);
                
                // 🔥 ESTO ES CLAVE: Llenamos el conteo inicial para que el polling 
                // tenga contra qué comparar desde el segundo 1.
                res.data.forEach(v => {
                    if (!conteoReferencia.current[v.id]) {
                        conteoReferencia.current[v.id] = v._count?.postulaciones || 0;
                    }
                });

                const total = res.data.reduce((acc, v) => acc + (v._count?.postulaciones || 0), 0);
                setPrevTotalPostulaciones(prev => prev === 0 ? total : prev);
            })
            .catch((err) => console.error("Error al cargar vacantes:", err));
    }
}, [empresa?.id]);

    // 3. TODOS los useEffect (MUEVE EL DE CLOSEALL AQUÍ ARRIBA)
    useEffect(() => {
    const closeAll = () => setOpenDropdown(null);
    window.addEventListener('click', closeAll);
    return () => window.removeEventListener('click', closeAll);
}, []);

const [perfilParaDescargaDirecta, setPerfilParaDescargaDirecta] = useState(null);

const handleDescargaDirecta = (usuario) => {
    setPerfilParaDescargaDirecta(usuario);
    // Esperamos un momento breve para que el componente se monte en el DOM invisible
    setTimeout(() => {
        const btnOculto = document.getElementById("btn-trigger-pdf-hidden");
        if (btnOculto) {
            btnOculto.click();
            // Limpiamos el estado después de generar el PDF
            setTimeout(() => setPerfilParaDescargaDirecta(null), 1000);
        }
    }, 300);
};

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



    // Carga inicial
    useEffect(() => {
        if (!empresa) {
            navigate('/'); 
        } else {
            cargarVacantes();
            setLoading(false);
        }
    }, [empresa, navigate, cargarVacantes]);

    // Control de Sidebar Responsive corregido
useEffect(() => {
    const handleResize = () => {
        // Solo forzamos el colapso si la pantalla es pequeña (móvil/tablet)
        // Pero si es grande, dejamos que el estado inicial (true) mande.
        if (window.innerWidth <= 1024) {
            setIsSidebarCollapsed(true);
        }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
}, []);

    const handleVerPostulaciones = async (vacanteId) => {
    setVacanteSeleccionadaId(vacanteId);
    try {
        const res = await API.get(`/postulaciones/vacante/${vacanteId}`);
        
        // ✅ LIMPIEZA: Eliminamos el parse de localStorage.
        // res.data ya contiene el campo "anclado: true/false" desde PostgreSQL.
        setPostulaciones(res.data);
        
        // Actualizamos el contador de la tarjeta izquierda
        setVacantes(prevVacantes => 
            prevVacantes.map(v => 
                v.id === vacanteId 
                ? { ...v, _count: { ...v._count, postulaciones: res.data.length } } 
                : v
            )
        );
    } catch (err) {
        console.error("Error al cargar postulaciones:", err);
        setPostulaciones([]);
    }
};

const checkNewPostulaciones = useCallback(async () => {
    if (!empresa?.id || vacantes.length === 0) return;

    try {
        const res = await API.get(`/vacantes/empresa/${empresa.id}`);
        const vacantesNuevas = res.data;
        let huboNovedad = false;

        vacantesNuevas.forEach((vNueva) => {
            const cantidadPrevia = conteoReferencia.current[vNueva.id] || 0;
            const cantidadActual = vNueva._count?.postulaciones || 0;

            if (cantidadActual > cantidadPrevia) {
                setVacanteAnimadaId(vNueva.id);
                huboNovedad = true;

                toast.info(`🚀 ¡Nueva postulación: ${vNueva.titulo}!`, {
                    position: "bottom-right",
                    autoClose: 5000,
                });

                const audio = new Audio('/sounds/notification.mp3');
                audio.play().catch(err => console.log("Audio bloqueado:", err));

                setTimeout(() => setVacanteAnimadaId(null), 7000);
            }
            conteoReferencia.current[vNueva.id] = cantidadActual;
        });

        if (huboNovedad) {
            setVacantes(vacantesNuevas);
            if (vacanteSeleccionadaId) {
                handleVerPostulaciones(vacanteSeleccionadaId);
            }
        }
    } catch (error) {
        console.error("Error en polling:", error);
    }
}, [empresa?.id, vacantes, vacanteSeleccionadaId]); 

    // Intervalo de revisión (Polling)
    useEffect(() => {
        const interval = setInterval(() => {
            checkNewPostulaciones();
        }, 30000); 
        return () => clearInterval(interval);
    }, [checkNewPostulaciones]);

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
            setNuevaVacante({ 
    titulo: "", descripcion: "", ubicacion: "", tipo: "", modalidad: "", 
    salario: "", tipoSalario: "", jornada: "", horario: "", // <--- Limpiar nuevos
    fechaCierre: "", limitePostulantes: "" , mostrarOtroContrato: false,
        mostrarOtraJornada: false,
        mostrarOtroSalario: false
});
            cargarVacantes();
            setActiveTab("gestion");
        } catch (err) { 
            toast.error("Error al publicar la vacante"); 
        }
    };

    const handleUpdate = async (e) => {
    e.preventDefault();
    try {
        const vacanteData = {
            ...editandoVacante,
            limitePostulantes: editandoVacante.limitePostulantes ? parseInt(editandoVacante.limitePostulantes) : null
        };

        await API.put(`/vacantes/${editandoVacante.id}`, vacanteData);
        
        toast.success("¡Vacante actualizada correctamente!");
        
        // Limpiar estado y volver a la pestaña de gestión
        setEditandoVacante(null);
        cargarVacantes(); // Recargar la lista para ver los cambios
        setActiveTab("gestion");
        window.scrollTo(0, 0);
    } catch (err) {
        console.error(err);
        toast.error("Error al actualizar la vacante");
    }
};

    // --- CORRECCIÓN 5: Logout limpio ---
const handleLogout = () => {
    localStorage.removeItem('usuario'); // Es más seguro borrar solo la clave
    localStorage.removeItem('token');   // Si usas token
    setEmpresa(null);
    setVacantes([]);
    setPostulaciones([]);
    setShowLogoutModal(false);
    navigate('/', { replace: true }); 
};

    const handlePrepararEdicion = (vacante) => {
    setEditandoVacante({ 
        ...vacante, 
        // Aseguramos que nada sea null para que coincida con los inputs
        titulo: vacante.titulo || "",
        descripcion: vacante.descripcion || "",
        salario: vacante.salario || "",
        limitePostulantes: vacante.limitePostulantes || "",
        fechaCierre: vacante.fechaCierre ? vacante.fechaCierre.split('T')[0] : "",
        mostrarOtroContrato: false,
        mostrarOtraJornada: false,
        mostrarOtroSalario: false
    });
    setActiveTab("edicion");
};

    const handleEliminarVacante = (vacanteId, titulo) => {
    // En lugar de alert, abrimos el modal personalizado
    setConfirmarEliminar({ visible: true, vacanteId, titulo });
};

// Nueva función para ejecutar la eliminación real
const ejecutarEliminacion = async () => {
    const { vacanteId } = confirmarEliminar;
    try {
        await API.delete(`/vacantes/${vacanteId}`);
        toast.success("Vacante eliminada exitosamente");
        cargarVacantes();
        if (vacanteSeleccionadaId === vacanteId) setVacanteSeleccionadaId(null);
    } catch (err) { 
        toast.error("No se pudo eliminar la vacante"); 
    } finally {
        setConfirmarEliminar({ visible: false, vacanteId: null, titulo: "" });
    }
};

    // --- LÓGICA DE VALIDACIÓN DE CAMBIOS ---
// --- LÓGICA DE VALIDACIÓN DE CAMBIOS (CORREGIDA) ---
const tieneCambios = React.useMemo(() => {
    if (!editandoVacante) return false;

    const original = vacantes.find(v => v.id === editandoVacante.id);
    if (!original) return false;

    // Función auxiliar para comparar valores evitando errores null vs ""
    const comparar = (val1, val2) => {
        const v1 = val1 ?? ""; // Si es null o undefined, usa string vacío
        const v2 = val2 ?? "";
        return String(v1).trim() === String(v2).trim();
    };

    const fechaOriginal = original.fechaCierre ? original.fechaCierre.split('T')[0] : "";
    
    // Si TODOS los campos son iguales, retorna FALSE (no hay cambios)
    const iguales = 
        comparar(editandoVacante.titulo, original.titulo) &&
        comparar(editandoVacante.descripcion, original.descripcion) &&
        comparar(editandoVacante.ubicacion, original.ubicacion) &&
        comparar(editandoVacante.modalidad, original.modalidad) &&
        comparar(editandoVacante.tipo, original.tipo) &&
        comparar(editandoVacante.jornada, original.jornada) &&
        comparar(editandoVacante.horario, original.horario) &&
        comparar(editandoVacante.tipoSalario, original.tipoSalario) &&
        comparar(editandoVacante.salario, original.salario) &&
        comparar(editandoVacante.limitePostulantes, original.limitePostulantes) &&
        comparar(editandoVacante.fechaCierre, fechaOriginal);

    return !iguales; // Si no son iguales, entonces tiene cambios
}, [editandoVacante, vacantes]);

// --- LÓGICA PARA HABILITAR BOTÓN DE PUBLICACIÓN ---
const formularioCreacionCompleto = React.useMemo(() => {
    return (
        nuevaVacante.titulo.trim() !== "" &&
        nuevaVacante.descripcion.trim() !== "" &&
        nuevaVacante.ubicacion.trim() !== "" &&
        nuevaVacante.tipo !== "" &&
        nuevaVacante.jornada !== "" &&
        nuevaVacante.modalidad !== "" &&
        nuevaVacante.tipoSalario !== "" &&
        nuevaVacante.horario.trim() !== "" &&
        nuevaVacante.fechaCierre !== "" &&
        nuevaVacante.limitePostulantes !== ""
    );
}, [nuevaVacante]);

// Función para verificar si hay cambios sin guardar antes de navegar
const verificarSalida = (proximaTab) => {
    const editandoConCambios = activeTab === 'edicion' && tieneCambios;
    const creandoConDatos = activeTab === 'creacion' && (nuevaVacante.titulo !== "" || nuevaVacante.descripcion !== "");
    
    // OPCIONAL: Si quieres proteger también la edición de perfil (necesitarías pasar el estado 'hayCambios' del perfil aquí)
    // Por ahora, con que permitas la navegación normal al perfil es suficiente.

    if (editandoConCambios || creandoConDatos) {
        setAvisoSalida({ visible: true, proximaTab });
    } else {
        setActiveTab(proximaTab);
        if (proximaTab === 'gestion') setVacanteSeleccionadaId(null);
        // Cerramos el menú del avatar si estaba abierto
        setShowProfileMenu(false); 
    }
};

// Protección contra cierre de pestaña o recarga accidental
useEffect(() => {
    const handleBeforeUnload = (e) => {
        // Verificamos si hay cambios en edición o datos en creación
        const tieneDatosCreacion = activeTab === 'creacion' && (nuevaVacante.titulo !== "" || nuevaVacante.descripcion !== "");
        const tieneCambiosEdicion = activeTab === 'edicion' && tieneCambios;

        if (tieneDatosCreacion || tieneCambiosEdicion) {
            // Cancelar el evento (según estándar moderno)
            e.preventDefault();
            // Chrome requiere que se establezca returnValue
            e.returnValue = '¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.';
            return e.returnValue;
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Limpieza al desmontar el componente
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [tieneCambios, activeTab, nuevaVacante.titulo, nuevaVacante.descripcion]);

    // --- CORRECCIÓN 3: Iniciales seguras ---
const obtenerIniciales = (nombreInput) => {
    // 1. Priorizamos el parámetro que recibe, pero si no llega, 
    // buscamos en el objeto 'empresa' que ya tienes en el estado.
    const nombreFinal = nombreInput || empresa?.nombres || empresa?.nombre;

    if (!nombreFinal) return "UA"; 

    // Limpiamos espacios y dividimos por palabras
    const partes = nombreFinal.trim().split(/\s+/); 

    if (partes.length >= 2) {
        // Toma la primera letra de la primera palabra y la primera de la segunda
        // Ejemplo: "Dollar City" -> "DC"
        return (partes[0][0] + partes[1][0]).toUpperCase();
    }

    // Si es una sola palabra, toma las dos primeras letras
    // Ejemplo: "Alpina" -> "AL"
    return nombreFinal.substring(0, 2).toUpperCase();
};

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
    

 // --- CORRECCIÓN 4: Variable segura ---
const vacanteActual = vacantes.find(v => v.id === vacanteSeleccionadaId) || null;

const handleCambiarEstado = async (postulacionId, nuevoEstado) => {
    // Lógica de Anclaje Universal
    if (nuevoEstado === 'ANCLAR' || nuevoEstado === 'DESANCLAR') {
        const esAnclado = nuevoEstado === 'ANCLAR';
        try {
            await API.put(`/postulaciones/${postulacionId}/anclaje`, { anclado: esAnclado });
            
            setPostulaciones(prev => prev.map(p => 
                p.id === postulacionId ? { ...p, anclado: esAnclado } : p
            ));

            toast.success(esAnclado ? "📌 Candidato anclado" : "📍 Candidato desanclado");
        } catch (error) {
            toast.error("Error al guardar el anclaje");
        }
        return; 
    }

    // Lógica normal de estados del Pipeline
    try {
        await API.put(`/postulaciones/${postulacionId}/estado`, { estado: nuevoEstado });
        toast.success(`Estado actualizado`);
        if (vacanteSeleccionadaId) handleVerPostulaciones(vacanteSeleccionadaId);
    } catch (error) {
        toast.error("No se pudo actualizar el estado");
    }
};

// --- LÓGICA DE FILTRADO DINÁMICO ---
const vacantesFiltradas = vacantes.filter((v) => {
    // 1. Filtrar por texto (Título)
    const coincideTexto = v.titulo.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Filtrar por Rango de Fechas
    // Convertimos la fecha de la vacante (que viene de la BD) a un formato YYYY-MM-DD
    const fechaVacante = v.fechaCreacion ? v.fechaCreacion.split('T')[0] : "";

    let coincideFecha = true;

    if (fechaDesde && fechaHasta) {
        // Si ambas fechas están puestas, debe estar en medio
        coincideFecha = fechaVacante >= fechaDesde && fechaVacante <= fechaHasta;
    } else if (fechaDesde) {
        // Si solo hay "Desde", debe ser mayor o igual
        coincideFecha = fechaVacante >= fechaDesde;
    } else if (fechaHasta) {
        // Si solo hay "Hasta", debe ser menor o igual
        coincideFecha = fechaVacante <= fechaHasta;
    }

    return coincideTexto && coincideFecha;
});

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
       // ... aquí empieza tu HTML (JSX)
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
    <button 
        className={`menu-item ${activeTab === 'gestion' ? 'active' : ''}`} 
        onClick={() => verificarSalida('gestion')} // 👈 Cambiado
    >
        <Home size={18}/> <span>PANEL DE GESTIÓN</span>
    </button>
    
    <button 
        className={`menu-item ${activeTab === 'creacion' ? 'active' : ''}`} 
        onClick={() => verificarSalida('creacion')} // 👈 Cambiado
    >
        <PlusCircle size={18}/> <span>PUBLICAR VACANTE</span>
    </button>
    
    <button 
        className={`menu-item ${activeTab === 'metricas' ? 'active' : ''}`} 
        onClick={() => verificarSalida('metricas')} // 👈 Cambiado
    >
        <BarChart3 size={18}/> <span>MÉTRICAS Y REPORTES</span>
    </button>
    
    <button 
        className={`menu-item ${activeTab === 'mensajes' ? 'active' : ''}`} 
        onClick={() => verificarSalida('mensajes')} // 👈 Cambiado
    >
        <MessageSquare size={18}/> <span>MENSAJES / CHAT</span>
    </button>
    <button 
        className={`menu-item ${activeTab === 'total_postulaciones' ? 'active' : ''}`} 
        onClick={() => verificarSalida('total_postulaciones')}
    >
        <ClipboardList size={18}/> <span>LISTADO POSTULADOS</span>
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
                        
                        <div className="header-right">
    {/* Contenedor relativo para que el menú flote justo debajo */}
    <div className="user-profile-info" style={{ position: 'relative' }}>
        <div className="user-details">
            <span className="user-full-name-empresa">
                {empresa?.nombres || empresa?.nombre || "Cargando..."}
            </span>
            <span className="user-career">Empresa Aliada</span>
        </div>
        
        {/* Al darle clic, abrimos/cerramos el mini menú */}
        <div 
            className="user-avatar-initials" 
            style={{ backgroundColor: '#006b3f', cursor: 'pointer' }}
            onClick={(e) => {
                e.stopPropagation(); // Evita que otros clics cierren el menú de inmediato
                setShowProfileMenu(!showProfileMenu);
            }}
        >
            <span>{obtenerIniciales(empresa?.nombres || empresa?.nombre)}</span>
        </div>

        {/* --- ESTE ES EL MENÚ QUE APARECE AL DAR CLIC AL AVATAR --- */}
        {showProfileMenu && (
            <div className="profile-dropdown-container fade-in">
                <button className="dropdown-item" onClick={() => {
                    setActiveTab("perfil"); // Cambia el contenido central
                    setShowProfileMenu(false); // Cierra el mini menú
                }}>
                    <User size={16} /> Ver Perfil
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={16} /> Cerrar Sesión
                </button>
            </div>
        )}
    </div>
</div>
                    </div>
                </header>

                <main className="content-inner">
                    {/* VISTA GESTIÓN */}
                    {activeTab === 'gestion' && (
                        <div className="vacantes-view-container fade-in">
                            <section className="vacantes-list-panel">
{/* 📦 CONTENEDOR ELEGANTE DE CABECERA COLAPSABLE */}
<div className="vacantes-tools-header">
    {/* Encabezado que siempre queda visible */}
    <div className="section-title-container" style={{ borderBottom: showFilters ? '1px solid #f1f5f9' : 'none', marginBottom: showFilters ? '18px' : '0' }}>
        <div className="title-icon-wrapper">
            <Briefcase size={22} className="title-icon" />
        </div>
        <div style={{ flex: 1 }}>
            <h2>
                MIS VACANTES 
                <span className="vacantes-count-badge">{vacantesFiltradas.length}</span>
            </h2>
        </div>

        {/* 🏹 BOTÓN DE LA FLECHITA (Colapsar/Expandir) */}
        <button 
            className={`btn-toggle-filters ${!showFilters ? 'is-collapsed' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title={showFilters ? "Ocultar búsqueda" : "Mostrar búsqueda"}
        >
            <ChevronRight size={20} />
        </button>
    </div>

    {/* Contenedor animado de los filtros */}
    <div className={`filters-collapsible-content ${!showFilters ? 'collapsed' : ''}`}>
        <div className="search-filters-stack">
            {/* Fila 1: Búsqueda por texto */}
            <div className="search-input-inner">
                <Search size={16} className="search-inner-icon" />
                <input 
                    type="text" 
                    placeholder="Buscar por título de vacante..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </div>
            
            {/* Fila 2: Rango de fechas + Botón Limpiar */}
            <div className="date-range-container">
                <div className="filter-date-item">
                    <Calendar size={14} className="filter-icon" />
                    <span className="date-label">Desde:</span>
                    <input 
                        type="date" 
                        className="date-input-field" 
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                    />
                </div>

                <div className="filter-date-item">
                    <Calendar size={14} className="filter-icon" />
                    <span className="date-label">Hasta:</span>
                    <input 
                        type="date" 
                        className="date-input-field" 
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                    />
                </div>

                {/* Botón Limpiar estilizado */}
                <button 
                    className="btn-clear-filters" 
                    title="Limpiar filtros"
                    onClick={limpiarFiltros}
                >
                    <XCircle size={18} />
                    <span>Limpiar</span>
                </button>
            </div>
        </div>
    </div>
</div>

                                <div className="scrollable-cards">
    {/* 🟢 CAMBIO: Usamos vacantesFiltradas en lugar de vacantes */}
{vacantesFiltradas.length > 0 ? (
    vacantesFiltradas.map((v) => {
        // Verificamos si esta vacante específica es la que debe animarse
        const esNueva = vacanteAnimadaId === v.id;

        return (
            <div 
                key={v.id} 
                className={`vacante-card-item 
                    ${vacanteSeleccionadaId === v.id ? 'active' : ''} 
                    ${esNueva ? 'pulse-new-notification' : ''}`} // 👈 Clase de animación
                onClick={() => handleVerPostulaciones(v.id)}
                style={{ position: 'relative' }}
            >
                {/* 🔔 INDICADOR FLOTANTE DE NUEVA POSTULACIÓN */}
                {esNueva && (
                    <div className="new-postulation-badge fade-in">
                        <Bell size={10} />
                        <span>¡NUEVA!</span>
                    </div>
                )}

                <div className="card-main-info">
                    <h4 style={{ 
                        fontWeight: '700', 
                        marginBottom: '8px', 
                        color: '#1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <Briefcase size={18} style={{ color: esNueva ? '#006b3f' : '#006b3f' }} /> 
                        <span>{v.titulo}</span>
                    </h4>

                    <div className="card-location-row">
                        <span className="location-chip">
                            <MapPin size={14} style={{ color: '#3b82f6' }} />
                            {v.ubicacion}
                        </span>
                        <span className="vertical-separator">|</span>
                        <span className="modalidad-chip">
                            {v.modalidad === 'Presencial' && <Building2 size={14} style={{ color: '#6366f1' }} />}
                            {v.modalidad === 'Remoto' && <Home size={14} style={{ color: '#f59e0b' }} />}
                            {v.modalidad === 'Híbrido' && <Users size={14} style={{ color: '#10b981' }} />}
                            {v.modalidad}
                        </span>
                    </div>

                    <div className="card-meta-tags">
                        <span className={`badge-slots ${esNueva ? 'highlight-count' : ''}`}>
                            <Users size={12} /> 
                            {v.postulaciones?.length || v._count?.postulaciones || 0} postulantes
                        </span>
                    </div>
                </div>

                <div className="card-actions-row">
                    <button 
                        className="btn-action-edit" 
                        onClick={(e) => { e.stopPropagation(); handlePrepararEdicion(v); }}
                    >
                        <Edit3 size={14} /> <span>Editar</span>
                    </button>
                    <button 
                        className="btn-action-delete" 
                        onClick={(e) => { e.stopPropagation(); handleEliminarVacante(v.id, v.titulo); }}
                    >
                        <Trash2 size={14} /> <span>Eliminar</span>
                    </button>
                </div>
            </div>
        );
    })
) : (
    <div className="empty-search-results">
        <Search size={32} style={{ opacity: 0.3 }} />
        <p>No se encontraron vacantes con los filtros seleccionados.</p>
    </div>
)}
</div>
                            </section>

                          <aside className="vacante-detail-panel">
  {vacanteSeleccionadaId ? (
    /* 1. SECCIÓN: CUANDO SÍ HAY UNA VACANTE SELECCIONADA */
    <div className="detail-content-wrapper fade-in">
      
      {/* CABECERA INSTITUCIONAL SÓLIDA (Siempre visible al seleccionar vacante) */}
      <div className="vacante-header-card-solid-container">
        <div className="header-icon-section">
          <div className="icon-pills-wrapper">
            <Users size={24} className="pills-icon" />
          </div>
        </div>

        <div className="header-text-section">
          <span className="selection-process-label">PROCESO DE SELECCIÓN</span>
          <h2 className="vacante-title-main">
            {vacanteActual?.titulo}
          </h2>
        </div>

        <div className="header-stats-section">
          <div className="header-stats-quick-mini" title="Total de postulados">
            <span className="stat-value-mini">{postulaciones.length}</span>
          </div>
        </div>
      </div>

      {/* VALIDACIÓN INTERNA: ¿Tiene postulantes la vacante seleccionada? */}
      {postulaciones.length > 0 ? (
        <ListaPostulacionesTable 
          postulaciones={postulaciones}
          stages={PIPELINE_STAGES}
          onCambiarEstado={handleCambiarEstado}
          onVerPerfil={handleVerPerfil}
          onDescargarDirecto={handleDescargaDirecta}
          onAbrirChat={(p) => { setChatPostulante(p); setIsChatOpen(true); }}
        />
      ) : (
        /* CASO: VACANTE SELECCIONADA PERO SIN POSTULANTES */
        <div className="empty-state-container fade-in">
          <div className="empty-state-illustration">
            <div className="icon-bg-circle">
              <Users size={48} className="empty-icon" />
            </div>
            <div className="empty-state-decorations">
              <span className="dot dot-1"></span>
              <span className="dot dot-2"></span>
              <span className="dot dot-3"></span>
            </div>
          </div>
          
          <div className="empty-state-text">
            <h3>Búsqueda en curso</h3>
            <p>
              Actualmente no hay candidatos postulados a esta vacante. 
              Las nuevas postulaciones aparecerán aquí automáticamente.
            </p>
          </div>

          <div className="empty-state-badge">
    <Search size={14} className="searching-icon-anim" />
    <span>Oferta activa y esperando candidatos</span>
</div>
        </div>
      )}
    </div>
  ) : (
    /* 2. SECCIÓN: ESTADO INICIAL (Cuando el usuario acaba de entrar al Dashboard) */
    <div className="no-selection-state fade-in">
      <div className="welcome-illustration">
        <div className="icon-circle-main">
          <Briefcase size={48} strokeWidth={1.5} />
        </div>
        <div className="pulse-ring"></div>
      </div>
      
      <div className="welcome-text-content">
        <h3>Gestión de Candidatos</h3>
        <p>
          Selecciona una vacante de la izquierda para ver el flujo de selección.
        </p>
      </div>
      
      <div className="welcome-footer-hint">
        <div className="hint-item">
          <Users size={16} />
          <span>Revisa nuevas postulaciones</span>
        </div>
        <div className="hint-separator"></div>
        <div className="hint-item">
          <CheckCircle size={16} />
          <span>Gestiona el proceso de selección</span>
        </div>
      </div>
    </div>
  )}
</aside>
 
                        </div>
                    )}

                    {/* VISTA MÉTRICAS */}
                    {activeTab === "metricas" && <div className="full-view fade-in"><EmpresaMetricas empresaId={empresa?.id} /></div>}
{/* VISTA CREACIÓN PROFESIONAL */}
{/* VISTA CREACIÓN PROFESIONAL UNIFICADA */}
{activeTab === 'creacion' && (
    <div className="form-view-container fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '20px' }}>
        
        {/* CABECERA ESTILIZADA TIPO TARJETA (Verde UdeC) */}
        <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)', // Degradado verde muy suave
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #dcfce7',
            borderLeft: '8px solid #006b3f', // Verde institucional
            marginBottom: '25px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
        }}>
            {/* Círculo del Icono */}
            <div style={{
                background: '#dcfce7',
                padding: '15px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 2px 4px rgba(0, 107, 63, 0.1)'
            }}>
                <PlusCircle size={36} style={{ color: '#006b3f' }} />
            </div>

            {/* Texto informativo */}
            <div style={{ flex: 1 }}>
                <h2 style={{ 
                    margin: 0, 
                    fontSize: '24px', 
                    fontWeight: '800', 
                    color: '#1e293b',
                    letterSpacing: '-0.5px'
                }}>
                    Publicar Nueva Oferta Laboral
                </h2>
                <p style={{ 
                    margin: '4px 0 0 0', 
                    fontSize: '14px', 
                    color: '#64748b' 
                }}>
                    Atrae al mejor talento de la <strong style={{ color: '#006b3f', fontWeight: '700' }}>Universidad de Cundinamarca</strong>
                </p>
            </div>
        </div>

        <div className="professional-form-card">
            <form onSubmit={handleSubmit}>
                {/* CONTENEDOR FLEX PRINCIPAL PARA HACERLO HORIZONTAL */}
                <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                    
                    {/* COLUMNA IZQUIERDA: Información General (Más ancha) */}
                    <div style={{ flex: '1.2' }}>
                        <div className="section-subtitle">
                            <FileText size={18} /> <span>Información General</span>
                        </div>
                        <div className="form-group full" style={{ marginBottom: '20px' }}>
                            <label>Título de la Vacante *</label>
                            <input 
                                type="text" 
                                required 
                                value={nuevaVacante.titulo} 
                                onChange={(e) => setNuevaVacante({ ...nuevaVacante, titulo: e.target.value })} 
                                placeholder="Ej: Desarrollador Web Junior" 
                            />
                        </div>
                        <div className="form-group full">
                            <label>Descripción del Cargo *</label>
                            <textarea 
                                style={{ height: '345px', resize: 'none' }} // Ajustado para alinear con la derecha
                                required 
                                value={nuevaVacante.descripcion} 
                                onChange={(e) => setNuevaVacante({ ...nuevaVacante, descripcion: e.target.value })} 
                                placeholder="Responsabilidades, requisitos, beneficios..." 
                            />
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: Detalles Técnicos (En rejilla de 2 columnas internas) */}
                    <div style={{ flex: '1', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                        <div className="section-subtitle">
                            <Briefcase size={18} /> <span>Detalles Técnicos</span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            {/* --- SECCIÓN DE CONTRATO --- */}
<div className="form-group" style={{ position: 'relative' }}>
    <label>Tipo de Contrato *</label>
<div 
    className="customSelectHeader" 
    onClick={(e) => {
        e.stopPropagation(); 
        setOpenDropdown(openDropdown === 'contrato' ? null : 'contrato');
    }}
>
    {/* 🟢 El estilo y el texto deben ir en la misma etiqueta */}
    <span style={{ color: nuevaVacante.mostrarOtroContrato ? '#999' : '#333' }}>
        {nuevaVacante.mostrarOtroContrato ? "Otro..." : (nuevaVacante.tipo || "Selecciona")}
    </span>
    
    <span className="selectArrow">▾</span>
</div>

    {openDropdown === 'contrato' && (
        <div className="customSelectDropdown">
            {["Término Fijo", "Término Indefinido", "Obra o Labor", "Prestación de Servicios", "Contrato de Aprendizaje", "Otro"].map((op) => (
                <div key={op} className="dropdownOption" onClick={() => {
                    if (op === "Otro") setNuevaVacante({ ...nuevaVacante, tipo: "", mostrarOtroContrato: true });
                    else setNuevaVacante({ ...nuevaVacante, tipo: op, mostrarOtroContrato: false });
                    setOpenDropdown(null);
                }}>
                    {op}
                </div>
            ))}
        </div>
    )}
    {nuevaVacante.mostrarOtroContrato && (
        <input type="text" placeholder="Especifica contrato" className="fade-in" style={{ marginTop: '8px' }} required
            value={nuevaVacante.tipo} onChange={(e) => setNuevaVacante({ ...nuevaVacante, tipo: e.target.value })} />
    )}
</div>

<div className="form-group" style={{ position: 'relative' }}>
    <label>Jornada *</label>
    <div 
        className="customSelectHeader" 
        onClick={(e) => {
            e.stopPropagation();
            setOpenDropdown(openDropdown === 'jornada' ? null : 'jornada');
        }}
    >
        <span style={{ color: nuevaVacante.mostrarOtraJornada ? '#999' : '#333' }}>
        {nuevaVacante.mostrarOtraJornada ? "Otro..." : (nuevaVacante.jornada || "Selecciona")}
    </span>
    <span className="selectArrow">▾</span>
    </div>

    {openDropdown === 'jornada' && (
        <div className="customSelectDropdown">
            {["Tiempo Completo", "Medio Tiempo", "Tiempo Parcial", "Por Horas", "Otro"].map((op) => (
                <div key={op} className="dropdownOption" onClick={() => {
                    if (op === "Otro") setNuevaVacante({ ...nuevaVacante, jornada: "", mostrarOtraJornada: true });
                    else setNuevaVacante({ ...nuevaVacante, jornada: op, mostrarOtraJornada: false });
                    setOpenDropdown(null);
                }}>
                    {op}
                </div>
            ))}
        </div>
    )}
    {nuevaVacante.mostrarOtraJornada && (
        <input type="text" placeholder="Especifica jornada" className="fade-in" style={{ marginTop: '8px' }} required
            value={nuevaVacante.jornada} onChange={(e) => setNuevaVacante({ ...nuevaVacante, jornada: e.target.value })} />
    )}
</div>

<div className="form-group" style={{ position: 'relative' }}>
    <label>Modalidad *</label>
    <div 
        className="customSelectHeader" 
        onClick={(e) => {
            e.stopPropagation();
            setOpenDropdown(openDropdown === 'modalidad' ? null : 'modalidad');
        }}
    >
        <span>{nuevaVacante.modalidad || "Selecciona"}</span>
        <span className="selectArrow">▾</span>
    </div>

    {openDropdown === 'modalidad' && (
        <div className="customSelectDropdown">
            {["Presencial", "Remoto", "Híbrido"].map((op) => (
                <div key={op} className="dropdownOption" onClick={() => {
                    setNuevaVacante({ ...nuevaVacante, modalidad: op });
                    setOpenDropdown(null);
                }}>
                    {op}
                </div>
            ))}
        </div>
    )}
</div>

<div className="form-group" style={{ position: 'relative' }}>
    <label>Tipo de Salario *</label>
    <div 
        className="customSelectHeader" 
        onClick={(e) => {
            e.stopPropagation();
            setOpenDropdown(openDropdown === 'salario' ? null : 'salario');
        }}
    >
        <span style={{ color: nuevaVacante.mostrarOtroSalario ? '#999' : '#333' }}>
        {nuevaVacante.mostrarOtroSalario ? "Otro..." : (nuevaVacante.tipoSalario || "Selecciona")}
    </span>
    <span className="selectArrow">▾</span>
    </div>

    {openDropdown === 'salario' && (
        <div className="customSelectDropdown">
            {["Básico", "Integral", "A convenir", "Rango Salarial", "Otro"].map((op) => (
                <div key={op} className="dropdownOption" onClick={() => {
                    if (op === "Otro") setNuevaVacante({ ...nuevaVacante, tipoSalario: "", mostrarOtroSalario: true });
                    else setNuevaVacante({ ...nuevaVacante, tipoSalario: op, mostrarOtroSalario: false });
                    setOpenDropdown(null);
                }}>
                    {op}
                </div>
            ))}
        </div>
    )}
    {nuevaVacante.mostrarOtroSalario && (
        <input type="text" placeholder="Especifica tipo salario" className="fade-in" style={{ marginTop: '8px' }} required
            value={nuevaVacante.tipoSalario} onChange={(e) => setNuevaVacante({ ...nuevaVacante, tipoSalario: e.target.value })} />
    )}
</div>



                            <div className="form-group">
                                <label>Salario (Opcional)</label>
                                <div className="input-with-icon">
                                    <span style={{paddingLeft: '10px'}}>$</span>
                                    <input type="text" placeholder="2.500.000" value={nuevaVacante.salario} onChange={(e) => setNuevaVacante({ ...nuevaVacante, salario: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Horario *</label>
                                <div className="input-with-icon">
                                    <Clock size={16} style={{marginLeft: '10px'}}/>
                                    <input type="text" required placeholder="Lun-Vie 8am-5pm" value={nuevaVacante.horario} onChange={(e) => setNuevaVacante({ ...nuevaVacante, horario: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Ubicación *</label>
                                <div className="input-with-icon">
                                    <MapPin size={16} style={{marginLeft: '10px'}}/>
                                    <input type="text" required placeholder="Ciudad o sede" value={nuevaVacante.ubicacion} onChange={(e) => setNuevaVacante({ ...nuevaVacante, ubicacion: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Cupos disponibles *</label>
                                <div className="input-with-icon">
                                    <Users size={16} style={{marginLeft: '10px'}}/>
                                    <input type="number" required placeholder="Ej: 20" value={nuevaVacante.limitePostulantes} onChange={(e) => setNuevaVacante({ ...nuevaVacante, limitePostulantes: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Fecha de Cierre *</label>
                                <div className="input-with-icon">
                                    <Calendar size={16} style={{marginLeft: '10px'}}/>
                                    <input type="date" required value={nuevaVacante.fechaCierre} onChange={(e) => setNuevaVacante({ ...nuevaVacante, fechaCierre: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-actions-footer" style={{ marginTop: '30px' }}>
                    {/* Tanto en la vista de CREACIÓN como en EDICIÓN */}
<button 
    type="button" 
    className="btn-secondary" 
    onClick={() => verificarSalida('gestion')} // 👈 Cambiado
>
    Cancelar
</button>
                    <button 
    type="submit" 
    className="btn-primary-udec"
    disabled={!formularioCreacionCompleto} // 👈 Bloquea el botón
    style={{ 
        background: !formularioCreacionCompleto ? '#cbd5e1' : '#006b3f', // Gris si falta algo
        cursor: !formularioCreacionCompleto ? 'not-allowed' : 'pointer',
        opacity: !formularioCreacionCompleto ? 0.7 : 1,
        transition: 'all 0.3s ease'
    }}
>
    <PlusCircle size={18} /> 
    {!formularioCreacionCompleto ? "Faltan campos" : "Publicar Oferta"}
</button>
                </div>
            </form>
        </div>
    </div>
)}

{/* VISTA EDICIÓN */}
{activeTab === 'edicion' && editandoVacante && (
    <div className="form-view-container fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '20px' }}>
        
        {/* CABECERA ESTILIZADA TIPO TARJETA */}
        <div style={{
            background: 'linear-gradient(135deg, #fffcf5 0%, #ffffff 100%)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #fef3c7',
            borderLeft: '8px solid #f59e0b', // Tu color naranja
            marginBottom: '25px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
        }}>
            {/* Círculo del Icono */}
            <div style={{
                background: '#fff7ed',
                padding: '15px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 2px 4px rgba(245, 158, 11, 0.1)'
            }}>
                <Edit3 size={36} style={{ color: '#f59e0b' }} />
            </div>

            {/* Texto informativo */}
            <div style={{ flex: 1 }}>
                <h2 style={{ 
                    margin: 0, 
                    fontSize: '24px', 
                    fontWeight: '800', 
                    color: '#1e293b',
                    letterSpacing: '-0.5px'
                }}>
                    Editar Oferta Laboral
                </h2>
                <p style={{ 
                    margin: '4px 0 0 0', 
                    fontSize: '14px', 
                    color: '#64748b' 
                }}>
                    Modificando información de: <strong style={{ color: '#f59e0b', fontWeight: '700' }}>{editandoVacante.titulo}</strong>
                </p>
            </div>
        </div>

        <div className="professional-form-card">
            <form onSubmit={handleUpdate}>
                <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                    
                    {/* COLUMNA IZQUIERDA: General */}
                    <div style={{ flex: '1.2' }}>
                        <div className="section-subtitle">
                            <FileText size={18} /> <span>Información General</span>
                        </div>
                        <div className="form-group full" style={{ marginBottom: '20px' }}>
                            <label>Título de la Vacante *</label>
                            <input type="text" required value={editandoVacante.titulo} 
                                onChange={(e) => setEditandoVacante({ ...editandoVacante, titulo: e.target.value })} />
                        </div>
                        <div className="form-group full">
                            <label>Descripción del Cargo *</label>
                            <textarea style={{ height: '345px', resize: 'none' }} required value={editandoVacante.descripcion} 
                                onChange={(e) => setEditandoVacante({ ...editandoVacante, descripcion: e.target.value })} />
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: Detalles Técnicos (Espejo de Creación) */}
                    <div style={{ flex: '1', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                        <div className="section-subtitle">
                            <Briefcase size={18} /> <span>Detalles Técnicos</span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            
                            {/* CONTRATO */}
                            <div className="form-group" style={{ position: 'relative' }}>
                                <label>Tipo de Contrato *</label>
                                <div className="customSelectHeader" onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'edit-contrato' ? null : 'edit-contrato'); }}>
                                    <span style={{ color: editandoVacante.mostrarOtroContrato ? '#999' : '#333' }}>
    {editandoVacante.mostrarOtroContrato ? "Otro..." : (editandoVacante.tipo || "Selecciona")}
</span>
                                    <span className="selectArrow">▾</span>
                                </div>
                                {openDropdown === 'edit-contrato' && (
                                    <div className="customSelectDropdown">
                                        {["Término Fijo", "Término Indefinido", "Obra o Labor", "Prestación de Servicios", "Contrato de Aprendizaje", "Otro"].map((op) => (
                                            <div key={op} className="dropdownOption" onClick={() => {
                                                setEditandoVacante({ ...editandoVacante, tipo: op === "Otro" ? "" : op, mostrarOtroContrato: op === "Otro" });
                                                setOpenDropdown(null);
                                            }}>{op}</div>
                                        ))}
                                    </div>
                                )}
                                {/* Debajo del dropdown de Contrato */}
{editandoVacante.mostrarOtroContrato && (
    <input 
        type="text" 
        placeholder="Especifica tipo de contrato" 
        className="fade-in" 
        style={{ marginTop: '8px', gridColumn: 'span 2' }} 
        required
        value={editandoVacante.tipo} 
        onChange={(e) => setEditandoVacante({ ...editandoVacante, tipo: e.target.value })} 
    />
)}
                            </div>

                            {/* JORNADA */}
                            <div className="form-group" style={{ position: 'relative' }}>
                                <label>Jornada *</label>
                                <div className="customSelectHeader" onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'edit-jornada' ? null : 'edit-jornada'); }}>
                                    <span style={{ color: editandoVacante.mostrarOtraJornada ? '#999' : '#333' }}>
    {editandoVacante.mostrarOtraJornada ? "Otro..." : (editandoVacante.jornada || "Selecciona")}
</span>
                                    <span className="selectArrow">▾</span>
                                </div>
                                {openDropdown === 'edit-jornada' && (
                                    <div className="customSelectDropdown">
                                        {["Tiempo Completo", "Medio Tiempo", "Tiempo Parcial", "Por Horas", "Otro"].map((op) => (
                                            <div key={op} className="dropdownOption" onClick={() => {
                                                setEditandoVacante({ ...editandoVacante, jornada: op === "Otro" ? "" : op, mostrarOtraJornada: op === "Otro" });
                                                setOpenDropdown(null);
                                            }}>{op}</div>
                                        ))}
                                    </div>
                                )}
                                {/* Debajo del dropdown de Jornada */}
{editandoVacante.mostrarOtraJornada && (
    <input 
        type="text" 
        placeholder="Especifica jornada" 
        className="fade-in" 
        style={{ marginTop: '8px', gridColumn: 'span 2' }} 
        required
        value={editandoVacante.jornada} 
        onChange={(e) => setEditandoVacante({ ...editandoVacante, jornada: e.target.value })} 
    />
)}
                            </div>

                            {/* MODALIDAD */}
                            <div className="form-group">
                                <label>Modalidad *</label>
                                <select className="custom-select-simple" value={editandoVacante.modalidad} 
                                    onChange={(e) => setEditandoVacante({ ...editandoVacante, modalidad: e.target.value })}>
                                    <option value="Presencial">Presencial</option>
                                    <option value="Remoto">Remoto</option>
                                    <option value="Híbrido">Híbrido</option>
                                </select>
                            </div>

                            {/* TIPO SALARIO */}
                            {/* TIPO SALARIO (Actualizado con lógica de "Otro") */}
<div className="form-group" style={{ position: 'relative' }}>
    <label>Tipo de Salario *</label>
    <div 
        className="customSelectHeader" 
        onClick={(e) => {
            e.stopPropagation();
            setOpenDropdown(openDropdown === 'edit-salario' ? null : 'edit-salario');
        }}
    >
        <span style={{ color: editandoVacante.mostrarOtroSalario ? '#999' : '#333' }}>
            {editandoVacante.mostrarOtroSalario ? "Otro..." : (editandoVacante.tipoSalario || "Selecciona")}
        </span>
        <span className="selectArrow">▾</span>
    </div>

    {openDropdown === 'edit-salario' && (
        <div className="customSelectDropdown">
            {["Básico", "Integral", "A convenir", "Rango Salarial", "Otro"].map((op) => (
                <div key={op} className="dropdownOption" onClick={() => {
                    if (op === "Otro") {
                        setEditandoVacante({ ...editandoVacante, tipoSalario: "", mostrarOtroSalario: true });
                    } else {
                        setEditandoVacante({ ...editandoVacante, tipoSalario: op, mostrarOtroSalario: false });
                    }
                    setOpenDropdown(null);
                }}>
                    {op}
                </div>
            ))}
        </div>
    )}
    
    {/* Este es el input que aparece si eligen "Otro" */}
    {editandoVacante.mostrarOtroSalario && (
        <input 
            type="text" 
            placeholder="Especifica tipo de salario" 
            className="fade-in" 
            style={{ marginTop: '8px' }} 
            required
            value={editandoVacante.tipoSalario} 
            onChange={(e) => setEditandoVacante({ ...editandoVacante, tipoSalario: e.target.value })} 
        />
    )}
</div>

                            <div className="form-group">
                                <label>Monto</label>
                                <input type="text" value={editandoVacante.salario} onChange={(e) => setEditandoVacante({ ...editandoVacante, salario: e.target.value })} />
                            </div>

                            <div className="form-group">
                                <label>Horario *</label>
                                <input type="text" required value={editandoVacante.horario} onChange={(e) => setEditandoVacante({ ...editandoVacante, horario: e.target.value })} />
                            </div>

                            <div className="form-group">
                                <label>Ubicación *</label>
                                <input type="text" required value={editandoVacante.ubicacion} onChange={(e) => setEditandoVacante({ ...editandoVacante, ubicacion: e.target.value })} />
                            </div>

                            <div className="form-group">
                                <label>Cupos disponibles *</label>
                                <input type="number" required value={editandoVacante.limitePostulantes} onChange={(e) => setEditandoVacante({ ...editandoVacante, limitePostulantes: e.target.value })} />
                            </div>

                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Fecha de Cierre *</label>
                                <input type="date" required value={editandoVacante.fechaCierre} onChange={(e) => setEditandoVacante({ ...editandoVacante, fechaCierre: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-actions-footer" style={{ marginTop: '30px' }}>
                    {/* Tanto en la vista de CREACIÓN como en EDICIÓN */}
<button 
    type="button" 
    className="btn-secondary" 
    onClick={() => verificarSalida('gestion')} // 👈 Cambiado
>
    Cancelar
</button>
                    <button 
    type="submit" 
    className="btn-primary-udec" 
    style={{ 
        background: !tieneCambios ? '#cbd5e1' : '#f59e0b', // Gris si no hay cambios, naranja si sí
        cursor: !tieneCambios ? 'not-allowed' : 'pointer',
        opacity: !tieneCambios ? 0.7 : 1,
        border: 'none'
    }}
    disabled={!tieneCambios} // 👈 BLOQUEA EL BOTÓN
>
    <CheckCircle size={18} /> 
    {!tieneCambios ? "Sin cambios" : "Actualizar Vacante"}
</button>
                </div>
            </form>
        </div>
    </div>
)}

{/* 👇 ESTO ES LO QUE TE HACE FALTA AGREGAR 👇 */}
    {activeTab === 'mensajes' && (
        <div className="full-view fade-in" style={{ height: '100%' }}>
            <ChatSidebar empresaId={empresa?.id} />
        </div>
    )}
    {activeTab === 'perfil' && (
        <div className="full-view fade-in">
            <PerfilEmpresa />
        </div>
    )}

    {/* 👇 DÉJALO EXACTAMENTE AQUÍ (Antes del cierre del main) 👇 */}
    {activeTab === 'total_postulaciones' && (
        <div className="full-view fade-in">
            <TotalPostulaciones empresaId={empresa?.id} />
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
            {isChatOpen && chatPostulante && (
    <ChatWidget 
        empresaId={empresa?.id} 
        postulante={chatPostulante} 
        // 💡 Asegúrate de que usamos vacanteId del objeto postulante
        vacanteId={chatPostulante?.vacanteId} 
        onClose={() => setIsChatOpen(false)} 
    />
)}

            {/* --- COMPONENTE FANTASMA PARA DESCARGA (Invisible para el usuario) --- */}
<div style={{ position: 'fixed', left: '-2000px', top: '-2000px', zIndex: -1, opacity: 0 }}>
    {perfilParaDescargaDirecta && (
        <VerCV 
            perfil={perfilParaDescargaDirecta} 
            isAutoDownloading={true} 
        />
    )}
</div>

            {/* MODAL DE ADVERTENCIA DE SALIDA PERSONALIZADO */}
{avisoSalida.visible && (
    <div className="modal-overlay fade-in" style={{ zIndex: 9999 }}>
        <div className="custom-confirm-modal">
            <div className="confirm-icon-wrapper">
                <AlertTriangle size={40} color="#f59e0b" />
            </div>
            
            <h3>Cambios sin guardar</h3>
            
            <p>
                {activeTab === 'edicion' 
                    ? "Estás editando una oferta laboral. Si sales ahora, perderás todas las modificaciones realizadas." 
                    : "Estás creando una nueva vacante. Si abandonas esta pestaña, los datos ingresados se borrarán."}
            </p>

            <div className="confirm-modal-actions">
                <button 
                    className="btn-modal-stay" 
                    onClick={() => setAvisoSalida({ visible: false, proximaTab: null })}
                >
                    Continuar editando
                </button>
                <button 
                    className="btn-modal-exit" 
                    onClick={() => {
                        setActiveTab(avisoSalida.proximaTab);
                        setVacanteSeleccionadaId(null);
                        setAvisoSalida({ visible: false, proximaTab: null });
                    }}
                >
                    Salir sin guardar
                </button>
            </div>
        </div>
    </div>
)}

{/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN PERSONALIZADO */}
{/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN PERSONALIZADO Y DINÁMICO */}
{confirmarEliminar.visible && (
    <div className="modal-overlay fade-in" style={{ zIndex: 10000 }}>
        {/* Usamos las mismas clases base del modal de logout para consistencia */}
        <div className="logout-modal delete-modal-premium">
            
            {/* Contenedor del icono con animación de olas y vibración */}
            <div className="modal-icon delete-icon-animated">
                <Trash2 size={40} color="#ef4444" strokeWidth={1.5} />
            </div>
            
            <h3>¿Eliminar vacante?</h3>
            
            <p>
                Estás a punto de eliminar la vacante: <br />
                <strong style={{ color: '#1e293b' }}>"{confirmarEliminar.titulo}"</strong>.
                <br /><br />
                Esta acción es irreversible y perderás todas las postulaciones asociadas.
            </p>

            {/* BOTONES HORIZONTALES (Copiados de la estructura del modal de logout) */}
            <div className="modal-actions">
                <button 
                    className="btn-cancel" 
                    onClick={() => setConfirmarEliminar({ visible: false, vacanteId: null, titulo: "" })}
                >
                    Cancelar
                </button>
                <button 
                    className="btn-confirm btn-delete-danger" 
                    onClick={ejecutarEliminacion}
                >
                    Sí, eliminar ahora
                </button>
            </div>
        </div>
    </div>
)}
        </div>
    );
}