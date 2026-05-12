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
    const [originalData, setOriginalData] = useState(null);

    // Obtener el usuario logueado del localStorage
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));
    
// Localiza el estado inicial y modifícalo así:
const [cvData, setCvData] = useState({
    celular: usuarioLogueado?.celular || "",
    email: usuarioLogueado?.correo || "",
    direccion: "",
    descripcion: "",
    // habilidades: "",  <-- ELIMINA ESTA LÍNEA
    habilidades: [{ nombre: "", nivel: "50" }], // 👈 NUEVO: Ahora es un array con nivel
    educacion: [{ titulo: "", institucion: "", periodo: "", fechaInicio: "", fechaFin: "" }],
experiencia: [{ cargo: "", empresa: "", periodo: "", fechaInicio: "", fechaFin: "" }],
    referencias: [{ nombre: "", cargo: "", celular: "" }],
    aptitudes: [{ aptitud: "" }], // Se queda solo texto como querías
    idiomas: [{ idioma: "", nivel: "0" }]
});

const isSectionComplete = (arrayName) => {
    const section = cvData[arrayName];
    if (!section || section.length === 0) return false;
    const lastItem = section[section.length - 1];
    
    // Regla especial para Educación
    if (arrayName === 'educacion') {
        return lastItem.titulo?.trim() !== "" && 
               lastItem.institucion?.trim() !== "" && 
               lastItem.fechaInicio?.trim() !== "" && 
               (lastItem.actualmente || (lastItem.fechaFin && lastItem.fechaFin.trim() !== ""));
    }
    
    // Regla especial para Experiencia
    if (arrayName === 'experiencia') {
        return lastItem.cargo?.trim() !== "" && 
               lastItem.empresa?.trim() !== "" && 
               lastItem.fechaInicio?.trim() !== "" && 
               (lastItem.actualmente || (lastItem.fechaFin && lastItem.fechaFin.trim() !== ""));
    }

    // Regla normal para Idiomas, Aptitudes, etc.
    return Object.values(lastItem).every(value => 
        value !== null && value !== undefined && value.toString().trim() !== ""
    );
};

    // Cargar los datos del CV si ya existen al montar el componente
