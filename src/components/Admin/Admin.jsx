import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

// Configuración de Chart.js
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

// Importación de Componentes Independientes
import ItemUsuarios from './ItemUsuarios';
import ItemEmpresas from './ItemEmpresas';
import ItemVacantes from './ItemVacantes';
import ItemPostulaciones from './ItemPostulaciones';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler);

const API_URL = "https://backend-ude-c.vercel.app/api";
const Icon = ({ name }) => <i className={`fa-solid fa-${name}`}></i>;

const Admin = () => {
  const [vistaActiva, setVistaActiva] = useState('inicio');
  const [vacantesRecientes, setVacantesRecientes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carga de datos reales para el Dashboard de Inicio
  useEffect(() => {
    const cargarDatosInicio = async () => {
      try {
        setLoading(true);
        const [resVacantes, resStats] = await Promise.all([
          axios.get(`${API_URL}/vacantes/admin/todas`),
          axios.get(`${API_URL}/vacantes/stats`)
        ]);
        // Solo tomamos las 5 más recientes para el Dashboard
        setVacantesRecientes(resVacantes.data.slice(0, 5));
        setStats(resStats.data);
      } catch (error) {
        console.error("Error al conectar con la base de datos real:", error);
      } finally {
        setLoading(false);
      }
    };

    if (vistaActiva === 'inicio') {
      cargarDatosInicio();
    }
  }, [vistaActiva]);

  if (loading && vistaActiva === 'inicio') {
    return (
      <div className="admin-loading-screen">
        <div className="admin-loading-content">
          <div className="udec-spinner"></div>
          <h2>Cargando Panel Administrativo</h2>
          <p>UdeC - Datos en Tiempo Real</p>
        </div>
      </div>
    );
  }

  return (
    <div className="udec-dashboard">
      <header className="udec-header">
        <div className="header-left">
          <img src="/Logo.png" alt="UdeC" className="udec-logo" />
          <h1>Universidad de Cundinamarca <span>|</span></h1>
          <p>Portal de Empleo - Administrador Pro</p>
        </div>
        <div className="header-right">
          <p>PANEL DE CONTROL - {vistaActiva.toUpperCase()}</p>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className="udec-sidebar">
          <nav>
            <ul>
              <li className={vistaActiva === 'inicio' ? 'active' : ''} onClick={() => setVistaActiva('inicio')}>
                <Icon name="house" /> Inicio
              </li>
              <li className={vistaActiva === 'usuarios' ? 'active' : ''} onClick={() => setVistaActiva('usuarios')}>
                <Icon name="users" /> Egresados
              </li>
              <li className={vistaActiva === 'empresas' ? 'active' : ''} onClick={() => setVistaActiva('empresas')}>
                <Icon name="building" /> Empresas
              </li>
              <li className={vistaActiva === 'vacantes' ? 'active' : ''} onClick={() => setVistaActiva('vacantes')}>
                <Icon name="file-lines" /> Vacantes
              </li>
              <li className={vistaActiva === 'postulaciones' ? 'active' : ''} onClick={() => setVistaActiva('postulaciones')}>
                <Icon name="check-to-slot" /> Postulaciones
              </li>
              <li><Icon name="envelope" /> Mensajes</li>
              <li><Icon name="chart-simple" /> Reportes</li>
              <li><Icon name="gear" /> Configuración</li>
            </ul>
          </nav>
        </aside>

        <main className="udec-main-panel">
          {/* RENDERIZADO POR COMPONENTES INDEPENDIENTES */}
          {vistaActiva === 'usuarios' && <ItemUsuarios API_URL={API_URL} />}
          {vistaActiva === 'empresas' && <ItemEmpresas API_URL={API_URL} />}
          {vistaActiva === 'vacantes' && <ItemVacantes API_URL={API_URL} />}
          {vistaActiva === 'postulaciones' && <ItemPostulaciones API_URL={API_URL} />}

          {/* DASHBOARD INICIAL (DATOS REALES) */}
          {vistaActiva === 'inicio' && (
            <>
              <section className="section-header">
                <h2>RESUMEN GENERAL DEL SISTEMA</h2>
              </section>

              <section className="status-cards">
                <div className="card">
                  <div className="card-icon"><Icon name="users" /></div>
                  <div className="card-info">
                    <h3>Total Egresados</h3>
                    <p>{stats?.totalEgresados || 0}</p>
                  </div>
                </div>
                <div className="card">
                  <div className="card-icon"><Icon name="building" /></div>
                  <div className="card-info">
                    <h3>Empresas Aliadas</h3>
                    <p>{stats?.totalEmpresas || 0}</p>
                  </div>
                </div>
                <div className="card">
                  <div className="card-icon"><Icon name="briefcase" /></div>
                  <div className="card-info">
                    <h3>Vacantes Activas</h3>
                    <p>{stats?.vacantesAbiertas || 0}</p>
                  </div>
                </div>
                <div className="card">
                  <div className="card-icon"><Icon name="clipboard-check" /></div>
                  <div className="card-info">
                    <h3>Postulaciones Hoy</h3>
                    <p>{stats?.postulacionesHoy || 0}</p>
                  </div>
                </div>
              </section>

              <div className="middle-content">
                <section className="chart-section" style={{ display: 'flex', gap: '20px', width: '100%' }}>
                  {/* Gráfica de Postulaciones Real */}
                  <div className="chart-container" style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '12px' }}>
                    <h3>Distribución de Postulaciones</h3>
                    <div style={{ height: '250px' }}>
                      {stats?.postulacionesPorEstado && (
                        <Doughnut 
                          data={{
                            labels: stats.postulacionesPorEstado.map(p => p.estado),
                            datasets: [{
                              data: stats.postulacionesPorEstado.map(p => p._count._all),
                              backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6c757d'],
                            }]
                          }}
                          options={{ maintainAspectRatio: false }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Gráfica de Crecimiento Real */}
                  <div className="chart-container" style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '12px' }}>
                    <h3>Crecimiento de la Plataforma</h3>
                    <div style={{ height: '250px' }}>
                      {stats?.datosCrecimiento && (
                        <Line 
                          data={{
                            labels: stats.datosCrecimiento.map(d => d.mes),
                            datasets: [
                              {
                                label: 'Egresados',
                                data: stats.datosCrecimiento.map(d => d.egresados),
                                borderColor: '#28a745',
                                fill: true,
                                tension: 0.4
                              },
                              {
                                label: 'Empresas',
                                data: stats.datosCrecimiento.map(d => d.empresas),
                                borderColor: '#ffc107',
                                fill: true,
                                tension: 0.4
                              }
                            ]
                          }}
                          options={{ maintainAspectRatio: false }}
                        />
                      )}
                    </div>
                  </div>
                </section>
              </div>

              <section className="vacantes-section" style={{ marginTop: '20px', background: 'white', padding: '20px', borderRadius: '12px' }}>
                <h3>ÚLTIMAS VACANTES PUBLICADAS</h3>
                <table className="udec-table">
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Empresa</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vacantesRecientes.map(v => (
                      <tr key={v.id}>
                        <td><strong>{v.titulo}</strong></td>
                        <td>{v.empresa?.nombre}</td>
                        <td><span className={`status-badge ${v.estado.toLowerCase()}`}>{v.estado}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Admin;