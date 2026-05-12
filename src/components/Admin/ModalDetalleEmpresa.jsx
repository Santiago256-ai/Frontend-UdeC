import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import styles from './ModalDetalle.module.css';

const Icon = ({ name }) => <i className={`fa-solid fa-${name}`}></i>;

const ModalDetalleEmpresa = ({ isOpen, onClose, empresa, onUpdate, API_URL }) => {
    const [isEditingCorp, setIsEditingCorp] = useState(false);
    const [corpFormData, setCorpFormData] = useState({});
    
    // Estados para la alerta de seguridad
    const [showExitWarning, setShowExitWarning] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // 'cerrar' o 'cancelar'

    useEffect(() => {
        if (empresa && isOpen) {
            setCorpFormData({ ...empresa });
            setIsEditingCorp(false);
            setShowExitWarning(false);
            setPendingAction(null);
        }
    }, [empresa, isOpen]);

    if (!isOpen || !empresa) return null;

    const handleCorpInputChange = (e) => {
        const { name, value } = e.target;
        setCorpFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveCorpData = async () => {
        try {
            const res = await axios.put(`${API_URL}/empresas/admin/${empresa.id}`, corpFormData);
            if (res.status === 200) {
                toast.success("Expediente corporativo actualizado correctamente");
                if (onUpdate) onUpdate(); 
                onClose(); 
            }
        } catch (error) {
            console.error("Error al actualizar empresa:", error);
            toast.error("No se pudo actualizar la información");
        }
    };

    // 🟢 Lógica: Detectar si hay cambios para habilitar el botón
    const hayCambios = empresa && Object.keys(corpFormData).some(key => corpFormData[key] != empresa[key]);

    // 🟢 Lógica: Validar salida al pulsar la X
    const intentarCerrarModal = () => {
        if (isEditingCorp && hayCambios) {
            setPendingAction('cerrar');
            setShowExitWarning(true);
        } else {
            onClose();
        }
    };

    // 🟢 Lógica: Validar salida al pulsar Cancelar
    const intentarCancelarEdicion = () => {
        if (hayCambios) {
            setPendingAction('cancelar');
            setShowExitWarning(true);
        } else {
            setIsEditingCorp(false);
        }
    };

    // 🟢 Lógica: Confirmación de salida en la alerta
    const handleConfirmWarning = () => {
        if (pendingAction === 'cerrar') {
            onClose(); // Cierra todo el modal corporativo
        } else if (pendingAction === 'cancelar') {
            setCorpFormData({ ...empresa }); // Revierte los inputs al estado original
            setIsEditingCorp(false); // Vuelve al modo vista estática
            setShowExitWarning(false); // Esconde la alerta
        }
    };

    return (
        <>
            <div className={styles.udec_corp_overlay}>
                <div className={styles.udec_corp_card}>
                    
                    {/* Lateral Izquierdo: Identidad Visual */}
                    <aside className={styles.udec_corp_sidebar}>
                        <div className={styles.udec_corp_avatar}>
                            <Icon name={isEditingCorp ? "building-circle-check" : "building"} />
                        </div>
                        <div className={styles.udec_corp_brand}>
                            <h3>{(corpFormData.nombre || "Empresa").split(' ')[0]}</h3>
                            <span>{corpFormData.nit || "NIT pendiente"}</span>
                            <div className={styles.udec_corp_badge}>
                                {isEditingCorp ? "Modo Editor" : "Empresa Aliada"}
                            </div>
                        </div>
                    </aside>

                    {/* Columna Derecha: Información Detallada */}
                    <main className={styles.udec_corp_content}>
                        <header className={styles.udec_corp_header}>
                            <h3>{isEditingCorp ? "Editando Expediente" : "Expediente Corporativo"}</h3>
                            <button onClick={intentarCerrarModal} className={styles.udec_corp_close}>&times;</button>
                        </header>

                        <div className={styles.udec_corp_scroll}>
                            {/* SECCIÓN 1: Identificación */}
                            <div className={styles.udec_corp_secTitle}>
                                <Icon name="id-card" /> Datos de Identificación
                            </div>
                            <div className={styles.udec_corp_grid}>
                                <div className={styles.udec_corp_field}>
                                    <label>Razón Social</label>
                                    {isEditingCorp ? 
                                        <input name="nombre" value={corpFormData.nombre || ''} onChange={handleCorpInputChange} className={styles.udec_corp_input} /> 
                                        : <p>{empresa.nombre}</p>
                                    }
                                </div>
                                <div className={styles.udec_corp_field}>
                                    <label>NIT</label>
                                    {isEditingCorp ? 
                                        <input name="nit" value={corpFormData.nit || ''} onChange={handleCorpInputChange} className={styles.udec_corp_input} /> 
                                        : <p>{empresa.nit || 'No registrado'}</p>
                                    }
                                </div>
                                <div className={styles.udec_corp_field}>
                                    <label>Correo Electrónico</label>
                                    {isEditingCorp ? 
                                        <input name="email" value={corpFormData.email || ''} onChange={handleCorpInputChange} className={styles.udec_corp_input} /> 
                                        : <p>{empresa.email}</p>
                                    }
                                </div>
                                <div className={styles.udec_corp_field}>
                                    <label>Teléfonos</label>
                                    {isEditingCorp ? 
                                        <input name="phones" value={corpFormData.phones || ''} onChange={handleCorpInputChange} className={styles.udec_corp_input} /> 
                                        : <p>{empresa.phones || 'Sin registrar'}</p>
                                    }
                                </div>
                            </div>

                            {/* SECCIÓN 2: Ubicación y Contacto */}
                            <div className={styles.udec_corp_secTitle}>
                                <Icon name="location-dot" /> Ubicación y Contacto
                            </div>
                            <div className={styles.udec_corp_grid}>
                                <div className={styles.udec_corp_field}>
                                    <label>Ciudad</label>
                                    {isEditingCorp ? 
                                        <input name="city" value={corpFormData.city || ''} onChange={handleCorpInputChange} className={styles.udec_corp_input} /> 
                                        : <p>{empresa.city}</p>
                                    }
                                </div>
                                <div className={styles.udec_corp_field}>
                                    <label>Persona de Contacto</label>
                                    {isEditingCorp ? 
                                        <input name="contactName" value={corpFormData.contactName || ''} onChange={handleCorpInputChange} className={styles.udec_corp_input} /> 
                                        : <p>{empresa.contactName}</p>
                                    }
                                </div>
                                <div className={`${styles.udec_corp_field} ${styles.udec_corp_full}`}>
                                    <label>Dirección Física</label>
                                    {isEditingCorp ? 
                                        <input name="address" value={corpFormData.address || ''} onChange={handleCorpInputChange} className={styles.udec_corp_input} /> 
                                        : <p>{empresa.address}</p>
                                    }
                                </div>
                            </div>

                            {/* SECCIÓN 3: Perfil de Negocio */}
                            <div className={styles.udec_corp_secTitle}>
                                <Icon name="chart-simple" /> Perfil de Negocio
                            </div>
                            <div className={styles.udec_corp_grid}>
                                <div className={styles.udec_corp_field}>
                                    <label>Sector Económico</label>
                                    {isEditingCorp ? 
                                        <input name="economicSector" value={corpFormData.economicSector || ''} onChange={handleCorpInputChange} className={styles.udec_corp_input} /> 
                                        : <p>{Array.isArray(empresa.economicSector) ? empresa.economicSector.join(', ') : empresa.economicSector}</p>
                                    }
                                </div>
                                <div className={styles.udec_corp_field}>
                                    <label>Número de Empleados</label>
                                    {isEditingCorp ? 
                                        <input name="employees" value={corpFormData.employees || ''} onChange={handleCorpInputChange} className={styles.udec_corp_input} /> 
                                        : <p>{empresa.employees}</p>
                                    }
                                </div>
                            </div>
                        </div>

                        <footer className={styles.udec_corp_footer}>
                            {!isEditingCorp ? (
                                <div className={styles.udec_corp_actions}>
                                    <button onClick={() => setIsEditingCorp(true)} className={styles.udec_corp_btnEdit}>
                                        <Icon name="pen-to-square" /> Editar Expediente
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.udec_corp_actions}>
                                    <button 
                                        onClick={intentarCancelarEdicion} 
                                        className={styles.udec_corp_btnCancel}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={handleSaveCorpData} 
                                        className={styles.udec_corp_btnSave}
                                        disabled={!hayCambios}
                                    >
                                        Guardar Cambios
                                    </button>
                                </div>
                            )}
                        </footer>
                    </main>
                </div>
            </div>

            {/* 🟢 ALERTA DE SEGURIDAD PROFESIONAL (Basada en tu modal de eliminación) */}
            {showExitWarning && (
                <div className={styles.udec_alerta_overlay}>
                    <div className={styles.udec_alerta_card}>
                        <div className={styles.udec_alerta_iconContainer}>
                            {/* Icono de exclamación blanco profesional */}
                            <i className="fa-solid fa-exclamation"></i>
                        </div>
                        <h2>¿Salir sin guardar?</h2>
                        <p>
                            Has realizado modificaciones en el expediente corporativo. 
                            Si sales ahora, perderás todos los cambios no guardados.
                        </p>
                        <div className={styles.udec_alerta_buttons}>
                            <button 
                                onClick={() => setShowExitWarning(false)} 
                                className={styles.udec_alerta_btnSecondary}
                            >
                                No, seguir editando
                            </button>
                            <button 
                                onClick={handleConfirmWarning} 
                                className={styles.udec_alerta_btnConfirm}
                            >
                                Sí, descartar cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ModalDetalleEmpresa;