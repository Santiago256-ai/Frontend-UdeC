import React from 'react';
import './verCV.css';

const VerCV = ({ perfil, onClose }) => {
  if (!perfil) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cv-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        
        {/* Encabezado con Diseño Diagonal */}
        <header className="cv-header">
          <div className="cv-header-text">
            <h2>{perfil.nombres} {perfil.apellidos}</h2>
            <p className="cv-subtitle">{perfil.cv?.titulo_profesional || "Profesional en formación"}</p>
          </div>
          <div className="cv-photo-container">
            <div className="cv-photo-circle">
                {/* Placeholder de avatar si no hay foto */}
                <span>{perfil.nombres[0]}{perfil.apellidos[0]}</span>
            </div>
          </div>
        </header>

        <div className="cv-body-layout">
          {/* Columna Izquierda (Sidebar) */}
          <aside className="cv-sidebar">
            <section className="cv-section">
              <h4>CONTACTO</h4>
              <p>📧 {perfil.correo}</p>
              {perfil.cv?.telefono && <p>📞 {perfil.cv.telefono}</p>}
              <p>📍 Ubicación Registrada</p>
            </section>

            <section className="cv-section">
              <h4>HABILIDADES</h4>
              <div className="cv-tags-container">
                {perfil.cv?.habilidades ? (
                  perfil.cv.habilidades.split(',').map((skill, index) => (
                    <span key={index} className="cv-tag">{skill.trim()}</span>
                  ))
                ) : (
                  <span>No especificadas</span>
                )}
              </div>
            </section>
          </aside>

          {/* Columna Derecha (Contenido) */}
          <main className="cv-main-content">
            <section className="cv-content-section">
              <h4>PERFIL</h4>
              <p>{perfil.cv?.descripcion || "Sin biografía disponible."}</p>
            </section>

            <section className="cv-content-section">
              <h4>EXPERIENCIA PROFESIONAL</h4>
              {perfil.cv?.experiencia?.length > 0 ? (
                perfil.cv.experiencia.map((exp, idx) => (
                  <div key={idx} className="cv-item">
                    <h5>{exp.cargo}</h5>
                    <p className="cv-item-meta">{exp.empresa} | {exp.periodo}</p>
                  </div>
                ))
              ) : (
                <p>Sin registros.</p>
              )}
            </section>

            <section className="cv-content-section">
              <h4>FORMACIÓN</h4>
              {perfil.cv?.educacion?.length > 0 ? (
                perfil.cv.educacion.map((edu, idx) => (
                  <div key={idx} className="cv-item">
                    <h5>{edu.titulo}</h5>
                    <p className="cv-item-meta">{edu.institucion} | {edu.periodo}</p>
                  </div>
                ))
              ) : (
                <p>Sin registros.</p>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default VerCV;