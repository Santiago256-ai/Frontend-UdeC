import React, { useState, useEffect } from 'react';
import { 
    Save, Eye, ArrowLeft, Phone, Mail, MapPin, Plus, Trash2, 
    Users, Briefcase, GraduationCap, User, BrainCircuit, Globe 
} from 'lucide-react';
import API from "../services/api";
import './CrearCV.css';

export default function CrearCV({ isInline, setVistaActiva }) {
    const [isPreview, setIsPreview] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Obtener el usuario logueado del localStorage
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));
    
    // Estado inicial unificado con Prisma
    const [cvData, setCvData] = useState({
        celular: "",
        email: usuarioLogueado?.correo || "",
        direccion: "",
        descripcion: "",
        habilidades: "", // Se guarda como String separado por comas
        educacion: [{ titulo: "", institucion: "", periodo: "" }],
        experiencia: [{ cargo: "", empresa: "", periodo: "" }],
        referencias: [{ nombre: "", cargo: "", celular: "" }],
        aptitudes: [{ aptitud: "" }],
        idiomas: [{ idioma: "", nivel: "0" }]
    });

    // Cargar los datos del CV si ya existen al montar el componente
    useEffect(() => {
        const cargarDatos = async () => {
            if (!usuarioLogueado?.id) return;
            try {
                const res = await API.get(`/cvs/${usuarioLogueado.id}`);
                if (res.data) {
                    setCvData(res.data);
                }
            } catch (error) {
                console.log("No se encontró CV previo o hubo un error al cargar");
            }
        };
        cargarDatos();
    }, [usuarioLogueado?.id]);

    // --- MANEJADORES DE ESTADO ---
    const handleChangeBasico = (e) => {
        const { name, value } = e.target;
        setCvData(prev => ({ ...prev, [name]: value }));
    };

    const handleArrayChange = (index, arrayName, field, value) => {
        const newArray = [...cvData[arrayName]];
        newArray[index] = { ...newArray[index], [field]: value };
        setCvData(prev => ({ ...prev, [arrayName]: newArray }));
    };

    const addArrayItem = (arrayName, emptyItem) => {
        setCvData(prev => ({ ...prev, [arrayName]: [...prev[arrayName], emptyItem] }));
    };

    const removeArrayItem = (index, arrayName) => {
        const newArray = cvData[arrayName].filter((_, i) => i !== index);
        setCvData(prev => ({ ...prev, [arrayName]: newArray }));
    };

    // --- LOGICA DE GUARDADO ---
    const handleGuardar = async () => {
    if (!usuarioLogueado?.id) {
        alert("Error: Usuario no identificado.");
        return;
    }

    setIsLoading(true);
    try {
        // --- AGREGA ESTA LÓGICA DE LIMPIEZA ---
        const limpiar = (arr) => arr.map(({ id, perfilId, perfilCVId, ...resto }) => resto);

        const dataLimpia = {
            ...cvData,
            experiencia: limpiar(cvData.experiencia),
            educacion: limpiar(cvData.educacion),
            referencias: limpiar(cvData.referencias),
            aptitudes: limpiar(cvData.aptitudes),
            idiomas: limpiar(cvData.idiomas),
        };

        // Enviamos dataLimpia en lugar de cvData
        await API.post(`/cvs/${usuarioLogueado.id}`, dataLimpia);
        alert("¡Hoja de vida guardada exitosamente!");
    } catch (error) {
        console.error("Error al guardar CV:", error);
        alert("Hubo un error al guardar la hoja de vida.");
    } finally {
        setIsLoading(false);
    }
};

    // --- VISTA DE PREVISUALIZACIÓN ---
    if (isPreview) {
        return (
            <div className="crear-cv-container">
                <div className="cv-actions-header">
                    <button className="btn-secondary" onClick={() => setIsPreview(false)}>
                        <ArrowLeft size={18} /> Volver a Editar
                    </button>
                    <button className="btn-primary" onClick={handleGuardar} disabled={isLoading}>
                        <Save size={18} /> {isLoading ? 'Guardando...' : 'Guardar CV'}
                    </button>
                </div>

                <div className="cv-document-wrapper">
                    <div className="cv-document">
                        {/* BARRA LATERAL IZQUIERDA (VERDE) */}
                        <aside className="cv-sidebar-green">
                            <div className="cv-logo-container">
                                <img src="/escudo_udec.png" alt="Logo UdeC" className="udec-logo-cv" />
                            </div>
                            
                            

                            {/* Habilidades */}
                            <div className="cv-sidebar-section">
                                <h3 className="cv-sidebar-title">HABILIDADES</h3>
                                {cvData.habilidades.split(',').map((hab, index) => hab.trim() && (
                                    <div className="cv-skill-item" key={index}>
                                        <span>{hab.trim()}</span>
                                        <div className="skill-bar-bg"><div className="skill-bar-fill" style={{width: `80%`}}></div></div>
                                    </div>
                                ))}
                            </div>

                            {/* Aptitudes */}
                            <div className="cv-sidebar-section">
                                <h3 className="cv-sidebar-title">APTITUDES</h3>
                                <ul className="cv-sidebar-list">
                                    {cvData.aptitudes.map((apt, index) => apt.aptitud && (
                                        <li key={index}>{apt.aptitud}</li>
                                    ))}
                                </ul>
                            </div>

                            {/* Idiomas */}
                            <div className="cv-sidebar-section">
                                <h3 className="cv-sidebar-title">IDIOMAS</h3>
                                {cvData.idiomas.map((idioma, index) => idioma.idioma && (
                                    <div className="cv-skill-item" key={index}>
                                        <span>{idioma.idioma}</span>
                                        <div className="skill-bar-bg">
                                            <div className="skill-bar-fill" style={{width: `${idioma.nivel}%`}}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </aside>

                        {/* CONTENIDO PRINCIPAL (Con Datos de Contacto arriba) */}
                    <main className="cv-main-content">
                        <header className="cv-header-modern">
    <h1 className="cv-name-display">
        {usuarioLogueado?.nombres} {usuarioLogueado?.apellidos}
    </h1>
    <div className="cv-contact-row">
        <span><Phone size={14} /> {cvData.celular || 'Sin teléfono'}</span>
        <span><Mail size={14} /> {cvData.email || usuarioLogueado?.correo}</span>
        <span><MapPin size={14} /> {cvData.direccion || 'Cundinamarca, Colombia'}</span>
    </div>
</header>

                            <section className="cv-section">
                                <h3 className="cv-section-title">PERFIL PROFESIONAL</h3>
                                <p className="cv-text-block">{cvData.descripcion}</p>
                            </section>

                            <section className="cv-section">
                                <h3 className="cv-section-title">EXPERIENCIA</h3>
                                {cvData.experiencia.map((exp, index) => exp.cargo && (
                                    <div className="cv-timeline-item" key={index}>
                                        <div className="cv-timeline-dates">{exp.periodo}</div>
                                        <div className="cv-timeline-details">
                                            <h4>{exp.cargo}</h4>
                                            <h5>{exp.empresa}</h5>
                                        </div>
                                    </div>
                                ))}
                            </section>

                            <section className="cv-section">
                                <h3 className="cv-section-title">FORMACIÓN</h3>
                                {cvData.educacion.map((edu, index) => edu.titulo && (
                                    <div className="cv-timeline-item" key={index}>
                                        <div className="cv-timeline-dates">{edu.periodo}</div>
                                        <div className="cv-timeline-details">
                                            <h4>{edu.institucion}</h4>
                                            <h5>{edu.titulo}</h5>
                                        </div>
                                    </div>
                                ))}
                            </section>

                            <section className="cv-section">
                                <h3 className="cv-section-title">REFERENCIAS</h3>
                                <div className="cv-references-grid">
                                    {cvData.referencias.map((ref, i) => ref.nombre && (
                                        <div className="cv-reference-item" key={i}>
                                            <strong>{ref.nombre}</strong>
                                            <p>{ref.cargo}</p>
                                            <p>Cel: {ref.celular}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </main>
                    </div>
                </div>
            </div>
        );
    }

    // --- VISTA DE EDICIÓN (FORMULARIO) ---
    return (
        <div className="crear-cv-container edit-mode-container">
            <header className="cv-actions-header">
                <h2>Completar Hoja de Vida</h2>
                <div className="action-buttons">
                    <button className="btn-secondary" onClick={() => setIsPreview(true)}>
                        <Eye size={18} /> Previsualizar
                    </button>
                    <button className="btn-primary" onClick={handleGuardar} disabled={isLoading}>
                        <Save size={18} /> {isLoading ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </header>

            <div className="cv-form-grid">
                {/* Datos Básicos */}
                <div className="form-card">
                    <h3><User size={20} /> Datos Básicos y Perfil</h3>
                    <div className="input-group">
                        <label>Teléfono Celular</label>
                        <input type="text" name="celular" value={cvData.celular} onChange={handleChangeBasico} placeholder="Ej. 300 123 4567"/>
                    </div>
                    <div className="input-group">
                        <label>Dirección de Residencia</label>
                        <input type="text" name="direccion" value={cvData.direccion} onChange={handleChangeBasico} placeholder="Ciudad, Departamento"/>
                    </div>
                    <div className="input-group">
                        <label>Perfil Profesional</label>
                        <textarea name="descripcion" value={cvData.descripcion} onChange={handleChangeBasico} placeholder="Cuéntanos sobre ti..."></textarea>
                    </div>
                    <div className="input-group">
                        <label>Habilidades (Separadas por comas)</label>
                        <input type="text" name="habilidades" value={cvData.habilidades} onChange={handleChangeBasico} placeholder="React, Node.js, SQL..."/>
                    </div>
                </div>

                {/* Experiencia */}
                <div className="form-card">
                    <h3><Briefcase size={20} /> Experiencia Laboral</h3>
                    {cvData.experiencia.map((exp, index) => (
                        <div key={index} className="dynamic-item-form">
                            <div className="input-group"><label>Cargo</label><input type="text" value={exp.cargo} onChange={(e) => handleArrayChange(index, 'experiencia', 'cargo', e.target.value)} /></div>
                            <div className="form-row">
                                <div className="input-group"><label>Empresa</label><input type="text" value={exp.empresa} onChange={(e) => handleArrayChange(index, 'experiencia', 'empresa', e.target.value)} /></div>
                                <div className="input-group"><label>Periodo</label><input type="text" value={exp.periodo} onChange={(e) => handleArrayChange(index, 'experiencia', 'periodo', e.target.value)} /></div>
                            </div>
                            <button className="btn-remove-text" onClick={() => removeArrayItem(index, 'experiencia')}><Trash2 size={14}/> Eliminar</button>
                        </div>
                    ))}
                    <button className="btn-add-more" onClick={() => addArrayItem('experiencia', { cargo: "", empresa: "", periodo: "" })}><Plus size={16} /> Añadir experiencia</button>
                </div>

                {/* Educación */}
                <div className="form-card">
                    <h3><GraduationCap size={20} /> Formación Académica</h3>
                    {cvData.educacion.map((edu, index) => (
                        <div key={index} className="dynamic-item-form">
                            <div className="input-group"><label>Título</label><input type="text" value={edu.titulo} onChange={(e) => handleArrayChange(index, 'educacion', 'titulo', e.target.value)} /></div>
                            <div className="form-row">
                                <div className="input-group"><label>Institución</label><input type="text" value={edu.institucion} onChange={(e) => handleArrayChange(index, 'educacion', 'institucion', e.target.value)} /></div>
                                <div className="input-group"><label>Periodo</label><input type="text" value={edu.periodo} onChange={(e) => handleArrayChange(index, 'educacion', 'periodo', e.target.value)} /></div>
                            </div>
                            <button className="btn-remove-text" onClick={() => removeArrayItem(index, 'educacion')}><Trash2 size={14}/> Eliminar</button>
                        </div>
                    ))}
                    <button className="btn-add-more" onClick={() => addArrayItem('educacion', { titulo: "", institucion: "", periodo: "" })}><Plus size={16} /> Añadir formación</button>
                </div>

                {/* Referencias */}
                <div className="form-card">
                    <h3><Users size={20} /> Referencias</h3>
                    {cvData.referencias.map((ref, index) => (
                        <div key={index} className="dynamic-item-form">
                            <div className="input-group"><label>Nombre</label><input type="text" value={ref.nombre} onChange={(e) => handleArrayChange(index, 'referencias', 'nombre', e.target.value)} /></div>
                            <div className="form-row">
                                <div className="input-group"><label>Cargo</label><input type="text" value={ref.cargo} onChange={(e) => handleArrayChange(index, 'referencias', 'cargo', e.target.value)} /></div>
<div className="input-group">
    <label>Teléfono</label>
    <input 
        type="text" 
        /* Cambia esto para que use el campo 'celular' directamente */
        value={ref.celular || ""} 
        onChange={(e) => handleArrayChange(index, 'referencias', 'celular', e.target.value)} 
    />
</div>
                            </div>
                            <button className="btn-remove-text" onClick={() => removeArrayItem(index, 'referencias')}><Trash2 size={14}/> Eliminar</button>
                        </div>
                    ))}
                    <button className="btn-add-more" onClick={() => addArrayItem('referencias', { nombre: "", cargo: "", celular: "" })}><Plus size={16} /> Añadir referencia</button>
                </div>

                {/* Aptitudes */}
                <div className="form-card">
                    <h3><BrainCircuit size={20} /> Aptitudes</h3>
                    {cvData.aptitudes.map((apt, index) => (
                        <div key={index} className="dynamic-item-form">
                            <div className="input-group">
                                <label>Aptitud</label>
                                <input type="text" value={apt.aptitud} onChange={(e) => handleArrayChange(index, 'aptitudes', 'aptitud', e.target.value)} placeholder="Ej. Liderazgo" />
                            </div>
                            <button className="btn-remove-text" onClick={() => removeArrayItem(index, 'aptitudes')}><Trash2 size={14}/> Eliminar</button>
                        </div>
                    ))}
                    <button className="btn-add-more" onClick={() => addArrayItem('aptitudes', { aptitud: "" })}><Plus size={16} /> Añadir aptitud</button>
                </div>

                {/* Idiomas */}
                <div className="form-card">
                    <h3><Globe size={20} /> Idiomas</h3>
                    {cvData.idiomas.map((idioma, index) => (
                        <div key={index} className="dynamic-item-form">
                            <div className="form-row">
                                <div className="input-group">
                                    <label>Idioma</label>
                                    <input type="text" value={idioma.idioma} onChange={(e) => handleArrayChange(index, 'idiomas', 'idioma', e.target.value)} placeholder="Ej. Inglés" />
                                </div>
                                <div className="input-group">
                                    <label>Nivel (%)</label>
                                    <input type="number" min="0" max="100" value={idioma.nivel} onChange={(e) => handleArrayChange(index, 'idiomas', 'nivel', e.target.value)} />
                                </div>
                            </div>
                            <button className="btn-remove-text" onClick={() => removeArrayItem(index, 'idiomas')}><Trash2 size={14}/> Eliminar</button>
                        </div>
                    ))}
                    <button className="btn-add-more" onClick={() => addArrayItem('idiomas', { idioma: "", nivel: "0" })}><Plus size={16} /> Añadir idioma</button>
                </div>
            </div>
        </div>
    );
}