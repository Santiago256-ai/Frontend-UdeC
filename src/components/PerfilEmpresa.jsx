import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from "../services/api";
import { 
    Building2, 
    MapPin, 
    BadgeDollarSign, 
    User, 
    Save, 
    Edit2,
    Info,             
    HeartHandshake,   
    Globe,
    Eye,        // 👈 NUEVO: Icono de visible
    EyeOff      // 👈 NUEVO: Icono de oculto
} from 'lucide-react';
import styles from './PerfilEmpresa.module.css';

export default function PerfilEmpresa() {
    const [empresaData, setEmpresaData] = useState(null);
    const [datosOriginales, setDatosOriginales] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPerfil = async () => {
            try {
                const userSession = JSON.parse(localStorage.getItem('usuario'));
                const token = localStorage.getItem('token');

                if (!userSession || !token) return;

                const response = await API.get(`/empresas/${userSession.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                // Asegurarnos de que si visibilidad es null, inicialice como objeto vacío
                const data = response.data;
                if (!data.visibilidad) data.visibilidad = {};

                setEmpresaData(data);
                setDatosOriginales(data); 
            } catch (error) {
                console.error("Error cargando perfil", error);
                toast.error("Error al cargar los datos de la empresa");
            } finally {
                setLoading(false);
            }
        };
        fetchPerfil();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEmpresaData(prev => ({ ...prev, [name]: value }));
    };

    // 🟢 NUEVA FUNCIÓN: Cambia el estado de visibilidad de una sección
    const toggleVisibilidad = (seccion) => {
        setEmpresaData(prev => {
            // Por defecto, si no existe la config, asumimos que está visible (true)
            const valorActual = prev.visibilidad?.[seccion] ?? true; 
            return {
                ...prev,
                visibilidad: {
                    ...prev.visibilidad,
                    [seccion]: !valorActual // Invertimos el valor
                }
            };
        });
    };

    const handleUpdate = async () => {
        try {
            const token = localStorage.getItem('token');
            await API.put(`/empresas/${empresaData.id}`, empresaData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setDatosOriginales(empresaData); 
            setEditMode(false);
            
            toast.success("¡Datos y visibilidad actualizados correctamente!", {
                position: "bottom-right",
                theme: "colored",
            });
        } catch (error) {
            toast.error("❌ No se pudieron guardar los cambios", {
                theme: "colored",
            });
        }
    };

    const handleCancel = () => {
        setEmpresaData(datosOriginales);
        setEditMode(false);
        toast.info("Edición cancelada");
    };

    // Helper para saber si una sección está visible (por defecto: true)
    const esVisible = (seccion) => {
        return empresaData?.visibilidad?.[seccion] ?? true;
    };

    if (loading) return <div className={styles.peLoader}>Cargando Perfil...</div>;

    const hayCambios = JSON.stringify(empresaData) !== JSON.stringify(datosOriginales);

    // COMPONENTE REUTILIZABLE PARA EL BOTÓN DE VISIBILIDAD
    const BotonVisibilidad = ({ seccion }) => {
        if (!editMode) return null;
        const visible = esVisible(seccion);
        
        return (
            <button
                type="button"
                onClick={() => toggleVisibilidad(seccion)}
                style={{
                    background: visible ? 'rgba(0, 179, 104, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                    border: 'none',
                    cursor: 'pointer',
                    color: visible ? '#00b368' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    transition: 'all 0.2s'
                }}
            >
                {visible ? <><Eye size={14}/> Público</> : <><EyeOff size={14}/> Oculto</>}
            </button>
        );
    };

    return (
        <div className={styles.peMainContainer}>
            {/* ENCABEZADO INSTITUCIONAL */}
            <div className={styles.peHeaderCard}>
                <div className={styles.peHeaderInfo}>
                    <div className={styles.peAvatarCircle}>
                        {empresaData?.nombre?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className={styles.peTitle}>{empresaData?.nombre || 'Mi Empresa'}</h1>
                        <p className={styles.peSubtitle}>NIT: {empresaData?.nit || 'No registrado'}</p>
                    </div>
                </div>
                
                <div className={styles.peHeaderActions}>
                    {!editMode ? (
                        <button className={styles.peBtnEdit} onClick={() => setEditMode(true)}>
                            <Edit2 size={18}/> Editar Perfil
                        </button>
                    ) : (
                        <div className={styles.peEditGroup}>
                            <button className={styles.peBtnCancel} onClick={handleCancel}>
                                Cancelar
                            </button>
                            <button 
                                className={styles.peBtnSave} 
                                onClick={handleUpdate}
                                disabled={!hayCambios} 
                            >
                                <Save size={18}/> Guardar Cambios
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* SECCIÓN: DESCRIPCIÓN */}
            <section className={styles.peSectionCard} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 className={styles.peSectionTitle} style={{ margin: 0, borderBottom: 'none', paddingLeft: '12px' }}><Info size={20}/> Sobre Nosotros</h3>
                    <BotonVisibilidad seccion="sobreNosotros" />
                </div>
                <div className={styles.peFieldGroup}>
                    <label>Descripción de la Empresa (Misión, Visión, a qué se dedican)</label>
                    <textarea 
                        name="descripcion" 
                        disabled={!editMode} 
                        value={empresaData?.descripcion || ''} 
                        onChange={handleInputChange}
                        rows="4"
                        placeholder="Cuéntale a los egresados por qué deberían trabajar con ustedes..."
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', opacity: esVisible('sobreNosotros') ? 1 : 0.5 }}
                    />
                </div>
            </section>

            <div className={styles.peGridInfo}>
                {/* SECCIÓN: DETALLES DE EMPRESA */}
                <section className={styles.peSectionCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 className={styles.peSectionTitle} style={{ margin: 0, borderBottom: 'none', paddingLeft: '12px' }}><Building2 size={20}/> Detalles</h3>
                        <BotonVisibilidad seccion="detallesEmpresa" />
                    </div>
                    <div style={{ opacity: esVisible('detallesEmpresa') ? 1 : 0.5 }}>
                        <div className={styles.peFieldRow}>
                            <div className={styles.peFieldGroup}>
                                <label>Tipo</label>
                                <input name="companyType" disabled={!editMode} value={empresaData?.companyType || ''} onChange={handleInputChange}/>
                            </div>
                            <div className={styles.peFieldGroup}>
                                <label>Empleados</label>
                                <input name="employees" disabled={!editMode} value={empresaData?.employees || ''} onChange={handleInputChange}/>
                            </div>
                        </div>
                        <div className={styles.peFieldRow}>
                            <div className={styles.peFieldGroup}>
                                <label>Modalidad de Trabajo</label>
                                <input name="modalidad" disabled={!editMode} value={empresaData?.modalidad || ''} onChange={handleInputChange} placeholder="Ej: Híbrido, 100% Remoto"/>
                            </div>
                            <div className={styles.peFieldGroup}>
                                <label>Año de Fundación</label>
                                <input name="foundationYear" type="number" disabled={!editMode} value={empresaData?.foundationYear || ''} onChange={handleInputChange}/>
                            </div>
                        </div>
                        <div className={styles.peFieldGroup}>
                            <label>Sector Económico</label>
                            <input 
                                name="economicSector" 
                                disabled={!editMode} 
                                value={Array.isArray(empresaData?.economicSector) ? empresaData.economicSector.join(', ') : empresaData?.economicSector || ''} 
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </section>

                {/* SECCIÓN: BENEFICIOS */}
                <section className={styles.peSectionCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 className={styles.peSectionTitle} style={{ margin: 0, borderBottom: 'none', paddingLeft: '12px' }}><HeartHandshake size={20}/> Cultura y Beneficios</h3>
                        <BotonVisibilidad seccion="beneficios" />
                    </div>
                    <div className={styles.peFieldGroup} style={{ opacity: esVisible('beneficios') ? 1 : 0.5 }}>
                        <label>Beneficios para empleados (Separados por coma)</label>
                        <textarea 
                            name="beneficios" 
                            disabled={!editMode} 
                            value={empresaData?.beneficios || ''} 
                            onChange={handleInputChange}
                            rows="3"
                            placeholder="Ej: Seguro médico, Viernes cortos..."
                        />
                    </div>
                </section>

                {/* SECCIÓN: UBICACIÓN */}
                <section className={styles.peSectionCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 className={styles.peSectionTitle} style={{ margin: 0, borderBottom: 'none', paddingLeft: '12px' }}><MapPin size={20}/> Ubicación</h3>
                        <BotonVisibilidad seccion="ubicacion" />
                    </div>
                    <div style={{ opacity: esVisible('ubicacion') ? 1 : 0.5 }}>
                        <div className={styles.peFieldGroup}>
                            <label>Dirección Principal</label>
                            <input name="address" disabled={!editMode} value={empresaData?.address || ''} onChange={handleInputChange}/>
                        </div>
                        <div className={styles.peFieldRow}>
                            <div className={styles.peFieldGroup}>
                                <label>Ciudad</label>
                                <input name="city" disabled={!editMode} value={empresaData?.city || ''} onChange={handleInputChange}/>
                            </div>
                            <div className={styles.peFieldGroup}>
                                <label>Departamento</label>
                                <input name="department" disabled={!editMode} value={empresaData?.department || ''} onChange={handleInputChange}/>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECCIÓN: PRESENCIA DIGITAL */}
                <section className={styles.peSectionCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 className={styles.peSectionTitle} style={{ margin: 0, borderBottom: 'none', paddingLeft: '12px' }}><Globe size={20}/> Presencia Digital</h3>
                        <BotonVisibilidad seccion="presenciaDigital" />
                    </div>
                    <div style={{ opacity: esVisible('presenciaDigital') ? 1 : 0.5 }}>
                        <div className={styles.peFieldGroup}>
                            <label>Sitio Web Oficial</label>
                            <input 
                                name="sitioWeb" type="url" disabled={!editMode} 
                                value={empresaData?.sitioWeb || ''} onChange={handleInputChange}
                            />
                        </div>
                        <div className={styles.peFieldGroup}>
                            <label>Perfil de LinkedIn</label>
                            <input 
                                name="linkedin" type="url" disabled={!editMode} 
                                value={empresaData?.linkedin || ''} onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </section>

                {/* SECCIÓN: CONTACTO */}
                <section className={styles.peSectionCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 className={styles.peSectionTitle} style={{ margin: 0, borderBottom: 'none', paddingLeft: '12px' }}><User size={20}/> Contacto Principal</h3>
                        <BotonVisibilidad seccion="contacto" />
                    </div>
                    <div style={{ opacity: esVisible('contacto') ? 1 : 0.5 }}>
                        <div className={styles.peFieldGroup}>
                            <label>Nombre de Contacto (RRHH)</label>
                            <input name="contactName" disabled={!editMode} value={empresaData?.contactName || ''} onChange={handleInputChange} />
                        </div>
                        <div className={styles.peFieldGroup}>
                            <label>Teléfonos</label>
                            <input name="phones" disabled={!editMode} value={empresaData?.phones || ''} onChange={handleInputChange} />
                        </div>
                    </div>
                </section>
                
                {/* SECCIÓN: INFORMACIÓN COMERCIAL */}
                <section className={styles.peSectionCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 className={styles.peSectionTitle} style={{ margin: 0, borderBottom: 'none', paddingLeft: '12px' }}><BadgeDollarSign size={20}/> Información Comercial</h3>
                        <BotonVisibilidad seccion="infoComercial" />
                    </div>
                    <div className={styles.peFieldGroup} style={{ opacity: esVisible('infoComercial') ? 1 : 0.5 }}>
                        <label>Principales Clientes o Proyectos</label>
                        <textarea 
                            name="mainClients" disabled={!editMode} 
                            value={empresaData?.mainClients || ''} onChange={handleInputChange} rows="2"
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}