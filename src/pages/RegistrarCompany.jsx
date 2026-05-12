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
    'Bogotá D.C.': ['Bogotá D.C.', 'Otra Ciudad...'],
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
        economicSector: [], otroSector: '', // 👈 Agrégalo aquí
    foundationYear: '', employees: '',
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
    const [touched, setTouched] = useState({});
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
    let finalValue = type === 'checkbox' ? checked : value;

    if (name === 'phones') {
        finalValue = value.replace(/[^0-9]/g, '');
        if (finalValue.length > 10) return;
    }

    setFormData(prev => {
        const newData = { ...prev, [name]: finalValue };
        // Si el usuario ya pasó por este campo, validamos mientras escribe
        if (touched[name]) {
            setErrors(prevErrors => ({ ...prevErrors, [name]: validateField(name, finalValue, newData) }));
        }
        return newData;
    });

    if (!touched[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
    }
};

// 🟢 NUEVO: Función que se ejecuta al salir del recuadro
const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value, formData);
    setErrors(prev => ({ ...prev, [name]: error }));
};

    const handleMultiSelectChange = (fieldName, event) => {
    const { value, checked } = event.target;
    setFormData(prev => {
        const currentArray = prev[fieldName];
        const newArray = checked ? [...currentArray, value] : currentArray.filter(item => item !== value);
        
        // 🟢 CORREGIDO: Ahora usamos setFormData en lugar de setOtroSector
        if (!checked && value === 'Otro') setFormData(p => ({...p, otroSector: ''}));
        if (!checked && value === 'Otro Canal') setFormData(p => ({...p, otroCanalDistribucion: ''}));
        
        if (newArray.length > 0) setErrors(p => ({ ...p, [fieldName]: '' }));
        return { ...prev, [fieldName]: newArray };
    });
};

    const validateField = (name, value, currentData) => {
    const emailRegex = /\S+@\S+\.\S+/;
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+={}[\]:;\"'<>,.?/\\|~`]).{8,}$/;

    switch (name) {
        case 'companyName': return !value.trim() ? 'Nombre requerido' : '';
        case 'email': return (!value.trim() || !emailRegex.test(value)) ? 'Correo inválido' : '';
        case 'phones': return (!value.trim() || value.length !== 10) ? 'Debe tener exactamente 10 dígitos' : '';
        case 'contactName': return !value.trim() ? 'Nombre de contacto requerido' : '';
        case 'password': return (!value || !passwordRegex.test(value)) ? 'Contraseña débil' : '';
        case 'confirmPassword': return value !== currentData.password ? 'Las contraseñas no coinciden' : '';
        case 'address': return !value.trim() ? 'Dirección requerida' : '';
        // Puedes agregar más 'cases' aquí si quieres validación en tiempo real para otros campos de texto
        // --- Paso 2 ---
        case 'department': return !value ? 'Requerido' : '';
        case 'city': return !value ? 'Requerido' : '';
        case 'otherCity': return (currentData.city === 'Otra Ciudad' || currentData.city === 'Otra Ciudad...') && !value.trim() ? 'Escriba el nombre de la ciudad' : '';
        
        // --- Paso 3 ---
        case 'companyType': return !value ? 'Requerido' : '';
        case 'otherCompanyType': return currentData.companyType === 'otra' && !value.trim() ? 'Especifique el tipo' : '';
        case 'otroSector': return currentData.economicSector.includes('Otro') && !value.trim() ? 'Especifique el sector' : '';
        case 'foundationYear': return !value ? 'Requerido' : '';
        case 'employees': return !value ? 'Requerido' : '';
        
        // --- Paso 4 ---
        case 'annualRevenue': return !value ? 'Requerido' : '';
        case 'distributionChannels': return value.length === 0 ? 'Seleccione al menos uno' : '';
        case 'otroCanalDistribucion': return currentData.distributionChannels.includes('Otro Canal') && !value.trim() ? 'Especifique el canal' : '';
        case 'mainClients': return !value.trim() ? 'Requerido' : '';
        default: return '';
    }
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
            if (formData.economicSector.includes('Otro') && !formData.otroSector?.trim()) stepErrors.otroSector = 'Especifique el sector';
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
            const otherTypeValid = formData.companyType === 'otra' ? !!formData.otherCompanyType?.trim() : true;
const otherSectorValid = formData.economicSector.includes('Otro') ? !!formData.otroSector?.trim() : true; // 👈 NUEVO
return !formData.companyType || formData.economicSector.length === 0 || !otherTypeValid || !otherSectorValid; // 👈 ACTUALIZADO
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
    ? [...formData.economicSector.filter(s => s !== 'Otro'), formData.otroSector.trim()]
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
    delete finalFormData.otroSector;

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

    const renderValidationMessage = (fieldName) => {
    if (!touched[fieldName]) return null;
    
    if (errors[fieldName]) {
        // Llama a styles.errorMessage
        return <span className={styles.errorMessage}>❌ {errors[fieldName]}</span>;
    }
    
    if (formData[fieldName] !== '' && formData[fieldName] !== false && formData[fieldName]?.length !== 0) {
        // Llama a styles.successMessage
        return <span className={styles.successMessage}>✅ Correcto</span>;
    }
    
    return null;
};

    return (
        <div className={styles.companyContainer}>
            <div className={styles.companyCard}>
                
                
                <div className={styles.headerTopWhite}>
                    <img src="/Logo.png" alt="Empresa Logo" className={styles.logoImg} />
                    <div className={styles.headerDivider}></div>
                    <img src="/UdeC2.png" alt="UdeC Logo" className={styles.logoUdec} />
                </div>

                <div className={styles.headerBottomGreen}>
                    <h1 className={styles.formTitle}>Registro Empresarial</h1>
                    <p className={styles.formSubtitle}>Conecta con talento preparado y lleva tu empresa al siguiente nivel.</p>
                </div>

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
            
            <div className={styles.stepNumber}>
                {currentStep > s ? (
                    <span className={styles.checkIcon}>✓</span> 
                ) : (
                    s 
                )}
            </div>
        </div>
    ))}
