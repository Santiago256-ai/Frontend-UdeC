import React, { useRef, useEffect } from 'react';
import { X, Mail, Phone, MapPin } from 'lucide-react';
import html2pdf from 'html2pdf.js'; // npm install html2pdf.js
import './verCV.css';

const VerCV = ({ perfil, onClose, isAutoDownloading = false }) => {
    // Referencia al contenedor que queremos convertir en PDF
    const cvRef = useRef();

    const cv = perfil?.cv || {};

    const obtenerTexto = (item) => {
        if (!item) return "";
        if (typeof item === 'string') return item;
        return item.idioma || item.aptitud || item.habilidad || item.nombre;
    };

    const manejarClicFondo = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Función para generar y descargar el PDF
 const descargarPDF = () => {
    const elemento = cvRef.current;
    
    // 1. Aplicamos una micro-escala temporal para asegurar que entre en A4
    elemento.style.transform = "scale(0.98)"; 
    elemento.style.transformOrigin = "top center";

    const opciones = {
        margin: 0,
        filename: `CV_${perfil?.nombres || 'Candidato'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            letterRendering: true,
            scrollY: 0, // Evita el hueco blanco arriba
            height: elemento.offsetHeight // Captura la altura exacta
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
        },
        pagebreak: { mode: 'avoid-all' } // Evita cortes de página automáticos
    };

    html2pdf().set(opciones).from(elemento).save().then(() => {
        // 2. Quitamos la escala después de generar el PDF para que el modal no se vea raro
        elemento.style.transform = "none";
    });
};

    // Efecto para disparo automático desde la tabla en el Dashboard
    useEffect(() => {
        if (isAutoDownloading) {
            // Un pequeño retraso asegura que el logo y estilos estén listos en el DOM invisible
            const timer = setTimeout(() => {
                descargarPDF();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isAutoDownloading]);

    const habilidades = cv.habilidades ? cv.habilidades.split(',') : [];
    const aptitudes = Array.isArray(cv.aptitudes) ? cv.aptitudes : [];
    const idiomas = Array.isArray(cv.idiomas) ? cv.idiomas : [];
    const experiencias = Array.isArray(cv.experiencia) ? cv.experiencia : [];
    const educaciones = Array.isArray(cv.educacion) ? cv.educacion : [];
    const referencias = Array.isArray(cv.referencias) ? cv.referencias : [];

    return (
        /* Si es auto-descarga, quitamos el fondo oscuro y animaciones para evitar parpadeos */
        <div 
            className={isAutoDownloading ? "" : "cv-modal-overlay"} 
            onClick={isAutoDownloading ? null : manejarClicFondo}
        >
            
            {/* BOTÓN OCULTO: Permite que el Dashboard dispare la descarga por ID si es necesario */}
            {isAutoDownloading && (
                <button id="btn-trigger-pdf-hidden" onClick={descargarPDF} style={{ display: 'none' }} />
            )}

            {/* 2. CONTENEDOR DEL CV (Lo que se captura para el PDF) */}
            <div className="cv-preview-container fade-in" ref={cvRef}>
                
                {/* BOTÓN CERRAR: Solo aparece cuando el usuario está viendo el CV, no al descargar */}
                {!isAutoDownloading && (
                    <button className="cv-close-x" onClick={onClose} title="Cerrar">
                        <X size={20} />
                    </button>
                )}

                {/* COLUMNA IZQUIERDA: VERDE UDEC */}
                <aside className="cv-aside-green">
                    <div className="cv-aside-logo">
                        <img src="/escudo_udec.png" alt="Logo UdeC" className="udec-logo-cv" />
                    </div>

                    <div className="cv-aside-section">
                        <h3>HABILIDADES</h3>
                        <div className="cv-skills-list">
                            {habilidades.length > 0 ? habilidades.map((item, i) => (
                                <div className="cv-skill-item" key={i}>
                                    <span>{item.trim()}</span>
                                    <div className="skill-bar">
                                        <div className="progress" style={{width: '85%'}}></div>
                                    </div>
                                </div>
                            )) : <p className="no-data">No registradas</p>}
                        </div>
                    </div>

                    <div className="cv-aside-section">
                        <h3>APTITUDES</h3>
                        <ul className="cv-bullet-list">
                            {aptitudes.length > 0 ? aptitudes.map((item, i) => (
                                <li key={i}>{obtenerTexto(item)}</li>
                            )) : <li className="no-data">No registradas</li>}
                        </ul>
                    </div>

                    <div className="cv-aside-section">
                        <h3>IDIOMAS</h3>
                        {idiomas.length > 0 ? idiomas.map((item, i) => (
                            <div className="cv-skill-item" key={i}>
                                <span>{obtenerTexto(item)}</span>
                                <div className="skill-bar">
                                    <div className="progress" style={{width: `${item.nivel || 70}%`}}></div>
                                </div>
                            </div>
                        )) : <p className="no-data">No registrados</p>}
                    </div>
                </aside>

                {/* COLUMNA DERECHA: INFORMACIÓN BLANCA */}
                <main className="cv-main-white">
                    <header className="cv-main-header">
                        <h1>{perfil?.nombres} <br /> {perfil?.apellidos}</h1>
                        <div className="cv-contact-row">
                            <span><Phone size={12} /> {cv.celular || 'N/A'}</span>
                            <span><Mail size={12} /> {cv.email || perfil?.correo}</span>
                            <span><MapPin size={12} /> {cv.direccion || 'Cundinamarca, Colombia'}</span>
                        </div>
                    </header>

                    <section className="cv-content-section">
                        <h2 className="cv-section-title">PERFIL PROFESIONAL</h2>
                        <div className="detail-body-text">
                            <p>{cv.descripcion || 'Perfil no redactado.'}</p>
                        </div>
                    </section>

                    <section className="cv-content-section">
                        <h2 className="cv-section-title">EXPERIENCIA</h2>
                        <div className="cv-timeline">
                            {experiencias.length > 0 ? experiencias.map((exp, i) => (
                                <div className="timeline-item" key={i}>
                                    <span className="timeline-date">{exp.periodo}</span>
                                    <div className="timeline-marker"></div>
                                    <div className="timeline-info">
                                        <h4>{exp.cargo}</h4>
                                        <p>{exp.empresa}</p>
                                    </div>
                                </div>
                            )) : <p className="no-data">Sin experiencia registrada.</p>}
                        </div>
                    </section>

                    <section className="cv-content-section">
                        <h2 className="cv-section-title">FORMACIÓN</h2>
                        <div className="cv-timeline">
                            {educaciones.length > 0 ? educaciones.map((edu, i) => (
                                <div className="timeline-item" key={i}>
                                    <span className="timeline-date">{edu.periodo}</span>
                                    <div className="timeline-marker"></div>
                                    <div className="timeline-info">
                                        <h4>{edu.institucion}</h4>
                                        <p>{edu.titulo}</p>
                                    </div>
                                </div>
                            )) : <p className="no-data">Sin formación registrada.</p>}
                        </div>
                    </section>

                    <section className="cv-content-section">
                        <h2 className="cv-section-title">REFERENCIAS</h2>
                        <div className="cv-references-grid">
                            {referencias.length > 0 ? referencias.map((ref, i) => (
                                <div className="ref-item" key={i}>
                                    <strong>{ref.nombre}</strong>
                                    <p>{ref.cargo}</p>
                                    <p>Cel: {ref.celular}</p>
                                </div>
                            )) : <p className="no-data">Sin referencias.</p>}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default VerCV;