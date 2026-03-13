import React, { useState, useEffect } from 'react';
import API from "../../services/api";
import { 
    BarChart3, Users, Briefcase, CheckCircle2, 
    XCircle, Calendar, Download, TrendingUp, Filter
} from 'lucide-react';
import './EmpresaMetricas.css';

export default function EmpresaMetricas({ empresaId }) {
    const [stats, setStats] = useState({
        activas: 0,
        inactivas: 0,
        postulaciones: 0,
        tasaAceptacion: 0
    });
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/vacantes/empresa/${empresaId}`);
            const data = res.data;
            
            // Lógica de filtrado por fecha local (opcional si el backend no lo hace)
            const filtradas = data.filter(v => {
                if (!fechaInicio || !fechaFin) return true;
                const fechaV = new Date(v.fechaCreacion);
                return fechaV >= new Date(fechaInicio) && fechaV <= new Date(fechaFin);
            });

            const totalPost = filtradas.reduce((acc, v) => acc + (v._count?.postulaciones || 0), 0);
            
            setStats({
                activas: filtradas.filter(v => v.estado === 'ABIERTA').length,
                inactivas: filtradas.filter(v => v.estado === 'CERRADA').length,
                postulaciones: totalPost,
                tasaAceptacion: filtradas.length > 0 ? ((totalPost / filtradas.length).toFixed(1)) : 0
            });
        } catch (err) {
            console.error("Error cargando métricas:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (empresaId) fetchStats();
    }, [empresaId, fechaInicio, fechaFin]);

    return (
        <div className="metrics-module animate-fade-in">
            {/* Header de Filtros */}
            <div className="metrics-header-card">
                <div className="filter-title">
                    <Filter size={20} className="text-udec" />
                    <div>
                        <h4>Filtros de Reporte</h4>
                        <p>Analiza el rendimiento por periodos de tiempo</p>
                    </div>
                </div>
                <div className="filter-inputs">
                    <div className="input-field">
                        <label>Desde</label>
                        <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                    </div>
                    <div className="input-field">
                        <label>Hasta</label>
                        <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                    </div>
                    <button className="btn-export">
                        <Download size={18} />
                        <span>PDF</span>
                    </button>
                </div>
            </div>

            {/* Grid de Indicadores */}
            <div className="stats-kpi-grid">
                <div className="stat-card udec-border">
                    <div className="stat-icon green-bg"><Briefcase size={24} /></div>
                    <div className="stat-info">
                        <p>Vacantes Activas</p>
                        <h3>{stats.activas}</h3>
                    </div>
                    <div className="stat-trend positive">+ {stats.activas > 0 ? '12' : '0'}%</div>
                </div>

                <div className="stat-card olive-border">
                    <div className="stat-icon olive-bg"><XCircle size={24} /></div>
                    <div className="stat-info">
                        <p>Cerradas / Inactivas</p>
                        <h3>{stats.inactivas}</h3>
                    </div>
                </div>

                <div className="stat-card blue-border">
                    <div className="stat-icon blue-bg"><Users size={24} /></div>
                    <div className="stat-info">
                        <p>Postulaciones Totales</p>
                        <h3>{stats.postulaciones}</h3>
                    </div>
                </div>

                <div className="stat-card gold-border">
                    <div className="stat-icon gold-bg"><TrendingUp size={24} /></div>
                    <div className="stat-info">
                        <p>Promedio x Vacante</p>
                        <h3>{stats.tasaAceptacion}</h3>
                    </div>
                </div>
            </div>

            {/* Panel de Visualización */}
            <div className="metrics-visual-panel">
                <div className="chart-container">
                    <div className="chart-header">
                        <h4>Flujo de Talento</h4>
                        <BarChart3 size={20} />
                    </div>
                    <div className="chart-placeholder-view">
                        <div className="empty-chart-msg">
                            <TrendingUp size={48} />
                            <p>Gráfico de tendencias histórico</p>
                            <span>(Integración con Recharts disponible)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}