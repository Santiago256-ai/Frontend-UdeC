import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import {
    Home, PlusCircle, BarChart3, Bell, MessageSquare, ClipboardList, Trash2, User, LogOut,
} from 'lucide-react';
import logoUdec from '../../assets/UdeC2.png';
import logoGrande from '../../assets/Logo2.png';
import './EmpresaNav.css';

/* Navegación principal de Empresa — Rumbo B "Sello en Marcha", la misma pieza
   que el menú de Egresado (VacantesDashboard, prefijo .ex-) con prefijo propio
   .emp-nav-. `label` es la etiqueta visible (corta, para que los 7 quepan en
   una línea); `nombre` es el nombre completo que lee el lector de pantalla.
   `countKey` = clave del objeto `counts`; el badge se muestra sólo si > 0 y se
   "estampa" (empn-stamp) cuando el número aumenta. */
const NAV_ITEMS = [
    { tab: 'gestion',             label: 'Gestión',    nombre: 'Panel de gestión',    Icon: Home,          countKey: 'gestion',        countNoun: 'ofertas' },
    { tab: 'creacion',            label: 'Publicar',   nombre: 'Publicar vacante',    Icon: PlusCircle },
    { tab: 'metricas',            label: 'Métricas',   nombre: 'Métricas y reportes', Icon: BarChart3 },
    { tab: 'notificaciones',      label: 'Avisos',     nombre: 'Avisos',              Icon: Bell,          countKey: 'notificaciones', countNoun: 'sin leer' },
    { tab: 'mensajes',            label: 'Mensajes',   nombre: 'Mensajes / Chat',     Icon: MessageSquare, countKey: 'mensajes',       countNoun: 'sin leer' },
    { tab: 'total_postulaciones', label: 'Postulados', nombre: 'Listado postulados',  Icon: ClipboardList },
    { tab: 'eliminadas',          label: 'Eliminadas', nombre: 'Vacantes eliminadas', Icon: Trash2 },
];

const obtenerIniciales = (nombre) => {
    if (!nombre) return 'UA';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
    return nombre.substring(0, 2).toUpperCase();
};

