import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './ItemEmpresas.module.css';
import ModalConfirmacion from './ModalConfirmacion';
import ModalDetalleEmpresa from './ModalDetalleEmpresa';

const Icon = ({ name }) => <i className={`fa-solid fa-${name}`}></i>;

const ItemEmpresas = ({ API_URL }) => {
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [empresaParaEliminar, setEmpresaParaEliminar] = useState(null);
    
    // Estados para Filtros
    const [filtroSector, setFiltroSector] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("");
    const [filtroFecha, setFiltroFecha] = useState("");
    const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
    const [isModalDetalleOpen, setIsModalDetalleOpen] = useState(false);
const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);

const handleVerDetalles = (empresa) => {
    setEmpresaSeleccionada(empresa);
    setIsModalDetalleOpen(true);
};

    const cargarEmpresas = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/empresas/admin/todas`);
            setEmpresas(res.data);
        } catch (error) {
            console.error("Error al cargar empresas:", error);
            toast.error("Error al conectar con el listado de empresas");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarEmpresas();
    }, []);

    // Formateador de fecha similar al de Egresados
    const formatearFechaLog = (fechaISO) => {
        if (!fechaISO) return "Fecha no disponible";
        const fecha = new Date(fechaISO);
        return fecha.toLocaleString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const toggleEstado = async (empresa) => {
        const nuevoEstado = empresa.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        try {
            // Asegúrate de tener esta ruta en tu backend
            await axios.put(`${API_URL}/empresas/admin/estado/${empresa.id}`, { 
                estado: nuevoEstado 
            });
            
            setEmpresas(empresas.map(e => 
                e.id === empresa.id ? { ...e, estado: nuevoEstado } : e
            ));
            
            toast.success(`Empresa ${nuevoEstado === "ACTIVO" ? 'activada' : 'desactivada'}`);
        } catch (error) {
            toast.error("No se pudo cambiar el estado de la empresa");
        }
    };

// 1. Esta función solo "prepara" el terreno y abre el modal
const handleEliminar = (id, nombre) => {
    setEmpresaParaEliminar({ id, nombre });
    setIsModalOpen(true);
};

// 2. Esta es la que realmente hace el trabajo sucio al darle "Aceptar" en el modal
const ejecutarEliminacion = async () => {
    if (!empresaParaEliminar) return;

    try {
        // La URL con /admin/ que ya habíamos corregido
        await axios.delete(`${API_URL}/empresas/admin/${empresaParaEliminar.id}`); 
        
        setEmpresas(empresas.filter(e => e.id !== empresaParaEliminar.id));
        toast.success(`La empresa "${empresaParaEliminar.nombre}" ha sido eliminada correctamente`);
    } catch (error) {
        console.error("Error al eliminar:", error);
        const mensajeError = error.response?.data?.error || "No se pudo eliminar la empresa";
        toast.error(mensajeError);
    } finally {
        // Cerramos el modal y limpiamos el estado
        setIsModalOpen(false);
        setEmpresaParaEliminar(null);
    }
};

    // Lógica de filtrado "Blindada"
const filtradas = empresas.filter(e => {
    const busquedaLimpia = busqueda.trim().toLowerCase().replace(/\s+/g, ' ');
    const nombreEmpresa = (e.nombre || "").toLowerCase().replace(/\s+/g, ' ');
    const nit = (e.nit || "");
    const email = (e.email || "").toLowerCase();

    // Normalizar fecha de creación para comparar (YYYY-MM-DD)
    const fechaRegistro = e.createdAt ? e.createdAt.split('T')[0] : null;

    const matchBusqueda = nombreEmpresa.includes(busquedaLimpia) || nit.includes(busquedaLimpia) || email.includes(busquedaLimpia);
    const matchSector = filtroSector === "" || e.economicSector === filtroSector;
    const matchEstado = filtroEstado === "" || e.estado === filtroEstado;

    // 🟢 Lógica de Rango de Fechas
    const matchFechaDesde = filtroFecha === "" || (fechaRegistro && fechaRegistro >= filtroFecha);
    const matchFechaHasta = filtroFechaHasta === "" || (fechaRegistro && fechaRegistro <= filtroFechaHasta);

    return matchBusqueda && matchSector && matchEstado && matchFechaDesde && matchFechaHasta;
});

    if (loading) return (
        <div className={styles.loaderContainer}>
            <div className={styles.spinner}></div>
            <p>Cargando aliados empresariales...</p>
        </div>
    );

    // --- FUNCIONES DE EXPORTACIÓN (Agrega esto) ---
const exportarExcel = () => {
    // Limpiamos los datos para que el Excel se vea profesional
    const datosLimpios = filtradas.map(e => ({
        Empresa: e.nombre,
        NIT: e.nit || 'N/A',
        Correo: e.email,
        Ciudad: e.city || 'N/A',
        Sector: e.economicSector || 'N/A',
        Vacantes_Activas: e._count?.vacantes || 0,
        Estado: e.estado,
        Fecha_Registro: formatearFechaLog(e.createdAt)
    }));

    const worksheet = XLSX.utils.json_to_sheet(datosLimpios);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Aliados_Empresas");
    XLSX.writeFile(workbook, "Reporte_Empresas_UdeC.xlsx");
    toast.info("Descargando reporte Excel...");
};

const exportarPDF = () => {
    const doc = new jsPDF();
    
    // Configuración estética del PDF
    doc.setFontSize(18);
    doc.setTextColor(0, 104, 55); // Verde UdeC
    doc.text("Reporte de Empresas Aliadas - UdeC", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 28);

    const columnas = ["Empresa", "NIT", "Ciudad", "Sector", "Vacantes", "Estado"];
    const filas = filtradas.map(e => [
        e.nombre, 
        e.nit || 'N/A', 
        e.city || 'N/A', 
        e.economicSector || 'N/A', 
        e._count?.vacantes || 0,
        e.estado
    ]);

    autoTable(doc, {
        startY: 35,
        head: [columnas],
        body: filas,
        headStyles: { fillColor: [0, 104, 55] }, // Verde Institucional
        alternateRowStyles: { fillColor: [240, 240, 240] },
        styles: { fontSize: 8, cellPadding: 3 }
    });

    doc.save("Reporte_Empresas_UdeC.pdf");
    toast.info("Descargando reporte PDF...");
};

 return (
    <div className={styles.container}>
        {/* Encabezado: Título y Acciones de Exportación */}
        <div className={styles.header}>
            <div>
                <h2 className={styles.title}>Gestión de Empresas Aliadas</h2>
                <p className={styles.subtitle}>Total vinculadas: {empresas.length}</p>
            </div>
            
            <div className={styles.exportActions}>
                <button onClick={exportarExcel} className={styles.btnExcel}>
                    <Icon name="file-excel" /> Excel
                </button>
                <button onClick={exportarPDF} className={styles.btnPdf}>
                    <Icon name="file-pdf" /> PDF
                </button>
            </div>
        </div>

        {/* Barra de Filtros Avanzada */}
        <div className={styles.filterBar}>
            <div className={styles.searchBoxMain}>
                <Icon name="magnifying-glass" />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre, NIT o correo..." 
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    autoComplete="off"
                />
            </div>

            <select value={filtroSector} onChange={(e) => setFiltroSector(e.target.value)} className={styles.filterSelect}>
                <option value="">Todos los Sectores</option>
                {[...new Set(empresas.map(e => e.economicSector))].flat().filter(Boolean).map(s => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>

            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className={styles.filterSelect}>
                <option value="">Todos los Estados</option>
                <option value="ACTIVO">Activas</option>
                <option value="INACTIVO">Inactivas</option>
            </select>

            {/* 📅 Rango de Fechas corregido */}
            <div className={styles.dateFilterContainer}>
                <div className={styles.dateGroup}>
                    <label>Desde:</label>
                    <input 
                        type="date" 
                        value={filtroFecha} 
                        onChange={(e) => setFiltroFecha(e.target.value)} 
                        className={styles.filterDate}
                    />
                </div>
                <div className={styles.dateGroup}>
                    <label>Hasta:</label>
                    <input 
                        type="date" 
                        value={filtroFechaHasta} 
                        onChange={(e) => setFiltroFechaHasta(e.target.value)} 
                        className={styles.filterDate}
                    />
                </div>
            </div>

            {(filtroSector || filtroEstado || filtroFecha || filtroFechaHasta || busqueda) && (
                <button className={styles.btnClearFilters} onClick={() => {
                    setFiltroSector(""); 
                    setFiltroEstado(""); 
                    setFiltroFecha(""); 
                    setFiltroFechaHasta(""); 
                    setBusqueda("");
                }}>
                    <Icon name="filter-circle-xmark" /> Limpiar
                </button>
            )}
        </div>

        {/* Tabla de Resultados */}
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Empresa / Registro</th>
                        <th>NIT / Email</th>
                        <th>Ubicación / Sector</th>
                        <th>Vacantes</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filtradas.length > 0 ? (
                        filtradas.map(e => (
                            <tr key={e.id}>
                                <td>
                                    <div className={styles.companyInfo}>
                                        <strong>{e.nombre}</strong>
                                        <span className={styles.registrationDate}>
                                            <Icon name="calendar-day" /> {formatearFechaLog(e.createdAt)}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.userName}>
                                        <strong>{e.nit || 'Sin NIT'}</strong>
                                        <span>{e.email}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.sectorInfo}>
                                        <span>{e.city || 'N/A'}</span>
                                        <small>{Array.isArray(e.economicSector) ? e.economicSector.join(', ') : (e.economicSector || 'Sin sector')}</small>
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.vacantesCell}>
                                        <div className={styles.countBadge}>
                                            <strong>{e._count?.vacantes || 0}</strong>
                                            <span>Vacantes</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.udec_status_container}>
                                        <button 
                                            className={e.estado === "ACTIVO" ? styles.statusActiveBtn : styles.statusInactiveBtn}
                                            onClick={() => toggleEstado(e)}
                                            title={e.estado === "ACTIVO" ? "Click para desactivar" : "Click para activar"}
                                        >
                                            <span className={styles.statusDot}></span>
                                            {e.estado || "ACTIVO"}
                                        </button>
                                    </div>
                                </td>
                                <td className={styles.actions}>
                                    <button 
                                        className={styles.viewBtn} 
                                        title="Ver detalles"
                                        onClick={() => handleVerDetalles(e)}
                                    >
                                        <Icon name="eye" />
                                    </button>
                                    <button 
                                        className={styles.deleteBtn} 
                                        onClick={() => handleEliminar(e.id, e.nombre)}
                                        title="Eliminar Empresa"
                                    >
                                        <Icon name="trash-can" />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className={styles.empty}>
                                <div className={styles.noResults}>
                                    <Icon name="folder-open" />
                                    <p>No se encontraron empresas con los filtros aplicados.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* 1. 🟢 MODAL DE DETALLES (Esencial agregarlo aquí) */}
        <ModalDetalleEmpresa 
            isOpen={isModalDetalleOpen}
            onClose={() => {
                setIsModalDetalleOpen(false);
                setEmpresaSeleccionada(null);
            }}
            empresa={empresaSeleccionada}
        />

        {/* 2. 🔴 MODAL DE ELIMINACIÓN */}
        <ModalConfirmacion 
            isOpen={isModalOpen}
            onClose={() => {
                setIsModalOpen(false);
                setEmpresaParaEliminar(null);
            }}
            onConfirm={ejecutarEliminacion}
            nombreEmpresa={empresaParaEliminar?.nombre || ""}
        />
    </div>
);
};

export default ItemEmpresas;