import React, { useState } from 'react';
import { 
    MessageSquare, 
    ArrowRight, 
    Download, 
    Eye, 
    XCircle, 
    AlertTriangle,
    ChevronDown,
    Search, Filter, Calendar, Pin, PinOff
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
    onDescargarDirecto 
}) => {

    // Estado para el modal de confirmación de rechazo
    const [confirmarRechazo, setConfirmarRechazo] = useState({ visible: false, id: null, nombre: "" });
    
    // Estado para controlar qué fila está expandida
    const [filaExpandida, setFilaExpandida] = useState(null);
    // Estados para controlar la búsqueda y el filtro
const [busqueda, setBusqueda] = useState("");
const [filtroEstado, setFiltroEstado] = useState("TODOS");
// Nuevos estados para el rango de fechas
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
    // Si 'a' está anclado y 'b' no, 'a' va primero (-1)
    if (a.anclado && !b.anclado) return -1;
    if (!a.anclado && b.anclado) return 1;
    return 0; // Si ambos son iguales, mantienen su orden original
});

    return (
        <div className="postulaciones-table-container fade-in">
            {/* Barra de herramientas: Buscador y Filtro */}
<div className="table-controls-header" style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '12px', 
    marginBottom: '20px',
    marginTop: '20px'
}}>
    {/* FILA PRINCIPAL */}
    <div style={{ display: 'flex', gap: '15px' }}>
        {/* Buscador */}
        <div className="search-box-container" style={{ flex: 2, display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '10px' }}>
            <Search size={18} color="#94a3b8" />
            <input 
                type="text" 
                placeholder="Buscar candidato..." 
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', marginLeft: '10px', width: '100%' }}
            />
        </div>

        {/* Selector de Estado y Fecha */}
        <div className="filter-box-container" style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '10px' }}>
            <Filter size={18} color="#94a3b8" />
            <select 
                value={filtroEstado} 
                onChange={(e) => setFiltroEstado(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', marginLeft: '10px', width: '100%', cursor: 'pointer', fontWeight: '500' }}
            >
                <option value="TODOS">Todos los estados</option>
                
                {/* OPCIÓN ESPECIAL DE FECHA */}
                <option value="FECHA" style={{ fontWeight: 'bold', color: '#006b3f' }}>📅 Filtrar por fecha</option>
                
                <hr />
                {Object.keys(stages).map(key => (
                    <option key={key} value={key}>{stages[key].label}</option>
                ))}
            </select>
        </div>
    </div>

    {/* FILA CONDICIONAL: Solo aparece si seleccionan "Filtrar por fecha" */}
    {filtroEstado === "FECHA" && (
        <div className="date-picker-row fade-in" style={{ 
            display: 'flex', 
            gap: '10px', 
            alignItems: 'center', 
            background: '#f0fdf4', /* Verde muy suave para resaltar que es un filtro activo */
            padding: '10px 15px', 
            borderRadius: '10px',
            border: '1px dashed #006b3f' 
        }}>
            <Calendar size={16} color="#006b3f" />
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#00482b' }}>Rango de postulación:</span>
            
            <input 
                type="date" 
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                style={{ border: '1px solid #dcfce7', borderRadius: '5px', padding: '3px 8px', fontSize: '12px' }}
            />
            <span style={{ fontSize: '12px', color: '#006b3f' }}>hasta</span>
            <input 
                type="date" 
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                style={{ border: '1px solid #dcfce7', borderRadius: '5px', padding: '3px 8px', fontSize: '12px' }}
            />
            
            <button 
                onClick={() => { setFechaDesde(""); setFechaHasta(""); setFiltroEstado("TODOS"); }}
                style={{ marginLeft: 'auto', border: 'none', background: '#ef4444', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
            >
                Cerrar y Limpiar
            </button>
        </div>
    )}
</div>
            <table className="postulaciones-table">
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
                                <tr 
    className={`postulacion-row ${p.anclado ? 'is-pinned' : ''} ${esRechazado ? 'rechazado-row' : ''} ${estaExpandida ? 'is-expanded' : ''}`} 
    onClick={() => toggleFila(p.id)}
>
                                  <td className="td-nombre" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    {/* BOTÓN DE ANCLAR */}
    <button
        onClick={(e) => {
            e.stopPropagation(); // Para que no se expanda la fila al hacer clic
            onCambiarEstado(p.id, p.anclado ? 'DESANCLAR' : 'ANCLAR'); // Supongamos que tu función maneja esto
        }}
        style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: p.anclado ? '#f59e0b' : '#94a3b8', // Naranja si está anclado, gris si no
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
                                                    {/* BARRA DE PROGRESO CON BOLITA */}
<div className="pipeline-bar-wrapper">
    <div className={`pipeline-bar-bg ${esRechazado ? 'is-rejected' : ''}`}>
        
        {/* El relleno de la barra */}
        <div 
            className="pipeline-bar-fill" 
            style={{ 
                width: getProgressWidth(p.estado),
                backgroundColor: esRechazado ? '#dc2626' : stageInfo.color 
            }}
        ></div>

        {/* LA BOLITA (KNOB) - Agrégala justo aquí */}
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