</div>

                    <form onSubmit={handleSubmit} className={styles.companyForm}>
                        
                        {currentStep === 1 && (
                            <div className={styles.formStep}>
                                <h2 className={styles.stepTitle}>Datos de Acceso y Contacto</h2>
                                {/* ... resto de tus inputs ... */}
                            
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
    <label className={styles.formLabel}>Nombre Empresa *</label>
    <input 
        type="text" 
        name="companyName" 
        value={formData.companyName} 
        onChange={handleChange} 
        onBlur={handleBlur}
        className={`${styles.formInput} ${errors.companyName && touched.companyName ? styles.inputError : ''}`} 
    />
    {renderValidationMessage('companyName')}
</div>

<div className={styles.formGroup}>
    <label className={styles.formLabel}>Correo Electrónico *</label>
    <input 
        type="email" 
        name="email" 
        value={formData.email} 
        onChange={handleChange} 
        onBlur={handleBlur} 
        className={`
            ${styles.formInput} 
            ${errors.email && touched.email ? styles.inputError : ''} 
            ${highlightError ? styles.inputHighlight : ''} 
        `} 
    />
    {renderValidationMessage('email')}
</div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
    <label className={styles.formLabel}>Teléfono de Contacto *</label>
    <input 
        type="tel" 
        name="phones" 
        value={formData.phones} 
        onChange={handleChange} 
        onBlur={handleBlur} /* 👈 NUEVO */
        placeholder="Ej: 3156789032"
        className={`${styles.formInput} ${errors.phones && touched.phones ? styles.inputError : ''}`} 
    />
    {renderValidationMessage('phones')}
</div>
                                <div className={styles.formGroup}>
    <label className={styles.formLabel}>Nombre del Contacto *</label>
    <input 
        type="text" 
        name="contactName" 
        value={formData.contactName} 
        onChange={handleChange} 
        onBlur={handleBlur} /* 👈 NUEVO */
        className={`${styles.formInput} ${errors.contactName && touched.contactName ? styles.inputError : ''}`} 
    />
    {renderValidationMessage('contactName')}
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
    e.preventDefault(); 
    setFormData({ ...formData, modalidad: item.v });
    toggleMenu('modalidad');
    
    // 🟢 NUEVO: Simulamos que el campo fue tocado y quitamos el error
    setTouched(prev => ({ ...prev, modalidad: true }));
    setErrors(prev => ({ ...prev, modalidad: '' }));
}}
                >
                    {item.l}
                </div>
            ))}
        </div>
    )}
    {renderValidationMessage('modalidad')}
</div>
</div>

                            <div className={styles.formRow}>
            {/* --- Campo Contraseña --- */}
            <div className={styles.formGroup}>
                <label className={styles.formLabel}>Contraseña *</label>
                
                {/* 🟢 CONTENEDOR PARA EL OJITO */}
                <div className={styles.passwordWrapper}>
                    <input 
    type={showPassword ? "text" : "password"} 
    name="password" 
    value={formData.password} 
    onChange={handleChange} 
    onBlur={handleBlur} /* 👈 NUEVO */
    className={`${styles.formInput} ${errors.password && touched.password ? styles.inputError : ''}`} 
