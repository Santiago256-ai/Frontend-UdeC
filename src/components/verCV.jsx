import React from 'react';
import { X, Mail, Phone, MapPin } from 'lucide-react';
import './verCV.css';

const VerCV = ({ perfil, onClose }) => {
    // 1. Extraemos el objeto CV del perfil del usuario
    const cv = perfil?.cv || {};

    // 2. Función de ayuda para extraer texto de los objetos (Aptitudes, Idiomas, etc.)
    const obtenerTexto = (item) => {
        if (!item) return "";
        if (typeof item === 'string') return item;
        // Mapeo según nombres de campos en tu schema.prisma
        return item.idioma || item.aptitud || item.habilidad || item.nombre;
    };

    // 3. Preparación de listas según tu schema.prisma
    // 'habilidades' es un String? en tu PerfilCV
    const habilidades = cv.habilidades ? cv.habilidades.split(',') : [];
    
    // Las siguientes son relaciones (Arrays de objetos)
    const aptitudes = Array.isArray(cv.aptitudes) ? cv.aptitudes : [];
    const idiomas = Array.isArray(cv.idiomas) ? cv.idiomas : [];
    const experiencias = Array.isArray(cv.experiencia) ? cv.experiencia : [];
    const educaciones = Array.isArray(cv.educacion) ? cv.educacion : [];
    const referencias = Array.isArray(cv.referencias) ? cv.referencias : [];

    return (
        <div className="cv-modal-overlay">
            <div className="cv-preview-container fade-in">
                {/* BOTÓN CERRAR */}
                <button className="cv-close-x" onClick={onClose} title="Cerrar">
                    <X size={20} />
                </button>

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
                                    {/* Usamos el campo 'nivel' (0-100) de tu schema */}
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
                            <span><Phone size={12} /> {cv.telefono || 'N/A'}</span>
                            <span><Mail size={12} /> {cv.email || perfil?.correo}</span>
                            <span><MapPin size={12} /> {cv.direccion || 'Cundinamarca, Colombia'}</span>
                        </div>
                    </header>

                    <section className="cv-content-section">
                        <h2 className="cv-section-title">PERFIL PROFESIONAL</h2>
                        <div className="detail-body-text">
                            {/* En tu schema el campo es 'descripcion' */}
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
                                    {/* Cambiado 'anio' por 'periodo' según tu schema */}
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
                                    {/* Cambiado 'telefono' por 'celular' según tu schema */}
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