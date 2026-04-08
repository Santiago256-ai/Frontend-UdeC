import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import styles from './ItemVacantes.module.css';

const Icon = ({ name }) => <i className={`fa-solid fa-${name}`}></i>;

const ItemVacantes = ({ API_URL }) => {
    const [vacantes, setVacantes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroEstado, setFiltroEstado] = useState("TODAS");

    const cargarVacantes = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/vacantes/admin/todas`);
            setVacantes(res.data);
        } catch (error) {
            console.error("Error al cargar vacantes:", error);
            toast.error("No se pudieron obtener las vacantes reales");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarVacantes();
    }, []);

    const filtradas = filtroEstado === "TODAS" 
        ? vacantes 
        : vacantes.filter(v => v.estado.toUpperCase() === filtroEstado);

    if (loading) return (
        <div className={styles.loaderContainer}>
            <div className={styles.spinner}></div>
            <p>Sincronizando vacantes con el servidor...</p>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>Gestión Integral de Vacantes</h2>
                    <p className={styles.subtitle}>Supervisión de ofertas laborales publicadas</p>
                </div>
                <div className={styles.filters}>
                    <select 
                        value={filtroEstado} 
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className={styles.selectFiltro}
                    >
                        <option value="TODAS">Todos los estados</option>
                        <option value="ABIERTA">Abiertas</option>
                        <option value="CERRADA">Cerradas</option>
                        <option value="PENDIENTE">Pendientes</option>
                    </select>
                    <button className={styles.refreshBtn} onClick={cargarVacantes}>
                        <Icon name="rotate" />
                    </button>
                </div>
            </div>

            <div className={styles.gridVacantes}>
                {filtradas.length > 0 ? (
                    filtradas.map(v => (
                        <div key={v.id} className={styles.vacanteCard}>
                            <div className={styles.cardHeader}>
                                <span className={`${styles.badge} ${styles[v.estado.toLowerCase()]}`}>
                                    {v.estado}
                                </span>
                                <span className={styles.idVacante}>ID-{v.id}</span>
                            </div>
                            <h3 className={styles.vacanteTitulo}>{v.titulo}</h3>
                            <div className={styles.vacanteDetalle}>
                                <p><Icon name="building" /> {v.empresa?.nombre || 'Empresa N/A'}</p>
                                <p><Icon name="location-dot" /> {v.ubicacion || 'Remoto'}</p>
                                <p><Icon name="calendar-day" /> {new Date(v.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className={styles.cardActions}>
                                <button className={styles.btnVer} title="Ver detalles y postulados">
                                    <Icon name="eye" /> Detalles
                                </button>
                                <button className={styles.btnEdit}>
                                    <Icon name="pen-to-square" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.noData}>No hay vacantes registradas en este estado.</div>
                )}
            </div>
        </div>
    );
};

export default ItemVacantes;