/>
<button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.togglePasswordBtn}>
    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
</button>
</div>
{renderValidationMessage('password')}
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
    onBlur={handleBlur} /* 👈 NUEVO */
    className={`${styles.formInput} ${errors.confirmPassword && touched.confirmPassword ? styles.inputError : ''}`} 
/>
<button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={styles.togglePasswordBtn}>
    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
</button>
</div>
{renderValidationMessage('confirmPassword')}
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
        onBlur={handleBlur} /* 👈 NUEVO */
        className={`${styles.formInput} ${errors.address && touched.address ? styles.inputError : ''}`} 
    />
    {renderValidationMessage('address')}
</div>

        <div className={styles.formRow}>
            {/* --- BUSCADOR DE DEPARTAMENTO --- */}
            <div className={styles.formGroup} style={{ position: 'relative' }}>
    <label className={styles.formLabel}>Departamento *</label>
    <input 
        type="text"
        placeholder="Escriba para buscar..."
        value={showDeptOpts ? searchTermDept : (formData.department || searchTermDept)}
        onChange={(e) => {
            setSearchTermDept(e.target.value);
            setShowDeptOpts(true);
        }}
        onFocus={() => {
            setSearchTermDept(''); 
            setShowDeptOpts(true);
        }}
        className={`${styles.formInput} ${errors.department && touched.department ? styles.inputError : ''}`}
    />
    
    {showDeptOpts && (
        <div className={styles.customSelectDropdown} style={{ display: 'block', maxHeight: '200px', overflowY: 'auto', zIndex: 100 }}>
            {departamentosFiltrados.length > 0 ? (
                departamentosFiltrados.map(d => (
                    <div 
                        key={d} 
                        className={styles.dropdownOption}
                        onMouseDown={(e) => {
                            e.preventDefault(); 
                            setFormData(prev => ({ ...prev, department: d, city: '', otherCity: '' }));
                            setSearchTermDept(d);
                            setSearchTermCity('');
                            setShowDeptOpts(false);
                            setTouched(prev => ({ ...prev, department: true })); 
                            setTimeout(() => {
                                setShowCityOpts(true); 
                                cityInputRef.current?.focus(); 
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
    {renderValidationMessage('department')}
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
        className={`${styles.formInput} ${errors.city && touched.city ? styles.inputError : ''}`}
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
                            setTouched(prev => ({ ...prev, city: true })); 
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
    {renderValidationMessage('city')}
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
        onBlur={handleBlur} /* 👈 NUEVO */
        className={`${styles.formInput} ${errors.otherCity && touched.otherCity ? styles.inputError : ''}`}
        placeholder="Nombre de la ciudad manual..."
    />
    {renderValidationMessage('otherCity')}
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
                {/* 👇 ACTUALIZA EL HEADER */}
<div 
    className={`${styles.customSelectHeader} ${errors.companyType && touched.companyType ? styles.inputError : ''}`} 
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
    e.preventDefault(); 
    setFormData({...formData, companyType: opcion});
    toggleMenu('companyType');
    setTouched(prev => ({ ...prev, companyType: true })); /* 👈 NUEVO */
    setErrors(prev => ({ ...prev, companyType: '' }));
}}>
                                {opcion === 'sas' ? 'S.A.S' : opcion === 'sa' ? 'S.A' : opcion === 'ltda' ? 'Limitada' : opcion === 'pn' ? 'Persona Natural' : 'Otra'}
                            </div>
                        ))}
                    </div>
                )}
                {renderValidationMessage('companyType')}

                {formData.companyType === 'otra' && (
                    <div style={{ marginTop: '10px' }}>
    <label className={styles.formLabel}>¿Cuál tipo de empresa? *</label>
    <input 
        type="text" 
        name="otherCompanyType" 
        value={formData.otherCompanyType || ''} 
        onChange={handleChange} 
        onBlur={handleBlur} /* 👈 NUEVO */
        className={`${styles.formInput} ${errors.otherCompanyType && touched.otherCompanyType ? styles.inputError : ''}`}
        placeholder="Escriba el tipo de empresa..."
    />
    {renderValidationMessage('otherCompanyType')}
</div>
                )}
            </div>

            {/* --- SECTOR ECONÓMICO --- */}
            <div className={styles.formGroup} ref={economicRef} style={{ position: 'relative' }}>
                <label className={styles.formLabel}>Sector Económico *</label>
                {/* 👇 ACTUALIZA EL HEADER Y EL ONCLICK */}
<div 
    className={`${styles.customSelectHeader} ${errors.economicSector && touched.economicSector ? styles.inputError : ''}`} 
    onClick={() => {
        setIsEconomicDropdownOpen(!isEconomicDropdownOpen);
        setTouched(prev => ({ ...prev, economicSector: true })); /* 👈 NUEVO */
    }}
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
            name="otroSector" 
            value={formData.otroSector} 
            onChange={handleChange} 
            onBlur={handleBlur}
            className={`${styles.formInput} ${errors.otroSector && touched.otroSector ? styles.inputError : ''}`} 
            placeholder="Escriba su sector..."
        />
        {renderValidationMessage('otroSector')}
    </div>
)}
                {renderValidationMessage('economicSector')}
            </div>
        </div>

        <div className={styles.formRow}>
    {/* --- AÑO DE FUNDACIÓN --- */}
    <div className={styles.formGroup} style={{ position: 'relative' }}>
        <label className={styles.formLabel}>Año de Fundación *</label>
        <div 
            className={`${styles.customSelectHeader} ${errors.foundationYear && touched.foundationYear ? styles.inputError : ''}`} 
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
                        setTouched(prev => ({ ...prev, foundationYear: true }));
                        setErrors(prev => ({ ...prev, foundationYear: '' }));
                    }}>{year}</div>
                ))}
            </div>
        )}
        {renderValidationMessage('foundationYear')}
    </div>

    {/* --- EMPLEADOS --- */}
    <div className={styles.formGroup} style={{ position: 'relative' }}>
        <label className={styles.formLabel}>Empleados *</label>
        <div 
            className={`${styles.customSelectHeader} ${errors.employees && touched.employees ? styles.inputError : ''}`} 
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
                        setTouched(prev => ({ ...prev, employees: true }));
                        setErrors(prev => ({ ...prev, employees: '' }));
                    }}>
                        {val === '501+' ? 'Más de 500' : val}
                    </div>
                ))}
            </div>
        )}
        {renderValidationMessage('employees')}
    </div>
