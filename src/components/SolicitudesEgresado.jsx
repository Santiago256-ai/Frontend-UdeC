import React, { useState } from 'react';
import { 
    Clock, Building2, MapPin, CheckCircle2, 
    ChevronRight, FileText, Calendar, Search,
    X, Globe, DollarSign, Briefcase 
} from 'lucide-react';
import styles from './SolicitudesEgresado.module.css';
import DOMPurify from 'dompurify';

// Descripción de la vacante: HTML del editor Quill 2 de la empresa. Antes de
// pintarlo se deja sólo lo que produce ese editor (mismo criterio en
// VacantesDashboard.jsx): bloques, negrita/cursiva/subrayado/tachado, listas
// (Quill 2 marca las viñetas con data-list), encabezados, alineación por clase,
// color y resaltado por estilo, y enlaces http/https/mailto.
const purificador = DOMPurify(window); // instancia propia: sus hooks no afectan a nadie más
const CLASE_PERMITIDA = /^ql-align-(center|right|justify)$/;
const ESTILOS_PERMITIDOS = new Set(['color', 'background-color']);
const VALOR_DE_ESTILO = /^[#\w\s(),.%-]+$/;
purificador.addHook('uponSanitizeAttribute', (_nodo, datos) => {
    if (datos.attrName === 'class') {
        datos.attrValue = datos.attrValue.split(/\s+/).filter((c) => CLASE_PERMITIDA.test(c)).join(' ');
    } else if (datos.attrName === 'style') {
        datos.attrValue = datos.attrValue.split(';').map((d) => d.split(':'))
            .filter(([prop, valor, ...resto]) => !resto.length && valor && ESTILOS_PERMITIDOS.has(prop.trim().toLowerCase())
                && VALOR_DE_ESTILO.test(valor.trim()) && !/url|expression/i.test(valor))
            .map(([prop, valor]) => `${prop.trim().toLowerCase()}: ${valor.trim()}`).join('; ');
    } else if (datos.attrName === 'data-list' && !['bullet', 'ordered'].includes(datos.attrValue)) {
        datos.attrValue = '';
    }
    if (!datos.attrValue) datos.keepAttr = false;
});
purificador.addHook('afterSanitizeAttributes', (nodo) => {
    if (nodo.tagName === 'A' && nodo.hasAttribute('href')) nodo.setAttribute('rel', 'noopener noreferrer');
    else nodo.removeAttribute('rel');
});
const sanearDescripcion = (html) => purificador.sanitize(html || '', {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'ol', 'ul', 'li', 'a', 'h1', 'h2', 'h3', 'span'],
    ALLOWED_ATTR: ['href', 'rel', 'class', 'style', 'data-list'],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i, // sólo para href
    ADD_URI_SAFE_ATTR: ['data-list', 'rel'], // sin esto, su valor se validaría como URL y se borraría
});

