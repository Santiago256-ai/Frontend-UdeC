import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Search, MapPin, Users, Briefcase, ChevronRight, Building2 } from 'lucide-react';
import styles from './EgresadosVerEmpresas.module.css';

export default function EgresadosVerEmpresas({ onVerPerfil }) {
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchEmpresas = async () => {
            try {
                // Asume que este endpoint trae la lista pública de empresas
                const res = await API.get('/empresas');
                // Filtramos por si acaso vienen empresas inactivas
                const empresasActivas = res.data.filter(emp => emp.estado !== 'INACTIVO');
                setEmpresas(empresasActivas);
            } catch (error) {
                console.error("Error al cargar el directorio de empresas:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmpresas();
    }, []);

    // Filtrar por nombre o sector
    const filtradas = empresas.filter(emp => {
        const termino = searchTerm.toLowerCase();
        const nombreMatch = emp.nombre?.toLowerCase().includes(termino);
        const sectorStr = Array.isArray(emp.economicSector) ? emp.economicSector.join(' ') : emp.economicSector || '';
        const sectorMatch = sectorStr.toLowerCase().includes(termino);
        return nombreMatch || sectorMatch;
    });

    if (loading) {
        return <div className={styles.eveLoader}>Cargando directorio de empresas...</div>;
    }

    return (
        <div className={styles.eveContainer}>
            <div className={styles.eveHeaderFixed}>
                <div className={styles.eveHeaderInfo}>
                    <div className={styles.eveIconWrapper}><Building2 size={28} /></div>
                    <div>
                        <h2>Empresas Aliadas</h2>
                        <p>Explora nuestra red de empresas y descubre tu próximo lugar de trabajo.</p>
                    </div>
                </div>
                
                <div className={styles.eveSearchBox}>
                    <Search size={18} className={styles.eveSearchIcon} />
                    <input 
                        type="text" 
                        placeholder="Buscar empresa o sector..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* El Feed scrolleable estilo Facebook */}
            <div className={styles.eveFeedLayout}>
                {filtradas.length > 0 ? (
                    filtradas.map(empresa => (
                        <article 
                            key={empresa.id} 
                            className={styles.eveFeedCard}
                            onClick={() => onVerPerfil(empresa.id)}
                        >
                            <div className={styles.eveCardHeader}>
                                <div className={styles.eveAvatar}>
                                    {empresa.nombre?.charAt(0).toUpperCase()}
                                </div>
                                <div className={styles.eveTitleGroup}>
                                    <h3>{empresa.nombre}</h3>
                                    <span className={styles.eveSector}>
                                        {Array.isArray(empresa.economicSector) 
                                            ? empresa.economicSector.join(', ') 
                                            : empresa.economicSector || 'Sector Empresarial'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className={styles.eveCardBody}>
                                <div className={styles.eveTagsRow}>
                                    <span className={styles.eveTag}><MapPin size={14}/> {empresa.city || 'Ubicación'}</span>
                                    {empresa.employees && <span className={styles.eveTag}><Users size={14}/> {empresa.employees}</span>}
                                    {empresa.modalidad && <span className={styles.eveTag}><Briefcase size={14}/> {empresa.modalidad}</span>}
                                </div>
                            </div>

                            <div className={styles.eveCardFooter}>
                                <span>Conocer más sobre esta empresa</span>
                                <ChevronRight size={18} />
                            </div>
                        </article>
                    ))
                ) : (
                    <div className={styles.eveEmptyState}>
                        <Search size={40} />
                        <h3>No hay resultados</h3>
                        <p>No encontramos empresas que coincidan con "{searchTerm}"</p>
                    </div>
                )}
            </div>
        </div>
    );
}