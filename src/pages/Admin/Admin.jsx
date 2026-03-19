import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';
import './Admin.css';

import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler);

const Icon = ({ name }) => <i className={`fa-solid fa-${name}`}></i>;

const Admin = () => {
  const [vacantes, setVacantes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [postuladosVacante, setPostuladosVacante] = useState([]);
  const [vacanteSeleccionada, setVacanteSeleccionada] = useState(null);

  // --- ESTADOS DE NAVEGACIÓN Y POSTULACIONES TOTALES ---
  const [vistaActiva, setVistaActiva] = useState('inicio'); 
  const [todasLasPostulaciones, setTodasLasPostulaciones] = useState([]);
  const [loadingPostulaciones, setLoadingPostulaciones] = useState(false);

  const API_URL = "https://backend-ude-c.vercel.app/api";

  // --- FUNCIÓN PARA CARGAR TODAS LAS POSTULACIONES DEL SISTEMA ---
  const cargarTodasLasPostulaciones = async () => {
    setVistaActiva('postulaciones'); // 1. Cambiamos la interfaz inmediatamente
    setLoadingPostulaciones(true);   // 2. Activamos el cargando local
    try {
        const res = await axios.get(`${API_URL}/postulaciones/admin/todas`);
        setTodasLasPostulaciones(res.data);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        setLoadingPostulaciones(false); // 3. Quitamos el cargando al terminar
    }
};

const [usuarios, setUsuarios] = useState([]);
const [loadingUsuarios, setLoadingUsuarios] = useState(false);

// Función para cargar los egresados desde Neon
const cargarUsuarios = async () => {
    try {
        setVistaActiva('usuarios'); // Cambiamos la interfaz primero para feedback visual
        setLoadingUsuarios(true);
        const res = await axios.get(`${API_URL}/usuarios/admin/todos`);
        setUsuarios(res.data);
        setLoadingUsuarios(false);
    } catch (error) {
        console.error("Error cargando usuarios:", error);
        setLoadingUsuarios(false);
        alert("Error al conectar con la base de datos de egresados.");
    }
};

// Función para eliminar (opcional, por seguridad)
const handleEliminarUsuario = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario? Esta acción es irreversible.")) {
        try {
            await axios.delete(`${API_URL}/usuarios/${id}`);
            setUsuarios(usuarios.filter(u => u.id !== id));
        } catch (error) {
            alert("No se pudo eliminar el usuario.");
        }
    }
};

const [empresas, setEmpresas] = useState([]);
const [loadingEmpresas, setLoadingEmpresas] = useState(false);

