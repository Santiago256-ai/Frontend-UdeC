import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

// Configuración de Chart.js
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

// Importación de Iconos Premium (Lucide React)
import { 
  Home, Users, Building2, Briefcase, CheckCircle, 
  MessageSquare, BarChart3, Settings, LogOut, User
} from 'lucide-react';

// Importación de Componentes Independientes
import ItemUsuarios from './ItemUsuarios';
import ItemEmpresas from './ItemEmpresas';
import ItemVacantes from './ItemVacantes';
import ItemPostulaciones from './ItemPostulaciones';
import MetricasyReportesAdmin from './MetricasyReportesAdmin';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler);

const API_URL = "https://backend-ude-c.vercel.app/api";

const Admin = () => {
  const [vistaActiva, setVistaActiva] = useState('inicio');
  const [vacantesRecientes, setVacantesRecientes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false); // Estado para el menú del avatar
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false); // Nuevo estado
  const [hoverCancelar, setHoverCancelar] = useState(false);
const [hoverLogout, setHoverLogout] = useState(false);

  useEffect(() => {
    const cargarDatosInicio = async () => {
      try {
        setLoading(true);
        const [resVacantes, resStats] = await Promise.all([
          axios.get(`${API_URL}/vacantes/admin/todas`),
          axios.get(`${API_URL}/vacantes/stats`)
        ]);
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

  const handleLogout = () => {
    // 1. Limpiamos TODO el almacenamiento local (Tokens, datos de usuario, roles)
    // Esto garantiza que nadie pueda volver a entrar dándole al botón "Atrás"
    localStorage.clear(); 
    sessionStorage.clear();

    // 2. Redirigimos a la Landing Page (Raíz)
    // Usamos window.location.href en lugar de navigate('/') para forzar
    // una recarga total del navegador. Esto destruye todos los estados
    // de React que pudieran quedar en la memoria RAM.
    window.location.href = '/';
};

  if (loading && vistaActiva === 'inicio') {
    return (
      <div className="admin-loading-screen">
        <div className="admin-loading-content">
          <div className="udec-spinner"></div>
          <h2>Cargando Panel Administrativo</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout-wrapper">
      
      {/* HEADER PROFESIONAL (Con líneas de colores) */}
      <header className="admin-main-header-container">
        {/* Franja superior de colores institucionales */}
        <div className="header-top-bar">
            <div className="bar-green" style={{flex: 2, backgroundColor: '#00482b', height: '15px'}}></div>
            <div className="bar-orange" style={{width: '30%', backgroundColor: '#f7931e', height: '15px'}}></div>
        </div>

        <div className="admin-header-content">
          {/* LOGOS LIMPIOS A LA IZQUIERDA */}
          <div className="admin-header-left">
            <img src="/Logo.png" alt="Portal Admin" className="admin-brand-logo" />
            <div className="admin-brand-divider"></div>
            <img src="/UdeC2.png" alt="Logo UdeC" className="admin-udec-logo" />
          </div>
          
          {/* TEXTO Y AVATAR A LA DERECHA */}
          <div className="admin-header-right">
            <div className="admin-user-details">
              <span className="admin-role-text">Panel de Control - Administrador</span>
            </div>
            
            {/* AVATAR Y DROPDOWN */}
            <div className="admin-avatar-container">
              <div className="admin-avatar-circle" onClick={() => setShowDropdown(!showDropdown)}>
                <User size={20} />
              </div>
              
              {/* Busca esta parte en tu código y cámbiala así: */}
{showDropdown && (
  <div className="admin-dropdown-menu fade-in">
    <button 
      className="admin-dropdown-item admin-logout-btn" 
      onClick={() => {
        setShowLogoutModal(true); // Abrimos el modal
        setShowDropdown(false);   // Cerramos el dropdown
      }}
    >
      <LogOut size={16} /> Cerrar Sesión
    </button>
  </div>
)}
            </div>
          </div>
        </div>
      </header>

      <div className="admin-main-container">
        
        {/* SIDEBAR SUTIL TIPO GLASSMORPHISM */}
        <aside className="admin-glass-sidebar">
          <div className="admin-sidebar-menu">
            <button className={`admin-menu-item ${vistaActiva === 'inicio' ? 'active' : ''}`} onClick={() => setVistaActiva('inicio')}>
              <Home size={18} /> <span>INICIO</span>
            </button>
            <button className={`admin-menu-item ${vistaActiva === 'usuarios' ? 'active' : ''}`} onClick={() => setVistaActiva('usuarios')}>
              <Users size={18} /> <span>GESTIÓN EGRESADOS</span>
            </button>
            <button className={`admin-menu-item ${vistaActiva === 'empresas' ? 'active' : ''}`} onClick={() => setVistaActiva('empresas')}>
              <Building2 size={18} /> <span>GESTIÓN EMPRESAS</span>
            </button>
            <button className={`admin-menu-item ${vistaActiva === 'vacantes' ? 'active' : ''}`} onClick={() => setVistaActiva('vacantes')}>
              <Briefcase size={18} /> <span>VACANTES ACTIVAS</span>
            </button>
            <button className={`admin-menu-item ${vistaActiva === 'postulaciones' ? 'active' : ''}`} onClick={() => setVistaActiva('postulaciones')}>
              <CheckCircle size={18} /> <span>POSTULACIONES</span>
            </button>
            <button 
  className={`admin-menu-item ${vistaActiva === 'metricas' ? 'active' : ''}`} 
  onClick={() => setVistaActiva('metricas')}
>
  <BarChart3 size={18} /> <span>MÉTRICAS Y REPORTES</span>
</button>
            <button className="admin-menu-item">
              <Settings size={18} /> <span>CONFIGURACIÓN</span>
            </button>
          </div>
        </aside>

        {/* PANEL DE CONTENIDO PRINCIPAL */}
        <main className="admin-content-panel">
          
          {/* RENDERIZADO POR COMPONENTES INDEPENDIENTES */}
          {vistaActiva === 'usuarios' && <ItemUsuarios API_URL={API_URL} />}
          {vistaActiva === 'empresas' && <ItemEmpresas API_URL={API_URL} />}
          {vistaActiva === 'vacantes' && <ItemVacantes API_URL={API_URL} />}
          {vistaActiva === 'postulaciones' && <ItemPostulaciones API_URL={API_URL} />}
{/* AÑADE ESTA LÍNEA: */}
{vistaActiva === 'metricas' && <MetricasyReportesAdmin />}

          {/* DASHBOARD INICIAL (DATOS REALES) */}
          {vistaActiva === 'inicio' && (
            <div className="admin-dashboard-home">
              <section className="section-header" style={{ marginBottom: '25px' }}>
                <h2 style={{ fontSize: '22px', color: '#1a202c', fontWeight: '800' }}>Resumen General del Sistema</h2>
              </section>

              <section className="status-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="card" style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div className="card-icon" style={{ background: '#f0fdf4', color: '#16a34a', padding: '15px', borderRadius: '12px' }}><Users size={24} /></div>
                  <div className="card-info">
                    <h3 style={{ fontSize: '13px', color: '#64748b', margin: '0 0 5px 0' }}>Total Egresados</h3>
                    <p style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0' }}>{stats?.totalEgresados || 0}</p>
                  </div>
                </div>
                
                <div className="card" style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div className="card-icon" style={{ background: '#fffbeb', color: '#d97706', padding: '15px', borderRadius: '12px' }}><Building2 size={24} /></div>
                  <div className="card-info">
                    <h3 style={{ fontSize: '13px', color: '#64748b', margin: '0 0 5px 0' }}>Empresas Aliadas</h3>
                    <p style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0' }}>{stats?.totalEmpresas || 0}</p>
                  </div>
                </div>
                
                <div className="card" style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div className="card-icon" style={{ background: '#eff6ff', color: '#2563eb', padding: '15px', borderRadius: '12px' }}><Briefcase size={24} /></div>
                  <div className="card-info">
                    <h3 style={{ fontSize: '13px', color: '#64748b', margin: '0 0 5px 0' }}>Vacantes Activas</h3>
                    <p style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0' }}>{stats?.vacantesAbiertas || 0}</p>
                  </div>
                </div>
                
                <div className="card" style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div className="card-icon" style={{ background: '#fef2f2', color: '#dc2626', padding: '15px', borderRadius: '12px' }}><CheckCircle size={24} /></div>
                  <div className="card-info">
                    <h3 style={{ fontSize: '13px', color: '#64748b', margin: '0 0 5px 0' }}>Postulaciones Hoy</h3>
                    <p style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0' }}>{stats?.postulacionesHoy || 0}</p>
                  </div>
                </div>
              </section>

              <div className="middle-content">
                <section className="chart-section" style={{ display: 'flex', gap: '20px', width: '100%', flexWrap: 'wrap' }}>
                  {/* Gráfica de Postulaciones */}
                  <div className="chart-container" style={{ flex: '1 1 400px', background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '20px' }}>Distribución de Postulaciones</h3>
                    <div style={{ height: '280px' }}>
                      {stats?.postulacionesPorEstado && (
                        <Doughnut 
                          data={{
                            labels: stats.postulacionesPorEstado.map(p => p.estado),
                            datasets: [{
                              data: stats.postulacionesPorEstado.map(p => p._count._all),
                              backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6c757d'],
                              borderWidth: 0,
                            }]
                          }}
                          options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Gráfica de Crecimiento */}
                  <div className="chart-container" style={{ flex: '1 1 500px', background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '20px' }}>Crecimiento de la Plataforma</h3>
                    <div style={{ height: '280px' }}>
                      {stats?.datosCrecimiento && (
                        <Line 
                          data={{
                            labels: stats.datosCrecimiento.map(d => d.mes),
                            datasets: [
                              {
                                label: 'Egresados',
                                data: stats.datosCrecimiento.map(d => d.egresados),
                                borderColor: '#28a745',
                                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                                fill: true,
                                tension: 0.4
                              },
                              {
                                label: 'Empresas',
                                data: stats.datosCrecimiento.map(d => d.empresas),
                                borderColor: '#ffc107',
                                backgroundColor: 'rgba(255, 193, 7, 0.1)',
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

              {/* Tabla de Vacantes Recientes */}
              <section className="vacantes-section" style={{ marginTop: '20px', background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '20px' }}>ÚLTIMAS VACANTES PUBLICADAS</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                        <th style={{ padding: '12px 15px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Título</th>
                        <th style={{ padding: '12px 15px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Empresa</th>
                        <th style={{ padding: '12px 15px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vacantesRecientes.map(v => (
                        <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                          <td style={{ padding: '15px', color: '#1e293b', fontWeight: '600', fontSize: '14px' }}>{v.titulo}</td>
                          <td style={{ padding: '15px', color: '#475569', fontSize: '14px' }}>{v.empresa?.nombre}</td>
                          <td style={{ padding: '15px' }}>
                            <span style={{ 
                              padding: '6px 12px', 
                              borderRadius: '20px', 
                              fontSize: '12px', 
                              fontWeight: '700',
                              background: v.estado === 'ABIERTA' ? '#dcfce7' : '#f1f5f9',
                              color: v.estado === 'ABIERTA' ? '#166534' : '#475569'
                            }}>
                              {v.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              
            </div>
          )}
        </main>
      </div>
      {/* ========================================== */}
      {/* MODAL DE CERRAR SESIÓN (DISEÑO PREMIUM) */}
      {/* ========================================== */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', 
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white', width: '100%', maxWidth: '400px', 
            borderRadius: '24px', padding: '40px', textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Icono Circular */}
            <div style={{
              width: '80px', height: '80px', backgroundColor: '#fef2f2', 
              borderRadius: '50%', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', margin: '0 auto 25px auto', color: '#dc2626'
            }}>
              <LogOut size={40} />
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '10px' }}>
              ¿Cerrar sesión?
            </h2>
            <p style={{ color: '#64748b', marginBottom: '30px', lineHeight: '1.5' }}>
              Se cerrará tu sesión actual y tendrás que volver a ingresar tus credenciales para acceder.
            </p>

            <div style={{ display: 'flex', gap: '15px' }}>
  {/* BOTÓN CANCELAR */}
  <button 
    onClick={() => setShowLogoutModal(false)}
    onMouseEnter={() => setHoverCancelar(true)}
    onMouseLeave={() => setHoverCancelar(false)}
    style={{
      flex: 1, 
      padding: '14px', 
      borderRadius: '15px', 
      border: '1px solid #e2e8f0',
      backgroundColor: hoverCancelar ? '#f8fafc' : 'white', // Cambio de fondo sutil
      color: '#475569', 
      fontWeight: '700', 
      cursor: 'pointer',
      transition: 'all 0.2s ease', // Animación suave
      transform: hoverCancelar ? 'translateY(-2px)' : 'translateY(0)', // Se eleva un poco
      boxShadow: hoverCancelar ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' // Sombra al flotar
    }}
  >
    Cancelar
  </button>

  {/* BOTÓN CERRAR SESIÓN */}
  <button 
    onClick={handleLogout}
    onMouseEnter={() => setHoverLogout(true)}
    onMouseLeave={() => setHoverLogout(false)}
    style={{
      flex: 1, 
      padding: '14px', 
      borderRadius: '15px', 
      border: 'none',
      backgroundColor: hoverLogout ? '#b91c1c' : '#dc2626', // Rojo más oscuro en hover
      color: 'white', 
      fontWeight: '700', 
      cursor: 'pointer',
      transition: 'all 0.2s ease', // Animación suave
      transform: hoverLogout ? 'scale(1.03)' : 'scale(1)', // Crece un poquito
      boxShadow: hoverLogout ? '0 8px 15px rgba(220, 38, 38, 0.3)' : 'none' // Brillo rojo
    }}
  >
    Cerrar sesión
  </button>
</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;