export default function EmpresaNav({ empresa, activeTab, counts = {}, onNavegar, onVerPerfil, onCerrarSesion }) {
    const navRowRef = useRef(null);
    const tabRefs = useRef({});
    const userMenuRef = useRef(null);
    const [gliderStyle, setGliderStyle] = useState({ opacity: 0 });
    const [menuAbierto, setMenuAbierto] = useState(false);

    // 'edicion' (editar una vacante) cuelga de "Gestión"; 'perfil' no resalta ninguno.
    const navTab = NAV_ITEMS.some(i => i.tab === activeTab)
        ? activeTab
        : (activeTab === 'edicion' ? 'gestion' : null);

    // --- Papel elevado compartido (glider): geometría real de la pestaña activa ---
    const posicionarGlider = useCallback(() => {
        const row = navRowRef.current;
        const el = navTab ? tabRefs.current[navTab] : null;
        if (!row || !el) { setGliderStyle(s => ({ ...s, opacity: 0 })); return; }
        const rr = row.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        setGliderStyle({
            opacity: 1,
            width: `${er.width}px`,
            transform: `translateX(${er.left - rr.left + row.scrollLeft}px)`,
        });
    }, [navTab]);

    useLayoutEffect(() => { posicionarGlider(); }, [posicionarGlider, activeTab]);

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

    // Mantener la pestaña activa a la vista si la fila llegara a hacer scroll horizontal.
    // Se mueve sólo `scrollLeft` de la fila: `scrollIntoView()` (lo que usa Egresado)
    // hace que Chromium tome la pestaña como punto de partida del siguiente Tab, y el
    // teclado se saltaba el avatar y las pestañas anteriores a la activa.
    useEffect(() => {
        const row = navRowRef.current;
        const el = navTab ? tabRefs.current[navTab] : null;
        if (!row || !el || row.scrollWidth <= row.clientWidth) return;
        const rr = row.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        row.scrollLeft += (er.left + er.width / 2) - (rr.left + rr.width / 2);
    }, [navTab]);

    // Cerrar el menú del avatar al hacer clic fuera
    useEffect(() => {
        if (!menuAbierto) return;
        const fuera = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setMenuAbierto(false);
        };
        document.addEventListener('mousedown', fuera);
        return () => document.removeEventListener('mousedown', fuera);
    }, [menuAbierto]);

    // El badge se "estampa" (empn-stamp) sólo cuando el número AUMENTA, no al bajar ni al activar el tab.
    const prevCountsRef = useRef({});
    const [badgeBump, setBadgeBump] = useState({});
    const { gestion = 0, notificaciones = 0, mensajes = 0 } = counts;
    useEffect(() => {
        const prev = prevCountsRef.current;
        const cur = { gestion, notificaciones, mensajes };
        const subieron = {};
        let alguno = false;
        for (const k of Object.keys(cur)) {
            if (typeof prev[k] === 'number' && cur[k] > prev[k]) { subieron[k] = true; alguno = true; }
        }
        prevCountsRef.current = cur;
        if (!alguno) return;
        setBadgeBump(subieron);
        const t = setTimeout(() => setBadgeBump({}), 450);
        return () => clearTimeout(t);
    }, [gestion, notificaciones, mensajes]);

    const nombreEmpresa = empresa?.nombres || empresa?.nombre;

    return (
        <header className="emp-nav" data-empresa-nav>
            <div className="emp-nav-edge" aria-hidden="true">
                <span className="emp-nav-edge-green" />
                <span className="emp-nav-edge-gold" />
            </div>

            {/* Fila 1 — identidad */}
            <div className="emp-nav-identity">
                <div className="emp-nav-brand">
                    <img src={logoGrande} alt="Empres 360 Pro" className="emp-nav-brand-logo" />
                    <span className="emp-nav-brand-div" aria-hidden="true" />
                    <img src={logoUdec} alt="Universidad de Cundinamarca" className="emp-nav-brand-udec" />
                </div>

                <div className="emp-nav-user" ref={userMenuRef}>
                    <div className="emp-nav-user-txt">
                        <span className="emp-nav-user-name">{nombreEmpresa || 'Cargando...'}</span>
                        <span className="emp-nav-user-role">Empresa Aliada</span>
                    </div>
                    <button
                        type="button"
                        className="emp-nav-user-avatar"
                        aria-haspopup="menu"
                        aria-expanded={menuAbierto}
                        aria-label="Abrir menú de perfil"
                        onClick={() => setMenuAbierto(v => !v)}
                    >
                        <span>{obtenerIniciales(nombreEmpresa)}</span>
                    </button>
                    {menuAbierto && (
                        <div className="emp-nav-user-menu fade-in" role="menu">
                            <button type="button" role="menuitem" className="emp-nav-user-menu-item" onClick={() => { setMenuAbierto(false); onVerPerfil(); }}>
                                <User size={17} /> <span>Ver perfil</span>
                            </button>
                            <span className="emp-nav-user-menu-div" role="separator" />
                            <button type="button" role="menuitem" className="emp-nav-user-menu-item is-logout" onClick={() => { setMenuAbierto(false); onCerrarSesion(); }}>
                                <LogOut size={16} /> <span>Cerrar sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Fila 2 — pestañas del expediente */}
            <nav className="emp-nav-row" aria-label="Navegación principal del panel de empresa" ref={navRowRef}>
                <span className="emp-nav-glider" aria-hidden="true" style={gliderStyle} />
                <ul className="emp-nav-tablist">
                    {NAV_ITEMS.map((item) => {
                        const activo = navTab === item.tab;
                        const TabIcon = item.Icon;
                        const conteo = item.countKey ? (counts[item.countKey] || 0) : 0;
                        return (
                            <li key={item.tab}>
                                <button
                                    type="button"
                                    className={`emp-nav-tab${activo ? ' is-active' : ''}`}
                                    aria-current={activo ? 'page' : undefined}
                                    aria-label={conteo > 0 ? `${item.nombre}, ${conteo} ${item.countNoun}` : item.nombre}
                                    ref={el => { tabRefs.current[item.tab] = el; }}
                                    onClick={() => onNavegar(item.tab)}
                                >
                                    <span className="emp-nav-tab-icon">
                                        <TabIcon size={17} strokeWidth={2} aria-hidden="true" />
                                    </span>
                                    <span className="emp-nav-tab-label">{item.label}</span>
                                    {conteo > 0 && (
                                        <span
                                            className={`emp-nav-tab-seal${badgeBump[item.countKey] ? ' is-bumped' : ''}`}
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
    );
}
