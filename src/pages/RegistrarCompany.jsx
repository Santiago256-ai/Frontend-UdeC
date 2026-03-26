import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react'; // 🟢 Importa los iconos
import API from "../services/api";
import styles from './RegistrarCompany.module.css';

// --- DATOS ESTÁTICOS ---
const DATOS_UBICACION = {
    'Amazonas': ['Leticia'],
    'Antioquia': ['Medellín', 'Bello', 'Envigado', 'Itagüí', 'Rionegro', 'Otra Ciudad'],
    'Arauca': ['Arauca'],
    'Atlántico': ['Barranquilla', 'Soledad', 'Malambo', 'Puerto Colombia', 'Otra Ciudad'],
    'Bolívar': ['Cartagena', 'Magangué', 'Turbaco', 'Otra Ciudad'],
    'Boyacá': ['Tunja', 'Duitama', 'Sogamoso', 'Otra Ciudad'],
    'Caldas': ['Manizales', 'Riosucio', 'La Dorada', 'Otra Ciudad'],
    'Caquetá': ['Florencia'],
    'Casanare': ['Yopal'],
    'Cauca': ['Popayán', 'Santander de Quilichao', 'Otra Ciudad'],
    'Cesar': ['Valledupar', 'Aguachica', 'Otra Ciudad'],
    'Chocó': ['Quibdó'],
    'Córdoba': ['Montería', 'Sahagún', 'Lorica', 'Otra Ciudad'],
    'Cundinamarca': ['Bogotá', 'Soacha', 'Facatativá', 'Chía', 'Zipaquirá', 'Otra Ciudad'],
    'Guainía': ['Inírida'],
    'Guaviare': ['San José del Guaviare'],
    'Huila': ['Neiva', 'Pitalito', 'Garzón', 'Otra Ciudad'],
    'La Guajira': ['Riohacha', 'Maicao', 'Otra Ciudad'],
    'Magdalena': ['Santa Marta', 'Ciénaga', 'Plato', 'Otra Ciudad'],
    'Meta': ['Villavicencio', 'Puerto López', 'Granada', 'Otra Ciudad'],
    'Nariño': ['Pasto', 'Ipiales', 'Tumaco', 'Otra Ciudad'],
    'Norte de Santander': ['Cúcuta', 'Ocaña', 'Pamplona', 'Otra Ciudad'],
    'Putumayo': ['Mocoa', 'Puerto Asís', 'Otra Ciudad'],
    'Quindío': ['Armenia', 'Quimbaya', 'Montenegro', 'Otra Ciudad'],
    'Risaralda': ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'Otra Ciudad'],
    'San Andrés y Providencia': ['San Andrés'],
    'Santander': ['Bucaramanga', 'Floridablanca', 'Barrancabermeja', 'Giron', 'Otra Ciudad'],
    'Sucre': ['Sincelejo', 'Corozal', 'Since', 'Otra Ciudad'],
    'Tolima': ['Ibagué', 'Espinal', 'Honda', 'Otra Ciudad'],
    'Valle del Cauca': ['Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Otra Ciudad'],
    'Vaupés': ['Mitú'],
    'Vichada': ['Puerto Carreño'],
};

const SECTORES_ECONOMICOS = ['Agricultura', 'Industria', 'Servicios', 'Comercio', 'Financiero', 'Tecnología', 'Otro'];
const CANALES_DISTRIBUCION_OPCIONES = ['Venta Directa', 'Distribuidores Mayoristas', 'Minoris. y Puntos de Venta', 'Plataformas E-commerce', 'Redes Sociales y Apps', 'Otro Canal'];

