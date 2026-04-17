import React, { useState, useEffect, useRef } from 'react';
import API from "../../services/api"; 
import { AiOutlineStar, AiFillStar } from 'react-icons/ai';
import { ThumbsUp, ThumbsDown, X, MessageSquare, Send, Trash2, AlertTriangle, Briefcase, User } from 'lucide-react';
import { toast } from 'react-toastify';
import './TotalPostulaciones.css'; 

const TotalPostulaciones = ({ empresaId }) => {
    const [postulaciones, setPostulaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // --- ESTADOS PARA EL MODAL ---
    const [showModal, setShowModal] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [sentimiento, setSentimiento] = useState(null);
    const [enviando, setEnviando] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const modalRef = useRef(null);

    const PIPELINE_STAGES = {
        PENDIENTE: { label: 'pendiente', color: '#64748b', bg: '#f1f5f9' },
        REVISION: { label: 'Revisión CV', color: '#0ea5e9', bg: '#e0f2fe' },
        ENTREVISTA: { label: 'Entrevista', color: '#8b5cf6', bg: '#f5f3ff' },
        PRUEBA: { label: 'Prueba', color: '#f59e0b', bg: '#fffbeb' },
        FINALISTA: { label: 'Finalista', color: '#10b981', bg: '#ecfdf5' },
        CONTRATADO: { label: 'Contratado', color: '#006b3f', bg: '#f0fdf4' },
        RECHAZADO: { label: 'Descartado', color: '#ef4444', bg: '#fef2f2' }
    };

    const formatearFechaHora = (fechaRaw) => {
        if (!fechaRaw) return "Sin fecha";
        const date = new Date(fechaRaw);
        return new Intl.DateTimeFormat('es-CO', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: 'numeric', minute: 'numeric', hour12: true
        }).format(date).replace(',', '');
    };

    const tiempoRelativo = (fechaRaw) => {
        if (!fechaRaw) return "Sin cambios";
        const date = new Date(fechaRaw);
        const ahora = new Date();
        const diffInSeconds = Math.floor((ahora - date) / 1000);
        const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
        if (diffInSeconds < 60) return "Hace un momento";
        if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
        if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
        return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    };

    const cargarPostulaciones = async () => {
        try {
            const res = await API.get(`/postulaciones/empresa/${empresaId}`);
            setPostulaciones(res.data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { if (empresaId) cargarPostulaciones(); }, [empresaId]);

    // --- LÓGICA DE CIERRE SEGURO ---
    const hayCambios = () => {
        const ratingOriginal = selectedPost?.calificacionAdmin || 0;
        const feedbackOriginal = selectedPost?.comentarioAdmin || "";
        return rating !== ratingOriginal || feedback !== feedbackOriginal;
    };

    const intentarCerrar = () => {
        if (hayCambios()) setShowExitConfirm(true);
        else cerrarTodo();
    };

    const cerrarTodo = () => {
        setShowModal(false);
        setShowExitConfirm(false);
        setSelectedPost(null);
    };

    const handleBackdropClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) intentarCerrar();
    };

    // --- ACCIONES DE CALIFICACIÓN ---
    const handleOpenModal = (post) => {
    setSelectedPost(post);
    
    // Si ya existe calificación en la DB, la cargamos. Si no, TODO VACÍO (0 y null)
    const califExistente = post.calificacionAdmin || 0;
    const comentarioExistente = post.comentarioAdmin || "";

    setRating(califExistente);
    setFeedback(comentarioExistente);
    
    if (califExistente >= 3) {
        setSentimiento('positivo');
    } else if (califExistente > 0) {
        setSentimiento('negativo');
    } else {
        setSentimiento(null); // Esto asegura que las manitos aparezcan sin seleccionar
    }
    
    setShowModal(true);
};

    const submitCalificacion = async () => {
        if (rating === 0) return toast.warning("Asigna una puntuación");
        setEnviando(true);
        try {
            await API.put(`/postulaciones/calificar/${selectedPost.id}`, { calificacion: rating, comentario: feedback });
            toast.success("Calificación guardada");
            cerrarTodo();
            cargarPostulaciones(); 
        } catch (error) { toast.error("Error al guardar"); } finally { setEnviando(false); }
    };

    const iniciarEliminacion = () => {
    setShowDeleteConfirm(true);
};

const ejecutarEliminacionReal = async () => {
    setEnviando(true);
    try {
        await API.put(`/postulaciones/calificar/${selectedPost.id}`, { calificacion: 0, comentario: "" });
        toast.info("Calificación eliminada");
        cerrarTodo();
        setShowDeleteConfirm(false); // Cerramos el aviso
        cargarPostulaciones();
    } catch (error) { 
        toast.error("No se pudo eliminar"); 
    } finally { 
        setEnviando(false); 
    }
};

    if (loading) return <div className="tp-container"><p>Cargando registros...</p></div>;

    // Verifica si hay cambios comparando con los datos originales del post seleccionado
const puedeGuardar = () => {
    const ratingOriginal = selectedPost?.calificacionAdmin || 0;
    const feedbackOriginal = selectedPost?.comentarioAdmin || "";
    
    // Solo habilitar si rating > 0 Y (hay cambios en estrellas O hay cambios en feedback)
    return rating > 0 && (rating !== ratingOriginal || feedback !== feedbackOriginal);
};

    return (
        <div className="tp-container fade-in">
            <h2 className="tp-title">Listado Total de Postulaciones</h2>
            <div className="tp-table-wrapper">
                <table className="tp-custom-table">
                    <thead>
                        <tr>
                            <th className="tp-th">Candidato</th>
                            <th className="tp-th">Vacante</th>
                            <th className="tp-th">Fecha y Hora Postulación</th>
                            <th className="tp-th">Estado Actual</th>
                            <th className="tp-th">Último Cambio</th>
                            <th className="tp-th">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {postulaciones.map((post) => {
                            const stageInfo = PIPELINE_STAGES[post.estado] || PIPELINE_STAGES.PENDIENTE;
                            return (
                                <tr key={post.id} className="tp-row-card">
                                    <td className="tp-td tp-name-cell">{post.egresado.nombres} {post.egresado.apellidos}</td>
                                    <td className="tp-td">{post.vacante.titulo}</td>
                                    <td className="tp-td" style={{ color: '#1e293b', fontWeight: '500' }}>{formatearFechaHora(post.fecha)}</td>
                                    <td className="tp-td">
                                        <span className="tp-badge-status" style={{ backgroundColor: stageInfo.bg, color: stageInfo.color, border: `1px solid ${stageInfo.color}40` }}>
                                            {stageInfo.label.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="tp-td" style={{ fontSize: '0.75rem', color: '#64748b' }}>{tiempoRelativo(post.fechaActualizacion)}</td>
                                    <td className="tp-td">
    <button 
        className={`tp-btn-action ${post.calificacionAdmin ? 'has-rating' : ''}`}
        onClick={() => handleOpenModal(post)}
        title={post.calificacionAdmin ? "Editar calificación" : "Calificar candidato"}
    >
        {post.calificacionAdmin ? (
            /* --- ESTRELLA AMARILLA VIBRANTE --- */
            <AiFillStar 
                size={20} 
                color="#f59e0b" 
                style={{ filter: 'drop-shadow(0px 0px 2px rgba(245, 158, 11, 0.4))' }} 
            />
        ) : (
            <AiOutlineStar size={20} />
        )}
    </button>
</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL DE CALIFICACIÓN --- */}
            {showModal && (
                <div className="tp-modal-overlay" onClick={handleBackdropClick}>
                    <div className="tp-modal-card" ref={modalRef}>
                        <div className="tp-modal-header">
                                <button onClick={intentarCerrar} className="tp-x-close-btn" title="Cerrar">
        <X size={20}/>
    </button>
    <div className="tp-header-text-group">
        <h3 className="tp-modal-main-title">Calificar Candidato</h3>
        <div className="tp-candidate-context">
            {/* Badge del Estudiante con Naranja (Dorado) */}
            <span className="tp-student-badge">
                <User size={12} style={{ marginRight: '4px' }} />
                {selectedPost.egresado.nombres} {selectedPost.egresado.apellidos}
            </span>
            
            {/* Badge de la Vacante con Verde (Institucional) */}
            <span className="tp-vacancy-badge">
                <Briefcase size={12} style={{ marginRight: '4px' }} />
                {selectedPost.vacante.titulo}
            </span>
        </div>
    </div>

</div>

                        <div className="tp-modal-body">
                            <div className="tp-sentiment-row">
    <button 
        className={`tp-sent-btn pos ${sentimiento === 'positivo' ? 'active' : ''}`}
        onClick={() => {
            setSentimiento('positivo'); 
            if (rating < 3) setRating(5); // Si era negativo o 0, ponemos 5 por defecto
        }}
    >
        <ThumbsUp size={18} /> Positiva
    </button>
    <button 
        className={`tp-sent-btn neg ${sentimiento === 'negativo' ? 'active' : ''}`}
        onClick={() => {
            setSentimiento('negativo'); 
            if (rating >= 3 || rating === 0) setRating(1); // Si era positivo o 0, ponemos 1 por defecto
        }}
    >
        <ThumbsDown size={18} /> Negativa
    </button>
</div>

                            <div className="tp-stars-row">
                                {[...Array(5)].map((_, index) => {
    const val = index + 1;
    return (
        <button 
            key={val} 
            className={val <= (hover || rating) ? "on" : "off"}
            onClick={() => {
                setRating(val);
                // LÓGICA AUTOMÁTICA DE MANITOS
                if (val >= 3) {
                    setSentimiento('positivo');
                } else {
                    setSentimiento('negativo');
                }
            }}
            onMouseEnter={() => setHover(val)}
            onMouseLeave={() => setHover(rating)}
        >
            {val <= (hover || rating) ? <AiFillStar size={32}/> : <AiOutlineStar size={32}/>}
        </button>
    );
})}
                            </div>

                            <label className="tp-label"><MessageSquare size={14}/> Comentarios de seguimiento</label>
                            <textarea placeholder="Feedback sobre el desempeño..." value={feedback} onChange={(e) => setFeedback(e.target.value)} className="tp-textarea"/>
                        </div>

                        <div className="tp-modal-footer">
                            {selectedPost.calificacionAdmin > 0 && (
                                <button className="tp-btn-delete" onClick={iniciarEliminacion} title="Eliminar">
    <Trash2 size={18}/>
</button>
                            )}
                            <button className="tp-btn-cancel" onClick={intentarCerrar}>Cancelar</button>
                            <button 
    className="tp-btn-submit" 
    onClick={submitCalificacion} 
    disabled={enviando || !puedeGuardar()} // 👈 Se bloquea si está enviando O si no hay cambios
    style={{
        opacity: (!puedeGuardar() || enviando) ? 0.5 : 1,
        cursor: (!puedeGuardar() || enviando) ? 'not-allowed' : 'pointer',
        filter: (!puedeGuardar() || enviando) ? 'grayscale(0.5)' : 'none'
    }}
>
    {enviando ? "Guardando..." : <><Send size={16}/> Guardar Calificación</>}
</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CONFIRMACIÓN DE SALIDA --- */}
            {showExitConfirm && (
                <div className="tp-confirm-overlay">
                    <div className="tp-confirm-card scale-in">
                        <AlertTriangle size={40} color="#f59e0b" />
                        <h4>¿Salir sin guardar?</h4>
                        <p>Tienes cambios en la calificación que no han sido guardados.</p>
                        <div className="tp-confirm-actions">
                            <button className="tp-btn-stay" onClick={() => setShowExitConfirm(false)}>Continuar editando</button>
                            <button className="tp-btn-exit" onClick={cerrarTodo}>Salir sin guardar</button>
                        </div>
                    </div>
                </div>
            )}
            {showDeleteConfirm && (
    <div className="tp-confirm-overlay">
        <div className="tp-confirm-card scale-in">
            <Trash2 size={40} color="#ef4444" style={{ marginBottom: '15px' }} />
            <h4>¿Eliminar calificación?</h4>
            <p>Esta acción borrará permanentemente el feedback de este candidato.</p>
            <div className="tp-confirm-actions">
                <button className="tp-btn-stay" onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
                <button className="tp-btn-exit" onClick={ejecutarEliminacionReal}>Sí, eliminar</button>
            </div>
        </div>
    </div>
)}
        </div>
    );
};

export default TotalPostulaciones;