const SolicitudesEgresado = ({ vacantes, usuarioId, resaltarPostulacionId, setResaltarPostulacionId }) => {
    const [vacanteSeleccionada, setVacanteSeleccionada] = useState(null);

    const misSolicitudes = vacantes.filter(v => 
        v.postulaciones?.some(p => p.egresadoId === usuarioId)
    );

    // --- FUNCIONES DE FORMATO DE FECHA ---

    // 1. Para fechas de CALENDARIO (Cierre de vacante) - Corrige el desfase de un día
    const formatFechaCierre = (dateString) => {
        if (!dateString) return "Indefinida";
        const date = new Date(dateString);
        // Ajuste de offset para que no se reste un día en Colombia (UTC-5)
        const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
        return utcDate.toLocaleDateString('es-ES', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    // 2. Para fechas de SISTEMA (Postulado el...) - No requiere ajuste manual
    const formatFechaPostulacion = (dateString) => {
        if (!dateString) return "Reciente";
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const obtenerEstiloEstado = (estado) => {
        switch (estado?.toUpperCase()) {
            case 'PENDIENTE': return styles.estadoPendiente;
            case 'REVISION': return styles.estadoRevision;
            case 'ENTREVISTA': return styles.estadoEntrevista;
            case 'PRUEBA': return styles.estadoPrueba;
            case 'FINALISTA': return styles.estadoFinalista;
            case 'CONTRATADO': return styles.estadoContratado;
            case 'RECHAZADO': return styles.estadoRechazado;
            default: return styles.estadoDefault;
        }
    };

    // --- EFECTO DE RESALTADO PARA CAMBIOS DE ESTADO ---
React.useEffect(() => {
    if (resaltarPostulacionId && misSolicitudes.length > 0) {
        let intentos = 0;
        const maxIntentos = 8;

        const buscarYResaltar = () => {
            const idBuscado = `post-${resaltarPostulacionId}`;
            const elemento = document.getElementById(idBuscado);

            if (elemento) {
                // 1. Scroll suave al elemento
                elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // 2. Aplicar la clase de sombreado naranja
                elemento.classList.add(styles.udecPostHighlight);
                
                // 3. Limpiar después de 4 segundos
                setTimeout(() => {
                    elemento.classList.remove(styles.udecPostHighlight);
                    if (setResaltarPostulacionId) setResaltarPostulacionId(null);
                }, 4000);
            } else if (intentos < maxIntentos) {
                intentos++;
                setTimeout(buscarYResaltar, 500); // Reintenta si la lista aún no carga
            }
        };

        buscarYResaltar();
    }
}, [resaltarPostulacionId, misSolicitudes]);

    return (
        <div className={styles.solicitudesContainer}>
            <header className={styles.solicitudesHeader}>
                <div className={styles.headerTitle}>
                    <CheckCircle2 className={styles.iconTitle} size={24} />
                    <h2>Mis Postulaciones</h2>
                </div>
                <span className={styles.countBadge}>{misSolicitudes.length} procesos activos</span>
            </header>

            <div className={styles.solicitudesGrid}>
                {misSolicitudes.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Search size={48} color="#cbd5e0" />
                        <p>No tienes postulaciones activas en este momento.</p>
                    </div>
                ) : (
                    misSolicitudes.map((vacante) => {
                        const postu = vacante.postulaciones.find(p => p.egresadoId === usuarioId);
                        const estadoActual = postu?.estado || "PENDIENTE";

                        return (
                            <div 
    key={vacante.id} 
    id={`post-${postu?.id}`} // <--- AGREGA ESTO (Usa postu?.id que es el ID de la postulación)
    className={styles.solicitudCard}
>
                                <div className={`${styles.cardIndicator} ${obtenerEstiloEstado(estadoActual)}`}></div>
                                <div className={styles.cardBody}>
                                    <div className={styles.mainInfo}>
                                        <span className={styles.empresaTag}><Building2 size={14} /> {vacante.empresa?.nombre}</span>
                                        <h3 className={styles.vacanteTitulo}>{vacante.titulo}</h3>
                                        <div className={styles.metaInfo}>
                                            <span><MapPin size={14} /> {vacante.ubicacion}</span>
                                            {/* Uso de formatFechaPostulacion aquí */}
                                            <span><Calendar size={14} /> Postulado: {formatFechaPostulacion(postu?.fecha)}</span>
                                        </div>
                                    </div>
                                    <div className={styles.statusSection}>
                                        <div className={`${styles.statusBadge} ${obtenerEstiloEstado(estadoActual)}`}>
                                            <Clock size={14} />
                                            <span>{estadoActual}</span>
                                        </div>
                                        <button 
                                            className={styles.btnVerSeguimiento}
                                            onClick={() => setVacanteSeleccionada(vacante)}
                                        >
                                            Ver Detalles <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* MODAL DE DETALLES */}
            {vacanteSeleccionada && (
                <div className={styles.modalOverlay} onClick={() => setVacanteSeleccionada(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeModal} onClick={() => setVacanteSeleccionada(null)}>
                            <X size={24} />
                        </button>
                        
                        <div className={styles.modalHeader}>
                            <div className={styles.modalBadgeEmpresa}>
                                <Building2 size={18} /> {vacanteSeleccionada.empresa?.nombre}
                            </div>
                            <h2>{vacanteSeleccionada.titulo}</h2>
                        </div>

                        <div className={styles.modalGridInfo}>
                            <div className={styles.infoBox}><MapPin size={18} /> <strong>Ubicación:</strong> {vacanteSeleccionada.ubicacion}</div>
                            <div className={styles.infoBox}><FileText size={18} /> <strong>Contrato:</strong> {vacanteSeleccionada.tipo}</div>
                            <div className={styles.infoBox}><Globe size={18} /> <strong>Modalidad:</strong> {vacanteSeleccionada.modalidad}</div>
                            <div className={styles.infoBox}><DollarSign size={18} /> <strong>Salario:</strong> {vacanteSeleccionada.salario || 'A convenir'}</div>
                            <div className={styles.infoBox}><Clock size={18} /> <strong>Jornada:</strong> {vacanteSeleccionada.jornada}</div>
                            {/* Uso de formatFechaCierre aquí */}
                            <div className={styles.infoBox}><Calendar size={18} /> <strong>Cierre:</strong> {formatFechaCierre(vacanteSeleccionada.fechaCierre)}</div>
                            <div className={styles.infoBox}><Briefcase size={18} /> <strong>Horario:</strong> {vacanteSeleccionada.horario}</div>
                        </div>

                        <div className={styles.modalDescription}>
    <h3>Descripción de la vacante:</h3>
    
    {/* CAMBIO CLAVE: Usamos dangerouslySetInnerHTML para procesar el HTML del editor */}
    <div 
        className="ql-editor-view" // Clase para los estilos que ya creamos en el CSS global/dashboard
        style={{ 
            fontSize: '15px', 
            lineHeight: '1.8', 
            color: '#475569',
            marginTop: '10px' 
        }}
        dangerouslySetInnerHTML={{ 
            __html: sanearDescripcion(vacanteSeleccionada.descripcion) || "Sin descripción disponible."
        }} 
    />
</div>

                        <div className={styles.modalFooter}>
                            <div className={styles.postulacionInfo}>
                                <CheckCircle2 size={20} color="#006b3f" />
                                <div>
                                    <strong>Postulación Enviada</strong>
                                    <p>Ya estás participando en este proceso de selección.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SolicitudesEgresado;