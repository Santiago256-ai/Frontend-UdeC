import React from 'react';
import styles from './InicioEgresados.module.css';
import { 
    Briefcase, 
    CheckCircle, 
    MessageSquare, 
    FileUser, 
    TrendingUp, 
    Clock 
} from 'lucide-react';

const InicioEgresados = ({ usuario, vacantes }) => {
    // Cálculos rápidos para las estadísticas
    const postulacionesActivas = vacantes.filter(v => 
        v.postulaciones?.some(p => p.egresadoId === usuario?.id)
    ).length;

    const vacantesRecomendadas = vacantes.filter(v => 
        v.estado === "ABIERTA" && 
        !v.postulaciones?.some(p => p.egresadoId === usuario?.id)
    ).slice(0, 3); // Tomamos las 3 más recientes

    return (
        <div className={styles.containerInicio}>
            <header className={styles.welcomeHeader}>
                <h1>¡Hola, {usuario?.nombres}! 👋</h1>
                <p>Este es el resumen de tu actividad profesional hoy.</p>
            </header>

            {/* Fila de Estadísticas */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.iconBox} ${styles.blue}`}>
                        <Briefcase size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <span>Postulaciones</span>
                        <strong>{postulacionesActivas}</strong>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={`${styles.iconBox} ${styles.green}`}>
                        <CheckCircle size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <span>Perfil Completo</span>
                        <strong>85%</strong>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={`${styles.iconBox} ${styles.orange}`}>
                        <MessageSquare size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <span>Mensajes Nuevos</span>
                        <strong>2</strong>
                    </div>
                </div>
            </div>

            <div className={styles.mainDashboardGrid}>
                {/* Columna Izquierda: Vacantes Sugeridas */}
                <section className={styles.recentActivity}>
                    <div className={styles.sectionTitle}>
                        <TrendingUp size={20} />
                        <h2>Vacantes sugeridas para ti</h2>
                    </div>
                    <div className={styles.vacantesMiniList}>
                        {vacantesRecomendadas.length > 0 ? (
                            vacantesRecomendadas.map(v => (
                                <div key={v.id} className={styles.miniCard}>
                                    <div>
                                        <h4>{v.titulo}</h4>
                                        <span>{v.empresa?.nombre}</span>
                                    </div>
                                    <button className={styles.btnVer}>Ver</button>
                                </div>
                            ))
                        ) : (
                            <p className={styles.emptyText}>No hay vacantes nuevas por ahora.</p>
                        )}
                    </div>
                </section>

                {/* Columna Derecha: Estado de Hoja de Vida */}
                <aside className={styles.cvStatus}>
                    <div className={styles.sectionTitle}>
                        <FileUser size={20} />
                        <h2>Tu Hoja de Vida</h2>
                    </div>
                    <div className={styles.progressBox}>
                        <div className={styles.progressBarContainer}>
                            <div className={styles.progressBar} style={{ width: '85%' }}></div>
                        </div>
                        <p>Tu perfil destaca más que el 60% de otros egresados.</p>
                        <button className={styles.btnUpdate}>Actualizar CV</button>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default InicioEgresados;