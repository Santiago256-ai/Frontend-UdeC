import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from "../services/api";
import { 
    Building2, 
    MapPin, 
    BadgeDollarSign, 
    User, 
    Save, 
    Edit2 
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
                
                setEmpresaData(response.data);
                setDatosOriginales(response.data); 
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

    const handleUpdate = async () => {
        try {
            const token = localStorage.getItem('token');
            await API.put(`/empresas/${empresaData.id}`, empresaData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setDatosOriginales(empresaData); 
            setEditMode(false);
            
            toast.success("¡Datos actualizados correctamente!", {
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

    if (loading) return <div className={styles.peLoader}>Cargando Perfil...</div>;

    const hayCambios = JSON.stringify(empresaData) !== JSON.stringify(datosOriginales);

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

            <div className={styles.peGridInfo}>
                <section className={styles.peSectionCard}>
                    <h3 className={styles.peSectionTitle}><User size={20}/> Contacto Principal</h3>
                    <div className={styles.peFieldGroup}>
                        <label>Nombre de Contacto</label>
                        <input name="contactName" disabled={!editMode} value={empresaData?.contactName || ''} onChange={handleInputChange} />
                    </div>
                    <div className={styles.peFieldGroup}>
                        <label>Teléfonos</label>
                        <input name="phones" disabled={!editMode} value={empresaData?.phones || ''} onChange={handleInputChange} />
                    </div>
                </section>

                <section className={styles.peSectionCard}>
                    <h3 className={styles.peSectionTitle}><MapPin size={20}/> Ubicación</h3>
                    <div className={styles.peFieldGroup}>
                        <label>Dirección</label>
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
                </section>

                <section className={styles.peSectionCard}>
                    <h3 className={styles.peSectionTitle}><Building2 size={20}/> Detalles de Empresa</h3>
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
                            <label>Modalidad</label>
                            <input name="modalidad" disabled={!editMode} value={empresaData?.modalidad || ''} onChange={handleInputChange}/>
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
                </section>

                <section className={styles.peSectionCard}>
                    <h3 className={styles.peSectionTitle}><BadgeDollarSign size={20}/> Información Financiera</h3>
                    <div className={styles.peFieldGroup}>
                        <label>Ingresos Anuales</label>
                        <input name="annualRevenue" disabled={!editMode} value={empresaData?.annualRevenue || ''} onChange={handleInputChange}/>
                    </div>
                    <div className={styles.peFieldGroup}>
                        <label>Canales de Distribución</label>
                        <input 
                            name="distributionChannels" 
                            disabled={!editMode} 
                            value={Array.isArray(empresaData?.distributionChannels) ? empresaData.distributionChannels.join(', ') : empresaData?.distributionChannels || ''} 
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className={styles.peFieldGroup}>
                        <label>Principales Clientes</label>
                        <textarea 
                            name="mainClients" 
                            disabled={!editMode} 
                            value={empresaData?.mainClients || ''} 
                            onChange={handleInputChange}
                            rows="2"
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}