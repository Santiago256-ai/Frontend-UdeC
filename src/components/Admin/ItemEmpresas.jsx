import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import styles from './ItemEmpresas.module.css';

const Icon = ({ name }) => <i className={`fa-solid fa-${name}`}></i>;

const ItemEmpresas = ({ API_URL }) => {
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");

    const cargarEmpresas = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/empresas/admin/todas`);
            setEmpresas(res.data);
        } catch (error) {
            console.error("Error al cargar empresas:", error);
            toast.error("Error al conectar con el listado de empresas");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarEmpresas();
    }, []);

    const handleEliminar = async (id, nombre) => {
        if (window.confirm(`¿Eliminar la empresa "${nombre}"? Se perderán sus vacantes publicadas.`)) {
            try {
                await axios.delete(`${API_URL}/empresas/${id}`);
                setEmpresas(empresas.filter(e => e.id !== id));
                toast.success("Empresa eliminada");
            } catch (error) {
                toast.error("No se pudo eliminar la empresa");
            }
        }
    };

    const filtradas = empresas.filter(e => 
        e.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
        e.nit?.includes(busqueda)
    );

    if (loading) return (
        <div className={styles.loaderContainer}>
            <div className={styles.spinner}></div>
            <p>Cargando aliados empresariales...</p>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>Gestión de Empresas Aliadas</h2>
                    <p className={styles.subtitle}>Instituciones y organizaciones vinculadas</p>
                </div>
                <div className={styles.searchBox}>
                    <Icon name="building" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o NIT..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Empresa / Email</th>
                            <th>NIT</th>
                            <th>Ubicación / Sector</th>
                            <th>Vacantes</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtradas.map(e => (
                            <tr key={e.id}>
                                <td>
                                    <div className={styles.companyInfo}>
                                        <strong>{e.nombre}</strong>
                                        <span>{e.email}</span>
                                    </div>
                                </td>
                                <td>{e.nit || 'No registrado'}</td>
                                <td>
                                    <div className={styles.sectorInfo}>
                                        <span>{e.city || 'N/A'}</span>
                                        <small>{e.economicSector || 'Sin sector'}</small>
                                    </div>
                                </td>
                                <td>
                                    <span className={styles.badgeVacantes}>
                                        {e._count?.vacantes || 0} Activas
                                    </span>
                                </td>
                                <td className={styles.actions}>
                                    <button className={styles.actionBtn} title="Ver detalles">
                                        <Icon name="eye" />
                                    </button>
                                    <button 
                                        className={`${styles.actionBtn} ${styles.delete}`} 
                                        onClick={() => handleEliminar(e.id, e.nombre)}
                                    >
                                        <Icon name="trash-can" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ItemEmpresas;