import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Usamos los iconos de FontAwesome que ya tienes en el proyecto para ser consistentes
import styles from './ModalConfirmacion.module.css';

const ModalConfirmacion = ({ isOpen, onClose, onConfirm, nombreEmpresa }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className={styles.overlay}>
                    {/* Fondo oscuro con desenfoque (Glassmorphism) */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className={styles.backdrop}
                    />

                    {/* Contenedor del Modal */}
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className={styles.modal}
                        onClick={(e) => e.stopPropagation()} // Evita cerrar al hacer clic dentro
                    >
                        {/* Cabecera decorativa */}
                        <div className={styles.header}>
                            <div className={styles.iconWrapper}>
                                <i className="fa-solid fa-triangle-exclamation"></i>
                            </div>
                        </div>

                        {/* Contenido */}
                        <div className={styles.content}>
                            <h3>¿Confirmar eliminación?</h3>
                            <p>
                                Estás a punto de eliminar a:
                                <span className={styles.empresaNombre}>"{nombreEmpresa}"</span>
                            </p>
                            <p className={styles.warningText}>
                                Esta acción es irreversible y se perderán todas sus vacantes publicadas permanentemente.
                            </p>
                        </div>

                        {/* Botones de acción */}
                        <div className={styles.footer}>
                            <button
                                onClick={onClose}
                                className={styles.btnCancelar}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={onConfirm}
                                className={styles.btnEliminar}
                            >
                                Sí, eliminar empresa
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ModalConfirmacion;