import React, { useState, useEffect, useRef } from 'react';
import API from "../../services/api";
import { 
    BarChart3, Users, Briefcase, XCircle, Download, TrendingUp, Filter, 
    FileSpreadsheet, FileText, Clock, Bell, Trash2, Eye, MapPin
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import './EmpresaMetricas.css';

const COLORS = ['#00482b', '#f59e0b', '#0ea5e9', '#ef4444'];

export default function EmpresaMetricas({ empresaId }) {
    const [loading, setLoading] = useState(true);
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    
    // Estados de datos
    const [stats, setStats] = useState({ activas: 0, inactivas: 0, eliminadas: 0, postulaciones: 0, tasaAceptacion: 0 });
    const [graficoBarras, setGraficoBarras] = useState([]);
    const [graficoPastel, setGraficoPastel] = useState([]);
    
    // Tablas de reporte
    const [vacantesRecientes, setVacantesRecientes] = useState([]);
    const [vacantesPapelera, setVacantesPapelera] = useState([]);
    const [postulacionesRecientes, setPostulacionesRecientes] = useState([]);
    const [notificacionesRecientes, setNotificacionesRecientes] = useState([]);
    const [vacantesCrudas, setVacantesCrudas] = useState([]);

    const dashboardRef = useRef(null);

    const fetchMetricasPro = async () => {
        setLoading(true);
        try {
            // Asegúrate de que esta ruta coincida con la que creaste en el Backend
            const res = await API.get(`/vacantes/empresa/${empresaId}/metricas-pro`); 
            const { vacantes, postulacionesRecientes, notificacionesRecientes } = res.data;

            // 1. Filtrado de Fechas
            const filtradas = vacantes.filter(v => {
                if (!fechaInicio || !fechaFin) return true;
                const fechaV = new Date(v.fechaCreacion);
                return fechaV >= new Date(fechaInicio) && fechaV <= new Date(fechaFin);
            });

            setVacantesCrudas(filtradas);

            // 2. Separación de datos
            const activas = filtradas.filter(v => v.estado === 'ABIERTA');
            const inactivas = filtradas.filter(v => v.estado === 'DESACTIVADA' || v.estado === 'CERRADA');
            const eliminadas = filtradas.filter(v => v.estado === 'ELIMINADA');
            const totalPost = filtradas.reduce((acc, v) => acc + (v._count?.postulaciones || 0), 0);

            setStats({
                activas: activas.length,
                inactivas: inactivas.length,
                eliminadas: eliminadas.length,
                postulaciones: totalPost,
                tasaAceptacion: filtradas.length > 0 ? ((totalPost / filtradas.length).toFixed(1)) : 0
            });

            // 3. Gráficos
            const datosBarras = filtradas
                .filter(v => v.estado !== 'ELIMINADA')
                .map(v => ({
                    nombre: v.titulo.length > 15 ? v.titulo.substring(0, 15) + '...' : v.titulo,
                    postulados: v._count?.postulaciones || 0
                }))
                .sort((a, b) => b.postulados - a.postulados)
                .slice(0, 5);
            setGraficoBarras(datosBarras);

            setGraficoPastel([
                { name: 'Activas', value: activas.length },
                { name: 'Inactivas', value: inactivas.length },
                { name: 'Papelera', value: eliminadas.length }
            ]);

            // 4. Tablas
            setVacantesRecientes(filtradas.filter(v => v.estado !== 'ELIMINADA').slice(0, 5));
            setVacantesPapelera(eliminadas.slice(0, 5));
            setPostulacionesRecientes(postulacionesRecientes || []);
            setNotificacionesRecientes(notificacionesRecientes || []);

        } catch (err) {
            console.error("Error cargando métricas PRO:", err);
            toast.error("Error al cargar el panel directivo");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (empresaId) fetchMetricasPro();
    }, [empresaId, fechaInicio, fechaFin]);

    const exportarPDF = async () => {
        const input = dashboardRef.current;
        toast.info("Generando PDF, por favor espera...", { autoClose: 2000 });
        try {
            const canvas = await html2canvas(input, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Reporte_Directivo_${new Date().toLocaleDateString('es-CO')}.pdf`);
            toast.success("PDF generado exitosamente");
        } catch (error) {
            toast.error("Error al generar PDF");
        }
    };

    const exportarExcel = () => {
        if (vacantesCrudas.length === 0) return toast.warning("No hay datos para exportar");
        const datosExcel = vacantesCrudas.map(v => ({
            'Título Vacante': v.titulo,
            'Estado': v.estado,
            'Contrato': v.tipo,
            'Postulaciones': v._count?.postulaciones || 0,
            'Fecha Creación': new Date(v.fechaCreacion).toLocaleDateString('es-CO')
        }));
        const hoja = XLSX.utils.json_to_sheet(datosExcel);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, "Reporte Global");
        XLSX.writeFile(libro, `Reporte_Global_${new Date().toLocaleDateString('es-CO')}.xlsx`);
    };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="metrics-module animate-fade-in">
            {/* Cabecera y Filtros */}
            <div className="metrics-header-card">
                <div className="filter-title">
                    <TrendingUp size={28} style={{ color: '#00482b' }} />
                    <div>
                        <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1.4rem', fontWeight: '800' }}>Dashboard Ejecutivo</h4>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Visión 360° del talento y vacantes</p>
                    </div>
                </div>
                <div className="filter-inputs">
                    <div className="input-field"><label>Desde:</label><input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} /></div>
                    <div className="input-field"><label>Hasta:</label><input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} /></div>
                    <div className="export-buttons-group">
                        <button className="btn-export-excel" onClick={exportarExcel}><FileSpreadsheet size={16} /> Excel</button>
                        <button className="btn-export-pdf" onClick={exportarPDF}><FileText size={16} /> PDF</button>
                    </div>
                </div>
            </div>

            {/* ZONA DE EXPORTACIÓN PDF */}
            <div ref={dashboardRef} className="pdf-export-container">
                
                {/* 1. KPIs */}
                <div className="stats-kpi-grid">
                    <div className="stat-card udec-border">
                        <div className="stat-icon green-bg"><Briefcase size={24} /></div>
                        <div className="stat-info"><p>Vacantes Activas</p><h3>{stats.activas}</h3></div>
                    </div>
                    <div className="stat-card blue-border">
                        <div className="stat-icon blue-bg"><Users size={24} /></div>
                        <div className="stat-info"><p>Total Postulaciones</p><h3>{stats.postulaciones}</h3></div>
                    </div>
                    <div className="stat-card gold-border">
                        <div className="stat-icon gold-bg"><TrendingUp size={24} /></div>
                        <div className="stat-info"><p>Promedio x Vacante</p><h3>{stats.tasaAceptacion}</h3></div>
                    </div>
                    <div className="stat-card olive-border">
                        <div className="stat-icon olive-bg"><Trash2 size={24} /></div>
                        <div className="stat-info"><p>En Papelera</p><h3>{stats.eliminadas}</h3></div>
                    </div>
                </div>

                {/* 2. Gráficos */}
                <div className="metrics-visual-panel">
                    <div className="chart-container">
                        <div className="chart-header">
                            <div><h4 style={{ margin: 0 }}>Top 5 Ofertas</h4><span style={{ fontSize: '12px', color: '#64748b' }}>Por volumen de candidatos</span></div>
                            <BarChart3 size={20} color="#00482b" />
                        </div>
                        <div style={{ width: '100%', height: 280, marginTop: '10px' }}>
                            <ResponsiveContainer>
                                <BarChart data={graficoBarras} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
                                    <Bar dataKey="postulados" fill="#00482b" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="chart-container">
                        <div className="chart-header">
                            <div><h4 style={{ margin: 0 }}>Distribución de Estado</h4><span style={{ fontSize: '12px', color: '#64748b' }}>Status de tus publicaciones</span></div>
                        </div>
                        <div style={{ width: '100%', height: 280, display: 'flex', justifyContent: 'center' }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={graficoPastel} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {graficoPastel.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 3. Cuadrículas de Tablas Pro */}
                <div className="dashboard-tables-grid">
                    
                    {/* Tabla A: Postulaciones Recientes */}
                    <div className="dashboard-card-table">
                        <div className="table-header"><Users size={18}/> <h4>Postulaciones Recientes</h4></div>
                        <div className="table-body">
                            {postulacionesRecientes.length === 0 ? <p className="empty-msg">No hay postulaciones recientes</p> : 
                                postulacionesRecientes.map(p => (
                                    <div key={p.id} className="table-row-item">
                                        <div className="row-info">
                                            <strong>{p.egresado?.nombres} {p.egresado?.apellidos}</strong>
                                            <span>Aplicó a: {p.vacante?.titulo?.substring(0,25)}...</span>
                                        </div>
                                        <div className="row-action">
                                            <span className="date-mini">{new Date(p.fecha).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    {/* Tabla B: Últimas Ofertas Creadas */}
                    <div className="dashboard-card-table">
                        <div className="table-header"><Briefcase size={18}/> <h4>Últimas Vacantes Publicadas</h4></div>
                        <div className="table-body">
                            {vacantesRecientes.length === 0 ? <p className="empty-msg">No hay vacantes recientes</p> : 
                                vacantesRecientes.map(v => (
                                    <div key={v.id} className="table-row-item">
                                        <div className="row-info">
                                            <strong>{v.titulo.substring(0, 30)}...</strong>
                                            <span className="badge-mini status-abierta">{v.estado}</span>
                                        </div>
                                        <div className="row-action">
                                            <span className="stat-pill"><Users size={12}/> {v._count?.postulaciones}</span>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    {/* Tabla C: Papelera */}
                    <div className="dashboard-card-table">
                        <div className="table-header"><Trash2 size={18} color="#ef4444"/> <h4>En Papelera</h4></div>
                        <div className="table-body">
                            {vacantesPapelera.length === 0 ? <p className="empty-msg">Papelera limpia</p> : 
                                vacantesPapelera.map(v => (
                                    <div key={v.id} className="table-row-item">
                                        <div className="row-info">
                                            <strong>{v.titulo.substring(0, 30)}...</strong>
                                        </div>
                                        <div className="row-action">
                                            <span className="date-mini-red">Baja: {new Date(v.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    {/* Tabla D: Actividad / Notificaciones */}
                    <div className="dashboard-card-table">
                        <div className="table-header"><Bell size={18} color="#f59e0b"/> <h4>Últimas Alertas</h4></div>
                        <div className="table-body">
                            {notificacionesRecientes.length === 0 ? <p className="empty-msg">No hay alertas recientes</p> : 
                                notificacionesRecientes.map(n => (
                                    <div key={n.id} className="table-row-item">
                                        <div className="row-info">
                                            <span style={{ fontSize: '13px', color: '#334155' }}>{n.contenido}</span>
                                        </div>
                                        <div className="row-action">
                                            <span className="date-mini"><Clock size={12}/></span>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}