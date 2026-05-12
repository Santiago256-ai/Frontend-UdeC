import React, { useState } from 'react';
import { 
    MessageSquare, 
    ArrowRight, 
    Download, 
    Eye, 
    XCircle, 
    AlertTriangle,
    ChevronDown,
    Search, Filter, Calendar, Pin
} from 'lucide-react';
import './ListaPostulacionesTable.css';

// El orden de la barra de progreso (Pipeline)
const PIPELINE_ORDER = ['PENDIENTE', 'REVISION', 'ENTREVISTA', 'PRUEBA', 'FINALISTA', 'CONTRATADO'];

const ListaPostulacionesTable = ({ 
    postulaciones, 
    stages, 
    onCambiarEstado, 
    onVerPerfil, 
    onAbrirChat,
    onDescargarDirecto,
    highlightId
}) => {
    
    // Estado para el modal de confirmación de rechazo
    const [confirmarRechazo, setConfirmarRechazo] = useState({ visible: false, id: null, nombre: "" });
    
    // Estado para controlar qué fila está expandida
    const [filaExpandida, setFilaExpandida] = useState(null);
    const [activeHighlight, setActiveHighlight] = useState(null);
    
    // Estados para controlar la búsqueda y el filtro
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("TODOS");
    
    // Estados para el rango de fechas
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");

    const toggleFila = (id) => {
        setFilaExpandida(filaExpandida === id ? null : id);
    };

    const solicitarRechazo = (id, nombre) => {
        setConfirmarRechazo({ visible: true, id, nombre });
    };

    const ejecutarRechazo = () => {
        onCambiarEstado(confirmarRechazo.id, 'RECHAZADO');
        setConfirmarRechazo({ visible: false, id: null, nombre: "" });
    };

    const getProgressWidth = (currentStatus) => {
        if (currentStatus === 'RECHAZADO') return "100%"; 
        const index = PIPELINE_ORDER.indexOf(currentStatus);
        if (index === -1) return "0%";
        return `${(index / (PIPELINE_ORDER.length - 1)) * 100}%`;
    };

// 🌟 EFECTO PARA RESALTADO DESDE NOTIFICACIONES
// 🌟 EFECTO PARA RESALTADO DESDE NOTIFICACIONES
    React.useEffect(() => {
        let buscarYResaltar; // La declaramos aquí para poder limpiarla si el modal se cierra rápido

        if (highlightId) {
            setActiveHighlight(highlightId); // 💡 Encendemos la luz en React de inmediato

            // ⏳ 1. Damos un respiro de 400ms para que el modal termine su animación fade-in (ESTO EVITA LA TRABA)
            const delayAnimacion = setTimeout(() => {
                let intentos = 0;
                
                buscarYResaltar = setInterval(() => {
                    const elemento = document.getElementById(`postulacion-${highlightId}`);
                    intentos++;

                    if (elemento) {
                        // 🎯 2. CAMBIO CLAVE: Usamos block: 'nearest' en lugar de 'center'.
                        // Esto desliza la lista internamente sin hacer que la página entera salte.
                        elemento.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        
                        // ⏱️ A los 4 segundos, le decimos a React que APAGUE la luz
                        setTimeout(() => {
                            setActiveHighlight(null); 
                        }, 4000);

                        clearInterval(buscarYResaltar); // Dejamos de buscar
                    }
                    
                    // Nos rendimos a los 20 intentos (2 segundos) para no dejar el ciclo infinito
                    if (intentos > 20) clearInterval(buscarYResaltar);
                }, 100);
                
            }, 400); // 400ms de espera

            // 🧹 Función de limpieza de React (muy importante para evitar bugs)
            return () => {
                clearTimeout(delayAnimacion);
                if (buscarYResaltar) clearInterval(buscarYResaltar);
            };
        }
    }, [highlightId, postulaciones.length]);

    // 1. Primero filtramos por nombre, estado y fecha
    const filtrados = postulaciones.filter(p => {
        const nombreCompleto = `${p.egresado?.nombres} ${p.egresado?.apellidos}`.toLowerCase();
        const coincideBusqueda = nombreCompleto.includes(busqueda.toLowerCase());
        const coincideEstado = (filtroEstado === "TODOS" || filtroEstado === "FECHA") ? true : p.estado === filtroEstado;
        
        const fechaPost = new Date(p.fecha).setHours(0,0,0,0);
        const desde = fechaDesde ? new Date(fechaDesde).setHours(0,0,0,0) : null;
        const hasta = fechaHasta ? new Date(fechaHasta).setHours(0,0,0,0) : null;
        const coincideFecha = (!desde || fechaPost >= desde) && (!hasta || fechaPost <= hasta);

        return coincideBusqueda && coincideEstado && coincideFecha;
    });

    // 2. Ahora ORDENAMOS: Los anclados primero
    const postulacionesFiltradas = filtrados.sort((a, b) => {
        if (a.anclado && !b.anclado) return -1;
        if (!a.anclado && b.anclado) return 1;
        return 0; 
    });

    return (
        <div className="postulaciones-table-container fade-in">
            
            {/* Barra de herramientas: Buscador y Filtro PRO */}
            <div className="table-controls-header-pro">
                
                <div className="controls-row-main">
                    {/* Buscador */}
                    <div className={`pro-search-box ${postulaciones.length === 0 ? 'is-disabled' : ''}`}>
                        <Search size={18} className="control-icon" />
                        <input 
                            type="text" 
                            placeholder={postulaciones.length === 0 ? "Búsqueda deshabilitada..." : "Buscar candidato por nombre..."} 
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="pro-input-field"
                            disabled={postulaciones.length === 0} 
                        />
                    </div>

                    {/* Selector de Estado y Fecha */}
                    <div className={`pro-filter-box ${postulaciones.length === 0 ? 'is-disabled' : ''}`}>
                        <Filter size={18} className="control-icon" />
                        <select 
                            value={filtroEstado} 
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            className="pro-select-field"
                            disabled={postulaciones.length === 0} 
                        >
                            <option value="TODOS">Todos los estados</option>
                            <option value="FECHA" style={{ fontWeight: 'bold', color: '#006b3f' }}>📅 Filtrar por fecha</option>
                            <option disabled>──────────</option>
                            {Object.keys(stages).map(key => (
                                <option key={key} value={key}>{stages[key].label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* FILA CONDICIONAL: Filtro por fecha */}
                {filtroEstado === "FECHA" && (
                    <div className="date-picker-row-pro fade-in">
                        <div className="date-picker-group">
                            <Calendar size={16} color="#006b3f" />
                            <span className="date-label">Rango de postulación:</span>
                            <input 
                                type="date" 
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                className="pro-date-input"
                            />
                            <span className="date-separator">hasta</span>
                            <input 
                                type="date" 
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                className="pro-date-input"
                            />
                        </div>
                        <button 
                            className="btn-clear-dates-pro"
                            onClick={() => { setFechaDesde(""); setFechaHasta(""); setFiltroEstado("TODOS"); }}
                        >
                            <XCircle size={14} /> Cerrar y Limpiar
                        </button>
                    </div>
                )}
            </div>

            {/* --- LÓGICA CONDICIONAL: TABLA VS ESTADO VACÍO PRO --- */}
            {postulacionesFiltradas.length > 0 ? (
                <table className="postulaciones-table fade-in">
                    <thead>
                        <tr>
                            <th className="th-nombre">Nombre</th>
                            <th className="th-fecha">Fecha</th>
                            <th className="th-cv">Chat</th>
                            <th className="th-status">Estado Actual</th>
                            <th className="th-dropdown"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {postulacionesFiltradas.map((p) => {
                            const stageInfo = stages[p.estado] || stages.PENDIENTE;
                            const esRechazado = p.estado === 'RECHAZADO';
                            const esFinalizado = p.estado === 'CONTRATADO';
                            const estaExpandida = filaExpandida === p.id;
                            
                            const nombreSimplificado = `${p.egresado?.nombres?.split(" ")[0]} ${p.egresado?.apellidos?.split(" ")[0]}`;

                            return (
                                <React.Fragment key={p.id}>
                                    {/* FILA PRINCIPAL */}
                                    {/* Busca este tr dentro del .map y déjalo así: */}
<tr 
    key={p.id}
    id={`postulacion-${p.id}`} 
    className={`postulacion-row ${p.anclado ? 'is-pinned' : ''} ${
        esRechazado ? 'rechazado-row' : ''
    } ${estaExpandida ? 'is-expanded' : ''} ${
        // 🎯 Usamos el nuevo estado temporal
        String(p.id) === String(activeHighlight) ? 'fila-resaltada-naranja' : ''
    }`} 
    onClick={() => toggleFila(p.id)}
>
                                        <td className="td-nombre" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {/* BOTÓN DE ANCLAR */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); 
                                                    onCambiarEstado(p.id, p.anclado ? 'DESANCLAR' : 'ANCLAR'); 
                                                }}
                                                style={{
                                                    border: 'none',
                                                    background: 'none',
                                                    cursor: 'pointer',
                                                    color: p.anclado ? '#f59e0b' : '#94a3b8', 
                                                    transition: 'transform 0.2s'
                                                }}
                                                title={p.anclado ? "Quitar anclaje" : "Anclar candidato"}
                                                className="pin-button"
                                            >
                                                <Pin size={16} fill={p.anclado ? "currentColor" : "none"} style={{ transform: p.anclado ? 'rotate(45deg)' : 'none' }} />
                                            </button>

                                            <span className="candidato-full-name-chip">{nombreSimplificado}</span>
                                        </td>
                                            
                                        <td className="td-fecha">
                                            <span 
                                                className="fecha-postulacion-chip"
                                                title={`Fecha y Hora de postulación: ${new Date(p.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                            >
                                                {new Date(p.fecha).toLocaleDateString()}
                                            </span>
                                        </td>

                                        <td className="td-cv">
                                            <div className="chat-button-wrapper">
                                                <button 
                                                    className="btn-table-action-chat-v2" 
                                                    onClick={(e) => { e.stopPropagation(); onAbrirChat(p); }}
                                                    title="Iniciar conversación"
                                                >
                                                    <div className="icon-badge-container">
                                                        <MessageSquare size={18} fill="currentColor" fillOpacity={0.2} />
                                                        <span className="notification-dot-ping"></span>
                                                    </div>
                                                </button>
                                            </div>
                                        </td>

                                        <td className="td-status">
                                            <span className="status-badge-simple" style={{ backgroundColor: stageInfo.bg, color: stageInfo.color }}>
                                                {stageInfo.label}
                                            </span>
                                        </td>

                                        <td className="td-dropdown">
                                            <ChevronDown size={20} className={`dropdown-icon-arrow ${estaExpandida ? 'rotate-180' : ''}`} />
                                        </td>
                                    </tr>
                                    {/* FILA EXPANDIDA (DROPDOWN) */}
{estaExpandida && (
    <tr className="expanded-detail-row"> 
        <td colSpan="5">
            <div className="expanded-content-wrapper fade-in">
                                                    <div className="pipeline-visual-container">
                                                        
                                                        {/* Etiquetas del Pipeline */}
                                                        <div className="pipeline-labels-row">
                                                            {PIPELINE_ORDER.map((key) => {
                                                                const tooltips = {
                                                                    PENDIENTE: "Postulación recibida: en espera de revisión inicial",
                                                                    REVISION: "En revisión: evaluando perfil y Hoja de Vida",
                                                                    ENTREVISTA: "Fase de entrevistas: conociendo al candidato",
                                                                    PRUEBA: "Evaluación técnica: validando competencias",
                                                                    FINALISTA: "Candidato potencial: en terna para selección final",
                                                                    CONTRATADO: "¡Proceso exitoso! Candidato seleccionado y contratado"
                                                                };
                                                                return (
                                                                    <span 
                                                                        key={key} 
                                                                        className={`stage-pill-label ${p.estado === key ? 'active' : ''}`}
                                                                        title={tooltips[key]}
                                                                        style={{ 
                                                                            backgroundColor: p.estado === key ? stages[key].bg : 'transparent',
                                                                            color: p.estado === key ? stages[key].color : '#94a3b8',
                                                                            borderColor: p.estado === key ? stages[key].color : '#e2e8f0'
                                                                        }}
                                                                        onClick={(e) => { e.stopPropagation(); onCambiarEstado(p.id, key); }}
                                                                    >
                                                                        {stages[key].label}
                                                                    </span>
                                                                );
                                                            })}
                                                            {esRechazado && <span className="stage-pill-label active rejected">RECHAZADO</span>}
                                                        </div>

                                                        {/* Barra de Progreso */}
                                                        <div className="pipeline-bar-wrapper">
                                                            <div className={`pipeline-bar-bg ${esRechazado ? 'is-rejected' : ''}`}>
                                                                <div 
                                                                    className="pipeline-bar-fill" 
                                                                    style={{ 
                                                                        width: getProgressWidth(p.estado),
                                                                        backgroundColor: esRechazado ? '#dc2626' : stageInfo.color 
                                                                    }}
                                                                ></div>

                                                                <div 
                                                                    className="pipeline-knob" 
                                                                    style={{ 
                                                                        left: getProgressWidth(p.estado), 
                                                                        backgroundColor: esRechazado ? '#dc2626' : stageInfo.color 
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Acciones del Candidato */}
                                                        <div className="pipeline-actions-footer">
                                                            <div className="actions-left-group">
                                                                <button className="btn-action-chip" onClick={(e) => { e.stopPropagation(); onDescargarDirecto(p.egresado); }}>
                                                                    <Download size={14}/> <span>Descargar CV</span>
                                                                </button>
                                                                <button className="btn-action-chip" onClick={(e) => { e.stopPropagation(); onVerPerfil(p.egresado); }}>
                                                                    <Eye size={14}/> <span>Ver Perfil</span>
                                                                </button>
                                                                {!esRechazado && !esFinalizado && (
                                                                    <button 
                                                                        className="btn-action-chip reject" 
                                                                        onClick={(e) => { e.stopPropagation(); solicitarRechazo(p.id, nombreSimplificado); }}
                                                                    >
                                                                        <XCircle size={14}/> <span>Rechazar</span>
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {!esRechazado && !esFinalizado && (
                                                                <button className="btn-action-main" onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const nextIdx = PIPELINE_ORDER.indexOf(p.estado) + 1;
                                                                    onCambiarEstado(p.id, PIPELINE_ORDER[nextIdx]);
                                                                }}>
                                                                    <span>Siguiente Etapa</span> <ArrowRight size={15} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                // --- ESTADO VACÍO PRO ---
                <div className="empty-state-pro-container fade-in">
                    <div className="empty-state-visual-wrapper">
                        {/* Lupa con elementos flotantes */}
                        <div className="search-graphics-composition">
                            <div className="pro-magnifying-glass">
                                <Search size={48} className="glass-icon-svg" strokeWidth={1.5} />
                            </div>
                            
                            <div className="data-dot dot-1"></div>
                            <div className="data-dot dot-2"></div>
                            <div className="data-dot dot-3"></div>
                            <div className="data-line line-1"></div>
                            <div className="data-line line-2"></div>
                        </div>

                        {/* Textos Claros y Elegantes */}
                        <h2 className="empty-state-title">Aún no hay candidatos</h2>
                        <p className="empty-state-subtitle">
                            {busqueda || filtroEstado !== "TODOS" 
                                ? "No encontramos postulaciones con los filtros actuales. Intenta ajustar tu búsqueda."
                                : "Por favor, espera. Esta oferta está activa y en breve comenzarás a recibir las primeras postulaciones de los egresados de la UdeC."}
                        </p>
                    </div>
                </div>
            )}

            {/* MODAL DE RECHAZO */}
            {confirmarRechazo.visible && (
                <div className="modal-reject-overlay fade-in">
                    <div className="modal-reject-card">
                        <div className="modal-reject-icon">
                            <AlertTriangle size={32} color="#dc2626" />
                        </div>
                        <h3>Confirmar exclusión</h3>
                        <p>
                            ¿Está seguro de que desea dar de baja a <strong>{confirmarRechazo.nombre}</strong>? 
                            Esta acción notificará al postulante que no continuará en el proceso.
                        </p>
                        <div className="modal-reject-actions">
                            <button className="btn-modal-back" onClick={() => setConfirmarRechazo({ visible: false, id: null, nombre: "" })}>
                                Mantener en proceso
                            </button>
                            <button className="btn-modal-confirm-reject" onClick={ejecutarRechazo}>
                                Confirmar Rechazo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaPostulacionesTable;