import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom"; 
import axios from "axios";
// Importa el nuevo CSS (Este archivo debe existir en la misma carpeta)
import "./EmpresaDashboard.css"; 

const API_URL = "http://localhost:4000/api";

export default function EmpresaDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // --- Estados de la Aplicación ---
  const [empresa, setEmpresa] = useState(() => {
      const storedUser = localStorage.getItem('usuario');
      const initialUser = location.state?.usuario || (storedUser ? JSON.parse(storedUser) : null);
      
      // Asume que la empresa tiene un rol 'empresa'
      if (initialUser && initialUser.rol === 'empresa') {
        localStorage.setItem('usuario', JSON.stringify(initialUser));
        return initialUser;
      }
      return null;
  });

  const [activeTab, setActiveTab] = useState("gestion");
  const [vacantes, setVacantes] = useState([]);
  const [postulaciones, setPostulaciones] = useState([]);
  const [vacanteSeleccionadaId, setVacanteSeleccionadaId] = useState(null); 
  const [filtroEstado, setFiltroEstado] = useState("TODOS"); 
  const [loading, setLoading] = useState(true);
  
  const [nuevaVacante, setNuevaVacante] = useState({
    titulo: "",
    descripcion: "",
    ubicacion: "",
    tipo: "",
    modalidad: "",
    salario: "",
  });

  // 🛑 CLAVE 1: Redirección si la sesión no es válida.
  useEffect(() => {
    if (!empresa) {
        // Limpiar y redirigir al login si no hay sesión válida de empresa
        localStorage.removeItem('usuario');
        navigate('/'); 
    } else {
        setLoading(false);
    }
  }, [empresa, navigate]);

  // --- Funciones de Data ---

  // 1. Carga de Vacantes (Centralizada y Memoizada)
  const cargarVacantes = useCallback(() => {
    if (empresa?.id) {
      axios
        .get(`${API_URL}/vacantes/empresa/${empresa.id}`)
        .then((res) => {
          setVacantes(res.data);
        })
        .catch((err) => console.error("Error al cargar vacantes:", err));
    }
  }, [empresa]); 

  // 2. Carga Inicial de Vacantes
  useEffect(() => {
    if (empresa) {
      cargarVacantes();
    }
  }, [empresa, cargarVacantes]); 


  // 🌟 FUNCIÓN AGREGADA 1: Manejar el envío del formulario de nueva vacante
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    if (!empresa?.id) {
        alert("Error: ID de empresa no encontrado. Por favor, reinicia la sesión.");
        return;
    }

    try {
        const vacanteData = {
            ...nuevaVacante,
            empresaId: empresa.id, // Asegurar que enviamos el ID de la empresa
        };

        // Endpoint: POST /api/vacantes/
        const res = await axios.post(`${API_URL}/vacantes`, vacanteData);

        alert(`Vacante "${res.data.titulo}" publicada con éxito.`);
        
        // Limpiar el formulario
        setNuevaVacante({
            titulo: "",
            descripcion: "",
            ubicacion: "",
            tipo: "",
            modalidad: "",
            salario: "",
        });
        
        // Volver a la pestaña de gestión y refrescar la lista
        cargarVacantes();
        setActiveTab("gestion");

    } catch (err) {
        console.error("Error al publicar la vacante:", err.response?.data?.error || err);
        alert(`Error al publicar la vacante: ${err.response?.data?.error || "Error de conexión o validación."}`);
    }
  };

  // 🌟 FUNCIÓN AGREGADA 2: Manejar la eliminación de una vacante
  const handleEliminarVacante = async (vacanteId, titulo) => {
    if (!window.confirm(`¿Está seguro de eliminar la vacante: "${titulo}"? Esta acción es irreversible.`)) {
        return;
    }

    try {
        // Endpoint: DELETE /api/vacantes/:id
        await axios.delete(`${API_URL}/vacantes/${vacanteId}`);
        
        alert(`Vacante "${titulo}" eliminada con éxito.`);
        
        // Refrescar la lista y limpiar la vista de postulaciones si era la seleccionada
        cargarVacantes();
        if (vacanteSeleccionadaId === vacanteId) {
            setVacanteSeleccionadaId(null);
            setPostulaciones([]);
        }

    } catch (err) {
        console.error("Error al eliminar la vacante:", err);
        alert(`Fallo al eliminar la vacante: ${err.response?.data?.error || "Error desconocido."}`);
    }
  };
  
  // 3. Cargar Postulaciones de una vacante
  const handleVerPostulaciones = async (vacanteId) => {
    setVacanteSeleccionadaId(vacanteId);
    setFiltroEstado("TODOS");
    try {
      // Endpoint: /api/postulaciones/vacante/:vacanteId
      const res = await axios.get(
        `${API_URL}/postulaciones/vacante/${vacanteId}`
      );
      setPostulaciones(res.data);
    } catch (err) {
      console.error(err);
      setPostulaciones([]); // Limpiar si hay error o no hay data
      alert("Error al cargar postulaciones o no hay ninguna.");
    }
  };

  // 4. 🚀 FUNCIÓN CLAVE: Actualizar el estado de la postulación
  const handleUpdateEstado = async (postulacionId, nuevoEstado) => {
    const tituloVacante = vacantes.find(v => v.id === vacanteSeleccionadaId)?.titulo || 'esta vacante';
    const postulacion = postulaciones.find(p => p.id === postulacionId);
    
    // 🚨 CORREGIDO: Usar nombres y apellidos para la confirmación
    const nombreCandidato = `${postulacion?.usuario?.nombres} ${postulacion?.usuario?.apellidos}`.trim() || 'el candidato';
    
    if (!window.confirm(`¿Confirma cambiar el estado de la postulación de ${nombreCandidato} para la vacante "${tituloVacante}" a: **${nuevoEstado}**?`)) {
        return;
    }
    
    try {
        // Endpoint: PATCH /api/postulaciones/:id/estado
        await axios.patch(`${API_URL}/postulaciones/${postulacionId}/estado`, {
            estado: nuevoEstado.toUpperCase()
        });

        // Actualizar el estado localmente
        setPostulaciones(prevPostulaciones => 
            prevPostulaciones.map(p => 
                p.id === postulacionId ? { ...p, estado: nuevoEstado.toUpperCase() } : p
            )
        );
        alert(`Estado actualizado a: ${nuevoEstado.toUpperCase()}`);

    } catch (err) {
        console.error("Error al actualizar estado:", err);
        alert(`Fallo al actualizar el estado: ${err.response?.data?.error || "Error desconocido."}`);
    }
  };

  // 5. Lógica para filtrar las postulaciones
  const postulacionesFiltradas = postulaciones.filter(p => {
    const estado = p.estado?.toUpperCase() || "PENDIENTE"; 
    return filtroEstado === "TODOS" || estado === filtroEstado;
  });

  // 6. Función de Renderizado de Tags de Estado
  const getStatusTag = (estado) => {
    const status = estado?.toUpperCase() || 'PENDIENTE';
    const baseClass = 'status-tag';
    let specificClass = '';
    
    switch (status) {
        case 'ACEPTADA': specificClass = 'status-aceptada'; break;
        case 'RECHAZADA': specificClass = 'status-rechazada'; break;
        case 'REVISADO': specificClass = 'status-revisado'; break;
        case 'PENDIENTE':
        default: specificClass = 'status-pendiente'; break;
    }

    return (
        <span className={`${baseClass} ${specificClass}`}>
            {status}
        </span>
    );
  };


  // --- Renderizado Condicional de Carga/Error ---

  if (loading) {
      return <div className="dashboard-layout"><h1 className="loading-message">Cargando panel de empresa...</h1></div>;
  }
  
  if (!empresa) {
    return null; // El useEffect manejará la redirección
  }

  // Se extrae la vacante actual para mostrar su título en la sección de postulaciones
  const vacanteActual = vacantes.find(v => v.id === vacanteSeleccionadaId);
  
  // --- Renderizado Principal ---
  return (
    <div className="dashboard-layout">
      {/* Cabecera */}
      <header className="dashboard-header">
        <span className="logo-placeholder">💼</span>
        <div className="welcome-info">
            <h2>Panel de Control Empresarial</h2>
            <h3>Bienvenida, **{empresa?.nombre || empresa?.razonSocial || "Empresa"}**</h3>
            <button className="logout-button" onClick={() => {
                localStorage.removeItem('usuario');
                navigate('/');
            }}>Cerrar Sesión</button>
        </div>
      </header>

      <hr className="divider" />

      {/* Sistema de Pestañas */}
      <nav className="dashboard-tabs">
        <button 
          className={activeTab === "gestion" ? "active" : ""} 
          onClick={() => {
            setActiveTab("gestion"); 
            setVacanteSeleccionadaId(null); 
            setPostulaciones([]); 
            setFiltroEstado("TODOS");
          }}
        >
          📝 Gestión de Vacantes ({vacantes.length})
        </button>
        <button 
          className={activeTab === "creacion" ? "active" : ""} 
          onClick={() => setActiveTab("creacion")}
        >
          ✨ Publicar Nueva Vacante
        </button>
      </nav>

      {/* Contenido de la Pestaña Activa */}
      <main className="dashboard-content">
        
        {/* Pestaña de Creación (Con el handleSubmit ya referenciado) */}
        {activeTab === "creacion" && (
          <section className="dashboard-card form-card">
            <h3>Fomulario de Publicación</h3>
            <form onSubmit={handleSubmit} className="form-grid">
              
              <div className="form-group">
                <label>Título de la Vacante <span className="required-star">*</span></label>
                <input
                  type="text"
                  placeholder="Ej: Desarrollador Full-Stack"
                  value={nuevaVacante.titulo}
                  onChange={(e) => setNuevaVacante({ ...nuevaVacante, titulo: e.target.value })}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Descripción del Puesto <span className="required-star">*</span></label>
                <textarea
                  placeholder="Detalla las responsabilidades, requisitos y beneficios..."
                  value={nuevaVacante.descripcion}
                  onChange={(e) => setNuevaVacante({ ...nuevaVacante, descripcion: e.target.value })}
                  rows="4"
                  required
                />
              </div>

              {/* Controles de Condiciones */}
              <div className="form-group">
                <label>Ubicación <span className="required-star">*</span></label>
                <input
                  type="text"
                  placeholder="Ciudad, País"
                  value={nuevaVacante.ubicacion}
                  onChange={(e) => setNuevaVacante({ ...nuevaVacante, ubicacion: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Tipo de Contrato <span className="required-star">*</span></label>
                <select
                  value={nuevaVacante.tipo}
                  onChange={(e) => setNuevaVacante({ ...nuevaVacante, tipo: e.target.value })}
                  required
                >
                  <option value="">Selecciona el tipo</option>
                  <option value="Tiempo completo">Tiempo completo</option>
                  <option value="Medio tiempo">Medio tiempo</option>
                  <option value="Prácticas">Prácticas</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Modalidad <span className="required-star">*</span></label>
                <select
                  value={nuevaVacante.modalidad}
                  onChange={(e) => setNuevaVacante({ ...nuevaVacante, modalidad: e.target.value })}
                  required
                >
                  <option value="">Selecciona la modalidad</option>
                  <option value="Presencial">Presencial</option>
                  <option value="Remoto">Remoto</option>
                  <option value="Hibrido">Híbrido</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Salario (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: $1200 USD/mes"
                  value={nuevaVacante.salario}
                  onChange={(e) => setNuevaVacante({ ...nuevaVacante, salario: e.target.value })}
                />
              </div>

              <button type="submit" className="primary-button full-width">
                Publicar Vacante Ahora
              </button>
            </form>
          </section>
        )}

        {/* Pestaña de Gestión */}
        {activeTab === "gestion" && (
          <section className="dashboard-card management-view">
            <h3>Listado de Vacantes Activas</h3>
            
            {vacantes.length === 0 ? (
              <p className="empty-state">Aún no has publicado ninguna vacante. ¡Comienza en la pestaña "Publicar Nueva Vacante"!</p>
            ) : (
              <div className="vacantes-list-grid">
                {vacantes.map((v) => (
                  <div key={v.id} className={`vacante-item ${vacanteSeleccionadaId === v.id ? 'selected' : ''}`}>
                    <h4>{v.titulo}</h4>
                    <p className="vacante-meta">
                      📍 {v.ubicacion} | 💻 {v.modalidad} | 💰 {v.salario || 'A Convenir'}
                    </p>
                    <div className="vacante-actions">
                      <button 
                        className="secondary-button"
                        onClick={() => handleVerPostulaciones(v.id)}
                      >
                        Ver Postulaciones
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleEliminarVacante(v.id, v.titulo)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Sección de Postulaciones Detalladas */}
            {vacanteSeleccionadaId && (
              <div className="postulaciones-detail">
                <h4>Candidatos para: **{vacanteActual?.titulo || 'Vacante'}**</h4>
                
                <div className="filter-controls">
                    <label htmlFor="estado-filter">Filtrar por Estado:</label>
                    <select
                        id="estado-filter"
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                        <option value="TODOS">Todos ({postulaciones.length})</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="REVISADO">Revisado</option>
                        <option value="ACEPTADA">Aceptada</option> 
                        <option value="RECHAZADA">Rechazada</option>
                    </select>
                </div>

                {postulaciones.length > 0 ? (
                    postulacionesFiltradas.length > 0 ? (
                      <ul className="postulaciones-list">
                          {postulacionesFiltradas.map((p) => (
                          <li key={p.id} className="postulacion-item">
                            
                            <div className="candidate-info">
                                <span className="candidate-name">
                                    🧑‍💼 **{`${p.usuario?.nombres} ${p.usuario?.apellidos}`.trim() || 'Estudiante Sin Nombre'}**
                                </span>
                                {getStatusTag(p.estado)}
                                <span className="candidate-contact">📧 {p.usuario?.correo || 'Sin correo'}</span>
                                <span className="candidate-contact">📞 {p.telefono || 'Sin teléfono'}</span>
                            </div>

                            <div className="action-links">
                                <a 
                                    href={p.cv_url || '#'} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="cv-link"
                                >
                                    📥 Ver CV
                                </a>
                                
                                {/* 🎯 BOTONES DE ACCIÓN PARA ACTUALIZAR ESTADO */}
                                <button 
                                    className="action-button accept-button"
                                    onClick={() => handleUpdateEstado(p.id, 'ACEPTADA')}
                                    disabled={p.estado?.toUpperCase() === 'ACEPTADA'}
                                >
                                    ✅ Aceptar
                                </button>
                                <button
                                    className="action-button reject-button"
                                    onClick={() => handleUpdateEstado(p.id, 'RECHAZADA')}
                                    disabled={p.estado?.toUpperCase() === 'RECHAZADA'}
                                >
                                    ❌ Rechazar
                                </button>
                            </div>
                          </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="empty-state">No hay postulaciones con el estado "{filtroEstado}".</p>
                    )
                ) : (
                    <p className="empty-state">Aún no hay postulaciones para esta vacante.</p>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}