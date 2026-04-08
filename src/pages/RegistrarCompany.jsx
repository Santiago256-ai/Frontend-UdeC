import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react'; // 🟢 Importa los iconos
import API from "../services/api";
import styles from './RegistrarCompany.module.css';

// --- DATOS ESTÁTICOS ---
const DATOS_UBICACION = {
    'Amazonas': ['Leticia', 'Otra Ciudad...'],
    'Antioquia': ['Medellín', 'Bello', 'Envigado', 'Itagüí', 'Rionegro', 'Otra Ciudad...'],
    'Arauca': ['Arauca', 'Otra Ciudad...'],
    'Atlántico': ['Barranquilla', 'Soledad', 'Malambo', 'Puerto Colombia', 'Otra Ciudad...'],
    'Bolívar': ['Cartagena', 'Magangué', 'Turbaco', 'Otra Ciudad...'],
    'Boyacá': ['Tunja', 'Duitama', 'Sogamoso', 'Otra Ciudad...'],
    'Caldas': ['Manizales', 'Riosucio', 'La Dorada', 'Otra Ciudad...'],
    'Caquetá': ['Florencia', 'Otra Ciudad...'],
    'Casanare': ['Yopal', 'Otra Ciudad...'],
    'Cauca': ['Popayán', 'Santander de Quilichao', 'Otra Ciudad...'],
    'Cesar': ['Valledupar', 'Aguachica', 'Otra Ciudad...'],
    'Chocó': ['Quibdó', 'Otra Ciudad...'],
    'Córdoba': ['Montería', 'Sahagún', 'Lorica', 'Otra Ciudad'],
    'Cundinamarca': [
  'Agua de Dios', 'Albán', 'Anapoima', 'Anolaima', 'Apulo', 'Arbeláez', 
  'Beltrán', 'Bituima', 'Bojacá', 'Cabrera', 'Cachipay', 'Cajicá', 
  'Caparrapí', 'Cáqueza', 'Carmen de Carupa', 'Chaguaní', 'Chía', 
  'Chipaque', 'Choachí', 'Chocontá', 'Cogua', 'Cota', 'Cucunubá', 
  'El Colegio', 'El Peñón', 'El Rosal', 'Facatativá', 'Fómeque', 
  'Fosca', 'Funza', 'Fúquene', 'Fusagasugá', 'Gachalá', 'Gachetá', 
  'Gachancipá', 'Gama', 'Girardot', 'Granada', 'Guachetá', 'Guaduas', 
  'Guasca', 'Guataquí', 'Guatavita', 'Guayabal de Síquima', 'Guayabetal', 
  'Gutiérrez', 'Jerusalén', 'Junín', 'La Calera', 'La Mesa', 'La Palma', 
  'La Peña', 'La Vega', 'Lenguazaque', 'Machetá', 'Madrid', 'Manta', 
  'Medina', 'Mosquera', 'Nariño', 'Nemocón', 'Nilo', 'Nimaima', 
  'Nocaima', 'Pacho', 'Paime', 'Pandi', 'Paratebueno', 'Pasca', 
  'Puerto Salgar', 'Pulí', 'Quebradanegra', 'Quetame', 'Quipile', 
  'Ricaurte', 'San Antonio del Tequendama', 'San Bernardo', 
  'San Cayetano', 'San Francisco', 'San Juan de Rioseco', 'Sasaima', 
  'Sesquilé', 'Sibaté', 'Silvania', 'Simijaca', 'Soacha', 'Sopó', 
  'Subachoque', 'Suesca', 'Supatá', 'Susa', 'Sutatausa', 'Tabio', 
  'Tausa', 'Tena', 'Tenjo', 'Tibacuy', 'Tibirita', 'Tocaima', 
  'Tocancipá', 'Topaipí', 'Ubalá', 'Ubaque', 'Ubaté', 'Une', 
  'Utica', 'Venecia', 'Vergara', 'Vianí', 'Villagómez', 'Villapinzón', 
  'Villeta', 'Viotá', 'Yacopí', 'Zipacón', 'Zipaquirá','Otra Ciudad...'
],
    'Guainía': ['Inírida'],
    'Guaviare': ['San José del Guaviare'],
    'Huila': ['Neiva', 'Pitalito', 'Garzón', 'Otra Ciudad...'],
    'La Guajira': ['Riohacha', 'Maicao', 'Otra Ciudad...'],
    'Magdalena': ['Santa Marta', 'Ciénaga', 'Plato', 'Otra Ciudad...'],
    'Meta': ['Villavicencio', 'Puerto López', 'Granada', 'Otra Ciudad...'],
    'Nariño': ['Pasto', 'Ipiales', 'Tumaco', 'Otra Ciudad...'],
    'Norte de Santander': ['Cúcuta', 'Ocaña', 'Pamplona', 'Otra Ciudad...'],
    'Putumayo': ['Mocoa', 'Puerto Asís', 'Otra Ciudad...'],
    'Quindío': ['Armenia', 'Quimbaya', 'Montenegro', 'Otra Ciudad...'],
    'Risaralda': ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'Otra Ciudad...'],
    'San Andrés y Providencia': ['San Andrés'],
    'Santander': ['Bucaramanga', 'Floridablanca', 'Barrancabermeja', 'Giron', 'Otra Ciudad...'],
    'Sucre': ['Sincelejo', 'Corozal', 'Since', 'Otra Ciudad...'],
    'Tolima': ['Ibagué', 'Espinal', 'Honda', 'Otra Ciudad...'],
    'Valle del Cauca': ['Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Otra Ciudad...'],
    'Vaupés': ['Mitú', 'Otra Ciudad...'],
    'Vichada': ['Puerto Carreño', 'Otra Ciudad...'],
};

