import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import styles from './ModalDetalle.module.css';

const Icon = ({ name }) => <i className={`fa-solid fa-${name}`}></i>;

const ModalDetalleEmpresa = ({ isOpen, onClose, empresa, onUpdate, API_URL }) => {
    const [editando, setEditando] = useState(false);
    const [datosEditados, setDatosEditados] = useState({});

    // Sincronizar datos cuando se abre el modal o cambia la empresa
    useEffect(() => {
        if (empresa) {
            setDatosEditados({ ...empresa });
            setEditando(false); // Resetear a modo vista al abrir uno nuevo
        }
    }, [empresa, isOpen]);

    if (!isOpen || !empresa) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDatosEditados(prev => ({ ...prev, [name]: value }));
    };

    const handleGuardar = async () => {
        try {
            // Ajustamos la ruta según tu estándar de API
            const res = await axios.put(`${API_URL}/empresas/${empresa.id}`, datosEditados);
            if (res.status === 200) {
                toast.success("Expediente corporativo actualizado correctamente");
                if (onUpdate) onUpdate(); 
                setEditando(false);
            }
        } catch (error) {
            console.error("Error al actualizar empresa:", error);
            toast.error("No se pudo actualizar la información");
        }
    };

    const handleCancelar = () => {
        setDatosEditados({ ...empresa }); // Revertir cambios
        setEditando(false);
    };

    return (
        <div className={styles.udec_det_overlay}>
            <div className={styles.udec_det_cardHorizontal}>
                
                {/* Lateral Izquierdo: Identidad Visual */}
                <aside className={styles.udec_det_sidebar}>
                    <div className={styles.udec_det_avatarCircle}>
                        <Icon name={editando ? "building-circle-check" : "building"} />
                    </div>
                    <div className={styles.udec_det_sideText}>
                        <h3>{(datosEditados.nombre || "Empresa").split(' ')[0]}</h3>
                        <span>{datosEditados.companyType?.toUpperCase() || "S.A.S"}</span>
                        <div className={styles.udec_det_badge}>
                            {editando ? "Modo Editor" : "Empresa Aliada"}
                        </div>
                    </div>
                </aside>

                {/* Columna Derecha: Información Detallada */}
                <main className={styles.udec_det_mainContent}>
                    <div className={styles.udec_det_headerActions}>
                        <h3>{editando ? "Editando Expediente" : "Expediente Corporativo"}</h3>
                        <button onClick={onClose} className={styles.udec_det_closeBtn}>&times;</button>
                    </div>

                    <div className={styles.udec_det_scrollArea}>
                        {/* SECCIÓN 1: Identificación */}
                        <div className={styles.udec_det_sectionTitle}>
                            <Icon name="id-card" /> Datos de Identificación
                        </div>
                        <div className={styles.udec_det_dataGrid}>
                            <div className={styles.udec_det_field}>
                                <label>Razón Social</label>
                                {editando ? 
                                    <input name="nombre" value={datosEditados.nombre} onChange={handleChange} className={styles.udec_det_input} /> 
                                    : <p>{empresa.nombre}</p>
                                }
                            </div>
                            <div className={styles.udec_det_field}>
                                <label>NIT</label>
                                {editando ? 
                                    <input name="nit" value={datosEditados.nit} onChange={handleChange} className={styles.udec_det_input} /> 
                                    : <p>{empresa.nit || 'No registrado'}</p>
                                }
                            </div>
                            <div className={styles.udec_det_field}>
                                <label>Correo Electrónico</label>
                                {editando ? 
                                    <input name="email" value={datosEditados.email} onChange={handleChange} className={styles.udec_det_input} /> 
                                    : <p>{empresa.email}</p>
                                }
                            </div>
                            <div className={styles.udec_det_field}>
                                <label>Teléfonos</label>
                                {editando ? 
                                    <input name="phones" value={datosEditados.phones} onChange={handleChange} className={styles.udec_det_input} /> 
                                    : <p>{empresa.phones}</p>
                                }
                            </div>
                        </div>

                        {/* SECCIÓN 2: Ubicación y Contacto */}
                        <div className={styles.udec_det_sectionTitle} style={{marginTop: '20px'}}>
                            <Icon name="location-dot" /> Ubicación y Contacto
                        </div>
                        <div className={styles.udec_det_dataGrid}>
                            <div className={styles.udec_det_field}>
                                <label>Ciudad</label>
                                {editando ? 
                                    <input name="city" value={datosEditados.city} onChange={handleChange} className={styles.udec_det_input} /> 
                                    : <p>{empresa.city}</p>
                                }
                            </div>
                            <div className={styles.udec_det_field}>
                                <label>Persona de Contacto</label>
                                {editando ? 
                                    <input name="contactName" value={datosEditados.contactName} onChange={handleChange} className={styles.udec_det_input} /> 
                                    : <p>{empresa.contactName}</p>
                                }
                            </div>
                            <div className={`${styles.udec_det_field} ${styles.udec_det_full}`}>
                                <label>Dirección Física</label>
                                {editando ? 
                                    <input name="address" value={datosEditados.address} onChange={handleChange} className={styles.udec_det_input} /> 
                                    : <p>{empresa.address}</p>
                                }
                            </div>
                        </div>

                        {/* SECCIÓN 3: Perfil de Negocio */}
                        <div className={styles.udec_det_sectionTitle} style={{marginTop: '20px'}}>
                            <Icon name="chart-simple" /> Perfil de Negocio
                        </div>
                        <div className={styles.udec_det_dataGrid}>
                            <div className={styles.udec_det_field}>
                                <label>Sector Económico</label>
                                {editando ? 
                                    <input name="economicSector" value={datosEditados.economicSector} onChange={handleChange} className={styles.udec_det_input} /> 
                                    : <p>{Array.isArray(empresa.economicSector) ? empresa.economicSector.join(', ') : empresa.economicSector}</p>
                                }
                            </div>
                            <div className={styles.udec_det_field}>
                                <label>Número de Empleados</label>
                                {editando ? 
                                    <input name="employees" value={datosEditados.employees} onChange={handleChange} className={styles.udec_det_input} /> 
                                    : <p>{empresa.employees}</p>
                                }
                            </div>
                        </div>
                    </div>

                    <div className={styles.udec_det_footerActions}>
                        {!editando ? (
                            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                <button onClick={() => setEditando(true)} className={styles.udec_det_btnEdit} style={{ flex: 1 }}>
                                    <Icon name="pen-to-square" /> Editar Expediente
                                </button>
                                <button onClick={onClose} className={styles.udec_det_btnCancel}>
                                    Cerrar
                                </button>
                            </div>
                        ) : (
                            <div className={styles.udec_det_editGroup}>
                                <button onClick={handleCancelar} className={styles.udec_det_btnCancel}>
                                    Cancelar
                                </button>
                                <button onClick={handleGuardar} className={styles.udec_det_btnSave}>
                                    Guardar Cambios
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ModalDetalleEmpresa;