useEffect(() => {
    const cargarDatos = async () => {
        if (!usuarioLogueado?.id) return;
        try {
            const res = await API.get(`/cvs/${usuarioLogueado.id}`);
            if (res.data) {
                // 1. Formateamos los datos antes de setearlos
                const dataPreparada = {
                    ...res.data,
                    // Nos aseguramos que habilidades sea un array válido para el .map()
                    habilidades: Array.isArray(res.data.habilidades) && res.data.habilidades.length > 0 
                        ? res.data.habilidades 
                        : [{ nombre: "", nivel: "50" }],
                    // Hacemos lo mismo con los otros arrays por seguridad
                    // ... dentro de dataPreparada en tu useEffect
educacion: res.data.educacion?.length > 0 ? res.data.educacion : [{ titulo: "", institucion: "", periodo: "", fechaInicio: "", fechaFin: "" }],
experiencia: res.data.experiencia?.length > 0 ? res.data.experiencia : [{ cargo: "", empresa: "", periodo: "", fechaInicio: "", fechaFin: "" }],
                    referencias: res.data.referencias?.length > 0 ? res.data.referencias : [{ nombre: "", cargo: "", celular: "" }],
                    aptitudes: res.data.aptitudes?.length > 0 ? res.data.aptitudes : [{ aptitud: "" }],
                    idiomas: res.data.idiomas?.length > 0 ? res.data.idiomas : [{ idioma: "", nivel: "0" }]
                };

                setCvData(dataPreparada);
                setOriginalData(JSON.parse(JSON.stringify(dataPreparada))); // Copia profunda para comparar cambios
            }
        } catch (error) {
            console.log("No se encontró CV previo o hubo un error");
            
            const estadoInicialVacio = {
                celular: usuarioLogueado?.celular || "",
                email: usuarioLogueado?.correo || "",
                direccion: "",
                descripcion: "",
                habilidades: [{ nombre: "", nivel: "50" }],
                educacion: [{ titulo: "", institucion: "", periodo: "" }],
                experiencia: [{ cargo: "", empresa: "", periodo: "" }],
                referencias: [{ nombre: "", cargo: "", celular: "" }],
                aptitudes: [{ aptitud: "" }],
                idiomas: [{ idioma: "", nivel: "0" }]
            };

            setCvData(estadoInicialVacio);
            setOriginalData(estadoInicialVacio);
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
        setCvData(prev => {
            // Clonamos el array directamente desde el estado previo más reciente
            const newArray = [...prev[arrayName]];
            newArray[index] = { ...newArray[index], [field]: value };
            return { ...prev, [arrayName]: newArray };
        });
    };

const calcularTiempo = (inicio, fin, actualmente = false) => {
    if (!inicio) return "00a 00m 00d";
    if (!actualmente && !fin) return "00a 00m 00d";
    
    const dateInicio = new Date(`${inicio}T00:00:00`);
    // Si sigue estudiando/trabajando, tomamos la fecha de HOY
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

const formatearMesAno = (fechaISO, actualmente) => {
    if (actualmente) return "Actual";
    if (!fechaISO) return "Presente";
    const partes = fechaISO.split('-'); // Divide "2026-04-28"
    if (partes.length < 2) return fechaISO; // Por si acaso hay texto viejo
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const mes = meses[parseInt(partes[1], 10) - 1];
    return `${mes} ${partes[0]}`; // Ej: "Abr 2026"
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
        // 🛑 FILTRO DE SEGURIDAD: Solo enviamos lo que tiene contenido real
const dataParaEnviar = {
    ...cvData,
    experiencia: cvData.experiencia.filter(e => e.cargo.trim() !== ""),
    educacion: cvData.educacion.filter(e => e.titulo.trim() !== ""),
    referencias: cvData.referencias.filter(r => r.nombre.trim() !== ""),
    aptitudes: cvData.aptitudes.filter(a => a.aptitud.trim() !== ""),
    idiomas: cvData.idiomas.filter(i => i.idioma.trim() !== ""),
    habilidades: cvData.habilidades.filter(h => h.nombre.trim() !== ""), // 👈 Añade esta línea
};

        // Ahora limpiamos los IDs (como hablamos antes)
        const limpiar = (arr) => arr.map(({ id, perfilId, perfilCVId, ...resto }) => resto);
        
const finalData = {
    ...dataParaEnviar,
    experiencia: limpiar(dataParaEnviar.experiencia),
    educacion: limpiar(dataParaEnviar.educacion),
    referencias: limpiar(dataParaEnviar.referencias),
    aptitudes: limpiar(dataParaEnviar.aptitudes),
    idiomas: limpiar(dataParaEnviar.idiomas),
    habilidades: limpiar(dataParaEnviar.habilidades), // 👈 Añade esta línea
};

        await API.post(`/cvs/${usuarioLogueado.id}`, finalData);
        alert("¡Hoja de vida guardada exitosamente!");
        setOriginalData(cvData);
    } catch (error) {
        console.error("Error al guardar CV:", error);
        alert("Hubo un error al guardar la hoja de vida.");
    } finally {
        setIsLoading(false);
    }
};

const hayCambios = JSON.stringify(cvData) !== JSON.stringify(originalData);
    // --- VISTA DE PREVISUALIZACIÓN ---
    if (isPreview) {
        return (
            <div className="crear-cv-container">
                <div className="cv-actions-header">
                    <button className="btn-secondary" onClick={() => setIsPreview(false)}>
                        <ArrowLeft size={18} /> Volver a Editar
                    </button>
                    <button 
    className="btn-primary" 
    onClick={handleGuardar} 
    // ✅ 3. Aplica la lógica de bloqueo también aquí
    disabled={!hayCambios || isLoading} 
    style={{ 
        opacity: !hayCambios ? 0.5 : 1, 
        cursor: !hayCambios ? 'not-allowed' : 'pointer' 
    }}
>
    <Save size={18} /> {isLoading ? 'Guardando...' : 'Guardar'}
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
{/* Habilidades en la barra lateral verde */}
<div className="cv-sidebar-section">
    <h3 className="cv-sidebar-title">HABILIDADES TÉCNICAS</h3>
    {cvData.habilidades.map((hab, index) => hab.nombre && (
        <div className="cv-skill-item" key={index}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>{hab.nombre}</span>
                <span>{hab.nivel}%</span>
            </div>
            <div className="skill-bar-bg">
                <div 
                    className="skill-bar-fill" 
                    style={{ width: `${hab.nivel}%` }}
                ></div>
            </div>
        </div>
    ))}
</div>

                            {/* Aptitudes */}
                            {/* Aptitudes (Habilidades Blandas) con viñetas */}
<div className="cv-sidebar-section">
    <h3 className="cv-sidebar-title">HABILIDADES BLANDAS</h3>
    <ul className="cv-bullet-list" style={{ 
        padding: 0, 
        margin: 0, 
        listStyle: 'none',
        color: 'white',
        fontSize: '11px'
    }}>
        {cvData.aptitudes.map((apt, index) => apt.aptitud && (
            <li key={index} style={{ 
                marginBottom: '5px', 
                display: 'flex', 
                alignItems: 'flex-start',
                gap: '8px' 
            }}>
                {/* La viñeta (dot) dorada para que combine con el diseño */}
                <span style={{ color: '#a28945', fontSize: '14px', lineHeight: '1' }}></span>
                <span>{apt.aptitud}</span>
            </li>
        ))}
    </ul>
</div>
                            {/* Idiomas en la barra lateral verde (Corregido) */}
<div className="cv-sidebar-section">
    <h3 className="cv-sidebar-title">IDIOMAS</h3>
    {cvData.idiomas.map((idioma, index) => idioma.idioma && (
        <div className="cv-skill-item" key={index}>           
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>{idioma.idioma}</span>
                <span>{idioma.nivel}%</span>
            </div>
            <div className="skill-bar-bg">
                <div 
                    className="skill-bar-fill" 
                    style={{ width: `${idioma.nivel}%` }}
                ></div>
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
        <span>
        <Phone size={14} /> 
        {usuarioLogueado?.celular || cvData.celular || 'Sin teléfono'}
    </span>
        <span><Mail size={14} /> {cvData.email || usuarioLogueado?.correo}</span>
        <span><MapPin size={14} /> {cvData.direccion || 'Cundinamarca, Colombia'}</span>
    </div>
</header>

                            <section className="cv-section">
                                <h3 className="cv-section-title">PERFIL PROFESIONAL</h3>
                                <p className="cv-text-block">{cvData.descripcion}</p>
                            </section>

                            <section className="cv-section">
    <h3 className="cv-section-title">FORMACIÓN</h3>
    {cvData.educacion.map((edu, index) => edu.titulo && (
        <div className="cv-timeline-item" key={index}>
            <div className="cv-timeline-dates" style={{ 
                textTransform: 'capitalize', 
                display: 'flex', 
                flexDirection: 'column', 
                lineHeight: '1.4',
                fontSize: '13px',
                textAlign: 'right',
                paddingRight: '20px', // 👈 Más espacio hacia la línea
                minWidth: '140px',    // 👈 Evita que el texto se apriete
                gap: '2px',           // 👈 Separación sutil entre las fechas
                justifyContent: 'flex-start',
                marginTop: '2px'
            }}>
                {edu.fechaInicio ? (
                    <>
                        <span style={{ fontWeight: '600' }}>{formatearMesAno(edu.fechaInicio, false)} a</span>
                        <span style={{ opacity: 0.8 }}>{formatearMesAno(edu.fechaFin, edu.actualmente)}</span>
                    </>
                ) : (
                    // 👈 LÓGICA NUEVA: Dividimos las fechas viejas y forzamos el salto de línea
                    <>{(() => {
                        if (!edu.periodo) return null;
                        const textoLimpio = edu.periodo.replace(/\s*\([^)]*\)/g, '').trim(); // Quita el contador
                        const partes = textoLimpio.split(/\s+[aA]\s+/); // Divide por " A "
                        
                        if (partes.length === 2) {
                            return (
                                <>
                                    <span style={{ fontWeight: '600' }}>{partes[0]} a</span>
                                    <span style={{ opacity: 0.8 }}>{partes[1]}</span>
                                </>
                            );
                        }
                        return <span style={{ fontWeight: '600' }}>{textoLimpio}</span>;
                    })()}</>
                )}
            </div>
            <div className="cv-timeline-details">
                <h4>{edu.institucion}</h4>
                <h5>{edu.titulo}</h5>
            </div>
        </div>
    ))}
</section>

                           <section className="cv-section">
    <h3 className="cv-section-title">EXPERIENCIA</h3>
    {cvData.experiencia.map((exp, index) => exp.cargo && (
        <div className="cv-timeline-item" key={index}>
            <div className="cv-timeline-dates" style={{ 
                textTransform: 'capitalize', 
                display: 'flex', 
                flexDirection: 'column', 
                lineHeight: '1.4',
                fontSize: '13px',
                textAlign: 'right',
                paddingRight: '20px', 
                minWidth: '140px',
                gap: '2px',
                justifyContent: 'flex-start',
                marginTop: '2px'
            }}>
                {exp.fechaInicio ? (
                    <>
                        <span style={{ fontWeight: '600' }}>{formatearMesAno(exp.fechaInicio, false)} a</span>
                        <span style={{ opacity: 0.8 }}>{formatearMesAno(exp.fechaFin, exp.actualmente)}</span>
                        {/* 👈 Etiqueta moderna para el contador de tiempo */}
                        <span style={{ 
                            fontSize: '10.5px', 
                            color: '#00482b', 
                            backgroundColor: 'rgba(0, 72, 43, 0.08)', 
                            padding: '3px 6px', 
                            borderRadius: '4px', 
                            alignSelf: 'flex-end',
                            marginTop: '4px',
                            fontWeight: '600'
                        }}>
                            {calcularTiempo(exp.fechaInicio, exp.fechaFin, exp.actualmente)}
                        </span>
                    </>
                ) : (
                    // 👈 LÓGICA NUEVA: Dividimos fechas viejas conservando la etiqueta (badge) del tiempo
                    <>{(() => {
                        if (!exp.periodo) return null;
                        const partesTexto = exp.periodo.split(' ('); // Separa la fecha del contador
                        const fechas = partesTexto[0].trim();
                        const partesFechas = fechas.split(/\s+[aA]\s+/); // Divide la fecha por " A "
                        
                        return (
                            <>
                                {partesFechas.length === 2 ? (
                                    <>
                                        <span style={{ fontWeight: '600' }}>{partesFechas[0]} a</span>
                                        <span style={{ opacity: 0.8 }}>{partesFechas[1]}</span>
                                    </>
                                ) : (
                                    <span style={{ fontWeight: '600' }}>{fechas}</span>
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
            <div className="cv-timeline-details">
                <h4>{exp.cargo}</h4>
                <h5>{exp.empresa}</h5>
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
                    {/* Busca el botón de Guardar en la parte inferior de tu archivo */}
<button 
    className="btn-primary" 
    onClick={handleGuardar} 
    // ✅ 1. Añade la lógica de deshabilitado
    disabled={!hayCambios || isLoading} 
    style={{ 
        opacity: !hayCambios ? 0.5 : 1, 
        cursor: !hayCambios ? 'not-allowed' : 'pointer' 
    }}
>
    <Save size={18} /> {isLoading ? 'Guardando...' : 'Guardar'}
</button>
                </div>
            </header>

            <div className="cv-form-grid">
                {/* Datos Básicos */}
                {/* Datos Básicos */}
<div className="form-card">
    <h3><User size={20} /> Datos Básicos y Perfil</h3>
    
    <div className="input-group">
        <label>Dirección de Residencia</label>
        <input 
            type="text" 
            name="direccion" 
            value={cvData.direccion} 
            onChange={handleChangeBasico} 
            placeholder="Ciudad, Departamento"
        />
    </div>

    <div className="input-group">
        {/* Contenedor Flex para la etiqueta y el contador */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ marginBottom: 0 }}>Perfil Profesional</label>
            <span style={{ 
                fontSize: '11px', 
                color: cvData.descripcion.length >= 1000 ? '#e53e3e' : '#718096',
                fontWeight: '600'
            }}>
                {cvData.descripcion.length} / 1000
            </span>
        </div>
        
        <textarea 
            name="descripcion" 
            value={cvData.descripcion} 
            onChange={handleChangeBasico} 
            placeholder="Cuéntanos sobre ti..."
            maxLength="1000"
            style={{ minHeight: '120px', resize: 'vertical' }}
        ></textarea>
    </div>
</div>
{/* Sección de Habilidades Técnicas (Antes era el input de comas) */}
<div className="form-card">
    <h3><BrainCircuit size={20} /> Habilidades Técnicas</h3>
    {cvData.habilidades.map((hab, index) => (
        <div key={index} className="dynamic-item-form">
            <div className="form-row">
                <div className="input-group" style={{ flex: 2 }}>
                    <label>Habilidad</label>
                    <input 
                        type="text" 
                        value={hab.nombre} 
                        onChange={(e) => handleArrayChange(index, 'habilidades', 'nombre', e.target.value)} 
                        placeholder="Ej. React, Node.js, SQL..." 
                    />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                    <label>Nivel: {hab.nivel}%</label>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={hab.nivel} 
                        onChange={(e) => handleArrayChange(index, 'habilidades', 'nivel', e.target.value)} 
                        style={{ accentColor: '#00482b', marginTop: '10px' }}
                    />
                </div>
            </div>
            <button 
    className="btn-remove-text" 
    onClick={() => removeArrayItem(index, 'habilidades')}
    disabled={cvData.habilidades.length <= 1}
>
    <Trash2 size={14}/> Eliminar
</button>
        </div>
    ))}
    <button 
    className="btn-add-more" 
    onClick={() => addArrayItem('habilidades', { nombre: "", nivel: "50" })}
    disabled={!isSectionComplete('habilidades')}
>
    <Plus size={16} /> Añadir Habilidad
</button>
</div>
                
                {/* Aptitudes */}
                <div className="form-card">
                    <h3><BrainCircuit size={20} /> Habilidades Blandas</h3>
                    {cvData.aptitudes.map((apt, index) => (
                        <div key={index} className="dynamic-item-form">
                            <div className="input-group">
                                <label>Habilidad Blanda</label>
                                <input type="text" value={apt.aptitud} onChange={(e) => handleArrayChange(index, 'aptitudes', 'aptitud', e.target.value)} placeholder="Ej. Liderazgo" />
                            </div>
                            <button 
    className="btn-remove-text" 
    onClick={() => removeArrayItem(index, 'aptitudes')}
    disabled={cvData.aptitudes.length <= 1}
>
    <Trash2 size={14}/> Eliminar
</button>
                        </div>
                    ))}
                    <button 
    className="btn-add-more" 
    onClick={() => addArrayItem('aptitudes', { aptitud: "" })}
    disabled={!isSectionComplete('aptitudes')}
>
    <Plus size={16} /> Añadir aptitud
</button>
                </div>

                {/* Educación */}
{/* Educación */}
<div className="form-card">
    <h3><GraduationCap size={20} /> Formación Académica</h3>
    {cvData.educacion.map((edu, index) => (
        <div key={index} className="dynamic-item-form">
            
            {/* TÍTULO */}
            <div className="input-group">
                <label>Título</label>
                <input type="text" value={edu.titulo} onChange={(e) => handleArrayChange(index, 'educacion', 'titulo', e.target.value)} />
            </div>
            
            {/* FILA DIVIDIDA: INSTITUCIÓN Y PERIODO */}
            <div className="form-row" style={{ alignItems: 'flex-start' }}>
                
                {/* COLUMNA 1: INSTITUCIÓN + ELIMINAR */}
                <div style={{ flex: 1.2 }}>
                    <div className="input-group">
                        <label>Institución</label>
                        <input type="text" value={edu.institucion} onChange={(e) => handleArrayChange(index, 'educacion', 'institucion', e.target.value)} />
                    </div>
                    <button 
                        className="btn-remove-text" 
                        onClick={() => removeArrayItem(index, 'educacion')}
                        disabled={cvData.educacion.length <= 1}
                        style={{ marginTop: '4px', border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: '5px', padding: 0 }}
                    >
                        <Trash2 size={14}/> Eliminar
                    </button>
                </div>

                {/* COLUMNA 2: PERIODO */}
                <div style={{ flex: 2 }}>
                    <div className="input-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label style={{ marginBottom: 0 }}>Periodo de Formación</label>
                            <span style={{ fontSize: '11px', color: '#a28945', fontWeight: 'bold', backgroundColor: 'rgba(162, 137, 69, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                {calcularTiempo(edu.fechaInicio, edu.fechaFin, edu.actualmente)}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input 
                                type="date" 
                                value={edu.fechaInicio || ""} 
                                style={{ flex: 1 }} 
                                onChange={(e) => {
                                    const inicio = e.target.value;
                                    handleArrayChange(index, 'educacion', 'fechaInicio', inicio);
                                    const resumen = `${inicio} a ${edu.actualmente ? 'Actual' : (edu.fechaFin || '...')} (${calcularTiempo(inicio, edu.fechaFin, edu.actualmente)})`;
                                    handleArrayChange(index, 'educacion', 'periodo', resumen);
                                }} 
                            />
                            <span style={{ color: '#718096' }}>a</span>
                            <input 
                                type="date" 
                                value={edu.fechaFin || ""} 
                                disabled={edu.actualmente}
                                style={{ flex: 1, opacity: edu.actualmente ? 0.4 : 1, cursor: edu.actualmente ? 'not-allowed' : 'text' }} 
                                onChange={(e) => {
                                    const fin = e.target.value;
                                    handleArrayChange(index, 'educacion', 'fechaFin', fin);
                                    const resumen = `${edu.fechaInicio || '...'} a ${fin} (${calcularTiempo(edu.fechaInicio, fin, false)})`;
                                    handleArrayChange(index, 'educacion', 'periodo', resumen);
                                }} 
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#00482b', fontWeight: '600', cursor: 'pointer', margin: 0 }}>
                                <input 
                                    type="checkbox" 
                                    checked={edu.actualmente || false}
                                    onChange={(e) => {
                                        const isChecked = e.target.checked;
                                        handleArrayChange(index, 'educacion', 'actualmente', isChecked);
                                        if (isChecked) handleArrayChange(index, 'educacion', 'fechaFin', ""); 
                                        const resumen = `${edu.fechaInicio || '...'} a ${isChecked ? 'Actual' : '...'} (${calcularTiempo(edu.fechaInicio, "", isChecked)})`;
                                        handleArrayChange(index, 'educacion', 'periodo', resumen);
                                    }} 
                                    style={{ accentColor: '#00482b', width: '14px', height: '14px', margin: 0 }}
                                />
                                Actualmente estudio aquí
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ))}
    <button 
        className="btn-add-more" 
        onClick={() => addArrayItem('educacion', { titulo: "", institucion: "", periodo: "", fechaInicio: "", fechaFin: "" })}
        disabled={!isSectionComplete('educacion')}
    >
        <Plus size={16} /> Añadir formación
    </button>
</div>

{/* Experiencia Laboral */}
<div className="form-card">
    <h3><Briefcase size={20} /> Experiencia Laboral</h3>
    {cvData.experiencia.map((exp, index) => (
        <div key={index} className="dynamic-item-form">
            
            {/* CARGO */}
            <div className="input-group">
                <label>Cargo</label>
                <input type="text" value={exp.cargo} onChange={(e) => handleArrayChange(index, 'experiencia', 'cargo', e.target.value)} />
            </div>
            
            {/* FILA DIVIDIDA: EMPRESA Y PERIODO */}
            <div className="form-row" style={{ alignItems: 'flex-start' }}>
                
                {/* COLUMNA 1: EMPRESA + ELIMINAR */}
                <div style={{ flex: 1.2 }}>
                    <div className="input-group">
                        <label>Empresa</label>
                        <input type="text" value={exp.empresa} onChange={(e) => handleArrayChange(index, 'experiencia', 'empresa', e.target.value)} />
                    </div>
                    <button 
                        className="btn-remove-text" 
                        onClick={() => removeArrayItem(index, 'experiencia')}
                        disabled={cvData.experiencia.length <= 1}
                        style={{ marginTop: '4px', border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: '5px', padding: 0 }}
                    >
                        <Trash2 size={14}/> Eliminar
                    </button>
                </div>

                {/* COLUMNA 2: PERIODO */}
                <div style={{ flex: 2 }}>
                    <div className="input-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label style={{ marginBottom: 0 }}>Periodo Laboral</label>
                            <span style={{ fontSize: '11px', color: '#a28945', fontWeight: 'bold', backgroundColor: 'rgba(162, 137, 69, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                {calcularTiempo(exp.fechaInicio, exp.fechaFin, exp.actualmente)}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input 
                                type="date" 
                                value={exp.fechaInicio || ""} 
                                style={{ flex: 1 }} 
                                onChange={(e) => {
                                    const inicio = e.target.value;
                                    handleArrayChange(index, 'experiencia', 'fechaInicio', inicio);
                                    const resumen = `${inicio} a ${exp.actualmente ? 'Actual' : (exp.fechaFin || '...')} (${calcularTiempo(inicio, exp.fechaFin, exp.actualmente)})`;
                                    handleArrayChange(index, 'experiencia', 'periodo', resumen);
                                }} 
                            />
                            <span style={{ color: '#718096' }}>a</span>
                            <input 
                                type="date" 
                                value={exp.fechaFin || ""} 
                                disabled={exp.actualmente}
                                style={{ flex: 1, opacity: exp.actualmente ? 0.4 : 1, cursor: exp.actualmente ? 'not-allowed' : 'text' }} 
                                onChange={(e) => {
                                    const fin = e.target.value;
                                    handleArrayChange(index, 'experiencia', 'fechaFin', fin);
                                    const resumen = `${exp.fechaInicio || '...'} a ${fin} (${calcularTiempo(exp.fechaInicio, fin, false)})`;
                                    handleArrayChange(index, 'experiencia', 'periodo', resumen);
                                }} 
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#00482b', fontWeight: '600', cursor: 'pointer', margin: 0 }}>
                                <input 
                                    type="checkbox" 
                                    checked={exp.actualmente || false}
                                    onChange={(e) => {
                                        const isChecked = e.target.checked;
                                        handleArrayChange(index, 'experiencia', 'actualmente', isChecked);
                                        if (isChecked) handleArrayChange(index, 'experiencia', 'fechaFin', ""); 
                                        const resumen = `${exp.fechaInicio || '...'} a ${isChecked ? 'Actual' : '...'} (${calcularTiempo(exp.fechaInicio, "", isChecked)})`;
                                        handleArrayChange(index, 'experiencia', 'periodo', resumen);
                                    }} 
                                    style={{ accentColor: '#00482b', width: '14px', height: '14px', margin: 0 }}
                                />
                                Actualmente trabajo aquí
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ))}
    <button 
        className="btn-add-more" 
        onClick={() => addArrayItem('experiencia', { cargo: "", empresa: "", periodo: "", fechaInicio: "", fechaFin: "" })}
        disabled={!isSectionComplete('experiencia')}
    >
        <Plus size={16} /> Añadir experiencia
    </button>
</div>

                {/* Idiomas */}
                {/* Idiomas con barra de porcentaje */}
<div className="form-card">
    <h3><Globe size={20} /> Idiomas</h3>
    {cvData.idiomas.map((idioma, index) => (
        <div key={index} className="dynamic-item-form">
            <div className="form-row">
                <div className="input-group" style={{ flex: 2 }}>
                    <label>Idioma</label>
                    <input 
                        type="text" 
                        value={idioma.idioma} 
                        onChange={(e) => handleArrayChange(index, 'idiomas', 'idioma', e.target.value)} 
                        placeholder="Ej. Inglés, Francés..." 
                    />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                    <label>Nivel: {idioma.nivel}%</label>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={idioma.nivel} 
                        onChange={(e) => handleArrayChange(index, 'idiomas', 'nivel', e.target.value)} 
                        style={{ accentColor: '#00482b', marginTop: '10px' }}
                    />
                </div>
            </div>
            <button 
                className="btn-remove-text" 
                onClick={() => removeArrayItem(index, 'idiomas')}
                disabled={cvData.idiomas.length <= 1}
            >
                <Trash2 size={14}/> Eliminar
            </button>
        </div>
    ))}
    <button 
        className="btn-add-more" 
        onClick={() => addArrayItem('idiomas', { idioma: "", nivel: "0" })}
        disabled={!isSectionComplete('idiomas')}
    >
        <Plus size={16} /> Añadir idioma
    </button>
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
        placeholder="Ej. 3001234567"
        value={ref.celular || ""} 
        onChange={(e) => {
            // 1. Solo permitimos números usando Regex
            const soloNumeros = e.target.value.replace(/\D/g, "");
            
            // 2. Limitamos a máximo 10 dígitos
            if (soloNumeros.length <= 10) {
                handleArrayChange(index, 'referencias', 'celular', soloNumeros);
            }
        }} 
    />
</div>
                            </div>
                            <button 
    className="btn-remove-text" 
    onClick={() => removeArrayItem(index, 'referencias')}
    disabled={cvData.referencias.length <= 1}
>
    <Trash2 size={14}/> Eliminar
</button>
                        </div>
                    ))}
                    <button 
    className="btn-add-more" 
    onClick={() => addArrayItem('referencias', { nombre: "", cargo: "", celular: "" })}
    disabled={!isSectionComplete('referencias')}
>
    <Plus size={16} /> Añadir referencia
</button>
                </div>
            </div>
        </div>
    );
}