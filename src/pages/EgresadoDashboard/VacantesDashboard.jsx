import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../../services/api'; 
import logoUdec from '../../assets/UdeC2.png';
import logoGrande from '../../assets/Logo2.png';

import {
    LogOut,
    MessageSquare,
    Briefcase,
    Building2,
    PlusCircle,
    Home,
    Bell,
    ClipboardList,
    Clock,
    User,
    XCircle,
    CheckCircle,
    Search,
    ChevronUp,
    ChevronDown,
    SlidersHorizontal,
    Eye,
    Send,
    ArrowUpRight
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
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import VerPerfilEmpresa from './VerPerfilEmpresa';
import EgresadosVerEmpresas from '../../components/EgresadosVerEmpresas';

const AlignStyle = Quill.import('attributors/class/align');
Quill.register(AlignStyle, true);

// También registraremos el tamaño para evitar que se guarden tamaños diminutos
const SizeStyle = Quill.import('attributors/style/size');
Quill.register(SizeStyle, true);

/* --- Tabla de Vacantes: rangos de salario y estilo de badges de modalidad ---
   Solo tokens de marca (verde / dorado / gris institucional), en distintas
   saturaciones — sin colores nuevos fuera de la paleta del manual. */
const RANGOS_SALARIO = [
    { id: '0-2', label: '$0 – $2.000.000', min: 0, max: 2000000 },
    { id: '2-4', label: '$2.000.000 – $4.000.000', min: 2000000, max: 4000000 },
    { id: '4-6', label: '$4.000.000 – $6.000.000', min: 4000000, max: 6000000 },
    { id: '6+', label: '$6.000.000 o más', min: 6000000, max: Infinity },
];

const ESTILO_MODALIDAD = {
    Presencial: { bg: 'rgba(0, 123, 62, .10)', text: 'var(--udec-green-strong)', dot: 'var(--udec-green)' },
    'Híbrido': { bg: 'var(--udec-gold-bg)', text: 'var(--udec-gold-ink)', dot: 'var(--udec-gold)' },
    Remoto: { bg: 'rgba(77, 77, 77, .08)', text: '#4D4D4D', dot: '#4D4D4D' },
    __default: { bg: 'rgba(77, 77, 77, .08)', text: '#4D4D4D', dot: '#4D4D4D' },
};

const parseSalarioNumero = (valor) => {
    if (!valor) return null;
    const limpio = valor.toString().replace(/\D/g, '');
    return limpio ? parseInt(limpio, 10) : null;
};

/* Navegación principal — Rumbo B "Sello en Marcha".
   `countKey` = clave del objeto `counts`: el sello de lacre pasa a ser un badge
   numérico que se muestra siempre que el conteo sea > 0 (esté o no activo el tab)
   y se "estampa" (exn-stamp) cuando el número aumenta. `countNoun` alimenta el
   aria-label ("Vacantes, 3 disponibles"). */
const NAV_ITEMS = [
    { vista: 'inicio',         label: 'Inicio',       Icon: Home },
    { vista: 'solicitudes',    label: 'Solicitudes',  Icon: ClipboardList, countKey: 'solicitudes',    countNoun: 'en proceso' },
    { vista: 'vacantes',       label: 'Vacantes',     Icon: Briefcase,     countKey: 'vacantes',       countNoun: 'disponibles' },
    { vista: 'ver-empresas',   label: 'Empresas',     Icon: Building2 },
    { vista: 'crear-cv',       label: 'Hoja de Vida', Icon: PlusCircle },
    { vista: 'notificaciones', label: 'Avisos',       Icon: Bell,          countKey: 'notificaciones', countNoun: 'sin leer' },
    { vista: 'mensajes',       label: 'Mensajes',     Icon: MessageSquare, countKey: 'mensajes',       countNoun: 'sin leer' },
];

export default function VacantesDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    // ... otros estados
const [showProfileDropdown, setShowProfileDropdown] = useState(false);
const [resaltarPostulacionId, setResaltarPostulacionId] = useState(null);
const [empresaSeleccionadaId, setEmpresaSeleccionadaId] = useState(null);
const [vistaPreviaEmpresa, setVistaPreviaEmpresa] = useState('vacantes');

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
    const [postulandoId, setPostulandoId] = useState(null); // id de la vacante con envío en curso
    const [originRect, setOriginRect] = useState(null);   // caja de la fila que abre el modal (continuidad)
    const [searchTerm, setSearchTerm] = useState("");
    // --- Tabla de Vacantes: filtros y orden ---
    const [filtroUbicacion, setFiltroUbicacion] = useState("");
    const [filtroSalario, setFiltroSalario] = useState("");
    const [filtroModalidades, setFiltroModalidades] = useState([]);
    const [modalidadAbierta, setModalidadAbierta] = useState(false);
    const modalidadRef = useRef(null);
    const [orden, setOrden] = useState({ campo: null, dir: 'asc' });
    const [filtrosMovilAbiertos, setFiltrosMovilAbiertos] = useState(false);
    const filtrosSheetRef = useRef(null);
    const [vistaActiva, setVistaActiva] = useState('vacantes'); 
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    // Agrega esto junto a tus otros estados (como el de usuario o vacantes)
const [showLogoutModal, setShowLogoutModal] = useState(false);
const [notifCount, setNotifCount] = useState(0);
const [hayCambiosCV, setHayCambiosCV] = useState(false);
const [modalAlerta, setModalAlerta] = useState({ mostrar: false, destino: null });

// --- Navegación superior "Sello en Marcha": indicador deslizante + geometría ---
const navRowRef = useRef(null);
const tabRefs = useRef({});
const userMenuRef = useRef(null);
const [gliderStyle, setGliderStyle] = useState({ opacity: 0 });

// El destino de nav resaltado: 'ver-perfil-empresa' cuelga de "Empresas"; 'ver-perfil' no resalta ninguno.
const navVista = NAV_ITEMS.some(i => i.vista === vistaActiva)
    ? vistaActiva
    : (vistaActiva === 'ver-perfil-empresa' ? 'ver-empresas' : null);

const posicionarGlider = useCallback(() => {
    const row = navRowRef.current;
    const el = navVista ? tabRefs.current[navVista] : null;
    if (!row || !el) { setGliderStyle(s => ({ ...s, opacity: 0 })); return; }
    const rr = row.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    setGliderStyle({
        opacity: 1,
        width: `${er.width}px`,
        transform: `translateX(${er.left - rr.left + row.scrollLeft}px)`,
    });
}, [navVista]);

useLayoutEffect(() => { posicionarGlider(); }, [posicionarGlider, vistaActiva]);

useEffect(() => {
    posicionarGlider();
    const row = navRowRef.current;
    const ro = new ResizeObserver(() => posicionarGlider());
    if (row) ro.observe(row);
    window.addEventListener('resize', posicionarGlider);
    if (row) row.addEventListener('scroll', posicionarGlider, { passive: true });
    let cancelado = false;
    if (document.fonts?.ready) document.fonts.ready.then(() => { if (!cancelado) posicionarGlider(); });
    return () => {
        cancelado = true;
        ro.disconnect();
        window.removeEventListener('resize', posicionarGlider);
        if (row) row.removeEventListener('scroll', posicionarGlider);
    };
}, [posicionarGlider]);

// Mantener la pestaña activa a la vista cuando la fila hace scroll horizontal (tablet/estrecho)
useEffect(() => {
    const el = navVista ? tabRefs.current[navVista] : null;
    if (el?.scrollIntoView) el.scrollIntoView({ inline: 'center', block: 'nearest' });
}, [navVista]);

// Cerrar el menú del avatar al hacer clic fuera
useEffect(() => {
    if (!showProfileDropdown) return;
    const fuera = (e) => {
        if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowProfileDropdown(false);
    };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
}, [showProfileDropdown]);

// --- Conteos para los badges numéricos de la barra de navegación ---
// Vacantes disponibles = mismo criterio que "Ofertas encontradas" (sin el filtro de búsqueda).
const vacantesDisponibles = Array.isArray(vacantes)
    ? vacantes.filter(v => v.estado === 'ABIERTA' && !v.postulaciones?.some(p => p.egresadoId === usuario?.id)).length
    : 0;
// Mis Solicitudes = mismo criterio que SolicitudesEgresado (postulaciones del egresado).
const misSolicitudesCount = Array.isArray(vacantes)
    ? vacantes.filter(v => v.postulaciones?.some(p => p.egresadoId === usuario?.id)).length
    : 0;
// Mensajes sin leer = folios cuyo último mensaje lo mandó la empresa y no está leído.
const mensajesSinLeer = Array.isArray(chatsRecientes)
    ? chatsRecientes.filter(c => c.ultimoMsgSenderType === 'EMPRESA' && c.leido === false).length
    : 0;
const navCounts = {
    solicitudes: misSolicitudesCount,
    vacantes: vacantesDisponibles,
    notificaciones: notifCount,
    mensajes: mensajesSinLeer,
};

// El badge se "estampa" (exn-stamp) sólo cuando el número AUMENTA, no al bajar ni al activar el tab.
const prevNavCountsRef = useRef({});
const [badgeBump, setBadgeBump] = useState({});
useEffect(() => {
    const prev = prevNavCountsRef.current;
    const cur = { solicitudes: misSolicitudesCount, vacantes: vacantesDisponibles, notificaciones: notifCount, mensajes: mensajesSinLeer };
    const subieron = {};
    let alguno = false;
    for (const k of Object.keys(cur)) {
        if (typeof prev[k] === 'number' && cur[k] > prev[k]) { subieron[k] = true; alguno = true; }
    }
    prevNavCountsRef.current = cur;
    if (!alguno) return;
    setBadgeBump(subieron);
    const t = setTimeout(() => setBadgeBump({}), 450);
    return () => clearTimeout(t);
}, [misSolicitudesCount, vacantesDisponibles, notifCount, mensajesSinLeer]);

// 2. EFECTOS

    // 🟢 ACTUALIZADO: Capturador universal desde correos (Postulaciones o Mensajes) con limpieza de URL
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const idPostulacionResaltar = queryParams.get('resaltar');
        const chatVacanteId = queryParams.get('chatVacanteId');
        const chatMensajeId = queryParams.get('chatMensajeId');

        // Caso A: Si viene de un correo de cambio de estado
        if (idPostulacionResaltar) {
            console.log("🔥 Pista detectada desde el correo. Redirigiendo a solicitudes ID:", idPostulacionResaltar);
            setVistaActiva('solicitudes');
            setResaltarPostulacionId(parseInt(idPostulacionResaltar));
            navigate('/vacantes-dashboard', { replace: true });
        } 
        // Caso B: Si viene de un correo de un mensaje nuevo de chat
        else if (chatVacanteId) {
            console.log("💬 Pista de chat detectada. Abriendo bandeja de mensajería para vacante ID:", chatVacanteId);
            
            // Buscamos si la vacante ya está en memoria para rescatar sus datos legibles
            const vComp = vacantes.find(v => v.id === parseInt(chatVacanteId));
            
            setChatActivo({
                vacanteId: parseInt(chatVacanteId),
                empresaId: vComp?.empresaId || null,
                titulo: vComp?.titulo || "Vacante",
                nombreEmpresa: vComp?.empresa?.nombre || "Empresa Aliada",
                resaltarMensajeId: chatMensajeId ? parseInt(chatMensajeId) : null // Para focalizar el texto si lo deseas
            });
            
            // Movemos la interfaz a la sección de Chats
            setVistaActiva('mensajes');
            
            // Limpiamos la URL para mantener el diseño impecable
            navigate('/vacantes-dashboard', { replace: true });
        }
    }, [location.search, navigate, vacantes]); // Añadimos 'vacantes' para asegurar el match relacional

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

