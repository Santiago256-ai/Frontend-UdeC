import React, { useState, useEffect, useRef } from 'react'; // 🟢 Añadimos useRef
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
// 🟢 Añadimos Download y FileSpreadsheet
import { AlertCircle, RefreshCw, Trophy, Building, Download, FileSpreadsheet } from 'lucide-react'; 

// 🟢 Nuevas importaciones para exportación
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from 'xlsx';

import './MetricasyReportesAdmin.css';

const API_URL = "https://backend-ude-c.vercel.app/api";

// Paletas de colores corporativas UdeC (Verdes institucionales y Naranjas)
const COLORS_MAIN = ['#00482b', '#f7931e', '#16a34a', '#fbbf24', '#064e3b', '#d97706'];
const COLORS_MODALIDAD = ['#00482b', '#f7931e', '#22c55e']; // Verde oscuro, Naranja, Verde claro

const MetricasyReportesAdmin = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Referencia al contenedor principal para el PDF
  const reporteRef = useRef();
  // Estado para mostrar que se está generando el reporte
  const [isExporting, setIsExporting] = useState(false);

  // ==========================================
  // LÓGICA DE EXPORTACIÓN A PDF
  // ==========================================
  // ==========================================
  // LÓGICA DE EXPORTACIÓN A PDF (CORREGIDA)
  // ==========================================
  const exportarPDF = async () => {
    setIsExporting(true);
    try {
      const element = reporteRef.current;
      
      // 1. Forzamos el scroll arriba del todo
      window.scrollTo(0, 0);

      // 2. Aplicamos la clase que desactiva animaciones y arregla fondos
      element.classList.add('pdf-export-mode');

      // 3. Le damos 300ms a React y al navegador para procesar los estilos
      await new Promise(resolve => setTimeout(resolve, 300));

      // 4. Tomamos la fotografía
      const canvas = await html2canvas(element, { 
        scale: 2, // Alta definición
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollY: 0,
        windowHeight: element.scrollHeight // Obliga a leer todo hacia abajo
      });
      
      // 5. Retiramos la clase para que tu vista vuelva a la normalidad
      element.classList.remove('pdf-export-mode');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculamos cuánto mide la foto completa escalada al ancho del A4
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Pegamos la primera página
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Si la imagen es más larga que una hoja A4, creamos más hojas
      while (heightLeft > 0) {
        position -= pdfHeight; // Movemos la imagen hacia arriba el tamaño de una hoja
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save('Reporte_Estadistico_Empres360_PRO.pdf');
    } catch (error) {
      console.error("Error al generar PDF:", error);
      // Por si ocurre un error, nos aseguramos de quitar la clase
      if (reporteRef.current) reporteRef.current.classList.remove('pdf-export-mode');
    } finally {
      setIsExporting(false);
    }
  };
  // ==========================================
  // LÓGICA DE EXPORTACIÓN A EXCEL (COMPLETO)
  // ==========================================
  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Resumen General
    const kpiData = [
      { Métrica: "Egresados Registrados", Valor: data.totalEgresados },
      { Métrica: "Empresas Aliadas", Valor: data.totalEmpresas },
      { Métrica: "Vacantes Disponibles", Valor: data.vacantesActivas },
      { Métrica: "Procesos Finalizados", Valor: data.vacantesFinalizadas },
      { Métrica: "Postulaciones (Últimas 24h)", Valor: data.postulacionesHoy }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpiData), "Resumen_General");

    // 2. Facultad
    const wsFacultad = XLSX.utils.json_to_sheet(facultadData.map(f => ({
      Facultad: f.name,
      'Total Egresados': f.egresados
    })));
    XLSX.utils.book_append_sheet(wb, wsFacultad, "Adopcion_Facultades");

    // 3. Sectores
    const wsSectores = XLSX.utils.json_to_sheet(sectorData.map(s => ({
      'Sector Económico': s.sector,
      'Total Vacantes': s.cantidad
    })));
    XLSX.utils.book_append_sheet(wb, wsSectores, "Demanda_Sectores");

    // 4. Modalidad (¡Nuevo!)
    const wsModalidad = XLSX.utils.json_to_sheet(modalidadData.map(m => ({
      Modalidad: m.name,
      'Total Vacantes': m.value
    })));
    XLSX.utils.book_append_sheet(wb, wsModalidad, "Modalidad_Trabajo");

    // 5. Embudo de Selección (¡Nuevo!)
    const wsEmbudo = XLSX.utils.json_to_sheet(pieData.map(p => ({
      'Estado del Proceso': p.name,
      'Total Candidatos': p.value
    })));
    XLSX.utils.book_append_sheet(wb, wsEmbudo, "Embudo_Postulaciones");

    // 6. Crecimiento (¡Nuevo!)
    const wsCrecimiento = XLSX.utils.json_to_sheet(data.datosCrecimiento.map(c => ({
      Mes: c.mes,
      'Nuevos Egresados': c.egresados,
      'Nuevas Empresas': c.empresas
    })));
    XLSX.utils.book_append_sheet(wb, wsCrecimiento, "Crecimiento_Historico");

    // Descargar el libro maestro
    XLSX.writeFile(wb, "Reporte_Completo_Empres360_PRO.xlsx");
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/vacantes/stats`);
      setData(response.data);
      console.log("DATOS DEL BACKEND RECIÉN LLEGADOS:", response.data);
      setError(null);
    } catch (err) {
      setError("No se pudo conectar con el servidor de métricas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return (
    <div className="adm-metrics-loading">
      <RefreshCw className="spinner" size={32} />
      <p>Generando inteligencia institucional...</p>
    </div>
  );

  if (error) return (
    <div className="adm-metrics-error">
      <AlertCircle size={40} color="#dc2626" />
      <p>{error}</p>
      <button className="adm-refresh-btn" onClick={fetchStats}>Reintentar</button>
    </div>
  );

  // =========================================================
  // --- FORMATEO Y LIMPIEZA DE DATOS ---
  // =========================================================
  
  // 🟢 FUNCIÓN PARA LIMPIAR NOMBRES LARGOS DE FACULTADES
  const formatearFacultad = (nombreStr) => {
    if (!nombreStr) return "Sin Especificar";
    // Le quitamos la palabra "FACULTAD DE " y capitalizamos la primera letra
    let limpio = nombreStr.replace(/FACULTAD DE /i, "").toLowerCase();
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  };

  const pieData = (data?.postulacionesPorEstado || []).map(item => ({
    name: item.estado, 
    value: item._count._all
  }));

  const sectorData = (data?.vacantesPorSector || []).map(item => ({
    sector: item.economicSector, 
    cantidad: item._count._all
  }));

  const modalidadData = (data?.vacantesPorModalidad || []).map(item => ({
    name: item.modalidad, 
    value: item._count._all
  }));

  const facultadData = (data?.egresadosPorFacultad || [])
    .filter(item => item.facultad) // Ignora los que vengan nulos
    .map(item => ({
      name: formatearFacultad(item.facultad), // Aplicamos el limpiador aquí
      egresados: item._count._all
    }))
    // Ordenamos de mayor a menor para que se vea como una escalera
    .sort((a, b) => b.egresados - a.egresados);

  // =========================================================

  return (
    // 🟢 1. Agregamos el ref={reporteRef} al contenedor principal
    <div className="admin-metrics-scope" ref={reporteRef}>
      <header className="adm-header">
        <div>
          <h1 className="adm-title">Centro de Mando Analítico</h1>
          <p className="adm-subtitle">Monitoreo en tiempo real del ecosistema Empres360 PRO</p>
        </div>
        
        {/* 🟢 2. Botones de Exportación. Usamos data-html2canvas-ignore para que estos botones no salgan impresos en el PDF */}
        <div className="adm-header-actions" data-html2canvas-ignore="true">
          <button className="adm-btn-excel" onClick={exportarExcel} title="Descargar datos en Excel">
            <FileSpreadsheet size={16} /> Data Excel
          </button>
          
          <button className="adm-btn-pdf" onClick={exportarPDF} disabled={isExporting} title="Descargar reporte gráfico en PDF">
            {isExporting ? <RefreshCw size={16} className="spinner" /> : <Download size={16} />} 
            {isExporting ? 'Generando...' : 'Reporte PDF'}
          </button>

          <button className="adm-refresh-btn" onClick={fetchStats} title="Actualizar datos">
            <RefreshCw size={16} /> 
          </button>
        </div>
      </header>

      {/* 1. KPIs Superiores (4 Tarjetas) */}
      <section className="adm-kpi-grid">
        <div className="adm-glass-card adm-kpi-card">
          <h3 className="adm-kpi-title">Talento UdeC</h3>
          <p className="adm-kpi-value">{data.totalEgresados}</p>
          <span className="adm-kpi-trend positive">Egresados Registrados</span>
        </div>

        <div className="adm-glass-card adm-kpi-card">
          <h3 className="adm-kpi-title">Vacantes Disponibles</h3>
          <p className="adm-kpi-value" style={{ color: '#00482b' }}>{data.vacantesActivas}</p>
          <span className="adm-kpi-trend positive">Con cupos y fecha vigente</span>
        </div>

        <div className="adm-glass-card adm-kpi-card">
          <h3 className="adm-kpi-title">Procesos Finalizados</h3>
          <p className="adm-kpi-value" style={{ color: '#64748b' }}>{data.vacantesFinalizadas}</p>
          <span className="adm-kpi-trend">Cerradas o cupos llenos</span>
        </div>

        <div className="adm-glass-card adm-kpi-card">
          <h3 className="adm-kpi-title">Postulaciones Hoy</h3>
          <p className="adm-kpi-value">{data.postulacionesHoy}</p>
          <span className="adm-kpi-trend positive">Actividad en 24h</span>
        </div>
      </section>

      {/* 2. Grid Principal Complejo */}
      <section className="adm-charts-grid complex-grid">
        
        {/* GRÁFICO A: Evolución Histórica (Ocupa 2 columnas) */}
        <div className="adm-glass-card adm-chart-container span-2">
          <h3 className="adm-chart-title">Expansión de la Plataforma (Últimos 6 Meses)</h3>
          <div className="adm-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.datosCrecimiento} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  {/* Degradado Verde UdeC para Egresados */}
                  <linearGradient id="colorEgresados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00482b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00482b" stopOpacity={0}/>
                  </linearGradient>
                  {/* Degradado Naranja UdeC para Empresas */}
                  <linearGradient id="colorEmpresas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f7931e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f7931e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--adm-border-color)" />
                <XAxis dataKey="mes" stroke="var(--adm-text-muted)" />
                <YAxis stroke="var(--adm-text-muted)" />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="top" height={36} />
                
                {/* Líneas principales con los colores exactos */}
                <Area type="monotone" dataKey="egresados" stroke="#00482b" strokeWidth={3} fillOpacity={1} fill="url(#colorEgresados)" name="Nuevos Egresados" />
                <Area type="monotone" dataKey="empresas" stroke="#f7931e" strokeWidth={3} fillOpacity={1} fill="url(#colorEmpresas)" name="Nuevas Empresas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* WIDGET B: Ranking de Empresas (Lista Estilizada) */}
        <div className="adm-glass-card adm-list-widget">
          <h3 className="adm-chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={20} color="#f7931e" /> Recientes & Destacadas
          </h3>
          <div className="adm-ranking-list">
            {(data?.empresasRecientes || []).map((emp) => (
              <div key={emp.id} className="adm-ranking-item">
                <div className="adm-ranking-avatar"><Building size={16} /></div>
                <div className="adm-ranking-info">
                  <h4>{emp.nombre}</h4>
                  <span>NIT: {emp.nit || 'N/A'}</span>
                </div>
                <div className="adm-ranking-badge">Nueva</div>
              </div>
            ))}
            {(!data?.empresasRecientes || data.empresasRecientes.length === 0) && (
              <p className="adm-no-data" style={{color: '#64748b', textAlign: 'center', marginTop: '1rem'}}>No hay empresas recientes.</p>
            )}
          </div>
        </div>

        {/* GRÁFICO C: Empleabilidad por Facultad (Barras Verticales) */}
        <div className="adm-glass-card adm-chart-container span-2">
          <h3 className="adm-chart-title">Adopción por Facultad</h3>
          <div className="adm-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facultadData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--adm-border-color)" />
                <XAxis dataKey="name" stroke="var(--adm-text-muted)" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="var(--adm-text-muted)" />
                <Tooltip cursor={{ fill: 'var(--adm-hover-bg)' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                {/* 🟢 AQUÍ ESTÁ LA CORRECCIÓN: fill="#00482b" para que sea verde UdeC */}
                <Bar dataKey="egresados" fill="#00482b" radius={[6, 6, 0, 0]} barSize={40} name="Total Registrados" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO D: Modalidad de Trabajo (Dona) */}
        <div className="adm-glass-card adm-chart-container">
          <h3 className="adm-chart-title">Tendencia de Modalidad</h3>
          <div className="adm-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={modalidadData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                  {modalidadData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_MODALIDAD[index % COLORS_MODALIDAD.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO E: Embudo de Selección (Dona) */}
        <div className="adm-glass-card adm-chart-container">
          <h3 className="adm-chart-title">Embudo de Selección</h3>
          <div className="adm-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={0} outerRadius={100} dataKey="value" label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_MAIN[index % COLORS_MAIN.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO F: Demanda por Sector (Barras Horizontales) */}
        <div className="adm-glass-card adm-chart-container span-2">
          <h3 className="adm-chart-title">Sectores Económicos con Mayor Demanda</h3>
          <div className="adm-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--adm-border-color)" />
                <XAxis type="number" stroke="var(--adm-text-muted)" />
                <YAxis dataKey="sector" type="category" width={150} stroke="var(--adm-text-muted)" style={{ fontSize: '0.8rem' }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="cantidad" fill="#f7931e" radius={[0, 6, 6, 0]} barSize={25} name="Total Vacantes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </section>
    </div>
  );
};

export default MetricasyReportesAdmin;