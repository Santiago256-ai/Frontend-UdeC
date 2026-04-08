import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from '../services/api';
import './PerfilEgresado.css';

const PerfilEgresado = () => {
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        correo: '',
        celular: '',
        facultad: '',
        programa: ''
    });
    
    // Estado para guardar la copia de seguridad de los datos
    const [datosOriginales, setDatosOriginales] = useState(null);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await API.get('/estudiantes/perfil'); 
            
            if (response.data) {
                const data = response.data;
                
                // 1. Mapeamos los datos recibidos
                const infoMapeada = {
                    nombres: data.nombres || '',
                    apellidos: data.apellidos || '',
                    correo: data.correo || '',
                    celular: data.celular || data.telefono || '',
                    facultad: data.facultad || '',
                    programa: data.programa || ''
                };
                
                // 2. Actualizamos ambos estados con la información limpia
                setFormData(infoMapeada);
                setDatosOriginales(infoMapeada);
            }
        } catch (error) {
            console.error("Error al cargar:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Función para cancelar cambios
    const handleCancel = () => {
        if (datosOriginales) {
            setFormData(datosOriginales); // Restauramos la copia de seguridad
        }
        setIsEditing(false);
    };

    // Lógica de comparación para habilitar el botón de guardar
    // Solo se habilita si el contenido actual es distinto al original
    const hayCambios = JSON.stringify(formData) !== JSON.stringify(datosOriginales);

    const handleSave = async () => {
    try {
        const res = await API.put('/estudiantes/actualizar', { 
            nombres: formData.nombres,
            apellidos: formData.apellidos,
            celular: formData.celular
        });

        // Actualizar el localStorage
        const currentUser = JSON.parse(localStorage.getItem('usuario'));
        localStorage.setItem('usuario', JSON.stringify({ ...currentUser, ...res.data.egresado }));

        // 🟢 NUEVO: Actualizar estados y mostrar Toast de éxito
        setDatosOriginales(formData); 
        setIsEditing(false);
        
        toast.success("¡Datos actualizados correctamente!", {
            position: "bottom-right",
            theme: "colored",
        });

        // NOTA: Si quitas el reload, la experiencia es más fluida. 
        // Pero si lo necesitas por el menú lateral, déjalo después del toast.
        // window.location.reload(); 

    } catch (error) {
        // 🔴 NUEVO: Toast de error
        toast.error("Error al actualizar los datos.");
    }
};

    if (loading) return <div className="vdp-loading-state">Cargando perfil...</div>;

    return (
        <div className="vdp-main-wrapper">
            <header className="vdp-profile-hero">
                <div className="vdp-user-avatar">
                    {/* Usamos Optional Chaining (?.) por seguridad */}
                    {formData?.nombres?.charAt(0)}{formData?.apellidos?.charAt(0)}
                </div>
                <div className="vdp-hero-text">
                    <h1 className="vdp-user-fullname">{formData?.nombres} {formData?.apellidos}</h1>
                    <span className="vdp-user-tag">{formData?.programa}</span>
                </div>

                <div className="vdp-header-actions-container">
                    {!isEditing ? (
                        <button className="vdp-action-btn-edit" onClick={() => setIsEditing(true)}>
                            Editar Datos
                        </button>
                    ) : (
                        <div className="vdp-edit-group">
                            <button className="vdp-btn-cancel-header" onClick={handleCancel}>
                                Cancelar
                            </button>
                            <button 
                                className="vdp-btn-save-header" 
                                onClick={handleSave}
                                disabled={!hayCambios} // Bloqueado si no hay cambios reales
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="vdp-profile-grid">
                <section className="vdp-info-card">
                    <h3 className="vdp-card-header">Información Personal</h3>
                    <div className="vdp-field-box">
                        <label className="vdp-field-label">Nombres</label>
                        <input type="text" name="nombres" className="vdp-field-input" value={formData.nombres} onChange={handleInputChange} disabled={!isEditing} />
                    </div>
                    <div className="vdp-field-box">
                        <label className="vdp-field-label">Apellidos</label>
                        <input type="text" name="apellidos" className="vdp-field-input" value={formData.apellidos} onChange={handleInputChange} disabled={!isEditing} />
                    </div>
                </section>

                <section className="vdp-info-card">
                    <h3 className="vdp-card-header">Contacto</h3>
                    <div className="vdp-field-box">
                        <label className="vdp-field-label">Número Celular</label>
                        <input type="text" name="celular" className="vdp-field-input" value={formData.celular} onChange={handleInputChange} disabled={!isEditing} />
                    </div>
                    <div className="vdp-field-box">
                        <label className="vdp-field-label">Correo Institucional (No editable)</label>
                        <input type="text" className="vdp-field-input" value={formData.correo} disabled={true} />
                    </div>
                </section>

                <section className="vdp-info-card vdp-col-span-2">
                    <h3 className="vdp-card-header">Información Académica</h3>
                    <div className="vdp-profile-row">
                        <p><strong>Facultad:</strong> {formData.facultad}</p>
                        <p><strong>Programa:</strong> {formData.programa}</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default PerfilEgresado;