const cargarEmpresas = async () => {
    try {
        setVistaActiva('empresas');
        setLoadingEmpresas(true);
        const res = await axios.get(`${API_URL}/empresas/admin/todas`); // 👈 Tu nuevo endpoint
        setEmpresas(res.data);
        setLoadingEmpresas(false);
    } catch (error) {
        console.error("Error al cargar empresas aliadas");
        setLoadingEmpresas(false);
    }
};

  useEffect(() => {
    const cargarInformacion = async () => {
      try {
        setLoading(true);
        const [resVacantes, resStats] = await Promise.all([
          axios.get(`${API_URL}/vacantes/admin/todas`),
          axios.get(`${API_URL}/vacantes/stats`)
        ]);
        setVacantes(resVacantes.data);
        setStats(resStats.data);
        setLoading(false);
      } catch (error) {
        console.error("Error al conectar con el backend:", error);
        setLoading(false);
      }
    };
    cargarInformacion();
  }, []);

  const verDetalleVacante = async (vacante) => {
    try {
      setVacanteSeleccionada(vacante);
      const res = await axios.get(`${API_URL}/postulaciones/admin/detalle-completo/${vacante.id}`);
      setPostuladosVacante(res.data);
      setShowModal(true);
    } catch (error) {
      alert("Error al obtener postulados");
    }
  };

  if (loading) {
  return (
    <div className="admin-loading-screen">
      <div className="admin-loading-content">
        {/* Spinner de CSS puro */}
        <div className="udec-spinner"></div>
        <h2>Cargando Panel Administrativo</h2>
        <p>Empres360 PRO.</p>
      </div>
    </div>
  );
}

  return (
    <div className="udec-dashboard">
      {/* HEADER INSTITUCIONAL */}
      <header className="udec-header">
        <div className="header-left">
          <img src="/Logo.png" alt="UdeC" className="udec-logo" />
          <h1>Universidad de Cundinamarca <span>|</span></h1>
          <p>Portal de Empleo - Perfil Administrativo</p>
        </div>
        <div className="header-right">
          <p>PANEL DE CONTROL - ADMINISTRADOR</p>
        </div>
      </header>

      <div className="dashboard-content">
        {/* SIDEBAR CON NAVEGACIÓN ACTIVA */}
        <aside className="udec-sidebar">
          <nav>
            <ul>
              <li 
                className={vistaActiva === 'inicio' ? 'active' : ''} 
                onClick={() => setVistaActiva('inicio')}
              >
                <Icon name="house" /> Inicio
              </li>
              <li 
  className={vistaActiva === 'usuarios' ? 'active' : ''} 
  onClick={cargarUsuarios}
>
  <Icon name="users" /> Usuarios
</li>
              <li 
  className={vistaActiva === 'empresas' ? 'active' : ''} 
  onClick={cargarEmpresas} // 👈 Llamada a la nueva función
>
  <Icon name="building" /> Empresas
</li>
              <li 
                className={vistaActiva === 'vacantes' ? 'active' : ''} 
                onClick={() => setVistaActiva('vacantes')}
              >
                <Icon name="file-lines" /> Vacantes
              </li>
              <li 
                className={vistaActiva === 'postulaciones' ? 'active' : ''} 
                onClick={cargarTodasLasPostulaciones}
              >
                <Icon name="check-to-slot" /> Postulaciones
              </li>
              <li><Icon name="envelope" /> Mensajes</li>
              <li><Icon name="chart-simple" /> Reportes</li>
              <li><Icon name="gear" /> Configuración</li>
            </ul>
          </nav>
        </aside>

        <main className="udec-main-panel">
          
          {/* VISTA 1: DASHBOARD (INICIO) */}
          {vistaActiva === 'inicio' && (
            <>
              <section className="section-header">
                <h2>PANEL GENERAL DE GESTIÓN</h2>
                <div className="search-filters">
                  <input type="text" placeholder="Buscar..." />
                  <button className="filter-btn"><Icon name="magnifying-glass" /></button>
                  <button className="filter-btn"><Icon name="arrow-up-z-a" /> Filtra</button>
                  <button className="filter-btn">Filtros</button>
                </div>
              </section>

              <section className="status-cards">
                <div className="card">
                  <div className="card-icon"><Icon name="users" /></div>
                  <div className="card-info">
                    <h3>Total Usuarios</h3>
                    <p>{stats?.totalUsuarios || 0}</p>
                    <span className="growth">2.1% ↑</span>
                  </div>
                </div>
                <div className="card">
                  <div className="card-icon"><Icon name="building" /></div>
                  <div className="card-info">
                    <h3>Empresas Registradas</h3>
                    <p>{stats?.totalEmpresas || 0}</p>
                    <span className="growth">5.6% ↑</span>
                  </div>
                </div>
                <div className="card">
                  <div className="card-icon"><Icon name="briefcase" /></div>
                  <div className="card-info">
                    <h3>Vacantes Activas</h3>
                    <p>{stats?.vacantesAbiertas || 0}</p>
                    <span className="growth">12.3% ↑</span>
                  </div>
                </div>
                <div className="card">
  <div className="card-icon"><Icon name="clipboard-check" /></div>
  <div className="card-info">
    <h3>Postulaciones Nuevas</h3>
    {/* 🟢 Usamos el dato que viene directamente del backend filtrado por hoy */}
    <p>{stats?.postulacionesHoy || 0}</p> 
    <span className="subtext">(24h)</span>
  </div>
</div>
              </section>

              <div className="middle-content">
                <section className="matriz-section">
                  <h3>MATRIZ DE VACANTES POR SECTOR Y MODALIDAD</h3>
                  <div className="matriz-grid">
    {/* 🟢 HEADER X (Ejes Horizontales) */}
    <div className="matriz-header-x">
      {stats?.vacantesPorSector?.map((dato, index) => (
        <span key={`hx-${index}`} title={dato.economicSector}>
          {dato.economicSector || 'Sin Sector'}
        </span> // 👈 CORREGIDO: Antes decía </td>
      ))}
    </div>

    <div className="matriz-body">
      {/* 🟢 HEADER Y (Ejes Verticales) */}
      <div className="matriz-header-y">
        {stats?.vacantesPorSector?.map((dato, index) => (
          <span key={`hy-${index}`}>
            {dato.economicSector || 'Sin Sector'}
          </span>
        ))}
      </div>

      <div className="matriz-cells">
        {/* 🟢 GENERACIÓN DINÁMICA DE FILAS Y COLUMNAS */}
        {stats?.vacantesPorSector?.map((datoFila, indexFila) => (
          <div className="matriz-row" key={`fila-${indexFila}`}>
            {stats?.vacantesPorSector?.map((datoColumna, indexColumna) => {
              const cantidadValida = indexFila === indexColumna;
              const cantidadVacantes = cantidadValida ? (datoFila._count?._all || 0) : 0;

              let colorClase = 'matriz-cell-vacia'; 
              if (cantidadVacantes > 0) {
                if (cantidadVacantes <= 2) colorClase = 'bg-warning'; 
                else if (cantidadVacantes <= 5) colorClase = 'bg-success'; 
                else colorClase = 'bg-danger';
              }

              return (
                <div 
                  key={`celda-${indexFila}-${indexColumna}`} 
                  title={`${datoFila.economicSector}: ${cantidadVacantes} vacantes`} 
                  className={`matriz-cell ${colorClase}`}
                >
                  {cantidadVacantes > 0 && <span className="cell-number">{cantidadVacantes}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  </div>
                </section>

                <section className="empresas-section">
                  <h3>GESTIÓN DE EMPRESAS RECIENTES</h3>
                  <table className="udec-table">
  <thead>
    <tr>
      <th>ID</th>
      <th>Nombre</th>
      <th>NIT</th>
      <th>Estado</th>
    </tr>
  </thead>
  <tbody>
    {/* 🟢 MAPEO DE DATOS REALES */}
    {stats?.empresasRecientes?.length > 0 ? (
      stats.empresasRecientes.map((empresa, index) => (
        <tr key={empresa.id}>
          {/* Formateamos el índice o el ID para que siempre tenga 2 dígitos (01, 02...) */}
          <td>{(index + 1).toString().padStart(2, '0')}</td>
          <td><strong>{empresa.nombre}</strong></td>
          <td>{empresa.nit || 'Sin registro'}</td>
          <td>
            {/* Lógica de color: si tiene NIT lo marcamos como Activo (verde), si no, Inactivo (rojo) */}
            <span className="status-badge abierta">
  ACTIVO
</span>
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
          No hay empresas registradas recientemente.
        </td>
      </tr>
    )}
  </tbody>
</table>
                  <div className="pagination">
                    <button disabled>{"<"}</button><button className="active">1</button><button>2</button><button>{">"}</button>
                  </div>
                </section>
              </div>

              <div className="bottom-content">
                <section className="vacantes-section">
                  <h3>ÚLTIMAS VACANTES PUBLICADAS</h3>
                  <table className="udec-table">
                    <thead>
                      <tr>
                        <th># ID</th><th>Título Vacante</th><th>Empresa</th><th>Estado</th><th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vacantes.slice(0, 5).map(v => (
                        <tr key={v.id}>
                          <td>{v.id}</td>
                          <td><strong>{v.titulo}</strong></td>
                          <td>{v.empresa?.nombre}</td>
                          <td><span className={`status-badge ${v.estado.toLowerCase()}`}>{v.estado}</span></td>
                          <td>
                            <button className="action-btn" onClick={() => verDetalleVacante(v)}><Icon name="eye" /></button>
                            <button className="action-btn"><Icon name="pen-to-square" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section className="chart-section" style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
  
  {/* 🟢 GRÁFICA 1: DONUT - RESUMEN DE POSTULACIONES */}
  <div className="chart-container" style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', minHeight: '350px' }}>
    <h3 style={{ fontSize: '14px', color: 'var(--udec-green-primary)', marginBottom: '15px', textTransform: 'uppercase', fontWeight: 'bold' }}>
      RESUMEN DE POSTULACIONES
    </h3>
    <div style={{ height: '250px', position: 'relative' }}>
      {stats?.postulacionesPorEstado ? (
        <Doughnut 
          data={{
            labels: stats.postulacionesPorEstado.map(p => p.estado),
            datasets: [{
              data: stats.postulacionesPorEstado.map(p => p._count._all),
              backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6c757d'],
              hoverOffset: 15,
              borderWidth: 2,
            }]
          }}
          options={{
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: { boxWidth: 12, font: { size: 11 } }
              }
            }
          }}
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
          <p>Cargando estados...</p>
        </div>
      )}
    </div>
  </div>

  {/* 🔵 GRÁFICA 2: LINE - CRECIMIENTO DE LA PLATAFORMA */}
  <div className="chart-container" style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', minHeight: '350px' }}>
    <h3 style={{ fontSize: '14px', color: 'var(--udec-green-primary)', marginBottom: '15px', textTransform: 'uppercase', fontWeight: 'bold' }}>
      CRECIMIENTO USUARIOS Y EMPRESAS
    </h3>
    <div style={{ height: '250px', position: 'relative' }}>
      {stats?.datosCrecimiento ? (
        <Line 
          data={{
            labels: stats.datosCrecimiento.map(d => d.mes),
            datasets: [
              {
                label: 'Egresados',
                data: stats.datosCrecimiento.map(d => d.usuarios),
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#28a745'
              },
              {
  label: 'Empresas',
  data: stats.datosCrecimiento.map(d => d.empresas),
  borderColor: '#ffc107',
  backgroundColor: 'rgba(255, 193, 7, 0.3)', // Un poco más de opacidad al fondo
  fill: true,
  tension: 0.4,
  pointRadius: 6, // 🟢 Punto un poco más grande que el verde
  pointStyle: 'rectRot', // 🟢 Cambia el círculo por un rombo para diferenciarlo
  borderDash: [5, 5], // 🟢 Hace que la línea sea punteada
}
            ]
          }}
          options={{
  maintainAspectRatio: false,
  scales: {
    y: { 
      beginAtZero: true, 
      grid: { color: '#f0f0f0' },
      // 🟢 ESTO ELIMINA LOS DECIMALES
      ticks: {
        stepSize: 1, // Fuerza a que los saltos sean de 1 en 1
        precision: 0 // No permite decimales
      }
    },
    x: { grid: { display: false } }
  },
  plugins: {
    legend: { position: 'bottom', labels: { padding: 20, font: { size: 11 } } }
  }
}}
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
          <p>Calculando curvas...</p>
        </div>
      )}
    </div>
  </div>

</section>
              </div>
            </>
          )}

          {/* VISTA 2: GESTIÓN DE VACANTES (COMPLETA) */}
          {vistaActiva === 'vacantes' && (
            <section className="vacantes-section-full" style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
              <div className="section-header">
                <h2>GESTIÓN INTEGRAL DE VACANTES</h2>
                <button className="filter-btn" onClick={() => setVistaActiva('inicio')}>Volver al Dashboard</button>
              </div>
              <table className="udec-table">
                <thead>
                  <tr>
                    <th># ID</th>
                    <th>Título Vacante</th>
                    <th>Empresa</th>
                    <th>Ubicación</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {vacantes.map(v => (
                    <tr key={v.id}>
                      <td>{v.id}</td>
                      <td><strong>{v.titulo}</strong></td>
                      <td>{v.empresa?.nombre}</td>
                      <td>{v.ubicacion}</td>
                      <td><span className={`status-badge ${v.estado.toLowerCase()}`}>{v.estado}</span></td>
                      <td>
                        <button className="action-btn" onClick={() => verDetalleVacante(v)} title="Ver Postulados">
                          <Icon name="eye" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* VISTA 3: CENTRO DE POSTULACIONES */}
          {vistaActiva === 'postulaciones' && (
            <section className="postulaciones-section-full" style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
              <div className="section-header">
                <h2>CENTRO DE CONTROL DE POSTULACIONES</h2>
                <button className="filter-btn" onClick={() => setVistaActiva('inicio')}>Volver al Dashboard</button>
              </div>
              {loadingPostulaciones ? (
            <div className="loading-mini">Cargando lista de candidatos...</div>
        ) : (
              <table className="udec-table">
                <thead>
                  <tr>
                    <th>Candidato</th>
                    <th>Vacante Aplicada</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {todasLasPostulaciones.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.usuario.nombres} {p.usuario.apellidos}</strong></td>
                      <td>{p.vacante?.titulo || 'N/A'}</td>
                      <td>{new Date(p.fecha).toLocaleDateString()}</td>
                      <td><span className={`status-badge ${p.estado.toLowerCase()}`}>{p.estado}</span></td>
                      <td>
                        <button className="action-btn" onClick={() => verDetalleVacante(p.vacante)} title="Ver Perfil">
                          <Icon name="user-tie" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </section>
          )}

          {/* VISTA 4: GESTIÓN DE USUARIOS (EGRESADOS) */}
{vistaActiva === 'usuarios' && (
    <section className="usuarios-section-full" style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
        <div className="section-header">
            <h2>GESTIÓN DE EGRESADOS / ESTUDIANTES</h2>
            <button className="filter-btn" onClick={() => setVistaActiva('inicio')}>Volver al Dashboard</button>
        </div>

        {loadingUsuarios ? (
            <div className="loading-mini">Consultando base de datos de egresados...</div>
        ) : (
            <table className="udec-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre Completo</th>
                        <th>Correo Institucional</th>
                        <th>Usuario</th>
                        <th>Postulaciones</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {usuarios.map(u => (
                        <tr key={u.id}>
                            <td>{u.id}</td>
                            <td><strong>{u.nombres} {u.apellidos}</strong></td>
                            <td>{u.correo}</td>
                            <td>@{u.usuario}</td>
                            <td>
                                <span className="status-badge abierta">
                                    {u._count?.postulaciones || 0} Aplicaciones
                                </span>
                            </td>
                            <td>
                                <button className="action-btn" title="Ver CV">
                                    <Icon name="file-pdf" />
                                </button>
                                <button 
                                    className="action-btn" 
                                    style={{color: 'red'}} 
                                    onClick={() => handleEliminarUsuario(u.id)}
                                    title="Eliminar"
                                >
                                    <Icon name="trash" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
    </section>
)}

{vistaActiva === 'empresas' && (
    <section className="empresas-section-full" style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
        <div className="section-header">
            <h2>GESTIÓN DE EMPRESAS ALIADAS</h2>
            <button className="filter-btn" onClick={() => setVistaActiva('inicio')}>Volver al Dashboard</button>
        </div>

        {loadingEmpresas ? (
            <div className="loading-mini">Cargando aliados empresariales...</div>
        ) : (
            <table className="udec-table">
                <thead>
                    <tr>
                        <th>Empresa</th>
                        <th>NIT</th>
                        <th>Ciudad / Sector</th>
                        <th>Vacantes</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    {empresas.map(e => (
        <tr key={e.id}>
            <td><strong>{e.nombre}</strong><br/><small>{e.email}</small></td>
            <td>{e.nit || 'Sin registro'}</td>
            <td>{e.city} / {e.economicSector}</td>
            {/* Usamos tu clase 'status-badge abierta' que ya funciona */}
            <td><span className="status-badge abierta">{e._count?.vacantes || 0}</span></td>
            <td>
                {/* 🟢 CORRECCIÓN: Botones estilizados con Font Awesome */}
                <button className="action-btn" title="Ver Detalles">
                    <i className="fa-solid fa-eye"></i>
                </button>
                <button 
                    className="action-btn delete-btn" 
                    title="Eliminar"
                    onClick={() => handleEliminarEmpresa(e.id)}
                >
                    <i className="fa-solid fa-trash-can"></i>
                </button>
            </td>
        </tr>
    ))}
</tbody>
            </table>
        )}
    </section>
)}

        </main>
      </div>

      {/* MODAL PARA DETALLE DE POSTULADOS */}
      {showModal && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
          <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '80%', maxHeight: '80%', overflowY: 'auto'}}>
             <h3 style={{color: 'var(--udec-green-primary)'}}>Candidatos: {vacanteSeleccionada?.titulo}</h3>
             <table className="udec-table">
                <thead>
                  <tr><th>Nombre</th><th>Correo</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {postuladosVacante.map(p => (
                    <tr key={p.id}>
                      <td>{p.usuario.nombres} {p.usuario.apellidos}</td>
                      <td>{p.usuario.correo}</td>
                      <td><span className={`status-badge ${p.estado.toLowerCase()}`}>{p.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
             </table>
             <button className="filter-btn" style={{marginTop: '20px'}} onClick={() => setShowModal(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;