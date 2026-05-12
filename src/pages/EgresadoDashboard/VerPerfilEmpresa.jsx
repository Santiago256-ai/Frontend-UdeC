import React, { useState, useEffect } from 'react';
import API from "../../services/api";
import { 
    ArrowLeft, 
    Building2, 
    MapPin, 
    Users, 
    Globe, 
    Calendar,
    Briefcase,
    HeartHandshake,
    Info,
    Mail,
    User,
    Phone, 
    CheckCircle
} from 'lucide-react';
import styles from './VerPerfilEmpresa.module.css';

export default function VerPerfilEmpresa({ empresaId, onVolver, onAbrirVacante }) {
    const [empresa, setEmpresa] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmpresa = async () => {
            try {
                const res = await API.get(`/empresas/${empresaId}`);
                setEmpresa(res.data);
            } catch (error) {
                console.error("Error al cargar el perfil de la empresa:", error);
            } finally {
                setLoading(false);
            }
        };

        if (empresaId) {
            fetchEmpresa();
        }
    }, [empresaId]);

    // 🟢 NUEVA FUNCIÓN: Revisa el JSON de visibilidad. Si no existe, por defecto es 'true' (Público)
    const esVisible = (seccion) => {
        return empresa?.visibilidad?.[seccion] ?? true;
    };

    if (loading) {
        return (
            <div className={styles.vpeLoaderContainer}>
                <div className={styles.vpeSpinner}></div>
                <p>Cargando perfil corporativo...</p>
            </div>
        );
    }

    if (!empresa) {
        return (
            <div className={styles.vpeErrorContainer}>
                <Building2 size={48} className={styles.vpeErrorIcon} />
                <h2>Empresa no encontrada</h2>
                <button onClick={onVolver} className={styles.vpeBtnVolver}>Volver a las vacantes</button>
            </div>
        );
    }

    // Calculamos si debemos mostrar el bloque lateral completo
    const mostrarSidebarGeneral = esVisible('detallesEmpresa') || esVisible('presenciaDigital') || esVisible('contacto');

    // 🟢 NUEVO FILTRO ESTRICTO DE 3 REGLAS
    const vacantesActivas = (empresa?.vacantes || []).filter(vacante => {
        // Regla 1: Que el estado sea explícitamente ABIERTA
        if (vacante.estado !== "ABIERTA") return false;

        // Regla 2: Que la fecha de cierre no esté vencida
        if (vacante.fechaCierre) {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0); // Normalizamos a la medianoche
            
            const cierre = new Date(vacante.fechaCierre);
            // Ajustamos zona horaria igual que en tu VacantesDashboard
            const cierreAjustado = new Date(cierre.getTime() + cierre.getTimezoneOffset() * 60000);
            cierreAjustado.setHours(0, 0, 0, 0);

            if (cierreAjustado < hoy) return false; // ❌ Rechazada: Fecha Vencida
        }

        // Regla 3: Que tenga cupos disponibles
        if (vacante.limitePostulantes) {
            const inscritos = vacante.postulaciones ? vacante.postulaciones.length : 0;
            if (inscritos >= vacante.limitePostulantes) return false; // ❌ Rechazada: Cupos llenos
        }

        return true; // ✅ Aprobada: Pasa las 3 reglas
    });

    return (
        <div className={styles.vpeMainContainer}>
            {/* Cabecera con botón de volver */}
            <div className={styles.vpeTopNav}>
                <button onClick={onVolver} className={styles.vpeBtnVolverHeader}>
                    <ArrowLeft size={20} /> Regresar
                </button>
            </div>

            {/* Banner de la Empresa */}
            <header className={styles.vpeHeaderCard}>
                <div className={styles.vpeHeaderContent}>
                    <div className={styles.vpeAvatarWrapper}>
                        <div className={styles.vpeAvatar}>
                            {empresa.nombre.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div className={styles.vpeHeaderInfo}>
                        <h1 className={styles.vpeCompanyName}>{empresa.nombre}</h1>
                        <p className={styles.vpeCompanySector}>{empresa.economicSector?.join(', ') || empresa.economicSector || 'Sector no especificado'}</p>
                        
                        <div className={styles.vpeQuickStats}>
                            {/* 🛡️ Validamos la ubicación */}
                            {esVisible('ubicacion') && (
                                <span className={styles.vpeStatBadge}>
                                    <MapPin size={14}/> {empresa.city}, {empresa.department}
                                </span>
                            )}
                            
                            {/* 🛡️ Validamos los detalles de empleados y modalidad */}
                            {esVisible('detallesEmpresa') && (
                                <>
                                    <span className={styles.vpeStatBadge}>
                                        <Users size={14}/> {empresa.employees || 'Tamaño no definido'}
                                    </span>
                                    {empresa.modalidad && (
                                        <span className={styles.vpeStatBadge}>
                                            <Briefcase size={14}/> Modalidad: {empresa.modalidad}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Contenido Principal Grid */}
            <div className={styles.vpeContentGrid}>
                
                {/* Columna Izquierda (Principal) */}
                <div className={styles.vpeMainColumn}>
                    {/* 🛡️ Validamos "Sobre Nosotros" */}
                    {esVisible('sobreNosotros') && (
                        <section className={styles.vpeSection}>
                            <h2 className={styles.vpeSectionTitle}><Info size={20}/> Sobre Nosotros</h2>
                            <div className={styles.vpeTextContent}>
                                {empresa.descripcion ? (
                                    <p>{empresa.descripcion}</p>
                                ) : (
                                    <p className={styles.vpeEmptyText}>Esta empresa aún no ha agregado una descripción.</p>
                                )}
                            </div>
                        </section>
                    )}

                    {/* 🛡️ Validamos "Cultura y Beneficios" */}
                    {esVisible('beneficios') && (
                        <section className={styles.vpeSection}>
                            <h2 className={styles.vpeSectionTitle}><HeartHandshake size={20}/> Cultura y Beneficios</h2>
                            <div className={styles.vpeTextContent}>
                                {empresa.beneficios ? (
                                    <ul className={styles.vpeBenefitsList}>
                                        {empresa.beneficios.split(',').map((beneficio, index) => (
                                            <li key={index}>{beneficio.trim()}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className={styles.vpeEmptyText}>No se han especificado beneficios particulares.</p>
                                )}
                            </div>
                        </section>
                    )}
                    
                    {/* Si la empresa ocultó ambas cosas, mostramos un pequeño mensaje para que no quede vacío */}
                    {!esVisible('sobreNosotros') && !esVisible('beneficios') && (
                        <div className={styles.vpeTrustBadge} style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                            <Info size={16} />
                            <p>El perfil detallado de esta empresa se mantiene reservado.</p>
                        </div>
                    )}

                    {/* 🟢 AQUÍ PEGAMOS LA SECCIÓN DE VACANTES QUE FALTABA 🟢 */}
                    <section className={styles.vpeSection} style={{ marginTop: '30px' }}>
                        <h2 className={styles.vpeSectionTitle} style={{ margin: 0, borderBottom: 'none', paddingLeft: '12px', paddingBottom: '15px' }}>
                            <Briefcase size={20}/> Vacantes Disponibles
                        </h2>
                        
                        {vacantesActivas.length > 0 ? (
                            <div className={styles.vpeVacantesGrid}>
                                {vacantesActivas.map(vacante => {
                                    
                                    // 🔍 LÓGICA: Verificamos si el usuario actual ya se postuló
                                    const usuarioId = JSON.parse(localStorage.getItem('usuario'))?.id;
                                    const yaPostulado = vacante.postulaciones?.some(p => p.egresadoId === usuarioId);

                                    return (
                                        <div 
                                            key={vacante.id} 
                                            className={styles.vpeVacanteCard}
                                            onClick={() => onAbrirVacante && onAbrirVacante(vacante)} 
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className={styles.vpeVacanteHeader}>
                                                <h4 className={styles.vpeVacanteTitle}>{vacante.titulo}</h4>
                                                
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                    {yaPostulado ? (
                                                        <span className={styles.vpeBadgePostulado}>
                                                            <CheckCircle size={12}/> Ya postulado
                                                        </span>
                                                    ) : (
                                                        <span className={styles.vpeVacantePill}>{vacante.modalidad}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className={styles.vpeVacanteLocation}><MapPin size={14}/> {vacante.ubicacion}</p>
                                            
                                            <div className={styles.vpeVacanteFooter}>
                                                <span className={styles.vpeVacanteSalary}>
                                                    {vacante.salario && !isNaN(parseFloat(vacante.salario)) ? `$${parseFloat(vacante.salario).toLocaleString('es-CO')}` : 'A convenir'}
                                                </span>
                                                <span className={styles.vpeVacanteType}>{vacante.tipo}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={styles.vpeEmptyText} style={{ textAlign: 'center', padding: '25px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                Esta empresa no tiene vacantes activas en este momento.
                            </div>
                        )}
                    </section>
                    {/* 🟢 FIN DE LA SECCIÓN DE VACANTES 🟢 */}

                </div> {/* 👈 Este es el div que cierra la columna izquierda */}

                {/* Columna Derecha (Lateral) */}
                <div className={styles.vpeSidebarColumn}>
                    
                    {/* 🛡️ Solo mostramos esta tarjeta si Detalles o Presencia Digital están visibles */}
                    {mostrarSidebarGeneral && (
                        <aside className={styles.vpeSidebarCard}>
                            <h3 className={styles.vpeSidebarTitle}>Información General</h3>
                            
                            <ul className={styles.vpeInfoList}>
                                {/* Validamos Tipo y Fundación (Detalles de Empresa) */}
                                {esVisible('detallesEmpresa') && (
                                    <>
                                        <li>
                                            <Building2 size={16} className={styles.vpeIconRef} />
                                            <div>
                                                <strong>Tipo de Empresa</strong>
                                                <span>{empresa.companyType || 'No especificado'}</span>
                                            </div>
                                        </li>
                                        <li>
                                            <Calendar size={16} className={styles.vpeIconRef} />
                                            <div>
                                                <strong>Año de Fundación</strong>
                                                <span>{empresa.foundationYear || 'No especificado'}</span>
                                            </div>
                                        </li>
                                    </>
                                )}

                                {/* Validamos Redes y Web (Presencia Digital) */}
                                {esVisible('presenciaDigital') && (
                                    <>
                                        {empresa.sitioWeb && (
                                            <li>
                                                <Globe size={16} className={styles.vpeIconRef} />
                                                <div>
                                                    <strong>Sitio Web</strong>
                                                    <a href={empresa.sitioWeb.startsWith('http') ? empresa.sitioWeb : `https://${empresa.sitioWeb}`} target="_blank" rel="noopener noreferrer" className={styles.vpeLink}>
                                                        Visitar web oficial
                                                    </a>
                                                </div>
                                            </li>
                                        )}
                                        {empresa.linkedin && (
                                            <li>
                                                <Globe size={16} className={styles.vpeIconRef} />
                                                <div>
                                                    <strong>LinkedIn</strong>
                                                    <a href={empresa.linkedin.startsWith('http') ? empresa.linkedin : `https://${empresa.linkedin}`} target="_blank" rel="noopener noreferrer" className={styles.vpeLink}>
                                                        Ver perfil en LinkedIn
                                                    </a>
                                                </div>
                                            </li>
                                        )}
                                    </>
                                )}
                            {esVisible('contacto') && (
                                    <>
                                        {empresa.contactName && (
                                            <li>
                                                <User size={16} className={styles.vpeIconRef} />
                                                <div>
                                                    <strong>Contacto RRHH</strong>
                                                    <span>{empresa.contactName}</span>
                                                </div>
                                            </li>
                                        )}
                                        {empresa.phones && (
                                            <li>
                                                <Phone size={16} className={styles.vpeIconRef} />
                                                <div>
                                                    <strong>Teléfono</strong>
                                                    <span>{empresa.phones}</span>
                                                </div>
                                            </li>
                                        )}
                                    </>
                                )}
                            </ul>
                        </aside>
                    )}

                    {/* Nota de confidencialidad para el egresado (Esta siempre la dejamos) */}
                    <div className={styles.vpeTrustBadge}>
                        <Mail size={16} />
                        <p>Las aplicaciones a esta empresa a través de Empres360 PRO son directas y seguras.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}