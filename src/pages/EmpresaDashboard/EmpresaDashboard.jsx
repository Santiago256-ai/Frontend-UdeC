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
    Search, ChevronRight, Home, Bell, ClipboardList, User, Calendar, AlertTriangle, Sparkles, X, Filter, ChevronDown
} from 'lucide-react';
import "./EmpresaDashboard.css"; 
import ChatSidebar from "../../components/ChatSidebar"; 
import ChatWidget from "../../components/ChatWidget";
import VerCV from "../../components/verCV";
import PerfilEmpresa from "../../components/PerfilEmpresa";
import EmpresaMetricas from './EmpresaMetricas';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import Quill from 'quill';
import VacantesEliminadas from "./VacantesEliminadas";
import NotificacionesEmpresa from "./NotificacionesEmpresa";

const Parchment = Quill.import('parchment');
const AlignStyle = Quill.import('attributors/class/align');
Quill.register(AlignStyle, true);

const SizeStyle = Quill.import('attributors/style/size');
Quill.register(SizeStyle, true);

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    [{ 'font': [] }], 
    ['bold', 'italic', 'underline', 'strike'], 
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'align': [] }],
    // Aquí ya NO está 'image' ni 'link'
    ['clean'] 
  ],
};

// ✅ Versión corregida
const formats = [
  'header', 'font', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 
  'list',    // 👈 'list' engloba tanto a 'ordered' como a 'bullet'
  'align'
];

export default function EmpresaDashboard() {
    const location = useLocation();
    const navigate = useNavigate();

    const [fechaDesde, setFechaDesde] = useState("");
const [fechaHasta, setFechaHasta] = useState("");
const [showFilters, setShowFilters] = useState(true); 
const [estadosSeleccionados, setEstadosSeleccionados] = useState([]); 
const [showProfileMenu, setShowProfileMenu] = useState(false); 
const [confirmarEliminar, setConfirmarEliminar] = useState({ visible: false, vacanteId: null, titulo: "" });
const [vacanteAnimadaId, setVacanteAnimadaId] = useState(null);
const conteoReferencia = React.useRef({});
const [vacantesConNovedad, setVacantesConNovedad] = useState([]);
const [tieneNotifPendientes, setTieneNotifPendientes] = useState(false);
const [showStatusDropdown, setShowStatusDropdown] = useState(false);

const insertarPlantilla = (tipo) => {
    let textoAInsertar = "";

    switch (tipo) {
        case 'requisitos':
            textoAInsertar = "<p><strong>✅ Requisitos:</strong></p><ul><li>Formación: </li><li>Experiencia: </li></ul>";
            break;
        case 'funciones':
            textoAInsertar = "<p><strong>📝 Funciones Principales:</strong></p><ul><li></li><li></li></ul>";
            break;
        case 'responsabilidades':
            textoAInsertar = "<p><strong>⚠️ Responsabilidades Críticas:</strong></p><ul><li>¿Manejo de personal?: Si/No</li><li>¿Manejo de dinero?: Si/No</li></ul>";
            break;
        case 'habilidades':
            textoAInsertar = "<p><strong>🌟 Habilidades Deseadas:</strong></p><ul><li></li></ul>";
            break;
        default:
            break;
    }

    // Concatenamos al final de lo que ya existe
    if (activeTab === 'creacion') {
        setNuevaVacante(prev => ({ ...prev, descripcion: (prev.descripcion || "") + textoAInsertar }));
    } else {
        setEditandoVacante(prev => ({ ...prev, descripcion: (prev.descripcion || "") + textoAInsertar }));
    }
    
    toast.info("Bloque añadido al final de la descripción");
};
    
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
    // Agrega esto junto a tus otros estados (debajo de activeTab, por ejemplo)
const [vistaActiva, setVistaActiva] = useState({ vista: 'gestion', chatData: null });
const [touched, setTouched] = useState({});

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
    setEstadosSeleccionados([]); 
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

const consultarPendientes = useCallback(async () => {
    if (!empresa?.id) return;
    try {
        const res = await API.get(`/notificaciones/empresa/${empresa.id}`);
        // Verificamos si existe al menos una notificación con vista: false
        const pendientes = res.data.some(n => !n.vista);
        setTieneNotifPendientes(pendientes);
    } catch (error) {
        console.error("Error al consultar pendientes:", error);
    }
}, [empresa?.id]);

useEffect(() => {
    consultarPendientes();
    // Consultamos cada 30 segundos para mantenerlo sincronizado con el polling de vacantes
    const interval = setInterval(consultarPendientes, 30000);
    return () => clearInterval(interval);
}, [consultarPendientes]);

    // 3. TODOS los useEffect (MUEVE EL DE CLOSEALL AQUÍ ARRIBA)
    useEffect(() => {
    const closeAll = () => {
        setOpenDropdown(null);
        setShowStatusDropdown(false); // 👈 Agrega esto
        setShowProfileMenu(false);
    };
    window.addEventListener('click', closeAll);
    return () => window.removeEventListener('click', closeAll);
}, []);

const validateVacanteField = (name, value) => {
    switch (name) {
        case 'titulo': return !value.trim() ? 'El título es obligatorio' : '';
        case 'descripcion': 
            // Limpiamos HTML para validar texto real
            const textoLimpio = value?.replace(/<[^>]*>/g, '').trim();
            return (!textoLimpio || textoLimpio === "") ? 'La descripción no puede estar vacía' : '';
        case 'ubicacion': return !value.trim() ? 'La ubicación es requerida' : '';
        case 'tipo': return !value ? 'Seleccione tipo de contrato' : '';
        case 'modalidad': return !value ? 'Seleccione modalidad' : '';
        case 'jornada': return !value ? 'Seleccione jornada' : '';
        case 'tipoSalario': return !value ? 'Seleccione tipo de salario' : '';
        case 'horario': return !value.trim() ? 'El horario es requerido' : '';
        case 'limitePostulantes': return !value || value <= 0 ? 'Mínimo 1 cupo' : '';
        case 'fechaCierre': 
            const hoy = new Date().toISOString().split('T')[0];
            return !value ? 'Fecha requerida' : (value < hoy ? 'La fecha no puede ser pasada' : '');
        default: return '';
    }
};

// 3. Renderizador sutil (Igual al de registro)
const renderValidation = (fieldName, stateObj) => {
    if (!touched[fieldName]) return null;
    const error = validateVacanteField(fieldName, stateObj[fieldName]);
    
    if (error) {
        return <span className="error-message-sutil" style={{color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block'}}>❌ {error}</span>;
    }
    // Solo mostramos el check si el campo tiene contenido
    if (stateObj[fieldName]) {
        return <span className="success-message-sutil" style={{color: '#10b981', fontSize: '12px', marginTop: '4px', display: 'block'}}>✅ Correcto</span>;
    }
    return null;
};

// Dentro de EmpresaDashboard.jsx
useEffect(() => {
    if (vistaActiva && vistaActiva.vista) {
        setActiveTab(vistaActiva.vista);
        
        // 🌟 MAGIA: Si venimos de una notificación de POSTULACIÓN
        if (vistaActiva.vista === 'gestion' && vistaActiva.vacanteId) {
            // 👇 Le agregamos un "true" como segundo parámetro
            handleVerPostulaciones(vistaActiva.vacanteId, true);
        }
    }
}, [vistaActiva]);

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

const navegarAVista = (config) => {
    // Si config es un string, lo tratamos normal
    const nombreVista = typeof config === 'object' ? config.vista : config;

    if (typeof config === 'object') {
        setActiveTab(config.vista);

        // Si es una postulación, abrimos el modal de la vacante automáticamente
        if (config.vacanteId) {
            handleVerPostulaciones(config.vacanteId);
        }

        // Si es un mensaje, el ChatSidebar debería recibir la data (puedes pasarla por estados si lo necesitas)
        if (config.chatData) {
            // Aquí puedes activar un estado para que el chat se abra en el mensaje específico
        }
    } else {
        setActiveTab(config);
    }
};

// Función para marcar como tocado al salir del input
const handleVacanteBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
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

// 👇 Recibe el nuevo parámetro "vieneDeNotificacion" (por defecto es false)
const handleVerPostulaciones = async (vacanteId, vieneDeNotificacion = false) => {
    setVacanteSeleccionadaId(vacanteId);

    // 🌟 CLAVE: Solo borramos el postulacionId si el usuario abrió la tarjeta MANUALMENTE
    if (!vieneDeNotificacion) {
        setVistaActiva(prev => ({
            ...prev,
            postulacionId: null 
        }));
    }

    // 🟢 LÓGICA DE LIMPIEZA DE NOTIFICACIÓN:
    // Filtramos el array para eliminar el ID de la vacante que se acaba de abrir.
    setVacantesConNovedad(prev => prev.filter(id => id !== vacanteId));

    try {
        const res = await API.get(`/postulaciones/vacante/${vacanteId}`);
        
        setPostulaciones(res.data);
        
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
                // 1. Activamos la animación de vibración temporal (7 seg)
                setVacanteAnimadaId(vNueva.id);
                huboNovedad = true;

                // 2. 🟢 LÓGICA PERSISTENTE: Agregamos el ID a la lista de "Nuevas"
                // Solo lo agregamos si no está ya en la lista
                setVacantesConNovedad(prev => {
                    if (!prev.includes(vNueva.id)) return [...prev, vNueva.id];
                    return prev;
                });

                // 3. Notificaciones visuales y sonoras
                // Dentro de checkNewPostulaciones
toast.info(`¡Nueva postulación: ${vNueva.titulo}!`, {
    position: "bottom-right", // 👈 Asegura que salga donde el egresado
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "colored", // 👈 Esto hace que use los colores que definimos arriba
});

                const audio = new Audio('/sounds/notification.mp3');
                audio.play().catch(err => console.log("Audio bloqueado:", err));

                // Limpiamos solo la animación de vibración, el badge "NUEVA" se queda
                setTimeout(() => setVacanteAnimadaId(null), 7000);
            }
            // Actualizamos la referencia para la próxima comparación
            conteoReferencia.current[vNueva.id] = cantidadActual;
        });

        if (huboNovedad) {
            setVacantes(vacantesNuevas);
            // Si el usuario tiene abierto el modal de esa vacante, refrescamos la tabla
            if (vacanteSeleccionadaId) {
                handleVerPostulaciones(vacanteSeleccionadaId);
            }
        }
    } catch (error) {
        console.error("Error en polling:", error);
    }
}, [empresa?.id, vacantes, vacanteSeleccionadaId, handleVerPostulaciones]);

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
        // 1. Limpiamos la descripción de atajos que no fueron llenados
        const descripcionLimpia = limpiarContenidoVacio(nuevaVacante.descripcion);

        const vacanteData = { 
            ...nuevaVacante, 
            // 2. Usamos la descripción ya filtrada
            descripcion: descripcionLimpia,
            empresaId: empresa.id,
            // Esto es clave para que la base de datos no reciba un string vacío
            limitePostulantes: nuevaVacante.limitePostulantes ? parseInt(nuevaVacante.limitePostulantes) : null 
        };

        // 3. Enviamos los datos limpios a la API
        await API.post(`/vacantes`, vacanteData);
        
        toast.success("¡Oferta publicada exitosamente!");

        // 4. Limpiamos el formulario
        setNuevaVacante({ 
            titulo: "", 
            descripcion: "", 
            ubicacion: "", 
            tipo: "", 
            modalidad: "", 
            salario: "", 
            tipoSalario: "", 
            jornada: "", 
            horario: "", 
            fechaCierre: "", 
            limitePostulantes: "", 
            mostrarOtroContrato: false,
            mostrarOtraJornada: false,
            mostrarOtroSalario: false
        });

        cargarVacantes();
        setActiveTab("gestion");
        
    } catch (err) { 
        console.error("Error al publicar:", err);
        toast.error("Error al publicar la vacante"); 
    }
};

    const handleUpdate = async (e) => {
    e.preventDefault();
    try {
        // 1. Limpiamos los atajos vacíos antes de actualizar
        const descripcionLimpia = limpiarContenidoVacio(editandoVacante.descripcion);

        const vacanteData = {
            ...editandoVacante,
            // 2. Sobrescribimos la descripción con la versión filtrada
            descripcion: descripcionLimpia,
            limitePostulantes: editandoVacante.limitePostulantes ? parseInt(editandoVacante.limitePostulantes) : null
        };

        // 3. Enviamos la actualización a la API
        await API.put(`/vacantes/${editandoVacante.id}`, vacanteData);
        
        toast.success("¡Vacante actualizada correctamente!");
        
        // 4. Limpieza de estados y navegación
        setEditandoVacante(null);
        cargarVacantes(); // Recargar la lista para ver los cambios
        setActiveTab("gestion");
        window.scrollTo(0, 0);

    } catch (err) {
        console.error("Error al actualizar:", err);
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
        // 1. Llamamos al backend (que ahora hace el Soft Delete / cambia el estado a ELIMINADA)
        await API.delete(`/vacantes/${vacanteId}`);
        
        // 2. Mensaje más preciso para el usuario
        toast.success("Vacante movida a la papelera correctamente");
        
        // 3. RECARGA CRÍTICA: Esto hará que la vacante desaparezca del Panel de Gestión
        // porque el backend ya no la incluirá en la lista de activas.
        await cargarVacantes();
        
        // 4. Limpiamos selección si la vacante eliminada era la que estaba abierta en el modal
        if (vacanteSeleccionadaId === vacanteId) {
            setVacanteSeleccionadaId(null);
        }

    } catch (err) { 
        console.error("Error al eliminar:", err);
        toast.error("No se pudo mover la vacante a la papelera"); 
    } finally {
        // 5. Cerramos el modal de confirmación siempre
        setConfirmarEliminar({ visible: false, vacanteId: null, titulo: "" });
    }
};

