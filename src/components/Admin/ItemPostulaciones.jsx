import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Star, MessageCircle, X, ThumbsUp, ThumbsDown, Info } from 'lucide-react'; 
import styles from './ItemPostulaciones.module.css';

const Icon = ({ name }) => <i className={`fa-solid fa-${name}`}></i>;

const ItemPostulaciones = ({ API_URL }) => {
    const [postulaciones, setPostulaciones] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- CONFIGURACIÓN DE COLORES OFICIALES (IGUAL AL DE LA EMPRESA) ---
    const PIPELINE_STAGES = {
        PENDIENTE: { label: 'Pendiente', color: '#64748b', bg: '#f1f5f9' },
        REVISION: { label: 'Revisión CV', color: '#0ea5e9', bg: '#e0f2fe' },
        ENTREVISTA: { label: 'Entrevista', color: '#8b5cf6', bg: '#f5f3ff' },
        PRUEBA: { label: 'Prueba', color: '#f59e0b', bg: '#fffbeb' },
        FINALISTA: { label: 'Finalista', color: '#10b981', bg: '#ecfdf5' },
        CONTRATADO: { label: 'Contratado', color: '#006b3f', bg: '#f0fdf4' },
        RECHAZADO: { label: 'Descartado', color: '#ef4444', bg: '#fef2f2' }
    };

    // --- ESTADOS PARA EL MODAL DE CALIFICACIÓN ---
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);

    const cargarPostulaciones = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/postulaciones/admin/todas`);
            setPostulaciones(res.data);
        } catch (error) {
            console.error("Error al cargar postulaciones:", error);
            toast.error("Error al conectar con el historial de aplicaciones");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarPostulaciones();
    }, []);

    const handleOpenRating = (post) => {
        setSelectedPost(post);
        setShowRatingModal(true);
    };

    if (loading) return (
        <div className={styles.loaderContainer}>
            <div className={styles.spinner}></div>
            <p>Obteniendo registros de postulación...</p>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>Centro de Control de Postulaciones</h2>
                    <p className={styles.subtitle}>Seguimiento de candidatos en tiempo real</p>
                </div>
                <button className={styles.refreshBtn} onClick={cargarPostulaciones}>
                    <Icon name="arrows-rotate" /> Actualizar
                </button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Candidato</th>
                            <th>Vacante / Empresa</th>
                            <th>Fecha Aplicación</th>
                            <th>Estado Actual</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {postulaciones.length > 0 ? (
                            postulaciones.map(p => {
                                // Obtener los colores según el estado actual de la postulación
                                const stage = PIPELINE_STAGES[p.estado] || PIPELINE_STAGES.PENDIENTE;

                                return (
                                    <tr key={p.id}>
                                        <td>
                                            <div className={styles.candidatoInfo}>
                                                <div className={styles.avatar}>
                                                    {p.egresado?.nombres?.charAt(0)}
                                                </div>
                                                <div>
                                                    <strong>{p.egresado?.nombres} {p.egresado?.apellidos}</strong>
                                                    <span>{p.egresado?.correo}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.vacanteInfo}>
                                                <strong>{p.vacante?.titulo}</strong>
                                                <small>{p.vacante?.empresa?.nombre}</small>
                                            </div>
                                        </td>
                                        <td>{new Date(p.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td>
                                            {/* --- APLICACIÓN DE COLORES DINÁMICOS --- */}
                                            <span 
                                                className={styles.statusBadge} 
                                                style={{ 
                                                    backgroundColor: stage.bg, 
                                                    color: stage.color,
                                                    border: `1px solid ${stage.color}40` // Borde sutil al 25% de opacidad
                                                }}
                                            >
                                                {stage.label.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className={styles.actions}>
                                            <button 
                                                className={`${styles.btnAction} ${p.calificacionAdmin ? styles.btnRated : ''}`} 
                                                title="Ver Calificación de la Empresa"
                                                onClick={() => handleOpenRating(p)}
                                            >
                                                <Star size={18} fill={p.calificacionAdmin ? "#a28945" : "none"} color={p.calificacionAdmin ? "#a28945" : "currentColor"} />
                                            </button>
                                            
                                            <button className={styles.btnAction} title="Contactar">
                                                <Icon name="paper-plane" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="5" className={styles.empty}>Aún no hay postulaciones registradas en el sistema.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL DE CALIFICACIÓN (Solo Lectura para Admin) --- */}
            {showRatingModal && selectedPost && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modalCard} fade-in`}>
                        <div className={styles.modalHeader}>
    <h3>Seguimiento de Candidato</h3>
    
    <button 
        onClick={() => setShowRatingModal(false)} 
        className={styles.closeBtn}
        title="Cerrar"
    >
        <X size={20}/>
    </button>
</div>
                        
                        <div className={styles.modalBody}>
                            {selectedPost.calificacionAdmin ? (
                                <>
                                    <div className={styles.infoBox}>
                                        <Info size={16} />
                                        <span>Feedback proporcionado por <strong>{selectedPost.vacante?.empresa?.nombre}</strong></span>
                                    </div>

                                    <div className={styles.ratingStars}>
    {[...Array(5)].map((_, i) => (
        <Star 
            key={i} 
            size={32} 
            /* Rellenamos la estrella si el índice es menor a la calificación */
            fill={i < selectedPost.calificacionAdmin ? "#f59e0b" : "none"} 
            /* El borde de la estrella */
            color={i < selectedPost.calificacionAdmin ? "#f59e0b" : "#e2e8f0"} 
            style={{ filter: i < selectedPost.calificacionAdmin ? 'drop-shadow(0px 0px 2px rgba(245, 158, 11, 0.5))' : 'none' }}
        />
    ))}
</div>

                                    <div className={styles.sentimentDisplay}>
                                        {selectedPost.calificacionAdmin >= 4 ? (
                                            <div className={styles.posTag}><ThumbsUp size={16}/> Experiencia Positiva</div>
                                        ) : (
                                            <div className={styles.negTag}><ThumbsDown size={16}/> Experiencia Negativa</div>
                                        )}
                                    </div>

                                    <div className={styles.commentSection}>
                                        <label><MessageCircle size={14}/> Comentario de la Empresa:</label>
                                        <div className={styles.commentBox}>
                                            {selectedPost.comentarioAdmin || "La empresa no dejó un comentario escrito."}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className={styles.noRatingState}>
                                    <Star size={48} color="#e2e8f0" />
                                    <p>Esta empresa aún no ha calificado el perfil del egresado.</p>
                                </div>
                            )}
                        </div>
                        
                        <div className={styles.modalFooter}>
                            <button className={styles.btnPrimary} onClick={() => setShowRatingModal(false)}>Entendido</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItemPostulaciones;