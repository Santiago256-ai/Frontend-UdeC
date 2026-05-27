import React, { useState, useEffect, useCallback } from 'react';
import API from "../../services/api";
import { 
    RotateCcw, Trash2, Users, AlertCircle, 
    ChevronDown, FileSearch, Calendar, Info, User
} from 'lucide-react';
import { toast } from 'react-toastify';
import "./VacantesEliminadas.css";

export default function VacantesEliminadas({ empresaId }) {
    const [eliminadas, setEliminadas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detalleVacanteId, setDetalleVacanteId] = useState(null);
    const [postuladosEnDetalle, setPostuladosEnDetalle] = useState([]);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    
    // Estado para controlar los checkboxes
    const [seleccionadas, setSeleccionadas] = useState([]);
    
    // Estado para el modal de advertencia crítica (soporta una o varias)
    const [confirmarHardDelete, setConfirmarHardDelete] = useState({ 
        visible: false, 
        ids: [], 
        titulo: "",
        esMasivo: false 
    });

    // 1. Cargar vacantes eliminadas
    const cargarEliminadas = useCallback(async () => {
        try {
            setLoading(true);
            const res = await API.get(`/vacantes/empresa/${empresaId}?estado=ELIMINADA`);
            setEliminadas(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Error al cargar el historial");
        } finally {
            setLoading(false);
        }
    }, [empresaId]);

    useEffect(() => {
        cargarEliminadas();
    }, [cargarEliminadas]);

    // 2. Lógica para expandir/colapsar acordeón
    const toggleDetalle = async (vacante) => {
        if (detalleVacanteId === vacante.id) {
            setDetalleVacanteId(null);
            return;
        }

        try {
            setLoadingDetalle(true);
            setDetalleVacanteId(vacante.id);
            const res = await API.get(`/postulaciones/vacante/${vacante.id}`);
            setPostuladosEnDetalle(res.data);
        } catch (err) {
            toast.error("Error al cargar postulaciones previas");
        } finally {
            setLoadingDetalle(false);
        }
    };

    // 3. Reactivar vacante
    const handleReactivar = async (e, id) => {
        e.stopPropagation();
        try {
            await API.put(`/vacantes/${id}/reactivar`);
            toast.success("¡Vacante reactivada correctamente!");
            cargarEliminadas();
            if (detalleVacanteId === id) setDetalleVacanteId(null);
        } catch (err) {
            toast.error("No se pudo reactivar la vacante");
        }
    };

    // 4. Lógica de Checkboxes
    const toggleSelectRow = (e, id) => {
        e.stopPropagation(); 
        setSeleccionadas(prev => 
            prev.includes(id) 
                ? prev.filter(item => item !== id) 
                : [...prev, id]
        );
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            const todosLosIds = eliminadas.map(v => v.id);
            setSeleccionadas(todosLosIds);
        } else {
            setSeleccionadas([]);
        }
    };

    // 5. Lógica del Modal de Eliminación Definitiva
    const prepararEliminacionDefinitiva = (e, vacante) => {
        e.stopPropagation();
        setConfirmarHardDelete({
            visible: true,
            ids: [vacante.id],
            titulo: vacante.titulo,
            esMasivo: false
        });
    };

    const prepararEliminacionMasiva = () => {
        setConfirmarHardDelete({
            visible: true,
            ids: seleccionadas,
            titulo: `${seleccionadas.length} vacantes seleccionadas`,
            esMasivo: true
        });
    };

    const ejecutarHardDelete = async () => {
        try {
            // Ejecutamos todas las peticiones de eliminación en paralelo
            await Promise.all(
                confirmarHardDelete.ids.map(id => 
                    API.delete(`/vacantes/${id}/definitivo`)
                )
            );
            
            toast.success(confirmarHardDelete.esMasivo 
                ? "Vacantes eliminadas permanentemente" 
                : "Vacante eliminada permanentemente"
            );
            
            setSeleccionadas([]); // Limpiamos selección
            cargarEliminadas(); // Recargamos tabla
            
            // Si la vacante que estaba expandida se eliminó, la cerramos
            if (confirmarHardDelete.ids.includes(detalleVacanteId)) {
                setDetalleVacanteId(null);
            }
        } catch (err) {
            toast.error("Error al eliminar las vacantes");
        } finally {
            setConfirmarHardDelete({ visible: false, ids: [], titulo: "", esMasivo: false });
        }
    };

    if (loading) return <div className="trash-loader"><div className="spinner"></div><span>Consultando archivo...</span></div>;

    return (
        <div className="trash-page-container fade-in">
            <header className="trash-header">
                <div className="trash-title-box">
                    <Trash2 className="trash-icon-main" />
                    <div>
                        <h2>Control de Vacantes Eliminadas</h2>
                        <p>Historial de ofertas dadas de baja y sus registros asociados.</p>
                    </div>
                </div>
            </header>

            {/* BARRA DE ACCIONES MASIVAS */}
            {seleccionadas.length > 0 && (
                <div className="bulk-actions-bar fade-in">
                    <span className="bulk-text">
                        <strong>{seleccionadas.length}</strong> vacante(s) seleccionada(s)
                    </span>
                    <div className="bulk-buttons">
                        <button className="btn-bulk-cancel" onClick={() => setSeleccionadas([])}>
                            Cancelar
                        </button>
                        <button className="btn-bulk-delete" onClick={prepararEliminacionMasiva}>
                            <Trash2 size={16} /> Eliminar selección
                        </button>
                    </div>
                </div>
            )}

            <div className="trash-full-width-container">
                <div className="trash-card-premium">
                    <table className="trash-custom-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px', textAlign: 'center' }}>
                                    {eliminadas.length > 0 && (
    <input 
        type="checkbox" 
        className="custom-checkbox"
        onChange={toggleSelectAll}
        checked={seleccionadas.length === eliminadas.length}
    />
)}
                                </th>
                                <th>VACANTE</th>
                                <th style={{ textAlign: 'center' }}>ELIMINACIÓN</th>
                                <th style={{ textAlign: 'center' }}>POSTULADOS</th>
                                <th style={{ textAlign: 'center' }}>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {eliminadas.length === 0 ? (
    <tr>
        <td colSpan="5" className="trash-empty-premium">
            <div className="empty-state-content">
                <div className="empty-icon-wrapper">
                    {/* Puedes usar Trash2, FileSearch o Archive. Aquí uso FileSearch */}
                    <FileSearch size={48} className="floating-icon" strokeWidth={1.5} />
                </div>
                <h3>Papelera Limpia</h3>
                <p>Actualmente no hay vacantes eliminadas en el historial.</p>
            </div>
        </td>
    </tr>
) : (
                                eliminadas.map((v) => (
                                    <React.Fragment key={v.id}>
                                        <tr 
                                            className={`row-main ${detalleVacanteId === v.id ? 'is-expanded' : ''}`}
                                            onClick={() => toggleDetalle(v)}
                                        >
                                            <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                                <input 
                                                    type="checkbox" 
                                                    className="custom-checkbox"
                                                    checked={seleccionadas.includes(v.id)}
                                                    onChange={(e) => toggleSelectRow(e, v.id)}
                                                />
                                            </td>
                                            <td className="td-titulo">
                                                <div className="vacante-info-main">
                                                    <strong>{v.titulo}</strong>
                                                    <span className="fecha-creacion-text">
                                                        Creada: {new Date(v.fechaCreacion).toLocaleDateString('es-CO', {
                                                            day: '2-digit', month: '2-digit', year: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div className="trash-date-badge-premium">
                                                    <Calendar size={14} />
                                                    <span>
                                                        {v.updatedAt 
                                                            ? new Date(v.updatedAt).toLocaleDateString('es-CO') 
                                                            : new Date(v.fechaCreacion).toLocaleDateString('es-CO')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div className="trash-postulados-badge-premium">
                                                    <Users size={14} />
                                                    <span>{v._count?.postulaciones || 0}</span>
                                                </div>
                                            </td>
                                            <td className="td-actions" onClick={(e) => e.stopPropagation()}>
                                                <button onClick={() => toggleDetalle(v)} className={`btn-trash-view ${detalleVacanteId === v.id ? 'active-view' : ''}`} title="Ver Postulaciones">
                                                    <ChevronDown size={20} style={{ transform: detalleVacanteId === v.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
                                                </button>
                                                <button onClick={(e) => handleReactivar(e, v.id)} className="btn-trash-restore" title="Restaurar Vacante">
                                                    <RotateCcw size={18} />
                                                </button>
                                                <button onClick={(e) => prepararEliminacionDefinitiva(e, v)} className="btn-trash-hard" title="Borrar para siempre">
                                                    <AlertCircle size={18} />
                                                </button>
                                            </td>
                                        </tr>

                                        {detalleVacanteId === v.id && (
                                            <tr className="row-detail-expanded">
                                                {/* Cambiamos colSpan a 5 */}
                                                <td colSpan="5">
                                                    <div className="expanded-content-wrapper fade-in">
                                                        <div className="expanded-header">
                                                            <div className="status-dot"></div>
                                                            <h4>Candidatos que aplicaron antes del cierre</h4>
                                                        </div>
                                                        <div className="postulados-grid-desplegable">
                                                            {loadingDetalle ? (
                                                                <div className="mini-loader">Cargando postulaciones...</div>
                                                            ) : postuladosEnDetalle.length > 0 ? (
                                                                postuladosEnDetalle.map(p => (
                                                                    <div key={p.id} className="postulado-card-horizontal">
                                                                        <div className="p-avatar-circle">
                                                                            {p.egresado?.nombres?.charAt(0)}{p.egresado?.apellidos?.charAt(0)}
                                                                        </div>
                                                                        <div className="p-info-main">
                                                                            <p className="p-name">{p.egresado?.nombres} {p.egresado?.apellidos}</p>
                                                                            <span className={`p-tag ${p.estado?.toLowerCase()
                                                                                .normalize("NFD")               
                                                                                .replace(/[\u0300-\u036f]/g, "") 
                                                                                .replace(/\s+/g, '-')            
                                                                            }`}>
                                                                                {p.estado}
                                                                            </span>
                                                                        </div>
                                                                        <div className="p-contact"><User size={14} /></div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="no-postulados-info">
                                                                    <Info size={18} />
                                                                    <span>No se registraron postulaciones en esta oferta.</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DE CONFIRMACIÓN CRÍTICA (ELIMINACIÓN PARA SIEMPRE) */}
            {confirmarHardDelete.visible && (
                <div className="modal-overlay fade-in" style={{ zIndex: 11000 }}>
                    <div className="logout-modal hard-delete-modal">
                        <div className="modal-icon delete-icon-animated-critical">
                            <AlertCircle size={44} color="#ef4444" strokeWidth={2} />
                        </div>
                        <h3 style={{ color: '#991b1b', textAlign: 'center' }}>¿Eliminar permanentemente?</h3>
                        <div className="hard-delete-warning-box">
                            <p style={{ textAlign: 'center' }}>
                                {confirmarHardDelete.esMasivo 
                                    ? `Estás a punto de borrar definitivamente las ${confirmarHardDelete.ids.length} vacantes seleccionadas.` 
                                    : `Estás a punto de borrar definitivamente la vacante: `
                                }
                                {!confirmarHardDelete.esMasivo && <><br /><strong>"{confirmarHardDelete.titulo}"</strong></>}
                            </p>
                            <ul className="warning-list">
                                <li>Se borrarán todas las postulaciones asociadas.</li>
                                <li>Se eliminará el historial de mensajes de esta vacante.</li>
                                <li>Esta acción <strong>no se puede deshacer</strong>.</li>
                            </ul>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setConfirmarHardDelete({ visible: false, ids: [], titulo: "", esMasivo: false })}>
                                No, mantener registro
                            </button>
                            <button className="btn-confirm btn-hard-delete-danger" onClick={ejecutarHardDelete}>
                                Sí, eliminar para siempre
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}