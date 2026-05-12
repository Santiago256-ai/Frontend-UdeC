import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Phone, MapPin } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import './verCV.css';

const VerCV = ({ perfil, onClose, isAutoDownloading = false }) => {
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

    const descargarPDF = () => {
        const elemento = cvRef.current;
        if (!elemento) return;

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
                scrollY: 0,
                height: elemento.offsetHeight
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
            },
            pagebreak: { mode: 'avoid-all' }
        };

        html2pdf().set(opciones).from(elemento).save().then(() => {
            elemento.style.transform = "none";
        });
    };

    useEffect(() => {
        if (isAutoDownloading) {
            const timer = setTimeout(() => {
                descargarPDF();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isAutoDownloading]);

    const habilidades = Array.isArray(cv.habilidades) ? cv.habilidades : [];
    const aptitudes = Array.isArray(cv.aptitudes) ? cv.aptitudes : [];
    const idiomas = Array.isArray(cv.idiomas) ? cv.idiomas : [];
    const experiencias = Array.isArray(cv.experiencia) ? cv.experiencia : [];
    const educaciones = Array.isArray(cv.educacion) ? cv.educacion : [];
    const referencias = Array.isArray(cv.referencias) ? cv.referencias : [];

    // Función de formateo de fechas
    // Función de formateo de fechas
    const formatearMesAno = (fechaISO, actualmente) => {
        if (actualmente) return "Actual";
        if (!fechaISO || typeof fechaISO !== 'string') return "";
        const partes = fechaISO.split('-'); 
        if (partes.length < 2) return fechaISO; 
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const mes = meses[parseInt(partes[1], 10) - 1];
        return `${mes} ${partes[0]}`; 
    };

    // 👈 NUEVO: Función para calcular el tiempo en la vista de empresas
    const calcularTiempo = (inicio, fin, actualmente = false) => {
        if (!inicio) return "00a 00m 00d";
        if (!actualmente && !fin) return "00a 00m 00d";
        
        const dateInicio = new Date(`${inicio}T00:00:00`);
        const dateFin = actualmente ? new Date() : new Date(`${fin}T00:00:00`);
        
        if (dateFin < dateInicio) return "Invalido";

        let anios = dateFin.getFullYear() - dateInicio.getFullYear();
        let meses = dateFin.getMonth() - dateInicio.getMonth();
        let dias = dateFin.getDate() - dateInicio.getDate();

        if (dias < 0) {
            meses--;
            const diasMesAnterior = new Date(dateFin.getFullYear(), dateFin.getMonth(), 0).getDate();
            dias += diasMesAnterior;
        }
        if (meses < 0) {
            anios--;
            meses += 12;
        }

        const pad = (num) => num.toString().padStart(2, '0');
        return `${pad(anios)}a ${pad(meses)}m ${pad(dias)}d`;
    };

    return createPortal(
        <div 
            className={isAutoDownloading ? "cv-modal-hidden" : "cv-modal-overlay"} 
            onClick={isAutoDownloading ? null : manejarClicFondo}
            style={{ zIndex: 9999 }}
        >
            {isAutoDownloading && (
                <button id="btn-trigger-pdf-hidden" onClick={descargarPDF} style={{ display: 'none' }} />
            )}

            <div className="cv-preview-container fade-in" ref={cvRef}>
                
                {!isAutoDownloading && (
                    <button className="cv-close-x" onClick={onClose} title="Cerrar">
                        <X size={20} />
                    </button>
                )}

                {/* COLUMNA IZQUIERDA: IDENTIDAD INSTITUCIONAL */}
                <aside className="cv-aside-green">
                    <div className="cv-aside-logo">
                        <img src="/escudo_udec.png" alt="Logo UdeC" className="udec-logo-cv" />
                    </div>

                    <div className="cv-aside-section">
                        <h3>HABILIDADES TÉCNICAS</h3>
                        <div className="cv-skills-list">
                            {habilidades.length > 0 ? habilidades.map((item, i) => (
                                <div className="cv-skill-item" key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                                        <span>{item.nombre || 'Habilidad'}</span>
                                        <span style={{ fontWeight: 'bold' }}>{item.nivel || 0}%</span>
                                    </div>
                                    <div className="skill-bar">
                                        <div 
                                            className="progress" 
                                            style={{ width: `${item.nivel || 0}%`, backgroundColor: '#DAAA00' }}
                                        ></div>
                                    </div>
                                </div>
                            )) : <p className="no-data">No registradas</p>}
                        </div>
                    </div>

                    <div className="cv-aside-section">
                        <h3>HABILIDADES BLANDAS</h3>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                                    <span>{item.idioma || 'Idioma'}</span>
                                    <span style={{ fontWeight: 'bold' }}>{item.nivel || 0}%</span>
                                </div>
                                <div className="skill-bar">
                                    <div 
                                        className="progress" 
                                        style={{ width: `${item.nivel || 0}%`, backgroundColor: '#DAAA00' }}
                                    ></div>
                                </div>
                            </div>
                        )) : <p className="no-data">No registrados</p>}
                    </div>
                </aside>

                {/* COLUMNA DERECHA: INFORMACIÓN DEL CANDIDATO */}
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
    <h2 className="cv-section-title">FORMACIÓN</h2>
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
        {educaciones.length > 0 ? educaciones.map((edu, i) => (
            <div key={i} style={{ display: 'flex', position: 'relative', marginBottom: i === educaciones.length - 1 ? '0' : '5px' }}>
                
                {/* 1. FECHAS (Actualizado) */}
                <div style={{ 
                    display: 'flex', flexDirection: 'column', textAlign: 'right', 
                    paddingRight: '20px', 
                    lineHeight: '1.4', textTransform: 'capitalize',
                    minWidth: '140px', // 👈 Ajustado para evitar amontonamiento
                    gap: '2px',
                    flexShrink: 0
                }}>
                    {edu.fechaInicio ? (
                        <>
                            <span style={{ fontWeight: '600', fontSize: '12px', color: '#00482b' }}>
                                {formatearMesAno(edu.fechaInicio, false)} a
                            </span>
                            <span style={{ fontWeight: '600', fontSize: '12px', opacity: 0.7, color: '#718096' }}>
                                {formatearMesAno(edu.fechaFin, edu.actualmente)}
                            </span>
                        </>
                    ) : (
                        <>{(() => {
                            if (!edu.periodo) return null;
                            const textoLimpio = edu.periodo.replace(/\s*\([^)]*\)/g, '').trim();
                            const partes = textoLimpio.split(/\s+[aA]\s+/);
                            
                            if (partes.length === 2) {
                                return (
                                    <>
                                        <span style={{ fontWeight: '600', fontSize: '12px', color: '#00482b' }}>{partes[0]} a</span>
                                        <span style={{ fontWeight: '600', fontSize: '12px', opacity: 0.7, color: '#718096' }}>{partes[1]}</span>
                                    </>
                                );
                            }
                            return <span style={{ fontWeight: '600', fontSize: '12px', color: '#00482b' }}>{textoLimpio}</span>;
                        })()}</>
                    )}
                </div>

                {/* 2. EJE CENTRAL (Bolita y Línea) */}
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12px' }}>
                    <div style={{ width: '10px', height: '10px', backgroundColor: '#00482b', borderRadius: '50%', zIndex: 2, marginTop: '3px' }}></div>
                    {i !== educaciones.length - 1 && (
                        <div style={{ 
                            position: 'absolute', top: '13px', bottom: '-15px', 
                            left: '50%', transform: 'translateX(-50%)', 
                            width: '2px', backgroundColor: '#00482b', zIndex: 1 
                        }}></div>
                    )}
                </div>

                {/* 3. INFORMACIÓN */}
                <div style={{ paddingLeft: '20px', flex: 1, paddingBottom: '15px' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#1a202c', fontWeight: 'bold' }}>{edu.institucion}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#718096' }}>{edu.titulo}</p>
                </div>
            </div>
        )) : <p className="no-data">Sin formación registrada.</p>}
    </div>
</section>

<section className="cv-content-section">
    <h2 className="cv-section-title">EXPERIENCIA</h2>
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
        {experiencias.length > 0 ? experiencias.map((exp, i) => (
            <div key={i} style={{ display: 'flex', position: 'relative', marginBottom: i === experiencias.length - 1 ? '0' : '5px' }}>
                
                {/* 1. FECHAS (Actualizado) */}
                <div style={{ 
                    display: 'flex', flexDirection: 'column', textAlign: 'right', 
                    paddingRight: '20px', 
                    lineHeight: '1.4', textTransform: 'capitalize',
                    minWidth: '140px', // 👈 Ajustado para evitar amontonamiento
                    gap: '2px',
                    flexShrink: 0
                }}>
                    {exp.fechaInicio ? (
                        <>
                            <span style={{ fontWeight: '600', fontSize: '12px', color: '#00482b' }}>
                                {formatearMesAno(exp.fechaInicio, false)} a
                            </span>
                            <span style={{ fontWeight: '600', fontSize: '12px', opacity: 0.7, color: '#718096' }}>
                                {formatearMesAno(exp.fechaFin, exp.actualmente)}
                            </span>
                            <span style={{ 
                                fontSize: '10.5px', color: '#00482b', backgroundColor: 'rgba(0, 72, 43, 0.08)', 
                                padding: '3px 6px', borderRadius: '4px', alignSelf: 'flex-end', marginTop: '4px', fontWeight: '600'
                            }}>
                                {calcularTiempo(exp.fechaInicio, exp.fechaFin, exp.actualmente)}
                            </span>
                        </>
                    ) : (
                        <>{(() => {
                            if (!exp.periodo) return null;
                            const partesTexto = exp.periodo.split(' (');
                            const fechas = partesTexto[0].trim();
                            const partesFechas = fechas.split(/\s+[aA]\s+/);
                            
                            return (
                                <>
                                    {partesFechas.length === 2 ? (
                                        <>
                                            <span style={{ fontWeight: '600', fontSize: '12px', color: '#00482b' }}>{partesFechas[0]} a</span>
                                            <span style={{ fontWeight: '600', fontSize: '12px', opacity: 0.7, color: '#718096' }}>{partesFechas[1]}</span>
                                        </>
                                    ) : (
                                        <span style={{ fontWeight: '600', fontSize: '12px', color: '#00482b' }}>{fechas}</span>
                                    )}
                                    
                                    {partesTexto.length > 1 && (
                                        <span style={{ 
                                            fontSize: '10.5px', color: '#00482b', backgroundColor: 'rgba(0, 72, 43, 0.08)', 
                                            padding: '3px 6px', borderRadius: '4px', alignSelf: 'flex-end', marginTop: '4px', fontWeight: '600'
                                        }}>
                                            ({partesTexto[1]}
                                        </span>
                                    )}
                                </>
                            );
                        })()}</>
                    )}
                </div>

                {/* 2. EJE CENTRAL (Bolita y Línea) */}
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12px' }}>
                    <div style={{ width: '10px', height: '10px', backgroundColor: '#00482b', borderRadius: '50%', zIndex: 2, marginTop: '3px' }}></div>
                    {i !== experiencias.length - 1 && (
                        <div style={{ 
                            position: 'absolute', top: '13px', bottom: '-15px', 
                            left: '50%', transform: 'translateX(-50%)', 
                            width: '2px', backgroundColor: '#00482b', zIndex: 1 
                        }}></div>
                    )}
                </div>

                {/* 3. INFORMACIÓN */}
                <div style={{ paddingLeft: '20px', flex: 1, paddingBottom: '15px' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#1a202c', fontWeight: 'bold' }}>{exp.cargo}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#718096' }}>{exp.empresa}</p>
                </div>
            </div>
        )) : <p className="no-data">Sin experiencia registrada.</p>}
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
        </div>,
        document.body
    );
};

export default VerCV;