</div>
    </div>
)}

                 {currentStep === 4 && (
    <div className={styles.formStep}>
        <h2 className={styles.stepTitle}>Información Financiera</h2>
        <div className={styles.formRow}>
            {/* --- RANGO DE INGRESOS --- */}
            {/* --- RANGO DE INGRESOS --- */}
            {/* --- RANGO DE INGRESOS --- */}
<div className={styles.formGroup} style={{ position: 'relative' }}>
    <label className={styles.formLabel}>Rango de Ingresos *</label>
    <div 
        className={`${styles.customSelectHeader} ${errors.annualRevenue && touched.annualRevenue ? styles.inputError : ''}`} 
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
                    setTouched(prev => ({ ...prev, annualRevenue: true }));
                    setErrors(prev => ({ ...prev, annualRevenue: '' }));
                }}>{item.l}</div>
            ))}
        </div>
    )}
    {renderValidationMessage('annualRevenue')}
</div>

            {/* --- CANALES DE DISTRIBUCIÓN --- */}
            <div className={styles.formGroup} ref={channelsRef} style={{ position: 'relative' }}>
                <label className={styles.formLabel}>Canales de Distribución *</label>
                <div 
    className={`${styles.customSelectHeader} ${errors.distributionChannels && touched.distributionChannels ? styles.inputError : ''}`} 
    onClick={() => {
        setIsChannelsDropdownOpen(!isChannelsDropdownOpen);
        setTouched(prev => ({ ...prev, distributionChannels: true })); 
    }}
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
        onBlur={handleBlur} 
        className={`${styles.formInput} ${errors.otroCanalDistribucion && touched.otroCanalDistribucion ? styles.inputError : ''}`}
        placeholder="Escriba el canal..."
    />
    {renderValidationMessage('otroCanalDistribucion')}
</div>
                )}
                {renderValidationMessage('distributionChannels')}
            </div>
        </div>

        <div className={styles.formGroup}>
    <label className={styles.formLabel}>Principales Clientes *</label>
    <textarea 
        name="mainClients" 
        value={formData.mainClients} 
        onChange={handleChange} 
        onBlur={handleBlur} 
        className={`${styles.formInput} ${errors.mainClients && touched.mainClients ? styles.inputError : ''}`} 
        rows="3" 
        placeholder="Describa sus principales clientes..."
    />
    {renderValidationMessage('mainClients')}
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

            
{/* --- Contenedor para el ícono de Check --- */}
<div className={styles.finalCheckIcon}>
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
            
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