const SECTORES_ECONOMICOS = ['Agricultura', 'Industria', 'Servicios', 'Comercio', 'Financiero', 'Tecnología', 'Otro'];
const CANALES_DISTRIBUCION_OPCIONES = ['Venta Directa', 'Distribuidores Mayoristas', 'Minoris. y Puntos de Venta', 'Plataformas E-commerce', 'Redes Sociales y Apps', 'Otro Canal'];

export default function RegistrarCompany() {
    const navigate = useNavigate();
    const initialFormData = {
        companyName: '', email: '', phones: '', contactName: '', nit: '', modalidad: '',
        address: '', department: '', city: '', otherCity: '',
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
    const [searchTermDept, setSearchTermDept] = useState('');
const [searchTermCity, setSearchTermCity] = useState('');
const [showDeptOpts, setShowDeptOpts] = useState(false);
const [showCityOpts, setShowCityOpts] = useState(false);
const [openMenus, setOpenMenus] = useState({
    companyType: false,
    foundationYear: false,
    employees: false,
    annualRevenue: false,
    modalidad: false
});

// Función para abrir uno y cerrar los demás
const toggleMenu = (menuName) => {
    setOpenMenus(prev => ({
        companyType: false, foundationYear: false, employees: false, annualRevenue: false, // cerramos todos
        [menuName]: !prev[menuName] // abrimos el seleccionado
    }));
};
    const [currentStep, setCurrentStep] = useState(1);
    const [errors, setErrors] = useState({});
    const [otroSector, setOtroSector] = useState('');
    const [isEconomicDropdownOpen, setIsEconomicDropdownOpen] = useState(false);
    const [isChannelsDropdownOpen, setIsChannelsDropdownOpen] = useState(false);
    const [statusModal, setStatusModal] = useState({ show: false, type: '', message: '' });
    const [highlightError, setHighlightError] = useState(false);

    const economicRef = useRef(null);
    const cityInputRef = useRef(null);
    const channelsRef = useRef(null);

    useEffect(() => {
    function handleClickOutside(event) {
        // 1. Manejo de Sector Económico y Canales (Usando refs)
        if (economicRef.current && !economicRef.current.contains(event.target)) {
            setIsEconomicDropdownOpen(false);
        }
        if (channelsRef.current && !channelsRef.current.contains(event.target)) {
            setIsChannelsDropdownOpen(false);
        }

        // 2. Manejo de Departamentos, Ciudades y Menús Simples (Usando closest)
        // Solo cerramos si el clic NO fue dentro de un grupo de formulario
        if (!event.target.closest(`.${styles.formGroup}`)) {
            setShowDeptOpts(false);
            setShowCityOpts(false);
            setOpenMenus({ 
                companyType: false, 
                foundationYear: false, 
                employees: false, 
                annualRevenue: false,
                modalidad: false
            });
        }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
}, [economicRef, channelsRef]); // Agregamos las refs a las dependencias por buena práctica


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
    
    // 🟢 Nueva validación
    if ((formData.city === 'Otra Ciudad' || formData.city === 'Otra Ciudad...') && !formData.otherCity?.trim()) {
        stepErrors.otherCity = 'Escriba el nombre de la ciudad';
    }
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
    const isOtherCityInvalid = (formData.city === 'Otra Ciudad' || formData.city === 'Otra Ciudad...') && !formData.otherCity?.trim();
    return !formData.address.trim() || !formData.department || !formData.city || isOtherCityInvalid;
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

    const cityFinal = (formData.city === 'Otra Ciudad' || formData.city === 'Otra Ciudad...') 
        ? formData.otherCity.trim() 
        : formData.city;    

    // 3. Crear el objeto final para el envío
    const finalFormData = {
        ...formData,
        city: cityFinal,
        // 🟢 NUEVA MODIFICACIÓN: Si eligió 'otra', enviamos el contenido de otherCompanyType
        companyType: formData.companyType === 'otra' 
            ? formData.otherCompanyType?.trim() 
            : formData.companyType,
        economicSector: finalEconomicSector,
        distributionChannels: finalDistributionChannels,
    };

    // 4. Limpieza de campos temporales o de validación
    delete finalFormData.confirmPassword;
    delete finalFormData.otherCity;
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

// Filtrar listas en tiempo real
// Filtrar listas en tiempo real (Protección contra valores undefined)
const departamentosFiltrados = Object.keys(DATOS_UBICACION).filter(dept =>
    dept.toLowerCase().includes((searchTermDept || '').toLowerCase())
);

const ciudadesFiltradas = formData.department 
    ? DATOS_UBICACION[formData.department].filter(city =>
        city.toLowerCase().includes((searchTermCity || '').toLowerCase())
      )
    : [];
    
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
    {/* 🟢 Selector de Modalidad con diseño personalizado */}
<div className={styles.formGroup} style={{ position: 'relative' }}>
    <label className={styles.formLabel}>Modalidad de Empresa *</label>
    <div 
        className={`${styles.customSelectHeader} ${errors.modalidad ? styles.inputError : ''}`} 
        onClick={() => toggleMenu('modalidad')}
    >
        {formData.modalidad ? (
            formData.modalidad === 'Física' ? 'Física (Sede Principal)' :
            formData.modalidad === 'Virtual' ? 'Virtual / E-commerce' : 'Híbrida'
        ) : 'Seleccione...'}
    </div>
    
    {openMenus.modalidad && (
        <div className={styles.customSelectDropdown} style={{ display: 'block', zIndex: 101 }}>
            {[
                { v: 'Física', l: 'Física (Sede Principal)' },
                { v: 'Virtual', l: 'Virtual / E-commerce' },
                { v: 'Híbrida', l: 'Híbrida' }
            ].map(item => (
                <div 
                    key={item.v} 
                    className={styles.dropdownOption} 
                    onMouseDown={(e) => {
                        e.preventDefault(); // 🟢 Evita que el menú se cierre antes de capturar el dato
                        setFormData({ ...formData, modalidad: item.v });
                        toggleMenu('modalidad');
                        setErrors(prev => ({ ...prev, modalidad: '' }));
                    }}
                >
                    {item.l}
                </div>
            ))}
        </div>
    )}
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
        
        {/* --- DIRECCIÓN --- */}
        <div className={styles.formGroup}>
            <label className={styles.formLabel}>Dirección Principal *</label>
            <input 
                type="text" 
                name="address" 
                value={formData.address} 
                onChange={handleChange} 
                className={`${styles.formInput} ${errors.address ? styles.inputError : ''}`} 
            />
            {errors.address && <span className={styles.errorMessage}>{errors.address}</span>}
        </div>

        <div className={styles.formRow}>
            {/* --- BUSCADOR DE DEPARTAMENTO --- */}
            <div className={styles.formGroup} style={{ position: 'relative' }}>
                <label className={styles.formLabel}>Departamento *</label>
                <input 
                    type="text"
                    placeholder="Escriba para buscar..."
                    // Prioriza lo que el usuario escribe, si no, muestra lo guardado
                    value={showDeptOpts ? searchTermDept : (formData.department || searchTermDept)}
                    onChange={(e) => {
                        setSearchTermDept(e.target.value);
                        setShowDeptOpts(true);
                    }}
                    onFocus={() => {
                        setSearchTermDept(''); // Limpia búsqueda para mostrar todos al dar foco
                        setShowDeptOpts(true);
                    }}
                    className={`${styles.formInput} ${errors.department ? styles.inputError : ''}`}
                />
                
                {showDeptOpts && (
                    <div className={styles.customSelectDropdown} style={{ display: 'block', maxHeight: '200px', overflowY: 'auto', zIndex: 100 }}>
                        {departamentosFiltrados.length > 0 ? (
                            departamentosFiltrados.map(d => (
                                <div 
                                    key={d} 
                                    className={styles.dropdownOption}
                                    // 🟢 onMouseDown evita que el onBlur del input cierre el menú antes del clic
                                    onMouseDown={(e) => {
    e.preventDefault(); 
    setFormData(prev => ({ ...prev, department: d, city: '', otherCity: '' }));
    setSearchTermDept(d);
    setSearchTermCity('');
    
    // 1. Cerramos departamento
    setShowDeptOpts(false);

    // 2. Usamos un pequeño retraso para abrir Ciudad y darle el foco
    setTimeout(() => {
        setShowCityOpts(true); // Abre el menú
        cityInputRef.current?.focus(); // Pone el cursor allí
    }, 100); 

    setErrors(prev => ({ ...prev, department: '' }));
}}
                                >
                                    {d}
                                </div>
                            ))
                        ) : (
                            <div className={styles.dropdownOption} style={{ color: '#999', cursor: 'default' }}>No se encontraron resultados</div>
                        )}
                    </div>
                )}
                {errors.department && <span className={styles.errorMessage}>{errors.department}</span>}
            </div>

            {/* --- BUSCADOR DE CIUDAD --- */}
            <div className={styles.formGroup} style={{ position: 'relative' }}>
                <label className={styles.formLabel}>Ciudad *</label>
                <input 
                ref={cityInputRef}
                    type="text"
                    placeholder={formData.department ? "Escriba para buscar..." : "Primero elija departamento"}
                    value={showCityOpts ? searchTermCity : (formData.city || searchTermCity)}
                    disabled={!formData.department}
                    onChange={(e) => {
                        setSearchTermCity(e.target.value);
                        setShowCityOpts(true);
                    }}
                    onFocus={() => {
                        setSearchTermCity('');
                        setShowCityOpts(true);
                    }}
                    className={`${styles.formInput} ${errors.city ? styles.inputError : ''}`}
                />
                
                {showCityOpts && formData.department && (
                    <div className={styles.customSelectDropdown} style={{ display: 'block', maxHeight: '200px', overflowY: 'auto', zIndex: 100 }}>
                        {ciudadesFiltradas.length > 0 ? (
                            ciudadesFiltradas.map(c => (
                                <div 
                                    key={c} 
                                    className={styles.dropdownOption}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        setFormData(prev => ({ ...prev, city: c }));
                                        setSearchTermCity(c);
                                        setShowCityOpts(false);
                                        setErrors(prev => ({ ...prev, city: '' }));
                                    }}
                                >
                                    {c}
                                </div>
                            ))
                        ) : (
                            <div className={styles.dropdownOption} style={{ color: '#999', cursor: 'default' }}>No se encontraron resultados</div>
                        )}
                    </div>
                )}
                {errors.city && <span className={styles.errorMessage}>{errors.city}</span>}
            </div>
        </div>

        {/* --- CAMPO MANUAL PARA "OTRA CIUDAD" --- */}
        {(formData.city === 'Otra Ciudad' || formData.city === 'Otra Ciudad...') && (
            <div style={{ marginTop: '10px' }}>
                <label className={styles.formLabel}>¿Cuál ciudad? *</label>
                <input 
                    type="text" 
                    name="otherCity" 
                    value={formData.otherCity || ''} 
                    onChange={handleChange} 
                    className={`${styles.formInput} ${errors.otherCity ? styles.inputError : ''}`}
                    placeholder="Nombre de la ciudad manual..."
                />
                {errors.otherCity && <span className={styles.errorMessage}>{errors.otherCity}</span>}
            </div>
        )}
    </div>
)}

                  {currentStep === 3 && (
    <div className={styles.formStep}>
        <h2 className={styles.stepTitle}>Información Empresarial</h2>
        <div className={styles.formRow}>
            {/* --- TIPO DE EMPRESA --- */}
            <div className={styles.formGroup} style={{ position: 'relative' }}>
                <label className={styles.formLabel}>Tipo de Empresa *</label>
                <div 
                    className={`${styles.customSelectHeader} ${errors.companyType ? styles.inputError : ''}`} 
                    onClick={() => toggleMenu('companyType')}
                >
                    {formData.companyType ? (
                        formData.companyType === 'sas' ? 'S.A.S' : 
                        formData.companyType === 'sa' ? 'S.A' : 
                        formData.companyType === 'ltda' ? 'Limitada' : 
                        formData.companyType === 'pn' ? 'Persona Natural' : 
                        formData.companyType === 'otra' ? 'Otra' : formData.companyType.toUpperCase()
                    ) : 'Seleccione...'}
                </div>
                {openMenus.companyType && (
                    <div className={styles.customSelectDropdown} style={{ display: 'block', zIndex: 101 }}>
                        {['sas', 'sa', 'ltda', 'pn', 'otra'].map(opcion => (
                            <div key={opcion} className={styles.dropdownOption} onMouseDown={(e) => {
                                e.preventDefault(); // 🟢 Evita errores de clic
                                setFormData({...formData, companyType: opcion});
                                toggleMenu('companyType');
                                setErrors(prev => ({ ...prev, companyType: '' }));
                            }}>
                                {opcion === 'sas' ? 'S.A.S' : opcion === 'sa' ? 'S.A' : opcion === 'ltda' ? 'Limitada' : opcion === 'pn' ? 'Persona Natural' : 'Otra'}
                            </div>
                        ))}
                    </div>
                )}
                {errors.companyType && <span className={styles.errorMessage}>{errors.companyType}</span>}

                {formData.companyType === 'otra' && (
                    <div style={{ marginTop: '10px' }}>
                        <label className={styles.formLabel}>¿Cuál tipo de empresa? *</label>
                        <input 
                            type="text" 
                            name="otherCompanyType" 
                            value={formData.otherCompanyType || ''} 
                            onChange={handleChange} 
                            className={`${styles.formInput} ${errors.otherCompanyType ? styles.inputError : ''}`}
                            placeholder="Escriba el tipo de empresa..."
                        />
                        {errors.otherCompanyType && <span className={styles.errorMessage}>{errors.otherCompanyType}</span>}
                    </div>
                )}
            </div>

            {/* --- SECTOR ECONÓMICO --- */}
            <div className={styles.formGroup} ref={economicRef} style={{ position: 'relative' }}>
                <label className={styles.formLabel}>Sector Económico *</label>
                <div 
                    className={`${styles.customSelectHeader} ${errors.economicSector ? styles.inputError : ''}`} 
                    onClick={() => setIsEconomicDropdownOpen(!isEconomicDropdownOpen)}
                >
                    {formData.economicSector.length > 0 ? formData.economicSector.join(', ') : 'Seleccione...'}
                </div>
                {isEconomicDropdownOpen && (
                    <div className={styles.customSelectDropdown} style={{ display: 'block', zIndex: 101 }}>
                        {SECTORES_ECONOMICOS.map(s => (
                            <label key={s} className={styles.dropdownOption} onMouseDown={(e) => e.stopPropagation()}>
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
                    <div style={{marginTop: '10px'}}>
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
                {errors.economicSector && <span className={styles.errorMessage}>{errors.economicSector}</span>}
            </div>
        </div>

        <div className={styles.formRow}>
            {/* --- AÑO DE FUNDACIÓN --- */}
            <div className={styles.formGroup} style={{ position: 'relative' }}>
                <label className={styles.formLabel}>Año de Fundación *</label>
                <div 
                    className={`${styles.customSelectHeader} ${errors.foundationYear ? styles.inputError : ''}`} 
                    onClick={() => toggleMenu('foundationYear')}
                >
                    {formData.foundationYear || 'Seleccione...'}
                </div>
                {openMenus.foundationYear && (
                    <div className={styles.customSelectDropdown} style={{ display: 'block', zIndex: 101 }}>
                        {Array.from({length: 50}, (_, i) => new Date().getFullYear() - i).map(year => (
                            <div key={year} className={styles.dropdownOption} onMouseDown={(e) => {
                                e.preventDefault();
                                setFormData({...formData, foundationYear: year.toString()});
                                toggleMenu('foundationYear');
                                setErrors(prev => ({ ...prev, foundationYear: '' }));
                            }}>{year}</div>
                        ))}
                    </div>
                )}
                {errors.foundationYear && <span className={styles.errorMessage}>{errors.foundationYear}</span>}
            </div>

            {/* --- EMPLEADOS --- */}
            <div className={styles.formGroup} style={{ position: 'relative' }}>
                <label className={styles.formLabel}>Empleados *</label>
                <div 
                    className={`${styles.customSelectHeader} ${errors.employees ? styles.inputError : ''}`} 
                    onClick={() => toggleMenu('employees')}
                >
                    {formData.employees ? (formData.employees === '501+' ? 'Más de 500' : formData.employees) : 'Seleccione...'}
                </div>
                {openMenus.employees && (
                    <div className={styles.customSelectDropdown} style={{ display: 'block', zIndex: 101 }}>
                        {['1-10', '11-50', '51-200', '201-500', '501+'].map(val => (
                            <div key={val} className={styles.dropdownOption} onMouseDown={(e) => {
                                e.preventDefault();
                                setFormData({...formData, employees: val});
                                toggleMenu('employees');
                                setErrors(prev => ({ ...prev, employees: '' }));
                            }}>
                                {val === '501+' ? 'Más de 500' : val}
                            </div>
                        ))}
                    </div>
                )}
                {errors.employees && <span className={styles.errorMessage}>{errors.employees}</span>}
            </div>
        </div>
    </div>
)}

                 {currentStep === 4 && (
    <div className={styles.formStep}>
        <h2 className={styles.stepTitle}>Información Financiera</h2>
        <div className={styles.formRow}>
            {/* --- RANGO DE INGRESOS --- */}
            <div className={styles.formGroup} style={{ position: 'relative' }}>
                <label className={styles.formLabel}>Rango de Ingresos *</label>
                <div 
                    className={`${styles.customSelectHeader} ${errors.annualRevenue ? styles.inputError : ''}`} 
                    onClick={() => toggleMenu('annualRevenue')}
                >
                    {formData.annualRevenue ? (
                        formData.annualRevenue === '0-100' ? '0 - 100 Millones' :
                        formData.annualRevenue === '100-500' ? '100 - 500 Millones' :
                        formData.annualRevenue === '500+' ? 'Más de 500 Millones' : formData.annualRevenue
                    ) : 'Seleccione...'}
                </div>
                {openMenus.annualRevenue && (
                    <div className={styles.customSelectDropdown} style={{ display: 'block', zIndex: 101 }}>
                        {[
                            {v: '0-100', l: '0 - 100 Millones'},
                            {v: '100-500', l: '100 - 500 Millones'},
                            {v: '500+', l: 'Más de 500 Millones'}
                        ].map(item => (
                            <div key={item.v} className={styles.dropdownOption} onMouseDown={(e) => {
                                e.preventDefault();
                                setFormData({...formData, annualRevenue: item.v});
                                toggleMenu('annualRevenue');
                                setErrors(prev => ({ ...prev, annualRevenue: '' }));
                            }}>{item.l}</div>
                        ))}
                    </div>
                )}
                {errors.annualRevenue && <span className={styles.errorMessage}>{errors.annualRevenue}</span>}
            </div>

            {/* --- CANALES DE DISTRIBUCIÓN --- */}
            <div className={styles.formGroup} ref={channelsRef} style={{ position: 'relative' }}>
                <label className={styles.formLabel}>Canales de Distribución *</label>
                <div 
                    className={`${styles.customSelectHeader} ${errors.distributionChannels ? styles.inputError : ''}`} 
                    onClick={() => setIsChannelsDropdownOpen(!isChannelsDropdownOpen)}
                >
                    {formData.distributionChannels.length > 0 ? formData.distributionChannels.join(', ') : 'Seleccione...'}
                </div>
                
                {isChannelsDropdownOpen && (
                    <div className={styles.customSelectDropdown} style={{ display: 'block', zIndex: 101 }}>
                        {CANALES_DISTRIBUCION_OPCIONES.map(c => (
                            <label key={c} className={styles.dropdownOption} onMouseDown={(e) => e.stopPropagation()}>
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
                {formData.distributionChannels.includes('Otro Canal') && (
                    <div style={{ marginTop: '10px' }}>
                        <label className={styles.formLabel}>¿Cuál otro canal? *</label>
                        <input 
                            type="text" 
                            name="otroCanalDistribucion" 
                            value={formData.otroCanalDistribucion} 
                            onChange={handleChange} 
                            className={`${styles.formInput} ${errors.otroCanalDistribucion ? styles.inputError : ''}`}
                            placeholder="Escriba el canal..."
                        />
                        {errors.otroCanalDistribucion && <span className={styles.errorMessage}>{errors.otroCanalDistribucion}</span>}
                    </div>
                )}
                {errors.distributionChannels && <span className={styles.errorMessage}>{errors.distributionChannels}</span>}
            </div>
        </div>

        <div className={styles.formGroup}>
            <label className={styles.formLabel}>Principales Clientes *</label>
            <textarea 
                name="mainClients" 
                value={formData.mainClients} 
                onChange={handleChange} 
                className={`${styles.formInput} ${errors.mainClients ? styles.inputError : ''}`} 
                rows="3" 
                placeholder="Describa sus principales clientes..."
            />
            {errors.mainClients && <span className={styles.errorMessage}>{errors.mainClients}</span>}
        </div>
    </div>
)}

                    {currentStep === 5 && (
    <div className={styles.formStep}>
        <h2 className={styles.stepTitle}>Autorización para el Tratamiento de Datos Personales</h2>
        
        <div className={styles.policyContainer}>
            <div className={styles.policyScrollBox}>
                
                <p>Para nosotros es fundamental proteger su privacidad. Al vincularse, usted acepta las siguientes condiciones:</p>
                
                <div className={styles.policySection}>
                    <h4>1. Recolección de Datos</h4>
                    <p>Recopilamos información personal como nombre, dirección de correo electrónico, número de teléfono y otros datos relevantes para la prestación de nuestros servicios empresariales.</p>
                </div>

                <div className={styles.policySection}>
                    <h4>2. Uso de la Información</h4>
                    <p>Utilizamos sus datos para proporcionar y mejorar nuestros servicios, personalizar su experiencia, procesar transacciones y mantener una comunicación efectiva con usted.</p>
                </div>

                <div className={styles.policySection}>
                    <h4>3. Protección de Datos</h4>
                    <p>Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos personales contra acceso no autorizado, alteración, divulgación o destrucción.</p>
                </div>

                <div className={styles.policySection}>
                    <h4>4. Compartir Información</h4>
                    <p>Podemos compartir su información con terceros de confianza que nos ayudan a operar nuestro negocio, siempre bajo estrictas normas de confidencialidad y cumplimiento legal.</p>
                </div>

                <div className={styles.policySection}>
                    <h4>5. Sus Derechos</h4>
                    <p>Usted tiene derecho a acceder, corregir, actualizar o solicitar la eliminación de sus datos personales en cualquier momento a través de nuestros canales oficiales.</p>
                </div>

                <div className={styles.policySection}>
                    <h4>6. Cambios en la Política</h4>
                    <p>Nos reservamos el derecho de modificar esta política. Los cambios entrarán en vigor inmediatamente después de su publicación en nuestro sitio web oficial.</p>
                </div>

                <div className={styles.policySection}>
                    <h4>7. Consentimiento</h4>
                    <p>Al marcar la casilla de aceptación y utilizar nuestros servicios, usted consiente la recopilación y uso de su información de acuerdo con esta política.</p>
                </div>

                <div className={styles.policySection}>
                    <h4>8. Contacto</h4>
                    <p>Si tiene preguntas sobre esta política o el manejo de sus datos, por favor contáctenos a través de los canales proporcionados en nuestro portal.</p>
                </div>
            </div>
        </div>

        <div className={styles.checkboxWrapper}>
            <label className={styles.checkboxGroup}>
                <input type="checkbox" name="autorizaDatos" checked={formData.autorizaDatos} onChange={handleChange} />
                <span className={errors.autorizaDatos ? styles.errorMessage : ''}>
                    He leído y autorizo el tratamiento de mis datos personales *
                </span>
            </label>
            
        
        </div>
    </div>
)}

                    {currentStep === 6 && (
    <div className={styles.formStep}>
        <h2 className={styles.stepTitle}>Confirmación Final</h2>
        
        {/* 🟢 NUEVO: Contenedor Wrapper para el resumen y el ícono */}
        <div className={styles.resumenWrap}>
    <div className={styles.resumenContainer}>
        <p><strong>Empresa:</strong> {formData.companyName}</p>
        <p><strong>Correo:</strong> {formData.email}</p>
        <p><strong>Contacto:</strong> {formData.contactName} ({formData.phones})</p>
        <p>
            <strong>Ubicación:</strong> {
                (formData.city === 'Otra Ciudad' || formData.city === 'Otra Ciudad...') 
                ? formData.otherCity 
                : formData.city
            }, {formData.department}
        </p>
    </div>

            {/* 🟢 NUEVO: Contenedor para el ícono de Check */}
            {/* --- Contenedor para el ícono de Check --- */}
{/* --- Contenedor para el ícono de Check --- */}
<div className={styles.finalCheckIcon}>
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
            /* 🟢 Solo aplicamos la animación si el checkbox está marcado */
            className={formData.confirmacionFinal ? styles.checkPath : ''} 
            d="M8.5 12.5L10.5 14.5L15.5 9.5" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
        <path 
            className={formData.confirmacionFinal ? styles.checkPath : ''} 
            d="M7 3.33782C8.47087 2.48697 10.1786 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 10.1786 2.48697 8.47087 3.33782 7" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round"
        />
    </svg>
</div>
        </div>

        <label className={styles.checkboxGroup} style={{ marginTop: '20px' }}>
            <input type="checkbox" name="confirmacionFinal" checked={formData.confirmacionFinal} onChange={handleChange} />
            <span className={errors.confirmacionFinal ? styles.errorMessage : ''}>
                Confirmo que toda la información es verídica *
            </span>
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