const handleDesactivarVacante = async (vacanteId, estaDesactivada) => {
    try {
        // 1. Si la vacante ya estaba desactivada, la ponemos en "ABIERTA". 
        // Si no estaba desactivada, la ponemos en "DESACTIVADA".
        const nuevoEstado = estaDesactivada ? "ABIERTA" : "DESACTIVADA";
        
        // 2. Enviamos el cambio a tu ruta general de actualización,
        // pero esta vez enviando la variable 'estado'
        await API.put(`/vacantes/${vacanteId}`, { estado: nuevoEstado });
        
        // 3. Mostramos la alerta correspondiente
        toast.success(estaDesactivada ? "Vacante reactivada correctamente" : "Vacante desactivada correctamente");
        
        // 4. Refrescamos la interfaz
        cargarVacantes();
    } catch (err) {
        console.error("Error al cambiar estado:", err);
        toast.error("No se pudo procesar la solicitud");
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
// --- LÓGICA PARA HABILITAR BOTÓN DE PUBLICACIÓN Y EDICIÓN ---
const formularioCreacionCompleto = React.useMemo(() => {
    // Array con todos los nombres exactos de los campos obligatorios
    const camposRequeridos = [
        'titulo', 'descripcion', 'ubicacion', 'tipo', 'jornada', 
        'modalidad', 'tipoSalario', 'horario', 'limitePostulantes', 'fechaCierre'
    ];
    
    // El formulario está completo SOLO SI cada campo devuelve un string vacío (sin error)
    return camposRequeridos.every(campo => validateVacanteField(campo, nuevaVacante[campo]) === '');
}, [nuevaVacante]);

const formularioEdicionValido = React.useMemo(() => {
    if (!editandoVacante) return false;
    const camposRequeridos = [
        'titulo', 'descripcion', 'ubicacion', 'tipo', 'jornada', 
        'modalidad', 'tipoSalario', 'horario', 'limitePostulantes', 'fechaCierre'
    ];
    return camposRequeridos.every(campo => validateVacanteField(campo, editandoVacante[campo]) === '');
}, [editandoVacante]);

// Función para verificar si hay cambios sin guardar antes de navegar
const verificarSalida = (proximaTab) => {
    const editandoConCambios = activeTab === 'edicion' && tieneCambios;

    // 1. Limpiamos la descripción de etiquetas HTML básicas para ver si hay texto real
    const descripcionLimpia = nuevaVacante.descripcion?.replace(/<[^>]*>/g, '').trim();
    
    const creandoConDatos = activeTab === 'creacion' && (
        nuevaVacante.titulo.trim() !== "" || 
        (descripcionLimpia !== "" && descripcionLimpia !== undefined)
    );
    
    if (editandoConCambios || creandoConDatos) {
        setAvisoSalida({ visible: true, proximaTab });
    } else {
        setTouched({});
        setActiveTab(proximaTab);
        if (proximaTab === 'gestion') {
            setVacanteSeleccionadaId(null);
            // 🌟 CLAVE: Limpiamos por completo la vistaActiva al volver al panel
            setVistaActiva({ vista: 'gestion', chatData: null }); 
        }
        setShowProfileMenu(false); 
    }
};

// Protección contra cierre de pestaña o recarga accidental
useEffect(() => {
    const handleBeforeUnload = (e) => {
        // Aplicamos la misma limpieza de HTML aquí
        const descLimpia = nuevaVacante.descripcion?.replace(/<[^>]*>/g, '').trim();
        
        const tieneDatosCreacion = activeTab === 'creacion' && (
            nuevaVacante.titulo.trim() !== "" || 
            (descLimpia !== "" && descLimpia !== undefined)
        );
        const tieneCambiosEdicion = activeTab === 'edicion' && tieneCambios;

        if (tieneDatosCreacion || tieneCambiosEdicion) {
            e.preventDefault();
            e.returnValue = '¿Estás seguro de que quieres salir?';
            return e.returnValue;
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [tieneCambios, activeTab, nuevaVacante.titulo, nuevaVacante.descripcion]);

  // --- CORRECCIÓN 3: Iniciales seguras ---
    const obtenerIniciales = (nombreInput) => {
        const nombreFinal = nombreInput || empresa?.nombres || empresa?.nombre;
        if (!nombreFinal) return "UA"; 
        const partes = nombreFinal.trim().split(/\s+/); 
        if (partes.length >= 2) {
            return (partes[0][0] + partes[1][0]).toUpperCase();
        }
        return nombreFinal.substring(0, 2).toUpperCase();
    };

    // ❌ (Aquí borramos el if (loading) que tenías)

    // --- CORRECCIÓN 4: Variable segura ---
    const vacanteActual = vacantes.find(v => v.id === vacanteSeleccionadaId) || null;

    const handleCambiarEstado = async (postulacionId, nuevoEstado) => {
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

        try {
            await API.put(`/postulaciones/${postulacionId}/estado`, { estado: nuevoEstado });
            toast.success(`Estado actualizado`);
            if (vacanteSeleccionadaId) handleVerPostulaciones(vacanteSeleccionadaId);
        } catch (error) {
            toast.error("No se pudo actualizar el estado");
        }
    };

    // --- CÁLCULO DE CONTADORES PARA EL MENÚ (NUESTRO HOOK) ---
    const conteosEstado = React.useMemo(() => {
        const conteos = { activas: 0, desactivadas: 0, vencidas: 0, llenas: 0 };
        const ahora = new Date();

        vacantes.forEach(v => {
            const fechaCierre = v.fechaCierre ? new Date(v.fechaCierre) : null;
            if (fechaCierre) fechaCierre.setHours(23, 59, 59, 999);
            
            const postuladosActuales = v._count?.postulaciones || 0;
            const limite = v.limitePostulantes || 0;

            const estaExpirada = fechaCierre && fechaCierre < ahora;
            const cuposLlenos = limite > 0 && postuladosActuales >= limite;
            const esDesactivada = v.estado === "DESACTIVADA";
            const esActiva = v.estado === "ABIERTA" && !estaExpirada && !cuposLlenos;

            if (esActiva) conteos.activas++;
            if (esDesactivada) conteos.desactivadas++;
            if (estaExpirada) conteos.vencidas++;
            if (cuposLlenos) conteos.llenas++;
        });

        return conteos;
    }, [vacantes]);

    // --- LÓGICA DE FILTRADO DINÁMICO ---
    const vacantesFiltradas = vacantes.filter((v) => {
        const ahora = new Date();
        const fechaCierre = v.fechaCierre ? new Date(v.fechaCierre) : null;
        if (fechaCierre) fechaCierre.setHours(23, 59, 59, 999);
        
        const postuladosActuales = v._count?.postulaciones || 0;
        const limite = v.limitePostulantes || 0;

        const estaExpirada = fechaCierre && fechaCierre < ahora;
        const cuposLlenos = limite > 0 && postuladosActuales >= limite;
        const esDesactivada = v.estado === "DESACTIVADA";
        const esActiva = v.estado === "ABIERTA" && !estaExpirada && !cuposLlenos;

        const coincideTexto = v.titulo.toLowerCase().includes(searchTerm.toLowerCase());

        const fechaVacante = v.fechaCreacion ? v.fechaCreacion.split('T')[0] : "";
        let coincideFecha = true;
        if (fechaDesde && fechaHasta) coincideFecha = fechaVacante >= fechaDesde && fechaVacante <= fechaHasta;
        else if (fechaDesde) coincideFecha = fechaVacante >= fechaDesde;
        else if (fechaHasta) coincideFecha = fechaVacante <= fechaHasta;

        let coincideEstado = true;
        if (estadosSeleccionados.length > 0) {
            coincideEstado = false; 
            if (estadosSeleccionados.includes('activas') && esActiva) coincideEstado = true;
            if (estadosSeleccionados.includes('desactivadas') && esDesactivada) coincideEstado = true;
            if (estadosSeleccionados.includes('vencidas') && estaExpirada) coincideEstado = true;
            if (estadosSeleccionados.includes('llenas') && cuposLlenos) coincideEstado = true;
        }

        return coincideTexto && coincideFecha && coincideEstado;
    });

    // ❌ (Aquí borramos el otro if (loading) que tenías)

    const limpiarContenidoVacio = (html) => {
        if (!html) return "";
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        const items = tempDiv.querySelectorAll("li");
        items.forEach(li => {
            const texto = li.innerText.trim();
            if (texto.endsWith(":") || texto === "" || texto.endsWith(": ")) {
                li.remove();
            }
        });
        const listas = tempDiv.querySelectorAll("ul, ol");
        listas.forEach(lista => {
            if (lista.innerText.trim() === "") {
                let anterior = lista.previousElementSibling;
                if (anterior && (anterior.tagName === "P" || anterior.tagName === "STRONG")) {
                    anterior.remove();
                }
                lista.remove();
            }
        });
        return tempDiv.innerHTML;
    };
const hayFiltrosActivos = searchTerm !== "" || fechaDesde !== "" || fechaHasta !== "" || estadosSeleccionados.length > 0;
    // ✅ LA MAGIA OCURRE AQUÍ: Ponemos el validador de carga DESPUÉS de todos los Hooks y funciones.
    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    // Y ya de aquí en adelante arranca tu diseño normal sin problemas
    return (
        <div className="dashboard-layout dashboard-empresa-container">
            {/* SIDEBAR LIMPIO SIN BOTÓN DE CERRAR SESIÓN */}
        {/* SIDEBAR LIMPIO SIN BOTÓN DE CERRAR SESIÓN */}
        <nav 
            className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}
            onMouseEnter={() => setIsSidebarCollapsed(false)}
            onMouseLeave={() => setIsSidebarCollapsed(true)}
        >
            <div className="sidebar-top">
                <div className="sidebar-menu">
                    <button className={`menu-item ${activeTab === 'gestion' ? 'active' : ''}`} onClick={() => verificarSalida('gestion')}>
                        <Home size={22}/> <span>PANEL DE GESTIÓN</span>
                    </button>
                    <button className={`menu-item ${activeTab === 'creacion' ? 'active' : ''}`} onClick={() => verificarSalida('creacion')}>
                        <PlusCircle size={22}/> <span>PUBLICAR VACANTE</span>
                    </button>
                    <button className={`menu-item ${activeTab === 'metricas' ? 'active' : ''}`} onClick={() => verificarSalida('metricas')}>
                        <BarChart3 size={22}/> <span>MÉTRICAS Y REPORTES</span>
                    </button>
                    <button 
    className={`menu-item ${activeTab === 'notificaciones' ? 'active' : ''}`} 
    onClick={() => verificarSalida('notificaciones')}
>
    <div className="icon-wrapper"> 
        <Bell size={22} />
        {tieneNotifPendientes && <div className="notification-dot-orange"></div>}
    </div>
    <span>NOTIFICACIONES</span>
</button>
                    <button className={`menu-item ${activeTab === 'mensajes' ? 'active' : ''}`} onClick={() => verificarSalida('mensajes')}>
                        <MessageSquare size={22}/> <span>MENSAJES / CHAT</span>
                    </button>
                    <button className={`menu-item ${activeTab === 'total_postulaciones' ? 'active' : ''}`} onClick={() => verificarSalida('total_postulaciones')}>
                        <ClipboardList size={22}/> <span>LISTADO POSTULADOS</span>
                    </button>
                    {/* ... otros botones del menú ... */}
<button className={`menu-item ${activeTab === 'eliminadas' ? 'active' : ''}`} onClick={() => verificarSalida('eliminadas')}>
    <Trash2 size={22}/> <span>VACANTES ELIMINADAS</span>
</button>
                </div>
            </div>
            {/* Se eliminó el sidebar-footer de aquí */}
        </nav>

   <div className="glass-container">
    <header className="main-header-container">
        <div className="header-top-bar">
            <div className="bar-green"></div>
            <div className="bar-orange"></div>
        </div>
        <div className="header-content">
            {/* Lado Izquierdo: Ambos logos con divisoria */}
            <div className="header-left-brands">
                <img src={logoGrande} alt="Empres 360 Pro" className="header-brand-logo" />
                <div className="brand-divider"></div>
                <img src={logoUdec} alt="UdeC" className="header-udec-logo" />
            </div>

            {/* El centro queda vacío para que respire el diseño */}
            <div className="header-center"></div>

            <div className="header-right">
                <div className="user-profile-info" style={{ position: 'relative' }}>
                    <div className="user-details">
                        <span className="user-full-name-empresa">
                            {empresa?.nombres || empresa?.nombre || "Cargando..."}
                        </span>
                        <span className="user-career">Empresa Aliada</span>
                    </div>

                    <div
                        className="user-avatar-initials"
                        style={{ backgroundColor: '#006b3f', cursor: 'pointer' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowProfileMenu(!showProfileMenu);
                        }}
                    >
                        <span>{obtenerIniciales(empresa?.nombres || empresa?.nombre)}</span>
                    </div>

                    {showProfileMenu && (
                        <div className="profile-dropdown-container fade-in">
                            <button className="dropdown-item" onClick={() => {
                                setActiveTab("perfil");
                                setShowProfileMenu(false);
                            }}>
                                <User size={16} /> Ver Perfil
                            </button>
                            <div className="dropdown-divider"></div>
                            {/* Lógica unificada: abre el modal de confirmación */}
                            <button className="dropdown-item logout" onClick={() => {
                                setShowLogoutModal(true);
                                setShowProfileMenu(false);
                            }}>
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
                   {/* VISTA GESTIÓN REFORMADA (GRID COMPLETO) */}
{activeTab === 'gestion' && (
    <div className="vacantes-grid-wrapper fade-in">
        
        {/* Cabecera de filtros centrada y ancha */}
{/* Cabecera de filtros centrada y ancha */}
        <header className="vacantes-header-container-premium" style={{ position: 'relative', zIndex: 50 }}> {/* 👈 CORRECCIÓN 1: Z-Index alto */}
            <div className="vacantes-top-bar-hub">
                <div className="hub-left">
                    <div className="hub-icon-wrapper">
                        <Briefcase size={26} />
                    </div>
                    <div className="hub-title-text">
                        <h2>Mis Vacantes Activas</h2>
                        <p>Gestiona y supervisa el estado de tus ofertas publicadas</p>
                    </div>
                </div>

                <div className="hub-right">
                    <div className="hub-stats-control-wrapper">
                        <div className="hub-stat-card-mini">
                            <span className="stat-label">Total Ofertas</span>
                            <span className="stat-number">{vacantesFiltradas.length}</span>
                        </div>
                        
                        <button 
                            className={`btn-toggle-filters-hub ${!showFilters ? 'is-collapsed' : ''}`}
                            onClick={() => setShowFilters(!showFilters)}
                            title={showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
                        >
                            <ChevronRight size={20} className="icon-transition" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 👈 CORRECCIÓN 2: Liberar el overflow solo cuando está abierto */}
            <div 
                className={`filters-collapsible-content ${!showFilters ? 'collapsed' : ''}`}
                style={{ overflow: showFilters ? 'visible' : 'hidden' }}
            >
                <div className="search-filters-horizontal-hub" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
                    
                    {/* 🔍 BÚSQUEDA */}
                    <div className="search-input-wrapper-hub" style={{ flex: '1', minWidth: '200px' }}>
                        <Search size={18} className="search-icon-hub" />
                        <input 
                            type="text" 
                            className="search-input-field-premium"
                            placeholder="Buscar vacante..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                    </div>

                    {/* 📅 FECHAS */}
                    {/* 📅 FECHAS (Con etiquetas claras) */}
<div className="date-group-hub" style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
    
    {/* Contenedor Fecha Desde */}
    <div className="filter-date-pill-hub" style={{ 
        padding: '6px 10px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px',
        border: fechaDesde ? '1px solid #006b3f' : '1px solid #e2e8f0' // Se ilumina si tiene fecha
    }}>
        <Calendar size={14} style={{ color: '#64748b' }} />
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Desde:</span>
        <input 
            type="date" 
            value={fechaDesde} 
            onChange={(e) => setFechaDesde(e.target.value)} 
            style={{ 
                fontSize: '12px', 
                border: 'none', 
                background: 'transparent', 
                color: '#1e293b',
                fontWeight: '600',
                outline: 'none'
            }} 
        />
    </div>

    {/* Contenedor Fecha Hasta */}
    <div className="filter-date-pill-hub" style={{ 
        padding: '6px 10px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px',
        border: fechaHasta ? '1px solid #006b3f' : '1px solid #e2e8f0' // Se ilumina si tiene fecha
    }}>
        <Calendar size={14} style={{ color: '#64748b' }} />
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Hasta:</span>
        <input 
            type="date" 
            value={fechaHasta} 
            onChange={(e) => setFechaHasta(e.target.value)} 
            style={{ 
                fontSize: '12px', 
                border: 'none', 
                background: 'transparent', 
                color: '#1e293b',
                fontWeight: '600',
                outline: 'none'
            }} 
        />
    </div>
</div>

                    {/* ⚡ FILTRO POR ESTADO */}
                    <div className="status-dropdown-wrapper" style={{ position: 'relative' }}>
                        <button 
                            type="button"
                            className={`btn-filter-status-hub ${estadosSeleccionados.length > 0 ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); setShowStatusDropdown(!showStatusDropdown); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                                borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white',
                                fontSize: '13px', fontWeight: '600', color: '#64748b', cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <Filter size={16} />
                            <span>Estado {estadosSeleccionados.length > 0 && `(${estadosSeleccionados.length})`}</span>
                            <ChevronDown size={14} style={{ transform: showStatusDropdown ? 'rotate(180deg)' : 'rotate(0)' }} />
                        </button>

                        {showStatusDropdown && (
    <div 
        className="status-popover fade-in" 
        onClick={(e) => e.stopPropagation()} 
        style={{
            position: 'absolute', 
            top: '100%', 
            right: '0', 
            zIndex: 9999,
            background: 'white', 
            borderRadius: '12px', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)', 
            border: '1px solid #e2e8f0', 
            minWidth: '220px', // Un poco más ancho para que quepa el número
            padding: '12px',
            marginTop: '8px'
        }}
    >
        <p style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>Mostrar solo:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
                { id: 'activas', label: 'Activas', color: '#006b3f' },
                { id: 'desactivadas', label: 'Desactivadas', color: '#64748b' },
                { id: 'vencidas', label: 'Vencidas', color: '#ef4444' },
                { id: 'llenas', label: 'Cupos Llenos', color: '#f59e0b' }
            ].map(filtro => (
                <label key={filtro.id} style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    padding: '8px',
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    transition: 'background 0.2s',
                    fontSize: '13px', 
                    color: '#334155',
                    width: '100%' // Asegura que ocupe todo el ancho
                }} className="status-item-hover">
                    <input 
                        type="checkbox" 
                        checked={estadosSeleccionados.includes(filtro.id)}
                        onChange={(e) => {
                            if (e.target.checked) setEstadosSeleccionados([...estadosSeleccionados, filtro.id]);
                            else setEstadosSeleccionados(estadosSeleccionados.filter(id => id !== filtro.id));
                        }}
                        style={{ accentColor: filtro.color, width: '16px', height: '16px' }}
                    />
                    
                    {/* Contenedor flexible para separar el texto del número */}
                    <span style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between', // Empuja el número a la derecha
                        width: '100%',
                        color: estadosSeleccionados.includes(filtro.id) ? filtro.color : '#475569', 
                        fontWeight: estadosSeleccionados.includes(filtro.id) ? '700' : '500' 
                    }}>
                        <span>{filtro.label}</span>
                        
                        {/* La pastilla del contador */}
                        <span style={{
                            backgroundColor: `${filtro.color}15`, // Fondo semitransparente con el color del estado
                            color: filtro.color,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '800'
                        }}>
                            {conteosEstado[filtro.id]}
                        </span>
                    </span>
                </label>
            ))}
        </div>
    </div>
)}
                    </div>

                    {/* 🧹 BOTÓN LIMPIAR */}
                    {/* 🧹 BOTÓN LIMPIAR (Dinámico) */}
<button 
    className="btn-clear-hub-premium" 
    onClick={limpiarFiltros} 
    title="Limpiar filtros"
    disabled={!hayFiltrosActivos} // 👈 Se desactiva si no hay filtros
    style={{ 
        padding: '10px', 
        flexShrink: 0,
        cursor: hayFiltrosActivos ? 'pointer' : 'not-allowed', // Cambia el puntero
        opacity: hayFiltrosActivos ? 1 : 0.4, // Se vuelve opaco si está desactivado
        filter: hayFiltrosActivos ? 'none' : 'grayscale(1)', // Se pone gris si está desactivado
        transition: 'all 0.3s ease'
    }}
>
    <XCircle size={20} />
</button>
                </div> 
            </div> 
        </header>
        {/* --- REJILLA DE VACANTES --- */}
{/* --- REJILLA DE VACANTES PRO REFORMADA --- */}
{/* --- REJILLA DE VACANTES PRO REFORMADA --- */}
<div className="vacantes-main-grid">
{vacantesFiltradas.map((v) => {
    // 1. Lógica de Animación y Notificación Persistente
    const esNuevaAnimacion = vacanteAnimadaId === v.id;
    const tieneNovedadPersistente = vacantesConNovedad.includes(v.id);

    // 2. Lógica de Tiempos, Cupos y Estado
    const ahora = new Date();
    const fechaCierre = v.fechaCierre ? new Date(v.fechaCierre) : null;
    
    if (fechaCierre) {
        fechaCierre.setHours(23, 59, 59, 999);
    }

    const postuladosActuales = v._count?.postulaciones || 0;
    const limite = v.limitePostulantes || 0;

    // ... (tu código de fechas)
    const estaExpirada = fechaCierre && fechaCierre < ahora;
    const cuposLlenos = limite > 0 && postuladosActuales >= limite;
    
    // 👇 Ahora nos basamos en el estado real de tu base de datos
    const esDesactivada = v.estado === "DESACTIVADA"; 

    // 3. DETERMINACIÓN ÚNICA DE LA CLASE
    let blinkClass = "";
    if (esDesactivada) {
        blinkClass = "blink-disabled"; 
    } else if (estaExpirada) {
        blinkClass = "blink-expired";
    } else if (cuposLlenos) {
        blinkClass = "blink-full";
    }

    return (
        <div 
            key={v.id} 
            className={`pro-vacante-card ${esNuevaAnimacion ? 'pulse-new-notification' : ''} ${blinkClass}`} 
            onClick={() => handleVerPostulaciones(v.id)}
            style={{ position: 'relative', overflow: 'visible' }}
        >
            {/* --- BLOQUE DE BADGES --- */}
            
            {tieneNovedadPersistente && (
                <div className="badge-new-postulacion">
                    <Sparkles size={12} /> NUEVA
                </div>
            )}

            {/* Badge de Desactivada (Prioridad visual) */}
            {esDesactivada ? (
                <div className="badge-alert-blink alert-gray">
                    <XCircle size={12} /> VACANTE DESACTIVADA
                </div>
            ) : (
                <>
                    {estaExpirada && (
                        <div className="badge-alert-blink alert-red">
                            <Clock size={12} /> FECHA VENCIDA
                        </div>
                    )}

                    {cuposLlenos && !estaExpirada && (
                        <div className="badge-alert-blink alert-orange">
                            <Users size={12} /> CUPOS LLENOS
                        </div>
                    )}
                </>
            )}

            {/* ... resto del contenido de la tarjeta ... */}
            <div className="pro-card-header-full">
                <div className="pro-icon-container">
                    <Briefcase size={20} />
                </div>
                <h3 className="pro-vacante-title">{v.titulo}</h3>
                
                <div className="pro-postulantes-badge-mini">
                    <Users size={14} />
                    <span>{postuladosActuales}</span>
                </div>
            </div>

            <div className="pro-card-meta-row">
                <span className="meta-pill-simple"><MapPin size={14} /> {v.ubicacion}</span>
                <span className="meta-pill-simple"><Clock size={14} /> {v.modalidad}</span>
            </div>

            <div className="pro-card-actions-footer">
                {/* Botón de Activar/Desactivar */}
<button 
    className="pro-btn-footer toggle-status"
    onClick={(e) => { 
        e.stopPropagation(); 
        handleDesactivarVacante(v.id, esDesactivada); // 👈 Aquí le pasamos si está desactivada o no
    }}
    style={{ color: !esDesactivada ? '#64748b' : '#006b3f' }}
>
    {!esDesactivada ? <XCircle size={16} /> : <CheckCircle size={16} />}
    <span>{!esDesactivada ? "Desactivar" : "Activar"}</span>
</button>

                <button 
                    className="pro-btn-footer edit" 
                    onClick={(e) => { e.stopPropagation(); handlePrepararEdicion(v); }}
                >
                    <Edit3 size={16} /> <span>Editar</span>
                </button>
                <button 
                    className="pro-btn-footer delete" 
                    onClick={(e) => { e.stopPropagation(); handleEliminarVacante(v.id, v.titulo); }}
                >
                    <Trash2 size={16} /> <span>Mover a la papelera</span>
                </button>
            </div>
        </div>
    );
})}
</div>

        {/* --- MODAL DE GESTIÓN DE CANDIDATOS --- */}
        {vacanteSeleccionadaId && (
    <div className="modal-overlay fade-in" onClick={() => setVacanteSeleccionadaId(null)}>
        <div className="gestion-modal-content" onClick={(e) => e.stopPropagation()}>
            
            {/* AQUÍ DEBE ESTAR LA CABECERA PREMIUM QUE CREAMOS */}
            <header className="modal-gestion-header-premium">
                        {/* Decoración de fondo sutil */}
                        <div className="header-bg-glow"></div>
                        
                        <div className="header-title-wrapper">
                            <div className="header-icon-box">
                                <Briefcase size={28} color="#ffffff" strokeWidth={1.5} />
                            </div>
                            <div className="header-text-info">
                                <h2>{vacanteActual?.titulo}</h2>
                                <div className="header-badges">
                                    <span className="badge-active">
                                        <Sparkles size={12} /> Oferta Activa
                                    </span>
                                    <span className="badge-info">
                                        <MapPin size={12} /> {vacanteActual?.ubicacion || 'Sin ubicación'}
                                    </span>
                                    <span className="badge-info">
                                        <Clock size={12} /> {vacanteActual?.modalidad || 'Presencial'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <button 
    className="btn-close-modal-premium" 
    onClick={() => {
        setVacanteSeleccionadaId(null);
        // 🌟 CLAVE: Limpiamos la vistaActiva al cerrar el modal de la vacante
        setVistaActiva({ vista: 'gestion', chatData: null });
    }}
>
    <X size={24} />
</button>
                    </header>
<div className="modal-gestion-body">
                {/* IMPORTANTE: Renderiza la tabla directamente.
                    No le pongas condiciones, la tabla sola sabe cuándo mostrar la lupa. */}
                <ListaPostulacionesTable 
                    postulaciones={postulaciones} 
                    stages={PIPELINE_STAGES}
                    onCambiarEstado={handleCambiarEstado}
                    onVerPerfil={handleVerPerfil}
                    onDescargarDirecto={handleDescargaDirecta}
                    onAbrirChat={(p) => { setChatPostulante(p); setIsChatOpen(true); }}
                    highlightId={vistaActiva?.postulacionId}
                />
            </div>
            
        </div>
    </div>
)}
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
                <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                    
                    {/* COLUMNA IZQUIERDA: Información General */}
                    <div style={{ flex: '1.2' }}>
                        <div className="section-subtitle">
                            <FileText size={18} /> <span>Información General</span>
                        </div>
                        <div className="form-group full" style={{ marginBottom: '20px' }}>
                            <label>Título de la Vacante *</label>
                            <input 
                                type="text" 
                                name="titulo"
                                required 
                                value={nuevaVacante.titulo} 
                                onChange={(e) => setNuevaVacante({ ...nuevaVacante, titulo: e.target.value })} 
                                onBlur={handleVacanteBlur}
                                placeholder="Ej: Desarrollador Web Junior" 
                                style={{ borderColor: touched.titulo && validateVacanteField('titulo', nuevaVacante.titulo) ? '#ef4444' : '' }}
                            />
                            {renderValidation('titulo', nuevaVacante)} 
                        </div>
                        <div className="form-group full">
                            <label>Descripción del Cargo *</label>
                            <div style={{ marginBottom: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '13px', color: '#64748b', alignSelf: 'center', marginRight: '5px' }}>
                                    <Edit3 size={14} style={{ verticalAlign: 'middle' }} /> Insertar guía:
                                </span>
                                <button type="button" onClick={() => insertarPlantilla('requisitos')} className="btn-guia-editor">Requisitos</button>
                                <button type="button" onClick={() => insertarPlantilla('funciones')} className="btn-guia-editor">Funciones</button>
                                <button type="button" onClick={() => insertarPlantilla('habilidades')} className="btn-guia-editor">Habilidades</button>
                                <button type="button" onClick={() => insertarPlantilla('responsabilidades')} className="btn-guia-editor">Responsabilidades Críticas</button>
                            </div>
                            <div className="editor-wrapper" style={{ background: '#fff', borderRadius: '8px', color: '#333', width: '100%', position: 'relative' }}>
                                <ReactQuill 
                                    theme="snow"
                                    value={nuevaVacante.descripcion || ""}
                                    onChange={(content) => setNuevaVacante({ ...nuevaVacante, descripcion: content })} 
                                    onBlur={() => setTouched(prev => ({ ...prev, descripcion: true }))}
                                    modules={modules}
                                    formats={formats}
                                    placeholder="Escribe la descripción aquí..."
                                    style={{ height: '300px', marginBottom: '50px' }}
                                />
                                {renderValidation('descripcion', nuevaVacante)}
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: Detalles Técnicos */}
                    <div style={{ flex: '1', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                        <div className="section-subtitle">
                            <Briefcase size={18} /> <span>Detalles Técnicos</span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group" style={{ position: 'relative' }}>
                                <label>Tipo de Contrato *</label>
                                <div className="customSelectHeader" onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'contrato' ? null : 'contrato'); }} style={{ borderColor: touched.tipo && validateVacanteField('tipo', nuevaVacante.tipo) ? '#ef4444' : '' }}>
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
                                                setTouched(prev => ({ ...prev, tipo: true }));
                                            }}>{op}</div>
                                        ))}
                                    </div>
                                )}
                                {nuevaVacante.mostrarOtroContrato && (
                                    <input type="text" name="tipo" placeholder="Especifica contrato" className="fade-in" style={{ marginTop: '8px' }} required value={nuevaVacante.tipo} onChange={(e) => setNuevaVacante({ ...nuevaVacante, tipo: e.target.value })} onBlur={handleVacanteBlur} />
                                )}
                                {renderValidation('tipo', nuevaVacante)}
                            </div>

                            <div className="form-group" style={{ position: 'relative' }}>
                                <label>Jornada *</label>
                                <div className="customSelectHeader" onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'jornada' ? null : 'jornada'); }} style={{ borderColor: touched.jornada && validateVacanteField('jornada', nuevaVacante.jornada) ? '#ef4444' : '' }}>
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
                                                setTouched(prev => ({ ...prev, jornada: true }));
                                            }}>{op}</div>
                                        ))}
                                    </div>
                                )}
                                {nuevaVacante.mostrarOtraJornada && (
                                    <input type="text" name="jornada" placeholder="Especifica jornada" className="fade-in" style={{ marginTop: '8px' }} required value={nuevaVacante.jornada} onChange={(e) => setNuevaVacante({ ...nuevaVacante, jornada: e.target.value })} onBlur={handleVacanteBlur} />
                                )}
                                {renderValidation('jornada', nuevaVacante)}
                            </div>

                            <div className="form-group" style={{ position: 'relative' }}>
                                <label>Modalidad *</label>
                                <div className="customSelectHeader" onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'modalidad' ? null : 'modalidad'); }} style={{ borderColor: touched.modalidad && validateVacanteField('modalidad', nuevaVacante.modalidad) ? '#ef4444' : '' }}>
                                    <span>{nuevaVacante.modalidad || "Selecciona"}</span>
                                    <span className="selectArrow">▾</span>
                                </div>
                                {openDropdown === 'modalidad' && (
                                    <div className="customSelectDropdown">
                                        {["Presencial", "Remoto", "Híbrido"].map((op) => (
                                            <div key={op} className="dropdownOption" onClick={() => {
                                                setNuevaVacante({ ...nuevaVacante, modalidad: op });
                                                setOpenDropdown(null);
                                                setTouched(prev => ({ ...prev, modalidad: true }));
                                            }}>{op}</div>
                                        ))}
                                    </div>
                                )}
                                {renderValidation('modalidad', nuevaVacante)}
                            </div>

                            <div className="form-group" style={{ position: 'relative' }}>
                                <label>Tipo de Salario *</label>
                                <div className="customSelectHeader" onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'salario' ? null : 'salario'); }} style={{ borderColor: touched.tipoSalario && validateVacanteField('tipoSalario', nuevaVacante.tipoSalario) ? '#ef4444' : '' }}>
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
                                                setTouched(prev => ({ ...prev, tipoSalario: true }));
                                            }}>{op}</div>
                                        ))}
                                    </div>
                                )}
                                {nuevaVacante.mostrarOtroSalario && (
                                    <input type="text" name="tipoSalario" placeholder="Especifica tipo salario" className="fade-in" style={{ marginTop: '8px' }} required value={nuevaVacante.tipoSalario} onChange={(e) => setNuevaVacante({ ...nuevaVacante, tipoSalario: e.target.value })} onBlur={handleVacanteBlur} />
                                )}
                                {renderValidation('tipoSalario', nuevaVacante)}
                            </div>

                            <div className="form-group">
                                <label>Salario (Opcional)</label>
                                <div className="input-with-icon">
                                    <span style={{paddingLeft: '10px'}}>$</span>
                                    <input type="text" name="salario" placeholder="2.500.000" value={nuevaVacante.salario} onChange={(e) => setNuevaVacante({ ...nuevaVacante, salario: e.target.value })} onBlur={handleVacanteBlur} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Horario *</label>
                                <div className="input-with-icon">
                                    <Clock size={16} style={{marginLeft: '10px'}}/>
                                    <input type="text" name="horario" required placeholder="Lun-Vie 8am-5pm" value={nuevaVacante.horario} onChange={(e) => setNuevaVacante({ ...nuevaVacante, horario: e.target.value })} onBlur={handleVacanteBlur} style={{ borderColor: touched.horario && validateVacanteField('horario', nuevaVacante.horario) ? '#ef4444' : '' }} />
                                </div>
                                {renderValidation('horario', nuevaVacante)}
                            </div>

                            <div className="form-group">
                                <label>Ubicación *</label>
                                <div className="input-with-icon">
                                    <MapPin size={16} style={{marginLeft: '10px'}}/>
                                    <input type="text" name="ubicacion" required placeholder="Ciudad o sede" value={nuevaVacante.ubicacion} onChange={(e) => setNuevaVacante({ ...nuevaVacante, ubicacion: e.target.value })} onBlur={handleVacanteBlur} style={{ borderColor: touched.ubicacion && validateVacanteField('ubicacion', nuevaVacante.ubicacion) ? '#ef4444' : '' }} />
                                </div>
                                {renderValidation('ubicacion', nuevaVacante)}
                            </div>

                            <div className="form-group">
                                <label>Cupos disponibles *</label>
                                <div className="input-with-icon">
                                    <Users size={16} style={{marginLeft: '10px'}}/>
                                    <input type="number" name="limitePostulantes" required placeholder="Ej: 20" value={nuevaVacante.limitePostulantes} onChange={(e) => setNuevaVacante({ ...nuevaVacante, limitePostulantes: e.target.value })} onBlur={handleVacanteBlur} style={{ borderColor: touched.limitePostulantes && validateVacanteField('limitePostulantes', nuevaVacante.limitePostulantes) ? '#ef4444' : '' }} />
                                </div>
                                {renderValidation('limitePostulantes', nuevaVacante)}
                            </div>

                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Fecha de Cierre *</label>
                                <div className="input-with-icon">
                                    <Calendar size={16} style={{marginLeft: '10px'}}/>
                                    <input type="date" name="fechaCierre" required value={nuevaVacante.fechaCierre} onChange={(e) => setNuevaVacante({ ...nuevaVacante, fechaCierre: e.target.value })} onBlur={handleVacanteBlur} style={{ borderColor: touched.fechaCierre && validateVacanteField('fechaCierre', nuevaVacante.fechaCierre) ? '#ef4444' : '' }} />
                                </div>
                                {renderValidation('fechaCierre', nuevaVacante)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-actions-footer" style={{ marginTop: '30px' }}>
                    <button type="button" className="btn-secondary" onClick={() => verificarSalida('gestion')}>
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        className="btn-primary-udec"
                        disabled={!formularioCreacionCompleto} 
                        style={{ 
                            background: !formularioCreacionCompleto ? '#cbd5e1' : '#006b3f',
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
                            <input 
                                type="text" 
                                name="titulo" 
                                required 
                                value={editandoVacante.titulo} 
                                onChange={(e) => setEditandoVacante({ ...editandoVacante, titulo: e.target.value })} 
                                onBlur={handleVacanteBlur}
                                style={{ borderColor: touched.titulo && validateVacanteField('titulo', editandoVacante.titulo) ? '#ef4444' : '' }}
                            />
                            {renderValidation('titulo', editandoVacante)}
                        </div>
                        <div className="form-group full">
                            <label>Descripción del Cargo *</label>
                            <div style={{ marginBottom: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '13px', color: '#64748b', alignSelf: 'center', marginRight: '5px' }}>
                                     Insertar guía:
                                </span>
                                <button type="button" onClick={() => insertarPlantilla('requisitos')} className="btn-guia-editor">Requisitos</button>
                                <button type="button" onClick={() => insertarPlantilla('funciones')} className="btn-guia-editor">Funciones</button>
                                <button type="button" onClick={() => insertarPlantilla('habilidades')} className="btn-guia-editor">Habilidades</button>
                                <button type="button" onClick={() => insertarPlantilla('responsabilidades')} className="btn-guia-editor">Responsabilidades Críticas</button>
                            </div>
                            <div className="editor-wrapper" style={{ background: '#fff', borderRadius: '8px', color: '#333', width: '100%', position: 'relative' }}>
                                <ReactQuill 
                                    theme="snow"
                                    value={editandoVacante.descripcion || ""} 
                                    onChange={(content) => setEditandoVacante({ ...editandoVacante, descripcion: content })}
                                    onBlur={() => setTouched(prev => ({ ...prev, descripcion: true }))}
                                    modules={modules}
                                    formats={formats}
                                    style={{ height: '300px', marginBottom: '50px' }}
                                />
                                {renderValidation('descripcion', editandoVacante)}
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: Detalles Técnicos */}
                    <div style={{ flex: '1', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                        <div className="section-subtitle">
                            <Briefcase size={18} /> <span>Detalles Técnicos</span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group" style={{ position: 'relative' }}>
                                <label>Tipo de Contrato *</label>
                                <div className="customSelectHeader" onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'edit-contrato' ? null : 'edit-contrato'); }} style={{ borderColor: touched.tipo && validateVacanteField('tipo', editandoVacante.tipo) ? '#ef4444' : '' }}>
                                    <span style={{ color: editandoVacante.mostrarOtroContrato ? '#999' : '#333' }}>
                                        {editandoVacante.mostrarOtroContrato ? "Otro..." : (editandoVacante.tipo || "Selecciona")}
                                    </span>
                                    <span className="selectArrow">▾</span>
                                </div>
                                {openDropdown === 'edit-contrato' && (
                                    <div className="customSelectDropdown">
                                        {["Término Fijo", "Término Indefinido", "Obra o Labor", "Prestación de Servicios", "Contrato de Aprendizaje", "Otro"].map((op) => (
                                            <div key={op} className="dropdownOption" onClick={() => {
                                                if (op === "Otro") setEditandoVacante({ ...editandoVacante, tipo: "", mostrarOtroContrato: true });
                                                else setEditandoVacante({ ...editandoVacante, tipo: op, mostrarOtroContrato: false });
                                                setOpenDropdown(null);
                                                setTouched(prev => ({ ...prev, tipo: true }));
                                            }}>{op}</div>
                                        ))}
                                    </div>
                                )}
                                {editandoVacante.mostrarOtroContrato && (
                                    <input type="text" name="tipo" placeholder="Especifica contrato" className="fade-in" style={{ marginTop: '8px', gridColumn: 'span 2' }} required value={editandoVacante.tipo} onChange={(e) => setEditandoVacante({ ...editandoVacante, tipo: e.target.value })} onBlur={handleVacanteBlur} />
                                )}
                                {renderValidation('tipo', editandoVacante)}
                            </div>

                            <div className="form-group" style={{ position: 'relative' }}>
                                <label>Jornada *</label>
                                <div className="customSelectHeader" onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'edit-jornada' ? null : 'edit-jornada'); }} style={{ borderColor: touched.jornada && validateVacanteField('jornada', editandoVacante.jornada) ? '#ef4444' : '' }}>
                                    <span style={{ color: editandoVacante.mostrarOtraJornada ? '#999' : '#333' }}>
                                        {editandoVacante.mostrarOtraJornada ? "Otro..." : (editandoVacante.jornada || "Selecciona")}
                                    </span>
                                    <span className="selectArrow">▾</span>
                                </div>
                                {openDropdown === 'edit-jornada' && (
                                    <div className="customSelectDropdown">
                                        {["Tiempo Completo", "Medio Tiempo", "Tiempo Parcial", "Por Horas", "Otro"].map((op) => (
                                            <div key={op} className="dropdownOption" onClick={() => {
                                                if (op === "Otro") setEditandoVacante({ ...editandoVacante, jornada: "", mostrarOtraJornada: true });
                                                else setEditandoVacante({ ...editandoVacante, jornada: op, mostrarOtraJornada: false });
                                                setOpenDropdown(null);
                                                setTouched(prev => ({ ...prev, jornada: true }));
                                            }}>{op}</div>
                                        ))}
                                    </div>
                                )}
                                {editandoVacante.mostrarOtraJornada && (
                                    <input type="text" name="jornada" placeholder="Especifica jornada" className="fade-in" style={{ marginTop: '8px', gridColumn: 'span 2' }} required value={editandoVacante.jornada} onChange={(e) => setEditandoVacante({ ...editandoVacante, jornada: e.target.value })} onBlur={handleVacanteBlur} />
                                )}
                                {renderValidation('jornada', editandoVacante)}
                            </div>

                            <div className="form-group" style={{ position: 'relative' }}>
                                <label>Modalidad *</label>
                                <div className="customSelectHeader" onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'edit-modalidad' ? null : 'edit-modalidad'); }} style={{ borderColor: touched.modalidad && validateVacanteField('modalidad', editandoVacante.modalidad) ? '#ef4444' : '' }}>
                                    <span>{editandoVacante.modalidad || "Selecciona"}</span>
                                    <span className="selectArrow">▾</span>
                                </div>
                                {openDropdown === 'edit-modalidad' && (
                                    <div className="customSelectDropdown">
                                        {["Presencial", "Remoto", "Híbrido"].map((op) => (
                                            <div key={op} className="dropdownOption" onClick={() => {
                                                setEditandoVacante({ ...editandoVacante, modalidad: op });
                                                setOpenDropdown(null);
                                                setTouched(prev => ({ ...prev, modalidad: true }));
                                            }}>{op}</div>
                                        ))}
                                    </div>
                                )}
                                {renderValidation('modalidad', editandoVacante)}
                            </div>

                            <div className="form-group" style={{ position: 'relative' }}>
                                <label>Tipo de Salario *</label>
                                <div className="customSelectHeader" onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'edit-salario' ? null : 'edit-salario'); }} style={{ borderColor: touched.tipoSalario && validateVacanteField('tipoSalario', editandoVacante.tipoSalario) ? '#ef4444' : '' }}>
                                    <span style={{ color: editandoVacante.mostrarOtroSalario ? '#999' : '#333' }}>
                                        {editandoVacante.mostrarOtroSalario ? "Otro..." : (editandoVacante.tipoSalario || "Selecciona")}
                                    </span>
                                    <span className="selectArrow">▾</span>
                                </div>
                                {openDropdown === 'edit-salario' && (
                                    <div className="customSelectDropdown">
                                        {["Básico", "Integral", "A convenir", "Rango Salarial", "Otro"].map((op) => (
                                            <div key={op} className="dropdownOption" onClick={() => {
                                                if (op === "Otro") setEditandoVacante({ ...editandoVacante, tipoSalario: "", mostrarOtroSalario: true });
                                                else setEditandoVacante({ ...editandoVacante, tipoSalario: op, mostrarOtroSalario: false });
                                                setOpenDropdown(null);
                                                setTouched(prev => ({ ...prev, tipoSalario: true }));
                                            }}>{op}</div>
                                        ))}
                                    </div>
                                )}
                                {editandoVacante.mostrarOtroSalario && (
                                    <input type="text" name="tipoSalario" placeholder="Especifica tipo de salario" className="fade-in" style={{ marginTop: '8px' }} required value={editandoVacante.tipoSalario} onChange={(e) => setEditandoVacante({ ...editandoVacante, tipoSalario: e.target.value })} onBlur={handleVacanteBlur} />
                                )}
                                {renderValidation('tipoSalario', editandoVacante)}
                            </div>

                            <div className="form-group">
                                <label>Monto</label>
                                <div className="input-with-icon">
                                    <span style={{paddingLeft: '10px'}}>$</span>
                                    <input type="text" name="salario" value={editandoVacante.salario} onChange={(e) => setEditandoVacante({ ...editandoVacante, salario: e.target.value })} onBlur={handleVacanteBlur} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Horario *</label>
                                <div className="input-with-icon">
                                    <Clock size={16} style={{marginLeft: '10px'}}/>
                                    <input type="text" name="horario" required value={editandoVacante.horario} onChange={(e) => setEditandoVacante({ ...editandoVacante, horario: e.target.value })} onBlur={handleVacanteBlur} style={{ borderColor: touched.horario && validateVacanteField('horario', editandoVacante.horario) ? '#ef4444' : '' }} />
                                </div>
                                {renderValidation('horario', editandoVacante)}
                            </div>

                            <div className="form-group">
                                <label>Ubicación *</label>
                                <div className="input-with-icon">
                                    <MapPin size={16} style={{marginLeft: '10px'}}/>
                                    <input type="text" name="ubicacion" required value={editandoVacante.ubicacion} onChange={(e) => setEditandoVacante({ ...editandoVacante, ubicacion: e.target.value })} onBlur={handleVacanteBlur} style={{ borderColor: touched.ubicacion && validateVacanteField('ubicacion', editandoVacante.ubicacion) ? '#ef4444' : '' }} />
                                </div>
                                {renderValidation('ubicacion', editandoVacante)}
                            </div>

                            <div className="form-group">
                                <label>Cupos disponibles *</label>
                                <div className="input-with-icon">
                                    <Users size={16} style={{marginLeft: '10px'}}/>
                                    <input type="number" name="limitePostulantes" required value={editandoVacante.limitePostulantes} onChange={(e) => setEditandoVacante({ ...editandoVacante, limitePostulantes: e.target.value })} onBlur={handleVacanteBlur} style={{ borderColor: touched.limitePostulantes && validateVacanteField('limitePostulantes', editandoVacante.limitePostulantes) ? '#ef4444' : '' }} />
                                </div>
                                {renderValidation('limitePostulantes', editandoVacante)}
                            </div>

                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Fecha de Cierre *</label>
                                <div className="input-with-icon">
                                    <Calendar size={16} style={{marginLeft: '10px'}}/>
                                    <input type="date" name="fechaCierre" required value={editandoVacante.fechaCierre} onChange={(e) => setEditandoVacante({ ...editandoVacante, fechaCierre: e.target.value })} onBlur={handleVacanteBlur} style={{ borderColor: touched.fechaCierre && validateVacanteField('fechaCierre', editandoVacante.fechaCierre) ? '#ef4444' : '' }} />
                                </div>
                                {renderValidation('fechaCierre', editandoVacante)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-actions-footer" style={{ marginTop: '30px' }}>
                    <button type="button" className="btn-secondary" onClick={() => verificarSalida('gestion')}>Cancelar</button>
                    <button 
    type="submit" 
    className="btn-primary-udec" 
    style={{ 
        background: (!tieneCambios || !formularioEdicionValido) ? '#cbd5e1' : '#f59e0b', 
        cursor: (!tieneCambios || !formularioEdicionValido) ? 'not-allowed' : 'pointer', 
        opacity: (!tieneCambios || !formularioEdicionValido) ? 0.7 : 1, 
        border: 'none',
        transition: 'all 0.3s ease'
    }} 
    disabled={!tieneCambios || !formularioEdicionValido} 
>
    <CheckCircle size={18} /> 
    {!tieneCambios 
        ? "Sin cambios" 
        : (!formularioEdicionValido ? "Faltan campos" : "Actualizar Vacante")
    }
</button>
                </div>
            </form>
        </div>
    </div>
)}

{activeTab === 'notificaciones' && (
    <div className="full-view fade-in">
        <NotificacionesEmpresa 
            empresaId={empresa?.id} 
            setVistaActiva={setVistaActiva}
            actualizarPendientes={consultarPendientes}
        />
    </div>
)}
{/* 👇 ESTO ES LO QUE TE HACE FALTA AGREGAR 👇 */}
{activeTab === 'mensajes' && (
    <div className="full-view fade-in" style={{ height: '100%' }}>
        <ChatSidebar 
            empresaId={empresa?.id} 
            chatData={vistaActiva?.chatData} // 👈 Aquí viajan los IDs de la animación
        />
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
    {activeTab === 'eliminadas' && (
    <div className="full-view fade-in">
        <VacantesEliminadas empresaId={empresa?.id} />
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
{/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ACTUALIZADO */}
{confirmarEliminar.visible && (
    <div className="modal-overlay fade-in" style={{ zIndex: 10000 }}>
        <div className="logout-modal delete-modal-premium">
            <div className="modal-icon delete-icon-animated">
                <Trash2 size={40} color="#f59e0b" strokeWidth={1.5} /> {/* Cambié a naranja para indicar advertencia, no destrucción */}
            </div>
            
            <h3>¿Mover a la papelera?</h3>
            
            <p style={{ textAlign: 'center', color: '#1e293b', marginBottom: '10px' }}>
    Estás a punto de retirar la oferta: <br />
    <strong style={{ fontSize: '1.1rem', display: 'block', marginTop: '5px' }}>
        "{confirmarEliminar.titulo}"
    </strong>
</p>

<p style={{ 
    textAlign: 'justify', 
    fontSize: '14px', 
    lineHeight: '1.6', 
    color: '#64748b',
    marginTop: '20px',
    padding: '0 20px', // Espaciado lateral para que el justificado respire
    hyphens: 'auto'    // Opcional: ayuda a que las palabras se corten mejor si es necesario
}}>
    La vacante será retirada del portal y los candidatos ya no podrán postularse. 
    El historial de las personas que aplicaron hasta hoy se conservará en tu 
    <strong style={{ color: '#006b3f' }}> Control de Vacantes Eliminadas</strong> para tu consulta o reactivación.
</p>

            <div className="modal-actions">
                <button 
                    className="btn-cancel" 
                    onClick={() => setConfirmarEliminar({ visible: false, vacanteId: null, titulo: "" })}
                >
                    Cancelar
                </button>
                <button 
    className="btn-confirm" 
    style={{ 
        backgroundColor: '#f59e0b', 
        borderColor: '#f59e0b',
        whiteSpace: 'nowrap', // 👈 Esto evita el salto de línea
        padding: '10px 20px',  // Ajustamos el padding para que no se vea apretado
        minWidth: 'fit-content' // Asegura que el botón crezca con el texto
    }} 
    onClick={ejecutarEliminacion}
>
    Mover a la papelera
</button>
            </div>
        </div>
    </div>
)}
        </div>
    );
}