export default function RegistrarCompany() {
    const navigate = useNavigate();
    const initialFormData = {
        companyName: '', email: '', phones: '', contactName: '', nit: '', modalidad: '',
        address: '', department: '', city: '',
        companyType: '', otherCompanyType: '', // 👈 Agrégala aquí
        economicSector: [], foundationYear: '', employees: '',
        annualRevenue: '', totalAssets: '', equity: '',
        distributionChannels: [], otroCanalDistribucion: '', mainClients: '',
        password: '', confirmPassword: '',
        autorizaDatos: false, aceptaMarketing: false, comparteTerceros: false, aceptaRetencion: false,
        confirmacionFinal: false,
    };
const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [currentStep, setCurrentStep] = useState(1);
    const [errors, setErrors] = useState({});
    const [otroSector, setOtroSector] = useState('');
    const [isEconomicDropdownOpen, setIsEconomicDropdownOpen] = useState(false);
    const [isChannelsDropdownOpen, setIsChannelsDropdownOpen] = useState(false);
    const [statusModal, setStatusModal] = useState({ show: false, type: '', message: '' });
    const [highlightError, setHighlightError] = useState(false);

    const economicRef = useRef(null);
    const channelsRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (economicRef.current && !economicRef.current.contains(event.target)) setIsEconomicDropdownOpen(false);
            if (channelsRef.current && !channelsRef.current.contains(event.target)) setIsChannelsDropdownOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    // Actualiza tu función de cierre
const closeStatusModal = (targetStep = null) => {
    setStatusModal({ ...statusModal, show: false });
    
    if (statusModal.type === 'success') {
        navigate('/');
    } else if (targetStep) {
        setCurrentStep(targetStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 🟢 ACTIVA LA ANIMACIÓN:
        setHighlightError(true);
        // La apagamos después de 3 segundos para que pueda repetirse si es necesario
        setTimeout(() => setHighlightError(false), 3000);
    }
};

    const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // 🟢 Lógica especial para el teléfono
    if (name === 'phones') {
        // Solo permite números (elimina todo lo que no sea dígito)
        const onlyNums = value.replace(/[^0-9]/g, '');
        
        // No permite escribir más de 10 caracteres
        if (onlyNums.length > 10) return;

        setFormData(prev => ({ ...prev, [name]: onlyNums }));
    } else {
        // Lógica normal para los demás campos
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }

    setErrors(prev => ({ ...prev, [name]: '' }));
};

    const handleMultiSelectChange = (fieldName, event) => {
        const { value, checked } = event.target;
        setFormData(prev => {
            const currentArray = prev[fieldName];
            const newArray = checked ? [...currentArray, value] : currentArray.filter(item => item !== value);
            if (!checked && value === 'Otro') setOtroSector('');
            if (!checked && value === 'Otro Canal') setFormData(p => ({...p, otroCanalDistribucion: ''}));
            if (newArray.length > 0) setErrors(p => ({ ...p, [fieldName]: '' }));
            return { ...prev, [fieldName]: newArray };
        });
    };

// 🟢 1. Función para validar errores (se dispara al dar clic en Siguiente)
    const validateStep = (step) => {
        let stepErrors = {};
        const emailRegex = /\S+@\S+\.\S+/;
        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+={}[\]:;\"'<>,.?/\\|~`]).{8,}$/;

        if (step === 1) {
            if (!formData.companyName.trim()) stepErrors.companyName = 'Nombre requerido';
            if (!formData.email.trim() || !emailRegex.test(formData.email)) stepErrors.email = 'Correo inválido';
            if (!formData.phones.trim()) {
        stepErrors.phones = 'Teléfono requerido';
    } else if (formData.phones.length !== 10) {
        // 🟢 Valida que sean exactamente 10 para Colombia
        stepErrors.phones = 'Debe tener exactamente 10 dígitos';
    }
            if (!formData.contactName.trim()) stepErrors.contactName = 'Nombre de contacto requerido';
            if (!formData.password) stepErrors.password = 'Contraseña requerida';
            else if (!passwordRegex.test(formData.password)) stepErrors.password = 'Contraseña débil (8+ carac, Mayús, Núm, Especial (ej: #, $, @)';
            if (formData.password !== formData.confirmPassword) stepErrors.confirmPassword = 'Las contraseñas no coinciden';
            if (!formData.modalidad) stepErrors.modalidad = 'Requerido';
        }
        if (step === 2) {
            if (!formData.address.trim()) stepErrors.address = 'Dirección requerida';
            if (!formData.department) stepErrors.department = 'Requerido';
            if (!formData.city) stepErrors.city = 'Requerido';
        }
        if (step === 3) {
            if (!formData.companyType) stepErrors.companyType = 'Requerido';
            if (formData.companyType === 'otra' && !formData.otherCompanyType?.trim()) stepErrors.otherCompanyType = 'Especifique el tipo';
            if (formData.economicSector.length === 0) stepErrors.economicSector = 'Seleccione al menos uno';
            if (!formData.foundationYear) stepErrors.foundationYear = 'Requerido';
            if (!formData.employees) stepErrors.employees = 'Requerido';
        }
        if (step === 4) {
    if (!formData.annualRevenue) stepErrors.annualRevenue = 'Requerido';
    if (formData.distributionChannels.length === 0) stepErrors.distributionChannels = 'Seleccione al menos uno';
    
    // 🟢 Validación para el canal extra
    if (formData.distributionChannels.includes('Otro Canal') && !formData.otroCanalDistribucion?.trim()) {
        stepErrors.otroCanalDistribucion = 'Especifique el canal';
    }

    if (!formData.mainClients.trim()) stepErrors.mainClients = 'Requerido';
}
        if (step === 5 && !formData.autorizaDatos) stepErrors.autorizaDatos = 'Debe aceptar la política';
        if (step === 6 && !formData.confirmacionFinal) stepErrors.confirmacionFinal = 'Debe confirmar';

        setErrors(stepErrors);
        return Object.keys(stepErrors).length === 0;
    };

    // 🟢 2. Función para desactivar el botón visualmente (Revisión en tiempo real)
    // 🟢 Función corregida: Revisión en tiempo real para activar/desactivar botones
    const isStepIncomplete = () => {
        if (currentStep === 1) {
            return !formData.companyName.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword || formData.phones.length !== 10 || !formData.modalidad ;
        }
        if (currentStep === 2) {
            return !formData.address.trim() || !formData.department || !formData.city;
        }
        if (currentStep === 3) {
            // Si es 'otra', también validamos que haya escrito cuál
            const otherTypeValid = formData.companyType === 'otra' ? !!formData.otherCompanyType?.trim() : true;
            return !formData.companyType || formData.economicSector.length === 0 || !otherTypeValid;
        }
        if (currentStep === 4) {
    // Si incluye 'Otro Canal', verificamos que el texto no esté vacío
    const otherChannelValid = formData.distributionChannels.includes('Otro Canal') 
        ? !!formData.otroCanalDistribucion?.trim() 
        : true;

    return !formData.annualRevenue || formData.distributionChannels.length === 0 || !formData.mainClients.trim() || !otherChannelValid;
}
        if (currentStep === 5) return !formData.autorizaDatos;
        if (currentStep === 6) return !formData.confirmacionFinal;
        return false;
    };

    // 🟢 3. Acción del botón Siguiente
    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 6));
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Sube la pantalla suavemente
        }
    };

    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    
    // 1. Procesar Sector Económico (reemplazar 'Otro' por el texto escrito)
    let finalEconomicSector = formData.economicSector.includes('Otro') 
        ? [...formData.economicSector.filter(s => s !== 'Otro'), otroSector.trim()]
        : formData.economicSector;

    // 2. Procesar Canales de Distribución
    let finalDistributionChannels = formData.distributionChannels.includes('Otro Canal')
        ? [...formData.distributionChannels.filter(c => c !== 'Otro Canal'), formData.otroCanalDistribucion.trim()]
        : formData.distributionChannels;

    // 3. Crear el objeto final para el envío
    const finalFormData = {
        ...formData,
        // 🟢 NUEVA MODIFICACIÓN: Si eligió 'otra', enviamos el contenido de otherCompanyType
        companyType: formData.companyType === 'otra' 
            ? formData.otherCompanyType?.trim() 
            : formData.companyType,
        economicSector: finalEconomicSector,
        distributionChannels: finalDistributionChannels,
    };

    // 4. Limpieza de campos temporales o de validación
    delete finalFormData.confirmPassword;
    delete finalFormData.otroCanalDistribucion;
    delete finalFormData.otherCompanyType; // 👈 Ya lo movimos a companyType arriba
    delete finalFormData.confirmacionFinal;

    try {
    const response = await API.post("/empresas", finalFormData);
    // 🟢 REEMPLAZO DEL ALERT DE ÉXITO:
    setStatusModal({ 
        show: true, 
        type: 'success', 
        message: '¡Registro Exitoso! La empresa ha sido vinculada correctamente en el sistema.' 
    });
} catch (err) {
    setStatusModal({ 
        show: true, 
        type: 'error', 
        targetStep: 1, // 👈 Indica que debe volver al primer paso
        message: (
            <span>
                No se pudo completar el registro. Es posible que el <strong>correo electrónico</strong> o el <strong>NIT</strong> ya se encuentren registrados en nuestra base de datos.
            </span>
        )
    });
}
}; 

    const progressPercentage = ((currentStep - 1) / 5) * 100;

    return (
        <div className={styles.companyContainer}>
            <div className={styles.companyCard}>
                
                {/* --- NUEVO ENCABEZADO TIPO EGRESADOS --- */}
                <div className={styles.headerTopWhite}>
                    <img src="/Logo.png" alt="Empresa Logo" className={styles.logoImg} />
                    <div className={styles.headerDivider}></div>
                    <img src="/UdeC2.png" alt="UdeC Logo" className={styles.logoUdec} />
                </div>

                <div className={styles.headerBottomGreen}>
                    <h1 className={styles.formTitle}>Registro Empresarial</h1>
                    <p className={styles.formSubtitle}>Conecta con talento preparado y lleva tu empresa al siguiente nivel.</p>
                </div>
                {/* ---------------------------------------- */}

                {/* --- CONTENEDOR DEL FORMULARIO (Para los márgenes) --- */}
                <div className={styles.formContent}>
                    
        <div 
    className={styles.progressSteps} 
    style={{ '--progress-width': `${progressPercentage}%` }}
>
    {[1, 2, 3, 4, 5, 6].map((s) => (
        <div 
            key={s} 
            className={`
                ${styles.step} 
                ${currentStep === s ? styles.active : ''} 
                ${currentStep > s ? styles.completed : ''}
            `}
        >
            {/* 🟢 CAMBIO AQUÍ: Condicional para el contenido del círculo */}
            <div className={styles.stepNumber}>
                {currentStep > s ? (
                    <span className={styles.checkIcon}>✓</span> // Si está completado, muestra el Check
                ) : (
                    s // Si no, muestra el Número
                )}
            </div>
        </div>
    ))}
</div>

                    <form onSubmit={handleSubmit} className={styles.companyForm}>
                        {/* AQUÍ SIGUE TU CÓDIGO NORMAL DEL PASO 1... */}
                        {currentStep === 1 && (
                            <div className={styles.formStep}>
                                <h2 className={styles.stepTitle}>Datos de Acceso y Contacto</h2>
                                {/* ... resto de tus inputs ... */}
                            
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Nombre Empresa *</label>
                                    <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className={`${styles.formInput} ${errors.companyName ? styles.inputError : ''}`} />
                                    {errors.companyName && <span className={styles.errorMessage}>{errors.companyName}</span>}
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Correo Electrónico *</label>
                                    <input 
    type="email" 
    name="email" 
    value={formData.email} 
    onChange={handleChange} 
    className={`
        ${styles.formInput} 
        ${errors.email ? styles.inputError : ''} 
        ${highlightError ? styles.inputHighlight : ''} 
    `} 
/>
                                    {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
    <label className={styles.formLabel}>Teléfono de Contacto *</label>
    <input 
        type="tel" // 🟢 Cambiado a 'tel'
        name="phones" 
        value={formData.phones} 
        onChange={handleChange} 
        placeholder="Ej: 3156789032"
        className={`${styles.formInput} ${errors.phones ? styles.inputError : ''}`} 
    />
    {errors.phones && <span className={styles.errorMessage}>{errors.phones}</span>}
</div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Nombre del Contacto *</label>
                                    <input type="text" name="contactName" value={formData.contactName} onChange={handleChange} className={`${styles.formInput} ${errors.contactName ? styles.inputError : ''}`} />
                                    {errors.contactName && <span className={styles.errorMessage}>{errors.contactName}</span>}
                                </div>
                            </div>

                            <div className={styles.formRow}>
    {/* Campo NIT */}
    <div className={styles.formGroup}>
        <label className={styles.formLabel}>NIT (Opcional)</label>
        <input 
            type="text" 
            name="nit" 
            value={formData.nit} 
            onChange={handleChange} 
            className={`
                ${styles.formInput} 
                ${highlightError ? styles.inputHighlight : ''} 
            `} 
            placeholder="Ej: 900.123.456-7"
        />
    </div>

    {/* 🟢 Selector de Modalidad */}
    <div className={styles.formGroup}>
        <label className={styles.formLabel}>Modalidad de Empresa *</label>
        <select 
            name="modalidad" 
            value={formData.modalidad} 
            onChange={handleChange} 
            className={`${styles.formInput} ${errors.modalidad ? styles.inputError : ''}`}
        >
            <option value="">Seleccione...</option>
            <option value="Física">Física (Sede Principal)</option>
            <option value="Virtual">Virtual / E-commerce</option>
            <option value="Híbrida">Híbrida</option>
        </select>
        {errors.modalidad && <span className={styles.errorMessage}>{errors.modalidad}</span>}
    </div>
</div>

                            <div className={styles.formRow}>
            {/* --- Campo Contraseña --- */}
            <div className={styles.formGroup}>
                <label className={styles.formLabel}>Contraseña *</label>
                
                {/* 🟢 CONTENEDOR PARA EL OJITO */}
                <div className={styles.passwordWrapper}>
                    <input 
                        /* 🟢 Tipo dinámico: 'text' o 'password' */
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        className={`${styles.formInput} ${errors.password ? styles.inputError : ''}`} 
                    />
                    
                    {/* 🟢 BOTÓN DEL OJITO */}
                    <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className={styles.togglePasswordBtn}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
            </div>

            {/* --- Campo Confirmar Contraseña (Lo mismo) --- */}
            <div className={styles.formGroup}>
                <label className={styles.formLabel}>Confirmar Contraseña *</label>
                
                <div className={styles.passwordWrapper}>
                    <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        name="confirmPassword" 
                        value={formData.confirmPassword} 
                        onChange={handleChange} 
                        className={`${styles.formInput} ${errors.confirmPassword ? styles.inputError : ''}`} 
                    />
                    <button 
                        type="button" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                        className={styles.togglePasswordBtn}
                    >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                {errors.confirmPassword && <span className={styles.errorMessage}>{errors.confirmPassword}</span>}
            </div>
        </div>
    </div>
)}

                    {currentStep === 2 && (
                        <div className={styles.formStep}>
                            <h2 className={styles.stepTitle}>Ubicación</h2>
                            <div className={styles.formGroup}>
    <label className={styles.formLabel}>Dirección Principal *</label>
    <input 
        type="text" 
        name="address" 
        value={formData.address} 
        onChange={handleChange} 
        /* 🟢 Si hay error en 'address', aplica la clase 'inputError' */
        className={`${styles.formInput} ${errors.address ? styles.inputError : ''}`} 
    />
    {/* 🟢 Si existe el error, muestra el texto pequeño en rojo */}
    {errors.address && <span className={styles.errorMessage}>{errors.address}</span>}
</div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Departamento *</label>
                                    <select name="department" value={formData.department} onChange={handleChange} className={`${styles.formInput} ${errors.department ? styles.inputError : ''}`}>
                                        <option value="">Seleccione...</option>
                                        {Object.keys(DATOS_UBICACION).map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Ciudad *</label>
                                    <select name="city" value={formData.city} onChange={handleChange} className={`${styles.formInput} ${errors.city ? styles.inputError : ''}`} disabled={!formData.department}>
                                        <option value="">Seleccione...</option>
                                        {formData.department && DATOS_UBICACION[formData.department].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className={styles.formStep}>
                            <h2 className={styles.stepTitle}>Información Empresarial</h2>
                            <div className={styles.formRow}>
    <div className={styles.formGroup}>
        <label className={styles.formLabel}>Tipo de Empresa *</label>
        <select 
            name="companyType" 
            value={formData.companyType} 
            onChange={handleChange} 
            className={`${styles.formInput} ${errors.companyType ? styles.inputError : ''}`}
        >
            <option value="">Seleccione...</option>
            <option value="sas">S.A.S</option>
            <option value="sa">S.A</option>
            <option value="ltda">Limitada</option>
            <option value="pn">Persona Natural</option>
            <option value="otra">Otra</option>
        </select>
        {errors.companyType && <span className={styles.errorMessage}>{errors.companyType}</span>}

        {/* 🟢 NUEVO: Campo condicional para "Otra" empresa */}
        {formData.companyType === 'otra' && (
            <div style={{ marginTop: '10px' }}>
                <label className={styles.formLabel}>¿Cuál tipo de empresa? *</label>
                <input 
                    type="text" 
                    name="otherCompanyType" // Asegúrate de que este nombre coincida con tu initialFormData si lo tienes
                    value={formData.otherCompanyType || ''} 
                    onChange={handleChange} 
                    className={`${styles.formInput} ${errors.otherCompanyType ? styles.inputError : ''}`}
                    placeholder="Escriba el tipo de empresa..."
                />
                {errors.otherCompanyType && <span className={styles.errorMessage}>{errors.otherCompanyType}</span>}
            </div>
        )}
    </div>
                                <div className={styles.formGroup} ref={economicRef}>
                                    <label className={styles.formLabel}>Sector Económico *</label>
                                    <div className={`${styles.customSelectHeader} ${errors.economicSector ? styles.inputError : ''}`} onClick={() => setIsEconomicDropdownOpen(!isEconomicDropdownOpen)}>
                                        {formData.economicSector.length > 0 ? formData.economicSector.join(', ') : 'Seleccione...'}
                                    </div>
                                    {isEconomicDropdownOpen && (
    <div className={styles.customSelectDropdown}>
        {SECTORES_ECONOMICOS.map(s => (
            <label key={s} className={styles.dropdownOption}>
                <input 
                    type="checkbox" 
                    value={s} 
                    checked={formData.economicSector.includes(s)} 
                    onChange={(e) => handleMultiSelectChange('economicSector', e)} 
                />
                <span>{s}</span>
            </label>
        ))}
    </div>
)}
                                    {formData.economicSector.includes('Otro') && (
    <div className={styles.formGroup} style={{marginTop: '10px'}}>
        <label className={styles.formLabel}>¿Cuál otro sector? *</label>
        <input 
            type="text" 
            value={otroSector} 
            onChange={(e) => setOtroSector(e.target.value)} 
            className={styles.formInput} 
            placeholder="Escriba su sector..."
        />
    </div>
)}
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Año de Fundación *</label>
                                    <select name="foundationYear" value={formData.foundationYear} onChange={handleChange} className={`${styles.formInput} ${errors.foundationYear ? styles.inputError : ''}`}>
                                        <option value="">Seleccione...</option>
                                        {Array.from({length: 50}, (_, i) => new Date().getFullYear() - i).map(year => <option key={year} value={year}>{year}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Empleados *</label>
                                    <select name="employees" value={formData.employees} onChange={handleChange} className={`${styles.formInput} ${errors.employees ? styles.inputError : ''}`}>
                                        <option value="">Seleccione...</option>
                                        <option value="1-10">1-10</option>
                                        <option value="11-50">11-50</option>
                                        <option value="51-200">51-200</option>
                                        <option value="201-500">201-500</option>
                                        <option value="501+">Más de 500</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className={styles.formStep}>
                            <h2 className={styles.stepTitle}>Información Financiera</h2>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Rango de Ingresos *</label>
                                    <select name="annualRevenue" value={formData.annualRevenue} onChange={handleChange} className={`${styles.formInput} ${errors.annualRevenue ? styles.inputError : ''}`}>
                                        <option value="">Seleccione...</option>
                                        <option value="0-100">0 - 100 Millones</option>
                                        <option value="100-500">100 - 500 Millones</option>
                                        <option value="500+">Más de 500 Millones</option>
                                    </select>
                                </div>
                                {/* --- CANALES DE DISTRIBUCIÓN --- */}
<div className={styles.formGroup} ref={channelsRef}>
    <label className={styles.formLabel}>Canales de Distribución *</label>
    <div 
        className={`${styles.customSelectHeader} ${errors.distributionChannels ? styles.inputError : ''}`} 
        onClick={() => setIsChannelsDropdownOpen(!isChannelsDropdownOpen)}
    >
        {formData.distributionChannels.length > 0 ? formData.distributionChannels.join(', ') : 'Seleccione...'}
    </div>
    
    {isChannelsDropdownOpen && (
        <div className={styles.customSelectDropdown}>
            {CANALES_DISTRIBUCION_OPCIONES.map(c => (
                <label key={c} className={styles.dropdownOption}>
                    <input 
                        type="checkbox" 
                        value={c} 
                        checked={formData.distributionChannels.includes(c)} 
                        onChange={(e) => handleMultiSelectChange('distributionChannels', e)} 
                    /> 
                    <span>{c}</span>
                </label>
            ))}
        </div>
    )}

    {/* 🟢 NUEVO: Campo condicional para "Otro Canal" */}
    {formData.distributionChannels.includes('Otro Canal') && (
        <div style={{ marginTop: '10px' }}>
            <label className={styles.formLabel}>¿Cuál otro canal? *</label>
            <input 
                type="text" 
                name="otroCanalDistribucion" 
                value={formData.otroCanalDistribucion} 
                onChange={handleChange} 
                className={`${styles.formInput} ${errors.otroCanalDistribucion ? styles.inputError : ''}`}
                placeholder="Escriba el canal de distribución..."
            />
            {errors.otroCanalDistribucion && <span className={styles.errorMessage}>{errors.otroCanalDistribucion}</span>}
        </div>
    )}
</div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Principales Clientes *</label>
                                <textarea name="mainClients" value={formData.mainClients} onChange={handleChange} className={`${styles.formInput} ${errors.mainClients ? styles.inputError : ''}`} rows="3" />
                            </div>
                        </div>
                    )}

                    {currentStep === 5 && (
                        <div className={styles.formStep}>
                            <h2 className={styles.stepTitle}>Autorización de Datos</h2>
                            <div className={styles.policyBlock}>
                                <p>Al marcar la casilla, usted autoriza el tratamiento de sus datos personales bajo la ley de protección de datos vigente...</p>
                            </div>
                            <label className={styles.checkboxGroup}>
                                <input type="checkbox" name="autorizaDatos" checked={formData.autorizaDatos} onChange={handleChange} />
                                <span className={errors.autorizaDatos ? styles.errorMessage : ''}>Autorizo el uso de datos personales *</span>
                            </label>
                            <label className={styles.checkboxGroup}>
                                <input type="checkbox" name="aceptaMarketing" checked={formData.aceptaMarketing} onChange={handleChange} />
                                Acepto recibir comunicaciones de marketing.
                            </label>
                        </div>
                    )}

                    {currentStep === 6 && (
                        <div className={styles.formStep}>
                            <h2 className={styles.stepTitle}>Confirmación Final</h2>
                            <div className={styles.resumenContainer}>
                                <p><strong>Empresa:</strong> {formData.companyName}</p>
                                <p><strong>Correo:</strong> {formData.email}</p>
                                <p><strong>Contacto:</strong> {formData.contactName} ({formData.phones})</p>
                                <p><strong>Ubicación:</strong> {formData.city}, {formData.department}</p>
                            </div>
                            <label className={styles.checkboxGroup}>
                                <input type="checkbox" name="confirmacionFinal" checked={formData.confirmacionFinal} onChange={handleChange} />
                                <span className={errors.confirmacionFinal ? styles.errorMessage : ''}>Confirmo que toda la información es verídica *</span>
                            </label>
                        </div>
                    )}

                    {/* Controles de Navegación */}
                    <div className={styles.formNavigation}>
    {currentStep === 1 ? (
        <button type="button" onClick={() => navigate('/')} className={`${styles.udecButton} ${styles.btnSecondary}`}>Regresar</button>
    ) : (
        <button type="button" onClick={handleBack} className={`${styles.udecButton} ${styles.btnSecondary}`}>Anterior</button>
    )}

    {currentStep < 6 ? (
        <button 
            type="button" 
            onClick={handleNext} 
            /* 🟢 Si faltan datos, el botón se ve desactivado y no tiene eventos de mouse */
            className={`${styles.udecButton} ${styles.btnPrimary} ${isStepIncomplete() ? styles.btnDisabled : ''}`}
            disabled={isStepIncomplete()} 
        >
            Siguiente
        </button>
    ) : (
        <button 
            type="submit" 
            className={`${styles.udecButton} ${styles.btnSuccess} ${isStepIncomplete() ? styles.btnDisabled : ''}`}
            disabled={isStepIncomplete()}
        >
            Finalizar Registro
        </button>
    )}
</div>

                </form>
                </div>
{/* 🟢 MODAL DE ESTADO (Fuera del flujo del formulario para evitar conflictos de z-index) */}
            {statusModal.show && (
    <div className={styles.modalOverlay}>
        <div className={`${styles.statusModal} ${statusModal.type === 'success' ? styles.modalSuccess : styles.modalError}`}>
            <div className={styles.modalIcon}>
                {statusModal.type === 'success' ? '✅' : '❌'}
            </div>
            <h3 className={styles.modalTitle}>
                {statusModal.type === 'success' ? 'Operación Exitosa' : 'Hubo un inconveniente'}
            </h3>
            <p className={styles.modalText}>{statusModal.message}</p>
            
            <div className={styles.modalActions}>
    {/* 🟢 Solo aparece si hay un error y un paso al cual volver */}
    {statusModal.type === 'error' && (
        <button 
            type="button" 
            onClick={() => closeStatusModal(statusModal.targetStep)} 
            className={styles.modalBtnSecondary}
        >
            Verificar Datos
        </button>
    )}
    
    <button 
        type="button" 
        onClick={() => closeStatusModal()} 
        className={styles.modalBtn}
    >
        {statusModal.type === 'success' ? 'Ir al Inicio' : 'Cerrar'}
    </button>
</div>
        </div>
    </div>
)}

                {/* 🟢 AGREGA ESTO AQUÍ: Footer idéntico a Egresados */}
                <div className={styles.udecRegisterFooter}>
                    <p>
                        ¿Ya tienes una cuenta? 
                        <span onClick={() => navigate('/')} className={styles.loginLink} style={{cursor: 'pointer'}}> Iniciar Sesión</span>
                    </p>
                </div>
            </div>
        </div>
    );
}