import React, { useState, useEffect } from 'react';
import { User, BookOpen, Briefcase, Save, Trash2, ArrowLeft, Award, Languages, Phone, Mail, MapPin } from 'lucide-react';
import './CrearCV.css';
import API from '../services/api';

const CrearCV = ({ setVistaActiva }) => {
  // --- ESTADOS ---
  const [educacion, setEducacion] = useState([{ id: Date.now(), titulo: '', institucion: '', periodo: '' }]);
  const [experiencia, setExperiencia] = useState([{ id: Date.now(), cargo: '', empresa: '', periodo: '' }]);
  const [idiomas, setIdiomas] = useState([{ id: Date.now(), idioma: '', nivel: '' }]);
  const [referencias, setReferencias] = useState([{ id: Date.now(), nombre: '', cargo: '', celular: '' }]);
  
  const [personal, setPersonal] = useState({ telefono: '', email: '', direccion: '' });
  const [descripcion, setDescripcion] = useState('');
  const [habilidades, setHabilidades] = useState('');

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const obtenerCVExistente = async () => {
      try {
        const response = await API.get('/estudiantes/mi-cv'); 
        if (response.data) {
          const data = response.data;
          setPersonal({ 
            telefono: data.telefono || '', 
            email: data.email || '', 
            direccion: data.direccion || '' 
          });
          setDescripcion(data.descripcion || '');
          setHabilidades(data.habilidades || '');
          if (data.educacion?.length > 0) setEducacion(data.educacion);
          if (data.experiencia?.length > 0) setExperiencia(data.experiencia);
          if (data.idiomas?.length > 0) setIdiomas(data.idiomas);
          if (data.referencias?.length > 0) setReferencias(data.referencias);
        }
      } catch (error) {
        console.log("Iniciando formulario nuevo.");
      }
    };
    obtenerCVExistente();
  }, []);

  // --- HANDLERS ---
  const handleUpdate = (setFunc, list, id, field, value) => {
    setFunc(list.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handlePersonalChange = (field, value) => {
    const val = field === 'telefono' ? value.replace(/[^0-9]/g, '') : value;
    setPersonal(prev => ({ ...prev, [field]: val }));
  };

  // Validaciones
  const esEduValido = educacion.every(e => e.titulo && e.institucion);
  const esExpValido = experiencia.every(e => e.cargo && e.empresa);
  const esRefValido = referencias.every(r => r.nombre && r.celular);

  // --- GUARDAR ---
  const handleSave = async () => {
    const payload = {
      personal,
      descripcion,
      habilidades,
      educacion: educacion.filter(e => e.titulo || e.institucion),
      experiencia: experiencia.filter(exp => exp.cargo || exp.empresa),
      idiomas: idiomas.filter(i => i.idioma),
      referencias: referencias.filter(r => r.nombre || r.celular)
    };

    try {
      const response = await API.post('/estudiantes/guardar-cv', payload);
      if (response.status === 200 || response.status === 201) {
        alert("¡Hoja de vida guardada con éxito!");
        setVistaActiva('vacantes');
      }
    } catch (error) {
      const mensajeError = error.response?.data?.detalle || "Error en el servidor";
      alert(`Error: ${mensajeError}`);
    }
  };

  return (
    <div className="cv-container">
      <div className="cv-card">
        {/* Header Estilizado */}
        <header className="cv-card-header">
          <div className="header-left-group">
            <button type="button" className="btn-back-header" onClick={() => setVistaActiva('vacantes')}>
              <ArrowLeft size={20} />
            </button>
            <h1>Configuración de Perfil</h1>
          </div>
          <button type="button" className="btn-submit" onClick={handleSave}>
            <Save size={18} /> 
          </button>
        </header>

        <form className="cv-form" onSubmit={(e) => e.preventDefault()}>
          
          {/* 1. Información de Contacto */}
          <section className="form-section">
            <div className="section-title"><User size={20} /> <h3>Información de Contacto</h3></div>
            <div className="grid-row">
              <div className="input-group">
                <input type="tel" value={personal.telefono} onChange={(e) => handlePersonalChange('telefono', e.target.value)} placeholder="Ej: 321 244 5678" />
                <label><Phone size={12} /> Teléfono Móvil</label>
              </div>
              <div className="input-group">
                <input type="email" value={personal.email} onChange={(e) => handlePersonalChange('email', e.target.value)} placeholder="correo@ejemplo.com" />
                <label><Mail size={12} /> Correo Electrónico</label>
              </div>
            </div>
            <div className="input-group" style={{marginTop: '10px'}}>
              <input type="text" value={personal.direccion} onChange={(e) => handlePersonalChange('direccion', e.target.value)} placeholder="Ciudad, Departamento" />
              <label><MapPin size={12} /> Dirección de Residencia</label>
            </div>
          </section>

          {/* 2. Resumen Profesional */}
          <section className="form-section">
            <div className="section-title"><h3>Sobre mí</h3></div>
            <div className="input-group">
              <textarea 
                value={descripcion} 
                onChange={(e) => setDescripcion(e.target.value)} 
                placeholder="Ingeniero de Sistemas con experiencia en..."
                style={{height: '100px'}}
              ></textarea>
              <label>Perfil Profesional</label>
            </div>
          </section>

          {/* 3. Aptitudes */}
          <section className="form-section">
            <div className="section-title"><Award size={20} /> <h3>Habilidades y Aptitudes</h3></div>
            <div className="input-group">
              <input 
                type="text" 
                value={habilidades} 
                placeholder="React, SQL, Gestión de proyectos..." 
                onChange={(e) => setHabilidades(e.target.value)} 
              />
              <label>Tus principales competencias</label>
            </div>
          </section>

          {/* 4. Formación Académica */}
          <section className="form-section">
            <div className="section-title"><BookOpen size={20} /> <h3>Formación Académica</h3></div>
            {educacion.map((edu) => (
              <div key={edu.id} className="dynamic-block">
                <div className="grid-row">
                  <div className="input-group">
                    <input type="text" value={edu.titulo} onChange={(e) => handleUpdate(setEducacion, educacion, edu.id, 'titulo', e.target.value)} />
                    <label>Título Obtenido</label>
                  </div>
                  <div className="input-group">
                    <input type="text" value={edu.institucion} onChange={(e) => handleUpdate(setEducacion, educacion, edu.id, 'institucion', e.target.value)} />
                    <label>Institución</label>
                  </div>
                </div>
                <div className="input-group">
                  <input type="text" value={edu.periodo} placeholder="Ej: 2018 - 2022" onChange={(e) => handleUpdate(setEducacion, educacion, edu.id, 'periodo', e.target.value)} />
                  <label>Periodo / Año de Graduación</label>
                </div>
                {educacion.length > 1 && (
                  <button type="button" onClick={() => setEducacion(educacion.filter(i => i.id !== edu.id))} className="btn-remove">
                    <Trash2 size={12} /> Eliminar formación
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setEducacion([...educacion, { id: Date.now(), titulo: '', institucion: '', periodo: '' }])} className="btn-add">+ Añadir Educación</button>
          </section>

          {/* 5. Experiencia Profesional */}
          <section className="form-section">
            <div className="section-title"><Briefcase size={20} /> <h3>Experiencia Profesional</h3></div>
            {experiencia.map((exp) => (
              <div key={exp.id} className="dynamic-block">
                <div className="grid-row">
                  <div className="input-group">
                    <input type="text" value={exp.cargo} onChange={(e) => handleUpdate(setExperiencia, experiencia, exp.id, 'cargo', e.target.value)} />
                    <label>Cargo / Rol</label>
                  </div>
                  <div className="input-group">
                    <input type="text" value={exp.empresa} onChange={(e) => handleUpdate(setExperiencia, experiencia, exp.id, 'empresa', e.target.value)} />
                    <label>Empresa</label>
                  </div>
                </div>
                <div className="input-group">
                  <input type="text" value={exp.periodo} placeholder="Ej: Enero 2023 - Presente" onChange={(e) => handleUpdate(setExperiencia, experiencia, exp.id, 'periodo', e.target.value)} />
                  <label>Periodo Laborado</label>
                </div>
                {experiencia.length > 1 && (
                  <button type="button" onClick={() => setExperiencia(experiencia.filter(i => i.id !== exp.id))} className="btn-remove">
                    <Trash2 size={12} /> Eliminar experiencia
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setExperiencia([...experiencia, { id: Date.now(), cargo: '', empresa: '', periodo: '' }])} className="btn-add">+ Añadir Experiencia</button>
          </section>

          {/* 6. Idiomas y Referencias */}
          <div className="grid-row">
            <section className="form-section">
              <div className="section-title"><Languages size={20} /> <h3>Idiomas</h3></div>
              {idiomas.map((idi) => (
                <div key={idi.id} className="dynamic-block">
                  <div className="input-group">
                    <input type="text" value={idi.idioma} onChange={(e) => handleUpdate(setIdiomas, idiomas, idi.id, 'idioma', e.target.value)} />
                    <label>Idioma</label>
                  </div>
                  <div className="input-group">
                    <input type="text" value={idi.nivel} placeholder="Ej: B2" onChange={(e) => handleUpdate(setIdiomas, idiomas, idi.id, 'nivel', e.target.value)} />
                    <label>Nivel</label>
                  </div>
                </div>
              ))}
            </section>

            <section className="form-section">
              <div className="section-title"><User size={20} /> <h3>Referencias</h3></div>
              {referencias.map((ref) => (
                <div key={ref.id} className="dynamic-block">
                  <div className="input-group">
                    <input type="text" value={ref.nombre} onChange={(e) => handleUpdate(setReferencias, referencias, ref.id, 'nombre', e.target.value)} />
                    <label>Nombre</label>
                  </div>
                  <div className="input-group">
                    <input type="tel" value={ref.celular} onChange={(e) => handleUpdate(setReferencias, referencias, ref.id, 'celular', e.target.value.replace(/[^0-9]/g, ''))} />
                    <label>Celular</label>
                  </div>
                </div>
              ))}
            </section>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CrearCV;