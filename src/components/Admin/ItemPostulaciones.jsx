import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import styles from './ItemPostulaciones.module.css';

const Icon = ({ name }) => <i className={`fa-solid fa-${name}`}></i>;

const ItemPostulaciones = ({ API_URL }) => {
    const [postulaciones, setPostulaciones] = useState([]);
    const [loading, setLoading] = useState(true);

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
                            postulaciones.map(p => (
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
                                        <span className={`${styles.statusBadge} ${styles[p.estado.toLowerCase()] || styles.pendiente}`}>
                                            {p.estado}
                                        </span>
                                    </td>
                                    <td className={styles.actions}>
                                        <button className={styles.btnAction} title="Ver Hoja de Vida">
                                            <Icon name="file-pdf" />
                                        </button>
                                        <button className={styles.btnAction} title="Contactar">
                                            <Icon name="paper-plane" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className={styles.empty}>Aún no hay postulaciones registradas en el sistema.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ItemPostulaciones;