import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // 👈 CAMBIO AQUÍ: Importación directa
import styles from './ItemUsuarios.module.css';
import ModalConfirmacion from './ModalConfirmacion'; // 👈 Importa el componente

const Icon = ({ name }) => <i className={`fa-solid fa-${name}`}></i>;

// ==========================================
// SUB-COMPONENTE: MODAL PERFIL (EDICIÓN HORIZONTAL)
// ==========================================
const ModalPerfil = ({ usuario, onClose, onUpdate, API_URL }) => {
    const [editando, setEditando] = useState(false);
    const [datosEditados, setDatosEditados] = useState(usuario ? { ...usuario } : {});


    if (!usuario) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDatosEditados(prev => ({ ...prev, [name]: value }));
    };

    const handleGuardar = async () => {
        try {
            const res = await axios.put(`${API_URL}/usuarios/${usuario.id}`, datosEditados);
            if (res.status === 200) {
                toast.success("Expediente actualizado correctamente");
                if (onUpdate) onUpdate(); 
                onClose(); // Cierra el modal y vuelve a la lista
            }
        } catch (error) {
            console.error("Error al actualizar:", error);
            toast.error("No se pudo actualizar el expediente");
        }
    };

    return (
        <div className={styles.udec_det_overlay}>
            <div className={styles.udec_det_cardHorizontal}>
                {/* Lateral Izquierdo: Identidad */}
                <aside className={styles.udec_det_sidebar}>
                    <div className={styles.udec_det_avatarCircle}>
                        <Icon name={editando ? "user-pen" : "user-graduate"} />
                    </div>
                    <div className={styles.udec_det_sideText}>
                        <h3>{(datosEditados.nombres || "").split(' ')[0]}</h3>
                        <span>{(datosEditados.apellidos || "").split(' ')[0]}</span>
                        <div className={styles.udec_det_badge}>
                            {editando ? "Modo Editor" : "Egresado"}
                        </div>
                    </div>
                </aside>

                {/* Columna Derecha: Datos */}
                <main className={styles.udec_det_mainContent}>
                    <div className={styles.udec_det_headerActions}>
                        <h3>{editando ? "Editando Expediente" : "Expediente del Usuario"}</h3>
                        <button onClick={onClose} className={styles.udec_det_closeBtn}>&times;</button>
                    </div>

                    <div className={styles.udec_det_scrollArea}>
                        <div className={styles.udec_det_sectionTitle}>
                            <Icon name="address-card" /> Datos de Registro
                        </div>
                        <div className={styles.udec_det_dataGrid}>
                            <div className={styles.udec_det_field}>
                                <label>Nombres</label>
                                {editando ? 
                                    <input name="nombres" value={datosEditados.nombres} onChange={handleChange} className={styles.udec_det_input} /> 
                                    : <p>{usuario.nombres}</p>
                                }
                            </div>
                            <div className={styles.udec_det_field}>
                                <label>Apellidos</label>
                                {editando ? 
                                    <input name="apellidos" value={datosEditados.apellidos} onChange={handleChange} className={styles.udec_det_input} /> 
                                    : <p>{usuario.apellidos}</p>
                                }
                            </div>
                            <div className={styles.udec_det_field}>
                                <label>Correo Institucional</label>
                                {editando ? 
                                    <input name="correo" value={datosEditados.correo} onChange={handleChange} className={styles.udec_det_input} /> 
                                    : <p>{usuario.correo}</p>
                                }
                            </div>
                            <div className={styles.udec_det_field}>
                                <label>Teléfono Celular</label>
                                {editando ? 
                                    <input name="celular" value={datosEditados.celular} onChange={handleChange} className={styles.udec_det_input} /> 
                                    : <p>{usuario.celular || 'No registrado'}</p>
                                }
                            </div>
                        </div>

                        <div className={styles.udec_det_sectionTitle} style={{marginTop: '20px'}}>
                            <Icon name="graduation-cap" /> Formación Académica
                        </div>
                        <div className={styles.udec_det_dataGrid}>
                            <div className={`${styles.udec_det_field} ${styles.udec_det_full}`}>
                                <label>Facultad</label>
                                {editando ? 
                                    <input name="facultad" value={datosEditados.facultad} onChange={handleChange} className={styles.udec_det_input} /> 
                                    : <p>{usuario.facultad}</p>
                                }
                            </div>
                            <div className={`${styles.udec_det_field} ${styles.udec_det_full}`}>
                                <label>Programa Académico</label>
                                {editando ? 
                                    <input name="programa" value={datosEditados.programa} onChange={handleChange} className={styles.udec_det_input} /> 
                                    : <p>{usuario.programa}</p>
                                }
                            </div>
                        </div>
                    </div>

                    <div className={styles.udec_det_footerActions}>
                        {!editando ? (
                            <button onClick={() => setEditando(true)} className={styles.udec_det_btnEdit}>
                                <Icon name="pen-to-square" /> Editar Expediente
                            </button>
                        ) : (
                            <div className={styles.udec_det_editGroup}>
                                <button onClick={() => {setEditando(false); setDatosEditados({...usuario});}} className={styles.udec_det_btnCancel}>
                                    Cancelar
                                </button>
                                <button onClick={handleGuardar} className={styles.udec_det_btnSave}>
                                    Guardar Cambios
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

// ==========================================
// COMPONENTE PRINCIPAL: ITEM USUARIOS
// ==========================================
const ItemUsuarios = ({ API_URL }) => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [filtroFacultad, setFiltroFacultad] = useState("");
const [filtroPrograma, setFiltroPrograma] = useState("");
const [filtroEstado, setFiltroEstado] = useState("");
const [filtroFecha, setFiltroFecha] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false); // 👈 Controla visibilidad
const [usuarioParaEliminar, setUsuarioParaEliminar] = useState(null); // 👈 Guarda datos temporales

    const cargarUsuarios = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/usuarios/admin/todos`);
            setUsuarios(res.data);
        } catch (error) {
            console.error("Error al cargar usuarios:", error);
            toast.error("No se pudo conectar con la base de datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarUsuarios();
    }, []);

    // --- FUNCIONES DE EXPORTACIÓN ---
    const exportarExcel = () => {
        const datosLimpios = usuarios.map(({ id, password, resetToken, resetTokenExpiry, firebaseUid, ...resto }) => ({
            Nombres: resto.nombres,
            Apellidos: resto.apellidos,
            Correo: resto.correo,
            Celular: resto.celular || 'No registrado',
            Facultad: resto.facultad,
            Programa: resto.programa,
        }));
        const worksheet = XLSX.utils.json_to_sheet(datosLimpios);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Egresados");
        XLSX.writeFile(workbook, "Reporte_Egresados_UdeC.xlsx");
        toast.info("Descargando reporte en Excel...");
    };

    const exportarPDF = () => {
    const doc = new jsPDF();

    // Título del documento
    doc.setFontSize(18);
    doc.text("Reporte General de Egresados - UdeC", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    // Definimos las columnas y las filas
    const columnas = ["Nombres", "Apellidos", "Correo", "Celular", "Facultad", "Programa"];
    const filas = usuarios.map(u => [
        u.nombres, 
        u.apellidos, 
        u.correo, 
        u.celular || 'N/A', 
        u.facultad, 
        u.programa
    ]);

    // 🚀 LA SOLUCIÓN: Usamos autoTable(doc, {...}) en lugar de doc.autoTable
    autoTable(doc, {
        startY: 35,
        head: [columnas],
        body: filas,
        headStyles: { fillColor: [0, 104, 55] }, // Verde Institucional UdeC
        alternateRowStyles: { fillColor: [240, 240, 240] },
        styles: { fontSize: 8, cellPadding: 2 },
    });

    doc.save("Reporte_Egresados_UdeC.pdf");
    toast.info("Descargando reporte en PDF...");
};

const toggleEstado = async (usuario) => {
    const nuevoEstado = usuario.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    
    try {
        // Usamos el endpoint de actualización que ya creamos
        await axios.put(`${API_URL}/usuarios/${usuario.id}`, {
            ...usuario,
            estado: nuevoEstado
        });

        // Actualizamos el estado local para que la tabla cambie visualmente
        setUsuarios(usuarios.map(u => 
            u.id === usuario.id ? { ...u, estado: nuevoEstado } : u
        ));

        toast.success(`Usuario ${nuevoEstado === "ACTIVO" ? 'activado' : 'desactivado'}`);
    } catch (error) {
        console.error("Error al cambiar estado:", error);
        toast.error("No se pudo cambiar el estado");
    }
};

// 1. Esta función se activa al hacer clic en el botón de basura
// Antes probablemente tenías solo u.nombres
const handleEliminarClick = (id, nombres, apellidos) => {
    // Concatenamos nombres y apellidos para el nombre completo
    const nombreCompleto = `${nombres} ${apellidos}`;
    setUsuarioParaEliminar({ id, nombre: nombreCompleto });
    setIsModalOpen(true);
};

// 2. Esta función se activa cuando el usuario pulsa "Sí, eliminar" en el modal elegante
const ejecutarEliminacion = async () => {
    if (!usuarioParaEliminar) return;

    try {
        await axios.delete(`${API_URL}/usuarios/${usuarioParaEliminar.id}`);
        setUsuarios(usuarios.filter(u => u.id !== usuarioParaEliminar.id));
        toast.success(`El perfil de "${usuarioParaEliminar.nombre}" ha sido eliminado correctamente`);
    } catch (error) {
        console.error("Error al eliminar:", error);
        toast.error("No se pudo eliminar el usuario");
    } finally {
        // Cerramos y limpiamos siempre
        setIsModalOpen(false);
        setUsuarioParaEliminar(null);
    }
};

const usuariosFiltrados = usuarios.filter(u => {
    const busquedaLimpia = busqueda.trim().toLowerCase().replace(/\s+/g, ' ');
    const nombreCompleto = `${u.nombres} ${u.apellidos}`.toLowerCase().replace(/\s+/g, ' ');
    
    // Coincidencia de búsqueda manual
    const matchBusqueda = nombreCompleto.includes(busquedaLimpia) || u.correo.toLowerCase().includes(busquedaLimpia);
    
    // Coincidencia de filtros dropdown
    const matchFacultad = filtroFacultad === "" || u.facultad === filtroFacultad;
    const matchPrograma = filtroPrograma === "" || u.programa === filtroPrograma;
    const matchEstado = filtroEstado === "" || u.estado === filtroEstado;
    
    // Filtro por fecha (compara solo la parte YYYY-MM-DD)
    const matchFecha = filtroFecha === "" || (u.createdAt && u.createdAt.split('T')[0] === filtroFecha);

    return matchBusqueda && matchFacultad && matchPrograma && matchEstado && matchFecha;
});

    if (loading) return (
        <div className={styles.loaderContainer}>
            <div className={styles.spinner}></div>
            <p>Cargando egresados...</p>
        </div>
    );

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


return (
    <div className={styles.container}>
        {/* Modal de Detalle con Key única para resetear estado */}
        {usuarioSeleccionado && (
            <ModalPerfil 
                key={usuarioSeleccionado.id} 
                usuario={usuarioSeleccionado} 
                API_URL={API_URL}
                onClose={() => setUsuarioSeleccionado(null)} 
                onUpdate={cargarUsuarios} 
            />
        )}

        {/* Encabezado Superior */}
        <div className={styles.header}>
            <div>
                <h2 className={styles.title}>Gestión de Egresados</h2>
                <p className={styles.subtitle}>Total registrados: {usuarios.length}</p>
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

        {/* 🚀 NUEVA BARRA DE FILTROS Y BÚSQUEDA */}
        <div className={styles.filterBar}>
            {/* Buscador Principal */}
            <div className={styles.searchBoxMain}> {/* 👈 Verifica que diga searchBoxMain */}
    <Icon name="magnifying-glass" />
    <input 
        type="text" 
        placeholder="Buscar por nombre o correo..." 
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        autoComplete="off"
    />
</div>
            
            {/* Filtro por Facultad */}
            <select 
                value={filtroFacultad} 
                onChange={(e) => setFiltroFacultad(e.target.value)} 
                className={styles.filterSelect}
            >
                <option value="">Todas las Facultades</option>
                {[...new Set(usuarios.map(u => u.facultad))].filter(Boolean).map(f => (
                    <option key={f} value={f}>{f}</option>
                ))}
            </select>

            {/* Filtro por Estado */}
            <select 
                value={filtroEstado} 
                onChange={(e) => setFiltroEstado(e.target.value)} 
                className={styles.filterSelect}
            >
                <option value="">Todos los Estados</option>
                <option value="ACTIVO">Activos</option>
                <option value="INACTIVO">Inactivos</option>
            </select>

            {/* Filtro por Fecha de Registro */}
            <div className={styles.dateFilterContainer}>
                <label>Desde:</label>
                <input 
                    type="date" 
                    value={filtroFecha} 
                    onChange={(e) => setFiltroFecha(e.target.value)} 
                    className={styles.filterDate}
                />
            </div>
            
            {/* Botón para limpiar filtros (solo aparece si hay algo activo) */}
            {(filtroFacultad || filtroEstado || filtroFecha || busqueda) && (
                <button 
                    className={styles.btnClearFilters} 
                    onClick={() => {
                        setFiltroFacultad(""); 
                        setFiltroEstado(""); 
                        setFiltroFecha(""); 
                        setBusqueda("");
                    }}
                >
                    <Icon name="filter-circle-xmark" /> Limpiar
                </button>
            )}
        </div>

        {/* Tabla de Resultados */}
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Nombre Completo</th>
                        <th>Correo Institucional</th>
                        <th>Postulaciones</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {usuariosFiltrados.length > 0 ? (
                        usuariosFiltrados.map(u => (
                            <tr key={u.id}>
                                <td>
                                    <div className={styles.userName}>
                                        <strong>{u.nombres} {u.apellidos}</strong>
                                        {/* 🕒 Muestra la Fecha y Hora Colombiana del Registro */}
                                        <span className={styles.registrationDate}>
                                            <Icon name="calendar-day" /> {formatearFechaLog(u.createdAt)}
                                        </span>
                                    </div>
                                </td>
                                <td>{u.correo}</td>
                                <td>
                                    <span className={styles.countBadge}>
                                        {u._count?.postulaciones || 0} Postulaciones
                                    </span>
                                </td>
                                <td>
                                    <div className={styles.udec_status_container}>
                                        <button 
                                            className={u.estado === "ACTIVO" ? styles.statusActiveBtn : styles.statusInactiveBtn}
                                            onClick={() => toggleEstado(u)}
                                            title={u.estado === "ACTIVO" ? "Click para desactivar" : "Click para activar"}
                                        >
                                            <span className={styles.statusDot}></span>
                                            {u.estado || "ACTIVO"}
                                        </button>
                                    </div>
                                </td>
                                <td className={styles.actions}>
                                    <button 
                                        className={styles.viewBtn} 
                                        onClick={() => setUsuarioSeleccionado(u)}
                                        title="Ver Perfil"
                                    >
                                        <Icon name="user-tie" />
                                    </button>
                                   <button 
    className={styles.deleteBtn} 
    // Pasamos u.id, u.nombres y u.apellidos
    onClick={() => handleEliminarClick(u.id, u.nombres, u.apellidos)}
    title="Eliminar"
>
    <Icon name="trash-can" />
</button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className={styles.empty}>
                                <div className={styles.noResults}>
                                    <Icon name="folder-open" />
                                    <p>No se encontraron egresados con los filtros aplicados.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        <ModalConfirmacion 
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setUsuarioParaEliminar(null);
                }}
                onConfirm={ejecutarEliminacion}
                nombreEmpresa={usuarioParaEliminar?.nombre || ""} 
            />
    </div>
);
};

export default ItemUsuarios;