// Conteo de notificaciones sin leer — alimenta el badge numérico de "Avisos"
useEffect(() => {
    const verificarNuevas = async () => {
        if (!usuario?.id) return;
        try {
            const res = await API.get(`/notificaciones/egresado/${usuario.id}`);
            setNotifCount(Array.isArray(res.data) ? res.data.filter(n => !n.vista).length : 0);
        } catch (error) {
            console.error("Error al verificar notificaciones", error);
        }
    };

    verificarNuevas();
    const interval = setInterval(verificarNuevas, 20000); // Verifica cada 20 segundos
    return () => clearInterval(interval);
}, [usuario?.id]);

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

    // Poll ligero de chats siempre activo — mantiene fresco el badge de "Mensajes" fuera de esa vista.
    useEffect(() => {
        if (!usuario?.id) return;
        fetchChats();
        const iv = setInterval(fetchChats, 20000);
        return () => clearInterval(iv);
    }, [usuario?.id, fetchChats]);

    // --- ACCESIBILIDAD DEL MODAL DE DETALLE ---
    // Bloqueo de scroll del body, cierre con Esc, foco atrapado y devolución de foco.
    const modalRef = useRef(null);
    const triggerFocusRef = useRef(null); // elemento que abrió el modal

    useEffect(() => {
        if (!selectedVacante) return;

        triggerFocusRef.current = document.activeElement;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // Foco inicial dentro del modal
        const focusablesSelector =
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const node = modalRef.current;
        const first = node?.querySelector(focusablesSelector);
        first?.focus();

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                cerrarVacanteRef.current();
                return;
            }
            if (e.key === 'Tab' && node) {
                const items = Array.from(node.querySelectorAll(focusablesSelector))
                    .filter((el) => !el.disabled && el.offsetParent !== null);
                if (items.length === 0) return;
                const firstEl = items[0];
                const lastEl = items[items.length - 1];
                if (e.shiftKey && document.activeElement === firstEl) {
                    e.preventDefault();
                    lastEl.focus();
                } else if (!e.shiftKey && document.activeElement === lastEl) {
                    e.preventDefault();
                    firstEl.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = prevOverflow;
            // Devuelve el foco a la tarjeta que abrió el modal
            if (triggerFocusRef.current instanceof HTMLElement) {
                triggerFocusRef.current.focus();
            }
        };
    }, [selectedVacante]);

    // --- ACCESIBILIDAD DEL PANEL DE FILTROS (móvil) ---
    useEffect(() => {
        if (!filtrosMovilAbiertos) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const primero = filtrosSheetRef.current?.querySelector('select, button, input');
        primero?.focus();
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setFiltrosMovilAbiertos(false);
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = prevOverflow;
        };
    }, [filtrosMovilAbiertos]);

    // --- DROPDOWN DE MODALIDAD (clic fuera / Esc cierra) ---
    useEffect(() => {
        if (!modalidadAbierta) return;
        const onPointerDown = (e) => {
            if (modalidadRef.current && !modalidadRef.current.contains(e.target)) {
                setModalidadAbierta(false);
            }
        };
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setModalidadAbierta(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [modalidadAbierta]);

    // --- CONTINUIDAD TARJETA → MODAL (FLIP desde la caja real de la tarjeta) ---
    const prefiereMenosMovimiento = () =>
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    useLayoutEffect(() => {
        if (!selectedVacante) return;
        const panel = modalRef.current;
        if (!panel) return;
        const overlay = panel.parentElement;

        if (prefiereMenosMovimiento() || !originRect) {
            panel.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'ease-out' });
            overlay?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'ease-out' });
            return;
        }

        const dest = panel.getBoundingClientRect();
        const dx = (originRect.left + originRect.width / 2) - (dest.left + dest.width / 2);
        const dy = (originRect.top + originRect.height / 2) - (dest.top + dest.height / 2);
        const sx = Math.max(originRect.width / dest.width, 0.1);
        const sy = Math.max(originRect.height / dest.height, 0.1);

        overlay?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
        panel.animate?.(
            [
                { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0.35, borderRadius: '14px' },
                { transform: 'none', opacity: 1, borderRadius: '4px' },
            ],
            { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        );
    }, [selectedVacante, originRect]);

    // Abre el modal guardando la caja de la tarjeta de origen
    const abrirVacante = (vacante, evento) => {
        const rect = evento?.currentTarget?.getBoundingClientRect?.();
        setOriginRect(rect || null);
        setSelectedVacante(vacante);
    };

    // Cierra el modal con una salida corta (o inmediata si se pide menos movimiento)
    const cerrarVacanteRef = useRef(() => {});
    const cerrarVacante = () => {
        const panel = modalRef.current;
        if (!panel || prefiereMenosMovimiento() || !panel.animate) {
            setSelectedVacante(null);
            return;
        }
        const salida = panel.animate(
            [{ transform: 'none', opacity: 1 }, { transform: 'scale(0.97)', opacity: 0 }],
            { duration: 150, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        );
        salida.onfinish = () => setSelectedVacante(null);
        salida.oncancel = () => setSelectedVacante(null);
    };
    cerrarVacanteRef.current = cerrarVacante;

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

// `vacanteParam` permite postular directamente desde una fila de la tabla
// sin pasar por el modal; por defecto usa la vacante abierta en el modal.
const handlePostulacion = async (vacanteParam) => {
    const vacante = vacanteParam && vacanteParam.id ? vacanteParam : selectedVacante;
    if (!vacante || postulandoId) return; // evita doble envío

    setPostulandoId(vacante.id);
    try {
        const res = await API.post(`/estudiantes/${vacante.id}/postular`);

        toast.success(res.data.message || '¡Postulación exitosa!', {
            position: "bottom-right", // 👈 Aseguramos la posición aquí también
            icon: <CheckCircle size={20} color="white" />,
            style: {
                background: 'var(--udec-green-strong)', // Verde UdeC (Pantone 3537 C)
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600'
            }
        });

        await fetchVacantes();
        if (selectedVacante?.id === vacante.id) setSelectedVacante(null);

    } catch (err) {
        const errorMsg = err.response?.data?.error || "Error al postularse";
        toast.error(errorMsg, {
            position: "bottom-right", // 👈 Y aquí también para los errores
            style: {
                borderRadius: '12px',
                fontSize: '14px'
            }
        });
    } finally {
        setPostulandoId(null);
    }
};

    const getFilteredData = () => {
    const term = searchTerm.toLowerCase();
    if (vistaActiva === 'vacantes') {
        let lista = vacantes.filter(v =>
            (v.titulo.toLowerCase().includes(term) || (v.empresa?.nombre || '').toLowerCase().includes(term))
            && v.estado === "ABIERTA"
            // Solo mostrar si el usuario NO está en la lista de postulaciones
            && !v.postulaciones?.some(p => p.egresadoId === usuario?.id)
        );

        if (filtroUbicacion) lista = lista.filter(v => v.ubicacion === filtroUbicacion);
        if (filtroModalidades.length) lista = lista.filter(v => filtroModalidades.includes(v.modalidad));
        if (filtroSalario) {
            const rango = RANGOS_SALARIO.find(r => r.id === filtroSalario);
            lista = lista.filter(v => {
                const monto = parseSalarioNumero(v.salario);
                // "A convenir" (sin monto) no cae en ningún rango concreto
                return monto !== null && monto >= rango.min && monto < rango.max;
            });
        }

        if (orden.campo) {
            lista = [...lista].sort((a, b) => {
                let va, vb;
                if (orden.campo === 'salario') {
                    va = parseSalarioNumero(a.salario) ?? -1;
                    vb = parseSalarioNumero(b.salario) ?? -1;
                } else {
                    va = a.fechaCierre ? new Date(a.fechaCierre).getTime() : Infinity;
                    vb = b.fechaCierre ? new Date(b.fechaCierre).getTime() : Infinity;
                }
                return orden.dir === 'asc' ? va - vb : vb - va;
            });
        }

        return lista;
    }
        return Array.isArray(chatsRecientes) ? chatsRecientes.filter(c =>
            (c.nombreEmpresa || "").toLowerCase().includes(term) ||
            (c.tituloVacante || "").toLowerCase().includes(term)
        ) : [];
    };

    // Total de vacantes elegibles (abiertas, sin postular) sin los filtros del usuario —
    // para mostrar "X de Y" cuando hay filtros activos.
    const totalVacantesBase = vacantes.filter(v =>
        v.estado === "ABIERTA" && !v.postulaciones?.some(p => p.egresadoId === usuario?.id)
    ).length;

    const hayFiltrosActivos = Boolean(
        searchTerm || filtroUbicacion || filtroSalario || filtroModalidades.length
    );

    const limpiarFiltros = () => {
        setSearchTerm('');
        setFiltroUbicacion('');
        setFiltroSalario('');
        setFiltroModalidades([]);
    };

    const alternarOrden = (campo) => {
        setOrden((prev) =>
            prev.campo === campo
                ? { campo, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                : { campo, dir: 'asc' }
        );
    };

    const ubicacionesDisponibles = useMemo(
        () => Array.from(new Set(vacantes.map(v => v.ubicacion).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
        [vacantes]
    );

    // Las 3 modalidades institucionales siempre están disponibles como filtro,
    // haya o no ahora mismo una vacante de ese tipo (que el filtro no muestre
    // "Híbrido" solo porque ninguna vacante actual lo usa sería confuso).
    const modalidadesDisponibles = useMemo(() => {
        const ordenCanonico = ['Presencial', 'Híbrido', 'Remoto'];
        const presentes = new Set(vacantes.map(v => v.modalidad).filter(Boolean));
        const otras = Array.from(presentes).filter(m => !ordenCanonico.includes(m)).sort((a, b) => a.localeCompare(b, 'es'));
        return [...ordenCanonico, ...otras];
    }, [vacantes]);

    // --- AGREGA ESTO ANTES DE dataFiltrada ---
const navegarAVista = (config, ignorarCambios = false) => {
    // Determinamos el nombre de la vista (si es un objeto o un string)
    const nombreVista = typeof config === 'object' ? config.vista : config;

    // 👈 2. LÓGICA DE INTERCEPCIÓN AQUÍ
    // Si NO estamos ignorando los cambios, estamos en CV, hay cambios, y queremos ir a otra parte... bloqueamos.
    if (!ignorarCambios && hayCambiosCV && vistaActiva === 'crear-cv' && nombreVista !== 'crear-cv') {
        setModalAlerta({ mostrar: true, destino: config });
        return; // Detenemos la ejecución para que no navegue
    }

    // Al entrar a Avisos se marcan como leídas server-side; limpiamos el badge de forma optimista.
    if (nombreVista === 'notificaciones') {
        setNotifCount(0);
    }

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

    // La vista de Vacantes tiene su propio esqueleto de carga; el resto usa el spinner global.
    if (loading && vistaActiva !== 'vacantes') return <div className="loading-screen"><div className="spinner"></div></div>;

    // Inicial de la entidad para el sello de lacre
    const inicialEmpresa = (nombre) => (nombre?.trim?.()?.[0] || '·').toUpperCase();

    // Cupos disponibles y estado de una vacante
    const analizarVacante = (v) => {
        const cupos = v.limitePostulantes ? (v.limitePostulantes - (v._count?.postulaciones || 0)) : null;
        return {
            cupos,
            urgente: esFechaCercana(v.fechaCierre),
            critico: cupos !== null && cupos <= 2,
        };
    };

    const obtenerIniciales = (nombres, apellidos) => {
    if (!nombres) return "U";
    // Toma la primera de nombres y la primera de apellidos
    const inicialNombre = nombres.trim()[0] || "";
    const inicialApellido = apellidos ? apellidos.trim()[0] : "";
    return (inicialNombre + inicialApellido).toUpperCase();
};

const formatearSalarioVisual = (valor) => {
    if (!valor) return 'A convenir';
    
    // 1. Quitamos cualquier punto, coma o letra que venga de la BD
    const numeroLimpio = valor.toString().replace(/\D/g, "");
    
    // 2. Si no quedó ningún número (ej. escribieron "A convenir" manualmente), devolvemos el texto original
    if (!numeroLimpio) return valor; 
    
    // 3. Volvemos a formatear con los puntos de mil exactos
    return numeroLimpio.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

return (
    <div className="dashboard-layout dashboard-egresados-container">
        <div className="glass-container">
            {/* NAVEGACIÓN PRINCIPAL — Rumbo B "Sello en Marcha" */}
            <header className="ex-nav" data-egresado-nav>
                <div className="ex-nav-edge" aria-hidden="true">
                    <span className="ex-edge-green" />
                    <span className="ex-edge-gold" />
                </div>

                {/* Fila 1 — identidad */}
                <div className="ex-nav-identity">
                    <div className="ex-brand">
                        <img src={logoGrande} alt="Empres 360 Pro" className="ex-brand-logo" />
                        <span className="ex-brand-div" aria-hidden="true" />
                        <img src={logoUdec} alt="Universidad de Cundinamarca" className="ex-brand-udec" />
                    </div>

                    <div className="ex-user" ref={userMenuRef}>
                        <div className="ex-user-txt">
                            <span className="ex-user-name">{usuario?.nombres} {usuario?.apellidos}</span>
                            <span className="ex-user-role">Graduado · {usuario?.programa || "UdeC"}</span>
                        </div>
                        <button
                            type="button"
                            className="ex-user-avatar"
                            aria-haspopup="menu"
                            aria-expanded={showProfileDropdown}
                            aria-label="Abrir menú de perfil"
                            onClick={() => setShowProfileDropdown(v => !v)}
                        >
                            {usuario?.foto
                                ? <img src={usuario.foto} alt="" />
                                : <span>{obtenerIniciales(usuario?.nombres, usuario?.apellidos)}</span>}
                        </button>
                        {showProfileDropdown && (
                            <div className="ex-user-menu fade-in" role="menu">
                                <button type="button" role="menuitem" className="ex-user-menu-item" onClick={() => { setVistaActiva('ver-perfil'); setShowProfileDropdown(false); }}>
                                    <User size={17} /> <span>Ver perfil</span>
                                </button>
                                <span className="ex-user-menu-div" role="separator" />
                                <button type="button" role="menuitem" className="ex-user-menu-item is-logout" onClick={() => { setShowProfileDropdown(false); setShowLogoutModal(true); }}>
                                    <LogOut size={16} /> <span>Cerrar sesión</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fila 2 — pestañas del expediente */}
                <nav className="ex-nav-row" aria-label="Navegación principal del portal" ref={navRowRef}>
                    <span className="ex-glider" aria-hidden="true" style={gliderStyle} />
                    <ul className="ex-tablist">
                        {NAV_ITEMS.map((item) => {
                            const activo = navVista === item.vista;
                            const TabIcon = item.Icon;
                            const conteo = item.countKey ? (navCounts[item.countKey] || 0) : 0;
                            return (
                                <li key={item.vista}>
                                    <button
                                        type="button"
                                        className={`ex-tab${activo ? ' is-active' : ''}`}
                                        aria-current={activo ? 'page' : undefined}
                                        aria-label={conteo > 0 ? `${item.label}, ${conteo} ${item.countNoun}` : item.label}
                                        ref={el => { tabRefs.current[item.vista] = el; }}
                                        onClick={() => {
                                            if (item.vista === 'mensajes') setChatActivo(null);
                                            navegarAVista(item.vista);
                                        }}
                                    >
                                        <span className="ex-tab-icon">
                                            <TabIcon size={17} strokeWidth={2} aria-hidden="true" />
                                        </span>
                                        <span className="ex-tab-label">{item.label}</span>
                                        {conteo > 0 && (
                                            <span
                                                className={`ex-tab-seal${badgeBump[item.countKey] ? ' is-bumped' : ''}`}
                                                aria-hidden="true"
                                            >
                                                {conteo > 99 ? '99+' : conteo}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
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
                    <span className="stat-number">
                        {hayFiltrosActivos ? `${dataFiltrada.length} de ${totalVacantesBase}` : dataFiltrada.length}
                    </span>
                </div>
            </div>
        </header>

        {/* 2. BARRA DE FILTROS */}
        <div className="tv-filtros">
            <div className="tv-buscar">
                <Search size={16} aria-hidden="true" />
                <input
                    type="text"
                    placeholder="Buscar por cargo o empresa…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Buscar vacante por cargo o empresa"
                />
            </div>

            <div className="tv-filtros-controles">
                <label className="tv-select">
                    <span>Ubicación</span>
                    <select value={filtroUbicacion} onChange={(e) => setFiltroUbicacion(e.target.value)} aria-label="Filtrar por ubicación">
                        <option value="">Todas</option>
                        {ubicacionesDisponibles.map((u) => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                </label>

                <label className="tv-select">
                    <span>Salario</span>
                    <select value={filtroSalario} onChange={(e) => setFiltroSalario(e.target.value)} aria-label="Filtrar por rango salarial">
                        <option value="">Cualquiera</option>
                        {RANGOS_SALARIO.map((r) => (
                            <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                    </select>
                </label>

                <div className="tv-select tv-modalidad" ref={modalidadRef}>
                    <span>Modalidad</span>
                    <button
                        type="button"
                        className="tv-modalidad-btn"
                        aria-haspopup="listbox"
                        aria-expanded={modalidadAbierta}
                        onClick={() => setModalidadAbierta((v) => !v)}
                    >
                        <span className="tv-modalidad-btn-texto">
                            {filtroModalidades.length === 0
                                ? 'Todas'
                                : filtroModalidades.length === 1
                                    ? filtroModalidades[0]
                                    : `${filtroModalidades.length} seleccionadas`}
                        </span>
                        <ChevronDown size={14} aria-hidden="true" />
                    </button>
                    {modalidadAbierta && (
                        <div className="tv-modalidad-panel" role="listbox" aria-multiselectable="true" aria-label="Modalidad">
                            {modalidadesDisponibles.map((m) => {
                                const activo = filtroModalidades.includes(m);
                                return (
                                    <label key={m} className="tv-modalidad-opcion">
                                        <input
                                            type="checkbox"
                                            checked={activo}
                                            onChange={() => setFiltroModalidades((prev) =>
                                                activo ? prev.filter((x) => x !== m) : [...prev, m]
                                            )}
                                        />
                                        {m}
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                {hayFiltrosActivos && (
                    <button type="button" className="tv-limpiar" onClick={limpiarFiltros}>
                        Limpiar filtros
                    </button>
                )}
            </div>

            <button
                type="button"
                className="tv-filtrar-movil"
                onClick={() => setFiltrosMovilAbiertos(true)}
            >
                <SlidersHorizontal size={16} /> Filtrar
                {hayFiltrosActivos && <span className="tv-filtrar-dot" aria-hidden="true" />}
            </button>
        </div>

        {/* 3. TABLA DE VACANTES (grid accesible con roles ARIA — se reordena por CSS en tablet/móvil) */}
        <div className="tv-tabla-wrap" role="grid" aria-label="Vacantes disponibles" aria-rowcount={dataFiltrada.length}>
          <div className="tv-tabla-scroll">
            <div className="tv-row tv-head-row" role="row">
                <div className="tv-cell tv-col-cargo" role="columnheader">Cargo</div>
                <div className="tv-cell tv-col-empresa" role="columnheader">Empresa</div>
                <div className="tv-cell tv-col-ubicacion" role="columnheader">Ubicación</div>
                <div
                    className="tv-cell tv-col-salario"
                    role="columnheader"
                    aria-sort={orden.campo === 'salario' ? (orden.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                    <button type="button" className="tv-th-btn" onClick={() => alternarOrden('salario')}>
                        Salario
                        {orden.campo === 'salario' && (orden.dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                    </button>
                </div>
                <div className="tv-cell tv-col-modalidad" role="columnheader">Modalidad</div>
                <div
                    className="tv-cell tv-col-vigencia"
                    role="columnheader"
                    aria-sort={orden.campo === 'vigencia' ? (orden.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                    <button type="button" className="tv-th-btn" onClick={() => alternarOrden('vigencia')}>
                        Vigencia
                        {orden.campo === 'vigencia' && (orden.dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                    </button>
                </div>
                <div className="tv-cell tv-col-acciones" role="columnheader">
                    <span className="tv-sr-only">Acciones</span>
                </div>
            </div>

            <div role="rowgroup" className="tv-body">
            {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="tv-row tv-row-skeleton" role="row" aria-hidden="true">
                        <div className="tv-cell" role="gridcell"><span className="tv-sk tv-sk-title" /><span className="tv-sk tv-sk-line" /></div>
                        <div className="tv-cell" role="gridcell"><span className="tv-sk tv-sk-line" /></div>
                        <div className="tv-cell" role="gridcell"><span className="tv-sk tv-sk-line short" /></div>
                        <div className="tv-cell" role="gridcell"><span className="tv-sk tv-sk-line short" /></div>
                        <div className="tv-cell" role="gridcell"><span className="tv-sk tv-sk-badge" /></div>
                        <div className="tv-cell" role="gridcell"><span className="tv-sk tv-sk-line short" /></div>
                        <div className="tv-cell" role="gridcell"><span className="tv-sk tv-sk-line short" /></div>
                    </div>
                ))
            ) : dataFiltrada.length > 0 ? (
                dataFiltrada.map((v, idx) => {
                    const { cupos, urgente, critico } = analizarVacante(v);
                    const estiloModalidad = ESTILO_MODALIDAD[v.modalidad] || ESTILO_MODALIDAD.__default;
                    const salarioTexto = v.salario ? `$ ${formatearSalarioVisual(v.salario)}` : 'A convenir';
                    const vigenciaTexto = v.fechaCierre ? formatDate(v.fechaCierre) : 'Sin fecha límite';

                    return (
                        <div
                            key={v.id}
                            className="tv-row tv-fila"
                            role="row"
                            style={{ '--i': Math.min(idx, 14) }}
                            tabIndex={0}
                            aria-label={`Ver detalle de la vacante ${v.titulo} en ${v.empresa?.nombre || 'empresa aliada'}`}
                            onClick={(e) => abrirVacante(v, e)}
                            onKeyDown={(e) => {
                                if (e.target !== e.currentTarget) return;
                                if (e.key === 'Enter') abrirVacante(v, e);
                            }}
                        >
                            <div className="tv-cell tv-col-cargo" role="gridcell">
                                <Briefcase size={15} className="tv-icon-cargo" aria-hidden="true" />
                                <div className="tv-cargo-textos">
                                    <span className="tv-cargo-titulo">{v.titulo}</span>
                                    {v.fechaCierre && (
                                        <small className={`tv-cargo-vigencia-tablet${urgente ? ' is-urgent' : ''}`}>
                                            {urgente ? 'Vence pronto · ' : 'Vigente hasta '}{vigenciaTexto}
                                        </small>
                                    )}
                                    <span className="tv-empresa-movil">{v.empresa?.nombre || 'Empresa Aliada'}</span>
                                    <div className="tv-meta-movil">
                                        <span>{v.ubicacion}</span>
                                        <span aria-hidden="true">·</span>
                                        <span>{salarioTexto}</span>
                                    </div>
                                    <span
                                        className="tv-badge tv-badge-mini"
                                        style={{ '--tv-badge-bg': estiloModalidad.bg, '--tv-badge-text': estiloModalidad.text, '--tv-badge-dot': estiloModalidad.dot }}
                                    >
                                        <i aria-hidden="true" />{v.modalidad || 'No especificada'}
                                    </span>
                                </div>
                            </div>

                            <div className="tv-cell tv-col-empresa" role="gridcell">
                                <button
                                    type="button"
                                    className="tv-empresa-link"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setVistaPreviaEmpresa('vacantes');
                                        setEmpresaSeleccionadaId(v.empresaId || v.empresa?.id);
                                        setVistaActiva('ver-perfil-empresa');
                                    }}
                                >
                                    <span>{v.empresa?.nombre || 'Empresa Aliada'}</span>
                                    <ArrowUpRight size={12} className="tv-empresa-icono" aria-hidden="true" />
                                </button>
                            </div>

                            <div className="tv-cell tv-col-ubicacion" role="gridcell">{v.ubicacion}</div>

                            <div className="tv-cell tv-col-salario" role="gridcell">{salarioTexto}</div>

                            <div className="tv-cell tv-col-modalidad" role="gridcell">
                                <span
                                    className="tv-badge"
                                    style={{ '--tv-badge-bg': estiloModalidad.bg, '--tv-badge-text': estiloModalidad.text, '--tv-badge-dot': estiloModalidad.dot }}
                                >
                                    <i aria-hidden="true" />{v.modalidad || 'No especificada'}
                                </span>
                            </div>

                            <div className="tv-cell tv-col-vigencia" role="gridcell">
                                <span className={urgente ? 'tv-vigencia-urgente' : ''}>
                                    {v.fechaCierre ? vigenciaTexto : '—'}
                                </span>
                                {critico && (
                                    <small className="tv-cupos-critico">
                                        {cupos <= 0 ? 'Sin cupos' : `¡${cupos} ${cupos === 1 ? 'cupo' : 'cupos'}!`}
                                    </small>
                                )}
                            </div>

                            <div className="tv-cell tv-col-acciones" role="gridcell">
                                <button
                                    type="button"
                                    className="tv-accion-icono tv-accion-ver"
                                    aria-label="Ver detalle"
                                    onClick={(e) => abrirVacante(v, e)}
                                >
                                    <Eye size={16} aria-hidden="true" />
                                    <span className="tv-tooltip" role="tooltip">Ver detalle</span>
                                </button>
                                <button
                                    type="button"
                                    className="tv-accion-icono tv-accion-postular"
                                    aria-label="Postular"
                                    disabled={postulandoId === v.id}
                                    aria-busy={postulandoId === v.id}
                                    onClick={(e) => { e.stopPropagation(); handlePostulacion(v); }}
                                >
                                    {postulandoId === v.id ? <span className="exp-spinner" aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}
                                    <span className="tv-tooltip" role="tooltip">Postular</span>
                                </button>
                            </div>
                        </div>
                    );
                })
            ) : null}
            </div>
          </div>

            {!loading && dataFiltrada.length === 0 && (
                <div className="sello-empty">
                    <div className="doc" aria-hidden="true">
                        <div className="lines"><span /><span /><span /><span /></div>
                        <span className="wax">·</span>
                    </div>
                    {hayFiltrosActivos ? (
                        <>
                            <h3>No encontramos vacantes con estos filtros</h3>
                            <p>Prueba ajustando la búsqueda, la ubicación, el salario o la modalidad.</p>
                            <button type="button" className="s-refresh" onClick={limpiarFiltros}>
                                Limpiar filtros
                            </button>
                        </>
                    ) : (
                        <>
                            <h3>No hay vacantes disponibles por ahora</h3>
                            <p>Vuelve a intentarlo más tarde o actualiza el listado.</p>
                            <button type="button" className="s-refresh" onClick={fetchVacantes}>
                                <Clock size={16} /> <span>Actualizar listado</span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>

        {/* 4. FILTROS EN MÓVIL — bottom sheet */}
        {filtrosMovilAbiertos && (
            <div className="tv-sheet-overlay" onClick={() => setFiltrosMovilAbiertos(false)}>
                <div
                    className="tv-sheet"
                    ref={filtrosSheetRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Filtrar vacantes"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="tv-sheet-handle" aria-hidden="true" />
                    <h3>Filtrar vacantes</h3>

                    <label className="tv-select tv-select-block">
                        <span>Ubicación</span>
                        <select value={filtroUbicacion} onChange={(e) => setFiltroUbicacion(e.target.value)}>
                            <option value="">Todas</option>
                            {ubicacionesDisponibles.map((u) => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                    </label>

                    <label className="tv-select tv-select-block">
                        <span>Salario</span>
                        <select value={filtroSalario} onChange={(e) => setFiltroSalario(e.target.value)}>
                            <option value="">Cualquiera</option>
                            {RANGOS_SALARIO.map((r) => (
                                <option key={r.id} value={r.id}>{r.label}</option>
                            ))}
                        </select>
                    </label>

                    <span className="tv-sheet-label">Modalidad</span>
                    <div className="tv-chips" role="group" aria-label="Filtrar por modalidad">
                        {modalidadesDisponibles.map((m) => {
                            const activo = filtroModalidades.includes(m);
                            return (
                                <button
                                    type="button"
                                    key={m}
                                    className={`tv-chip${activo ? ' is-active' : ''}`}
                                    aria-pressed={activo}
                                    onClick={() => setFiltroModalidades((prev) =>
                                        activo ? prev.filter((x) => x !== m) : [...prev, m]
                                    )}
                                >
                                    {m}
                                </button>
                            );
                        })}
                    </div>

                    <div className="tv-sheet-actions">
                        {hayFiltrosActivos && (
                            <button type="button" className="tv-limpiar" onClick={limpiarFiltros}>
                                Limpiar filtros
                            </button>
                        )}
                        <button type="button" className="tv-sheet-aplicar" onClick={() => setFiltrosMovilAbiertos(false)}>
                            Ver {dataFiltrada.length} {dataFiltrada.length === 1 ? 'resultado' : 'resultados'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
)}
        {/* 3. MODAL — la hoja que se abre (Rumbo B · "Sello") */}
        {selectedVacante && (() => {
            const { cupos, urgente, critico } = analizarVacante(selectedVacante);
            const irAEmpresa = () => {
                setVistaPreviaEmpresa('vacantes');
                setEmpresaSeleccionadaId(selectedVacante.empresaId || selectedVacante.empresa?.id);
                setVistaActiva('ver-perfil-empresa');
                setSelectedVacante(null);
            };
            return (
            <div className="sello-modal-overlay" onClick={cerrarVacante}>
                <div
                    className="sello-sheet"
                    ref={modalRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="vdp-modal-title"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className="s-close" onClick={cerrarVacante} aria-label="Cerrar el expediente de la vacante">
                        <XCircle size={22} />
                    </button>

                    <div className="s-head">
                        <span className="s-modal-tab">{selectedVacante.modalidad || 'Modalidad'}</span>
                        <h3 id="vdp-modal-title" className="s-modal-title">{selectedVacante.titulo}</h3>
                        <p className="s-modal-org">
                            <button type="button" className="s-empresa" onClick={(e) => { e.stopPropagation(); irAEmpresa(); }}>
                                {selectedVacante.empresa?.nombre || 'Empresa Aliada'}
                            </button>
                            {' · '}{selectedVacante.ubicacion}
                        </p>
                        <span className="s-modal-wax" aria-hidden="true">{inicialEmpresa(selectedVacante.empresa?.nombre)}</span>
                    </div>

                    <div className="s-body">
                        <dl className="s-detail-grid">
                            <div><dt>Salario</dt><dd>{selectedVacante.salario ? `$ ${formatearSalarioVisual(selectedVacante.salario)}` : 'A convenir'}</dd></div>
                            <div><dt>Contrato</dt><dd>{selectedVacante.tipo || '—'}</dd></div>
                            <div><dt>Jornada</dt><dd>{selectedVacante.jornada || '—'}</dd></div>
                            <div><dt>Horario</dt><dd>{selectedVacante.horario || 'L–V'}</dd></div>
                            {selectedVacante.fechaCierre && (
                                <div>
                                    <dt>{urgente ? 'Vence pronto' : 'Vigente hasta'}</dt>
                                    <dd className={urgente ? 'is-urgent' : ''}>{formatDate(selectedVacante.fechaCierre)}</dd>
                                </div>
                            )}
                            {cupos !== null && (
                                <div>
                                    <dt>Cupos</dt>
                                    <dd className={critico ? 'is-critical' : ''}>
                                        {cupos <= 0 ? 'Sin cupos' : `${cupos} ${cupos === 1 ? 'disponible' : 'disponibles'}`}
                                    </dd>
                                </div>
                            )}
                            <div><dt>Publicado</dt><dd>{formatDate(selectedVacante.fechaCreacion)}</dd></div>
                        </dl>

                        <p className="s-desc-label">Descripción de la vacante</p>
                        <div className="s-desc">
                            <div
                                className="ql-editor-view"
                                dangerouslySetInnerHTML={{ __html: selectedVacante.descripcion || 'Sin descripción disponible.' }}
                            />
                        </div>
                    </div>

                    <button type="button" className="s-ver-empresa" onClick={irAEmpresa}>
                        <span className="mini-seal" aria-hidden="true">{inicialEmpresa(selectedVacante.empresa?.nombre)}</span>
                        Ver perfil de la empresa
                    </button>

                    <div className="s-actions">
                        {yaPostulado ? (
                            <div className="s-applied">
                                <CheckCircle size={18} /> <span>Ya estás participando en este proceso</span>
                            </div>
                        ) : (
                            <button
                                className="btn-radicar"
                                onClick={() => handlePostulacion(selectedVacante)}
                                disabled={postulandoId === selectedVacante.id}
                                aria-busy={postulandoId === selectedVacante.id}
                            >
                                {postulandoId === selectedVacante.id ? (
                                    <><span className="btn-apply-spinner" aria-hidden="true" />Radicando…</>
                                ) : 'Radicar postulación'}
                            </button>
                        )}
                        <button
                            className="btn-cv-secondary"
                            onClick={() => { setSelectedVacante(null); setVistaActiva('crear-cv'); }}
                            style={{ padding: '15px 20px', flex: '1 1 200px' }}
                        >
                            Ver mi hoja de vida
                        </button>
                    </div>
                </div>
            </div>
            );
        })()}

                    {vistaActiva === 'crear-cv' && (
    <div className="full-view">
        <CrearCV 
            isInline={true} 
            setVistaActiva={setVistaActiva} 
            setHayCambios={setHayCambiosCV} // 👈 3. PROP AÑADIDA
        />
    </div>
)}

{/* NUEVA VISTA: Perfil de la Empresa */}
{vistaActiva === 'ver-perfil-empresa' && empresaSeleccionadaId && (
    <div className="full-view">
        <VerPerfilEmpresa 
            empresaId={empresaSeleccionadaId} 
            onVolver={() => setVistaActiva(vistaPreviaEmpresa)} 
            onAbrirVacante={(vacante) => { setOriginRect(null); setSelectedVacante(vacante); }}
        />
    </div>
)}

{/* 🟢 NUEVA VISTA: DIRECTORIO DE EMPRESAS */}
{vistaActiva === 'ver-empresas' && (
    <div className="full-view">
        <EgresadosVerEmpresas 
            onVerPerfil={(id) => {
                setVistaPreviaEmpresa('ver-empresas'); // Guardamos memoria
                setEmpresaSeleccionadaId(id);
                setVistaActiva('ver-perfil-empresa');
            }} 
        />
    </div>
)}

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
            <ToastContainer 
    position="bottom-right" // 👈 Esto lo envía a la esquina inferior derecha
    autoClose={3000}
    hideProgressBar={false}
    newestOnTop={false}
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    theme="colored"
/>

            {showLogoutModal && (
    <div className="modal-overlay" style={{ zIndex: 10001 }}>
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
{modalAlerta.mostrar && (
                <div className="modal-glass-overlay">
                    <div className="modal-glass-content">
                        <h3>Cambios sin guardar</h3>
                        <p>Tienes modificaciones en tu Hoja de Vida que no han sido guardadas. Si cambias de sección ahora, perderás tu progreso.</p>
                        <div className="modal-glass-actions">
                            <button 
                                className="btn-glass-volver" 
                                onClick={() => setModalAlerta({ mostrar: false, destino: null })}
                            >
                                Quedarme aquí
                            </button>
                            <button 
    className="btn-glass-salir" 
    onClick={() => {
        setHayCambiosCV(false); // Limpiamos la alerta
        setModalAlerta({ mostrar: false, destino: null }); // Cerramos el modal
        
        // 👈 3. Le pasamos 'true' como segundo parámetro para forzar la salida
        navegarAVista(modalAlerta.destino, true); 
    }}
>
    Salir sin guardar
</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}