import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import {
    Home, Users, Building2, Briefcase, CheckCircle, BarChart3, Settings, User, LogOut,
} from 'lucide-react';
import logoUdec from '../../assets/UdeC2.png';
import logoGrande from '../../assets/Logo2.png';
import './AdminNav.css';

/* Navegación principal del Administrador — Rumbo B "Sello en Marcha", la misma
   pieza que el menú de Empresa (EmpresaNav, prefijo .emp-nav-) con prefijo propio
   .adm-nav-. `label` es la etiqueta visible (corta, para que los 7 quepan en una
   línea); `nombre` es el nombre completo que lee el lector de pantalla y siempre
   contiene la palabra visible. Sin insignias: el panel no tiene un conteo de
   "pendiente por atender". `proximamente`: destino sin vista todavía; se alcanza
   con Tab, pero no navega ni recibe la pestaña activa. */
const NAV_ITEMS = [
    { tab: 'inicio',        label: 'Inicio',        nombre: 'Inicio',              Icon: Home },
    { tab: 'usuarios',      label: 'Egresados',     nombre: 'Gestión egresados',   Icon: Users },
    { tab: 'empresas',      label: 'Empresas',      nombre: 'Gestión empresas',    Icon: Building2 },
    { tab: 'vacantes',      label: 'Vacantes',      nombre: 'Vacantes activas',    Icon: Briefcase },
    { tab: 'postulaciones', label: 'Postulaciones', nombre: 'Postulaciones',       Icon: CheckCircle },
    { tab: 'metricas',      label: 'Métricas',      nombre: 'Métricas y reportes', Icon: BarChart3 },
    { tab: 'configuracion', label: 'Configuración', nombre: 'Configuración',       Icon: Settings, proximamente: true },
];

export default function AdminNav({ activeTab, onNavegar, onCerrarSesion }) {
    const navRowRef = useRef(null);
    const tabRefs = useRef({});
    const userMenuRef = useRef(null);
    const [gliderStyle, setGliderStyle] = useState({ opacity: 0 });
    const [menuAbierto, setMenuAbierto] = useState(false);

    const navTab = NAV_ITEMS.some(i => i.tab === activeTab && !i.proximamente) ? activeTab : null;

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
    // Sólo `scrollLeft` de la fila, no `scrollIntoView()` (ver EmpresaNav).
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

    return (
        <header className="adm-nav" data-admin-nav>
            <div className="adm-nav-edge" aria-hidden="true">
                <span className="adm-nav-edge-green" />
                <span className="adm-nav-edge-gold" />
            </div>

            {/* Fila 1 — identidad */}
            <div className="adm-nav-identity">
                <div className="adm-nav-brand">
                    <img src={logoGrande} alt="Empres 360 Pro" className="adm-nav-brand-logo" />
                    <span className="adm-nav-brand-div" aria-hidden="true" />
                    <img src={logoUdec} alt="Universidad de Cundinamarca" className="adm-nav-brand-udec" />
                </div>

                <div className="adm-nav-user" ref={userMenuRef}>
                    <div className="adm-nav-user-txt">
                        <span className="adm-nav-user-name">Panel de control</span>
                        <span className="adm-nav-user-role">Administrador</span>
                    </div>
                    <button
                        type="button"
                        className="adm-nav-user-avatar"
                        aria-haspopup="menu"
                        aria-expanded={menuAbierto}
                        aria-label="Abrir menú de administrador"
                        onClick={() => setMenuAbierto(v => !v)}
                    >
                        <User size={20} aria-hidden="true" />
                    </button>
                    {menuAbierto && (
                        <div className="adm-nav-user-menu fade-in" role="menu">
                            <button type="button" role="menuitem" className="adm-nav-user-menu-item is-logout" onClick={() => { setMenuAbierto(false); onCerrarSesion(); }}>
                                <LogOut size={16} /> <span>Cerrar sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Fila 2 — pestañas del expediente */}
            <nav className="adm-nav-row" aria-label="Navegación principal del panel de administración" ref={navRowRef}>
                <span className="adm-nav-glider" aria-hidden="true" style={gliderStyle} />
                <ul className="adm-nav-tablist">
                    {NAV_ITEMS.map((item) => {
                        const activo = navTab === item.tab;
                        const TabIcon = item.Icon;
                        return (
                            <li key={item.tab}>
                                <button
                                    type="button"
                                    className={`adm-nav-tab${activo ? ' is-active' : ''}${item.proximamente ? ' is-soon' : ''}`}
                                    aria-current={activo ? 'page' : undefined}
                                    aria-disabled={item.proximamente ? 'true' : undefined}
                                    aria-label={item.proximamente ? `${item.nombre}, próximamente` : item.nombre}
                                    title={item.proximamente ? 'Próximamente' : undefined}
                                    ref={el => { tabRefs.current[item.tab] = el; }}
                                    onClick={item.proximamente ? undefined : () => onNavegar(item.tab)}
                                >
                                    <span className="adm-nav-tab-icon">
                                        <TabIcon size={17} strokeWidth={2} aria-hidden="true" />
                                    </span>
                                    <span className="adm-nav-tab-label">{item.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </header>
    );
}
