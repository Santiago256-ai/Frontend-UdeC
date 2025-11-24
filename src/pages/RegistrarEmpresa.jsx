import { useState, useMemo, useEffect, useRef } from 'react'; // ⚡ Añadimos useEffect y useRef
import { useNavigate } from 'react-router-dom';
import API from "../services/api"; // ⚡ Instancia con tu URL de Railway
import './RegistrarEmpresa.css';

// ----------------------------------------------------------------------
// 🚨 DATOS ESTATICOS PARA LAS LOGICAS DE FORMULARIO
// ----------------------------------------------------------------------

// 1. UBICACIÓN: Lista completa de Departamentos y Ciudades de Colombia
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

// 2. Información Empresarial: Opciones de Sector Económico
const SECTORES_ECONOMICOS = [
    'Agricultura', 'Industria', 'Servicios', 'Comercio', 'Financiero', 'Tecnología', 'Otro'
];

// 3. CANALES DE DISTRIBUCIÓN
const CANALES_DISTRIBUCION_OPCIONES = [
    'Venta Directa', 'Distribuidores Mayoristas', 'Minoris. y Puntos de Venta', 'Plataformas E-commerce', 'Redes Sociales y Apps', 'Otro Canal'
];


// ----------------------------------------------------------------------
// 💡 COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------

export default function RegistrarEmpresa() {
    const initialFormData = {
        // ... (otros campos se mantienen)
        companyName: '', email: '', phones: '', contactName: '', nit: '',
        
        // 2. UBICACIÓN
        address: '', department: '', city: '',

        // 3. INFORMACIÓN EMPRESARIAL
        companyType: '', 
        economicSector: [], 
        foundationYear: '', employees: '',
        
        // 4. INFORMACIÓN FINANCIERA
        annualRevenue: '', totalAssets: '', equity: '',
        distributionChannels: [], 
        otroCanalDistribucion: '', 
        mainClients: '',
        
        // 1. CREDENCIALES
        password: '', confirmPassword: '',

        // 5. AUTORIZACIÓN DE DATOS (Nuevos Checkboxes)
        autorizaDatos: false, // OBLIGATORIO
        aceptaMarketing: false,
        comparteTerceros: false,
        aceptaRetencion: false,

        // 6. Confirmación final
        confirmacionFinal: false,
    };
    
    // Estados
    const [formData, setFormData] = useState(initialFormData);
    const [currentStep, setCurrentStep] = useState(1);
    const [errors, setErrors] = useState({}); 
const navigate = useNavigate();
    // Estados adicionales para campos condicionales
    const [otherCompanyType, setOtherCompanyType] = useState(''); 
    const [otroSector, setOtroSector] = useState(''); 

    // Estados para controlar la apertura de los desplegables de selección múltiple
    const [isEconomicDropdownOpen, setIsEconomicDropdownOpen] = useState(false);
    const [isChannelsDropdownOpen, setIsChannelsDropdownOpen] = useState(false);
    
    // ⚡ REFERENCIAS para detectar clics fuera de los componentes
    const economicRef = useRef(null);
    const channelsRef = useRef(null);

    // ----------------------------------------------------------------------
    // ⚡ LÓGICA DE CIERRE AL HACER CLIC AFUERA (useOutsideClick)
    // ----------------------------------------------------------------------
    useEffect(() => {
        function handleClickOutside(event) {
            // Cierra el desplegable de Sectores
            if (economicRef.current && !economicRef.current.contains(event.target)) {
                setIsEconomicDropdownOpen(false);
            }
            // Cierra el desplegable de Canales
            if (channelsRef.current && !channelsRef.current.contains(event.target)) {
                setIsChannelsDropdownOpen(false);
            }
        }
        
        // Adjuntar el listener al documento
        document.addEventListener("mousedown", handleClickOutside);
        
        // Limpiar el listener al desmontar el componente
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [economicRef, channelsRef]);


    // ----------------------------------------------------------------------
    // MANEJADORES DE ESTADO (HANDLERS)
    // ----------------------------------------------------------------------

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        setFormData(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Limpiar el error cuando el usuario interactúa
        setErrors(prevErrors => ({
            ...prevErrors,
            [name]: ''
        }));
    };
    
    // Maneja la selección múltiple para los checkboxes
    const handleMultiSelectChange = (fieldName, event) => {
        const { value, checked } = event.target;
        
        setFormData(prevFormData => {
            const currentArray = prevFormData[fieldName];
            let newArray;
            
            if (checked) {
                // Agregar el valor
                newArray = [...currentArray, value];
            } else {
                // Remover el valor
                newArray = currentArray.filter(item => item !== value);
            }

            // Lógica especial para limpiar campos condicionales si se desmarca 'Otro'
            if (!checked && value === 'Otro') {
                setOtroSector('');
            } else if (!checked && value === 'Otro Canal') {
                setFormData(p => ({...p, otroCanalDistribucion: ''}));
            }

            // Limpiar error de campo principal si ya hay selecciones
            if (newArray.length > 0) {
                 setErrors(prevErrors => ({
                    ...prevErrors,
                    [fieldName]: ''
                }));
            }

            return {
                ...prevFormData,
                [fieldName]: newArray,
            };
        });
    };
    
    // Maneja el input de texto para el campo "Otro Sector"
    const handleOtroSectorChange = (e) => {
        setOtroSector(e.target.value);
        setErrors(prevErrors => ({
            ...prevErrors,
            otroSector: '' 
        }));
    };

    // Maneja el input de texto para el campo "Otro Canal de Distribución"
    const handleOtroCanalDistribucionChange = (e) => {
        setFormData(prevState => ({
            ...prevState,
            otroCanalDistribucion: e.target.value
        }));
        setErrors(prevErrors => ({
            ...prevErrors,
            otroCanalDistribucion: '' 
        }));
    };

// ----------------------------------------------------------------------
// MANEJADOR DE REDIRECCIÓN AL LANDING
// ----------------------------------------------------------------------
const handleRegresarALanding = () => {
    // Redirige al path de tu landing page (asumiendo que es la raíz '/')
    navigate('/'); 
    // O si la landing es la raíz: navigate('/');
};
    // ----------------------------------------------------------------------
    // VALIDACIÓN (Se mantiene la lógica de la corrección anterior)
    // ----------------------------------------------------------------------

    const validateStep = (step) => {
        let stepErrors = {};
        let isValid = true;
        
        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+={}[\]:;\"'<>,.?/\\|~`]).{8,}$/;
        
        // Paso 1: Credenciales
        if (step === 1) {
            if (!formData.companyName.trim()) stepErrors.companyName = 'El nombre es obligatorio.';
            if (!formData.email.trim()) {
                stepErrors.email = 'El correo es obligatorio.';
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                stepErrors.email = 'Correo inválido.';
            }
            if (!formData.phones.trim()) stepErrors.phones = 'El teléfono es obligatorio.';
            if (!formData.contactName.trim()) stepErrors.contactName = 'El contacto es obligatorio.';
            if (!formData.password.trim()) {
                stepErrors.password = 'La contraseña es obligatoria.';
            } else if (!passwordRegex.test(formData.password)) {
                stepErrors.password = 'Debe tener min. 8 carac. (letras, números y 1 especial).';
            }
            if (!formData.confirmPassword.trim()) {
                stepErrors.confirmPassword = 'Debe confirmar la contraseña.';
            } else if (formData.password !== formData.confirmPassword) {
                stepErrors.confirmPassword = 'Las contraseñas no coinciden.';
            }
        }
        
        // Paso 2: Ubicación
        if (step === 2) {
            if (!formData.address.trim()) stepErrors.address = 'La dirección es obligatoria.';
            if (!formData.department) stepErrors.department = 'El departamento es obligatorio.';
            if (!formData.city) stepErrors.city = 'La ciudad es obligatoria.';
        }
        
        // Paso 3: Información Empresarial
        if (step === 3) {
            if (!formData.companyType) stepErrors.companyType = 'El tipo de empresa es obligatorio.';
            if (formData.companyType === 'otra' && !otherCompanyType.trim()) {
                stepErrors.otherCompanyType = 'Especifique el tipo de empresa.';
            }
            if (formData.economicSector.length === 0) {
                stepErrors.economicSector = 'Seleccione al menos un sector.';
            } else if (formData.economicSector.includes('Otro') && !otroSector.trim()) {
                stepErrors.otroSector = 'Debe especificar el otro sector económico.';
            }
            if (!formData.foundationYear) stepErrors.foundationYear = 'El año es obligatorio.';
            if (!formData.employees) stepErrors.employees = 'El número de empleados es obligatorio.';
        }
        
        // Paso 4: Información Financiera
        if (step === 4) {
            if (!formData.annualRevenue) stepErrors.annualRevenue = 'Los ingresos son obligatorios.';
            if (!formData.mainClients) stepErrors.mainClients = 'Los clientes son obligatorios.';
            
            if (formData.distributionChannels.length === 0) {
                 stepErrors.distributionChannels = 'Seleccione al menos un canal de distribución.';
            } else if (formData.distributionChannels.includes('Otro Canal') && !formData.otroCanalDistribucion.trim()) {
                stepErrors.otroCanalDistribucion = 'Especifique el canal de distribución.';
            }
        }

        // Paso 5: Autorización de Datos
        if (step === 5) {
             if (!formData.autorizaDatos) {
                 stepErrors.autorizaDatos = 'Debe aceptar la política de uso de datos.';
             }
        }

        // Paso 6: Confirmación 
        if (step === 6) {
             if (!formData.confirmacionFinal) {
                 stepErrors.confirmacionFinal = 'Debe confirmar que la información es correcta.';
             }
        }

        setErrors(stepErrors);
        isValid = Object.keys(stepErrors).length === 0;
        return isValid;
    };

    // ----------------------------------------------------------------------
    // NAVEGACIÓN Y ENVÍO (Se mantiene la lógica de la corrección anterior)
    // ----------------------------------------------------------------------

    const handleNextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 6)); 
        } else {
            const errorList = Object.values(errors).filter(e => e).join('\n- ');
            alert(`⚠️ Por favor, corrija los siguientes errores para continuar:\n- ${errorList || 'Complete todos los campos obligatorios del paso actual.'}`);
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        setErrors({}); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateStep(currentStep)) {
            alert('Debe confirmar que la información es correcta para enviar el registro.');
            return;
        }

        // Preparar los datos finales a enviar
        let finalEconomicSector = formData.economicSector;
        let finalDistributionChannels = formData.distributionChannels;

        if (finalEconomicSector.includes('Otro')) {
            finalEconomicSector = finalEconomicSector.filter(s => s !== 'Otro');
            finalEconomicSector.push(otroSector.trim());
        }

        if (finalDistributionChannels.includes('Otro Canal')) {
            finalDistributionChannels = finalDistributionChannels.filter(c => c !== 'Otro Canal');
            finalDistributionChannels.push(formData.otroCanalDistribucion.trim());
        }


        const finalFormData = {
            ...formData,
            
            companyType: formData.companyType === 'otra' 
                ? otherCompanyType.trim() 
                : formData.companyType,

            economicSector: finalEconomicSector,
            distributionChannels: finalDistributionChannels,
        };
        
        // Eliminar campos auxiliares
        delete finalFormData.confirmPassword;
        delete finalFormData.otroCanalDistribucion; 
        delete finalFormData.otroSector; 
        delete finalFormData.otherCompanyType;
        delete finalFormData.confirmacionFinal;

        console.log("Datos a Enviar:", finalFormData); 

        try {
            const response = await API.post("/empresas", finalFormData);

            console.log("Empresa registrada:", response.data);
            alert("¡✅ Empresa registrada exitosamente! Ya puede iniciar sesión.");
            navigate('/');
            // Resetear estados
            setCurrentStep(1); 
            setFormData(initialFormData); 
            setOtherCompanyType(''); 
            setOtroSector('');
        } catch (error) {
            console.error("Error al registrar empresa:", error.response || error);
            let errorMessage = "Error al enviar el formulario. Intenta nuevamente.";
            if (error.response?.status === 409) {
                 errorMessage = "Error: Una empresa con este Correo o NIT ya está registrada (Código 409 Conflict).";
            } else if (error.response?.data?.error) {
                 errorMessage = error.response.data.error;
            }
            alert(`❌ ${errorMessage}`);
        }
    };


    // ----------------------------------------------------------------------
    // RENDERIZADO DEL COMPONENTE
    // ----------------------------------------------------------------------

    return (
        <div className="register-container">
            <div className="register-card">
                <div className="form-header">
                    <h1 className="form-title">Registro de Empresa</h1>
                    <p className="form-subtitle">
                        Complete la información de su empresa en los 6 pasos requeridos.
                    </p>
                </div>

                {/* Progress Steps (6 Pasos) */}
                <div className="progress-steps">
                    {[1, 2, 3, 4, 5, 6].map((step) => (
                        <div key={step} className={`step ${step === currentStep ? 'active' : ''}`}>
                            <div className="step-number">{step}</div>
                            <div className="step-label">
                                {step === 1 && 'Credenciales'} 
                                {step === 2 && 'Ubicación'}
                                {step === 3 && 'Empresarial'}
                                {step === 4 && 'Financiero'}
                                {step === 5 && 'Autorización'}
                                {step === 6 && 'Confirmación'}
                            </div>
                        </div>
                    ))}
                </div>


                <form onSubmit={handleSubmit} className="company-form">
                    {/* Paso 1: Información Básica y CREDENCIALES */}
                    {currentStep === 1 && (
                         <div className="form-step">
                            <h2 className="step-title">1. Información Básica y Credenciales de Acceso</h2>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Nombre de la Empresa <span className="required">*</span></label>
                                    <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className={`form-input ${errors.companyName ? 'input-error' : ''}`} placeholder="Nombre legal" />
                                    {errors.companyName && <span className="error-message">{errors.companyName}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Correo (Usuario) <span className="required">*</span></label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={`form-input ${errors.email ? 'input-error' : ''}`} placeholder="correo@empresa.com" />
                                    {errors.email && <span className="error-message">{errors.email}</span>}
                                </div>
                            </div>

                             <div className="form-row">
                                 <div className="form-group">
                                     <label className="form-label">Teléfonos <span className="required">*</span></label>
                                     <input type="tel" name="phones" value={formData.phones} onChange={handleChange} className={`form-input ${errors.phones ? 'input-error' : ''}`} placeholder="Teléfono de contacto" />
                                     {errors.phones && <span className="error-message">{errors.phones}</span>}
                                 </div>
                                 <div className="form-group">
                                     <label className="form-label">Nombre de Contacto <span className="required">*</span></label>
                                     <input type="text" name="contactName" value={formData.contactName} onChange={handleChange} className={`form-input ${errors.contactName ? 'input-error' : ''}`} placeholder="Nombre del contacto principal" />
                                     {errors.contactName && <span className="error-message">{errors.contactName}</span>}
                                 </div>
                             </div>

                             <div className="form-group">
                                 <label className="form-label">NIT <span className="optional">(Opcional)</span></label>
                                 <input type="text" name="nit" value={formData.nit} onChange={handleChange} className="form-input" placeholder="Número de Identificación Tributaria" />
                             </div>
                            
                            <h3 className="step-subtitle">Contraseña de Acceso</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Contraseña <span className="required">*</span></label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} className={`form-input ${errors.password ? 'input-error' : ''}`} placeholder="Mínimo 8 caracteres" />
                                    <small className="hint-text">Debe tener min. 8 carac. (letras, números y 1 símbolo especial).</small>
                                    {errors.password && <span className="error-message">{errors.password}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Confirmar Contraseña <span className="required">*</span></label>
                                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`} placeholder="Repita su contraseña" />
                                    {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                                </div>
                            </div>
                            <div className="navigation-buttons"> 
        {/* BOTÓN DE REGRESAR */}
        <button 
            type="button" 
            className="btn-back" // <--- Clase CSS para estilo
            onClick={handleRegresarALanding}
        >
            ← Regresar
        </button>
        
        {/* BOTÓN DE SIGUIENTE */}
        <button 
            type="button" 
            className="btn-next" // <--- Clase CSS para estilo
            onClick={handleNextStep}
        >
            Siguiente →
        </button>
    </div>
                        </div>
                    )}

                    {/* Paso 2: UBICACIÓN */}
                    {currentStep === 2 && (
                        <div className="form-step">
                            <h2 className="step-title">2. Ubicación</h2>
                            
                            <div className="form-group">
                                <label className="form-label">Dirección <span className="required">*</span></label>
                                <input type="text" name="address" value={formData.address} onChange={handleChange} className={`form-input ${errors.address ? 'input-error' : ''}`} placeholder="Dirección completa de la sede principal" />
                                {errors.address && <span className="error-message">{errors.address}</span>}
                            </div>

                            <div className="form-row">
                                {/* Selector de Departamento */}
                                <div className="form-group">
                                    <label className="form-label">Departamento <span className="required">*</span></label>
                                    <select
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        className={`form-select ${errors.department ? 'input-error' : ''}`}
                                    >
                                        <option value="">Seleccione un departamento...</option>
                                        {Object.keys(DATOS_UBICACION).sort().map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                    {errors.department && <span className="error-message">{errors.department}</span>}
                                </div>

                                {/* Selector de Ciudad (Dependiente del departamento) */}
                                <div className="form-group">
                                    <label className="form-label">Ciudad <span className="required">*</span></label>
                                    <select
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className={`form-select ${errors.city ? 'input-error' : ''}`}
                                        disabled={!formData.department}
                                    >
                                        <option value="">Seleccione una ciudad...</option>
                                        {formData.department && DATOS_UBICACION[formData.department]?.sort().map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                    {errors.city && <span className="error-message">{errors.city}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Paso 3: Información Empresarial */}
                    {currentStep === 3 && (
                        <div className="form-step">
                            <h2 className="step-title">3. Información Empresarial</h2>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Tipo de Empresa <span className="required">*</span></label>
                                    <select name="companyType" value={formData.companyType} onChange={handleChange} className={`form-select ${errors.companyType ? 'input-error' : ''}`}>
                                        <option value="">Seleccione un tipo de empresa</option>
                                        <option value="pn">Persona Natural</option>
                                        <option value="sas">Sociedad por acciones Simplificadas (SAS)</option>
                                        <option value="ltda">Sociedad de Responsabilidad Limitada (Ltda)</option>
                                        <option value="sa">Sociedad Anónima (SA)</option>
                                        <option value="sas">Empresa Unipersonal (UE)</option>
                                        <option value="otra">Otra</option>
                                    </select>
                                    {errors.companyType && <span className="error-message">{errors.companyType}</span>}
                                </div>
                                {formData.companyType === 'otra' && (
                                    <div className="form-group">
                                        <label className="form-label">Especifique el Tipo <span className="required">*</span></label>
                                        <input type="text" name="otherCompanyType" value={otherCompanyType} onChange={(e) => setOtherCompanyType(e.target.value)} className={`form-input ${errors.otherCompanyType ? 'input-error' : ''}`} placeholder="Ej: Sociedad Colectiva" />
                                        {errors.otherCompanyType && <span className="error-message">{errors.otherCompanyType}</span>}
                                    </div>
                                )}
                            </div>

                            <div className="form-row">
                                {/* Selector Múltiple para Sector Económico */}
                                <div className="form-group" ref={economicRef}>
                                    <label className="form-label">Sector(es) Económico(s) <span className="required">*</span></label>
                                    <div className="custom-select-container">
                                        <div
                                            className={`form-select custom-select-header ${errors.economicSector ? 'input-error' : ''}`}
                                            onClick={() => setIsEconomicDropdownOpen(!isEconomicDropdownOpen)}
                                        >
                                            {formData.economicSector.length > 0
                                                ? formData.economicSector.join(', ')
                                                : 'Seleccione uno o más sectores...'}
                                        </div>
                                        
                                        {isEconomicDropdownOpen && (
                                            <div className="custom-select-dropdown">
                                                {SECTORES_ECONOMICOS.map(sector => (
                                                    <div key={sector} className="dropdown-option">
                                                        <input
                                                            type="checkbox"
                                                            id={`sector-${sector}`}
                                                            value={sector}
                                                            checked={formData.economicSector.includes(sector)}
                                                            onChange={(e) => handleMultiSelectChange('economicSector', e)}
                                                        />
                                                        <label htmlFor={`sector-${sector}`}>{sector}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {errors.economicSector && <span className="error-message">{errors.economicSector}</span>}
                                </div>
                                
                                {/* Input condicional para 'Otro Sector' */}
                                {formData.economicSector.includes('Otro') && (
                                    <div className="form-group">
                                        <label className="form-label">Especifique el Otro Sector <span className="required">*</span></label>
                                        <input type="text" name="otroSector" value={otroSector} onChange={handleOtroSectorChange} className={`form-input ${errors.otroSector ? 'input-error' : ''}`} placeholder="Ej: Minería Artesanal" />
                                        {errors.otroSector && <span className="error-message">{errors.otroSector}</span>}
                                    </div>
                                )}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Año de Fundación <span className="required">*</span></label>
                                    <select name="foundationYear" value={formData.foundationYear} onChange={handleChange} className={`form-select ${errors.foundationYear ? 'input-error' : ''}`}>
                                        <option value="">Seleccione el año de fundación</option>
                                        {Array.from({length: 50}, (_, i) => { const year = new Date().getFullYear() - i; return <option key={year} value={year}>{year}</option>; }).reverse()}
                                    </select>
                                    {errors.foundationYear && <span className="error-message">{errors.foundationYear}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Número de Empleados <span className="required">*</span></label>
                                    <select name="employees" value={formData.employees} onChange={handleChange} className={`form-select ${errors.employees ? 'input-error' : ''}`}>
                                        <option value="">Seleccione el número de empleados</option>
                                        <option value="1-10">1-10 empleados</option>
                                        <option value="11-50">11-50 empleados</option>
                                        <option value="51-200">51-200 empleados</option>
                                        <option value="201-500">201-500 empleados</option>
                                        <option value="501+">Más de 500 empleados</option>
                                    </select>
                                    {errors.employees && <span className="error-message">{errors.employees}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Paso 4: Información Financiera y Comercial */}
                    {currentStep === 4 && (
                        <div className="form-step">
                            <h2 className="step-title">4. Información Financiera y Comercial</h2>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Ingresos Anuales <span className="required">*</span></label>
                                    <select name="annualRevenue" value={formData.annualRevenue} onChange={handleChange} className={`form-select ${errors.annualRevenue ? 'input-error' : ''}`}>
                                        <option value="">Seleccione el rango de ingresos</option>
                                        <option value="menos-100">Menos de 100 millones</option>
                                        <option value="100-500">100-500 millones</option>
                                        <option value="500-1000">500-1000 millones</option>
                                        <option value="mas-1000">Más de 1000 millones</option>
                                    </select>
                                    {errors.annualRevenue && <span className="error-message">{errors.annualRevenue}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Activos Totales <span className="optional">(Opcional)</span></label>
                                    <select name="totalAssets" value={formData.totalAssets} onChange={handleChange} className="form-select">
                                        <option value="">Seleccione el valor de activos</option>
                                        <option value="menos-50">Menos de 50 millones</option>
                                        <option value="50-200">50-200 millones</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                {/* Selector Múltiple para Canales de Distribución */}
                                <div className="form-group" ref={channelsRef}>
                                    <label className="form-label">Canales de Distribución <span className="required">*</span></label>
                                    <div className="custom-select-container">
                                        <div
                                            className={`form-select custom-select-header ${errors.distributionChannels ? 'input-error' : ''}`}
                                            onClick={() => setIsChannelsDropdownOpen(!isChannelsDropdownOpen)}
                                        >
                                            {formData.distributionChannels.length > 0
                                                ? formData.distributionChannels.join(', ')
                                                : 'Seleccione uno o más canales...'}
                                        </div>
                                        
                                        {isChannelsDropdownOpen && (
                                            <div className="custom-select-dropdown">
                                                {CANALES_DISTRIBUCION_OPCIONES.map(canal => (
                                                    <div key={canal} className="dropdown-option">
                                                        <input
                                                            type="checkbox"
                                                            id={`canal-${canal}`}
                                                            value={canal}
                                                            checked={formData.distributionChannels.includes(canal)}
                                                            onChange={(e) => handleMultiSelectChange('distributionChannels', e)}
                                                        />
                                                        <label htmlFor={`canal-${canal}`}>{canal}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {errors.distributionChannels && <span className="error-message">{errors.distributionChannels}</span>}
                                </div>
                                
                                {/* Input condicional para 'Otro Canal' */}
                                {formData.distributionChannels.includes('Otro Canal') && (
                                    <div className="form-group">
                                        <label className="form-label">Especifique el Canal <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            name="otroCanalDistribucion"
                                            value={formData.otroCanalDistribucion}
                                            onChange={handleOtroCanalDistribucionChange}
                                            className={`form-input ${errors.otroCanalDistribucion ? 'input-error' : ''}`}
                                            placeholder="Ej: Subasta Online"
                                        />
                                        {errors.otroCanalDistribucion && <span className="error-message">{errors.otroCanalDistribucion}</span>}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Principales Clientes <span className="required">*</span></label>
                                <textarea name="mainClients" value={formData.mainClients} onChange={handleChange} className={`form-input ${errors.mainClients ? 'input-error' : ''}`} placeholder="Describa brevemente su perfil de cliente principal." rows="3"></textarea>
                                {errors.mainClients && <span className="error-message">{errors.mainClients}</span>}
                            </div>
                        </div>
                    )}

                    {/* ⚡ CORRECCIÓN: Paso 5 con texto de Autorización */}
                    {currentStep === 5 && (
                        <div className="form-step">
                            <h2 className="step-title">5. Autorización de Datos y Políticas</h2>
                            <p className="step-subtitle">Por favor, revise y acepte nuestras políticas de uso de datos.</p>
                            
                            {/* Bloque de Texto de la Política */}
                            <div className="policy-block">
                                <h3 className="policy-title">Política de Autorización de Datos</h3>
                                <div className="policy-content">
                                    <p><strong>Autorización para el Tratamiento de Datos Personales</strong></p>
                                    <ol>
                                        <li><strong>Recolección de Datos:</strong> Recopilamos información personal como nombre, dirección de correo electrónico, número de teléfono y otros datos relevantes para nuestros servicios.</li>
                                        <li><strong>Uso de la Información:</strong> Utilizamos sus datos para proporcionar y mejorar nuestros servicios, personalizar su experiencia, procesar transacciones y comunicarnos con usted.</li>
                                        <li><strong>Protección de Datos:</strong> Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos personales contra acceso no autorizado, alteración, divulgación o destrucción.</li>
                                        <li><strong>Compartir Información:</strong> Podemos compartir su información con terceros de confianza que nos ayudan a operar nuestro negocio y servicios, siempre bajo estrictas normas de confidencialidad.</li>
                                        <li><strong>Sus Derechos:</strong> Usted tiene derecho a acceder, corregir, actualizar o solicitar la eliminación de sus datos personales en cualquier momento.</li>
                                        <li><strong>Cambios en la Política:</strong> Nos reservamos el derecho de modificar esta política de privacidad en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en nuestro sitio web.</li>
                                        <li><strong>Consentimiento:</strong> Al utilizar nuestros servicios, usted consiente la recopilación y uso de su información de acuerdo con esta política.</li>
                                        <li><strong>Contacto:</strong> Si tiene preguntas sobre esta política o el manejo de sus datos personales, por favor contáctenos a través de los canales proporcionados en nuestro sitio web.</li>
                                    </ol>
                                </div>
                            </div>


                            {/* Checkboxes de Autorización */}
                            <div className="form-group checkbox-group">
                                <input type="checkbox" id="autorizaDatos" name="autorizaDatos" checked={formData.autorizaDatos} onChange={handleChange} />
                                <label htmlFor="autorizaDatos" className={errors.autorizaDatos ? 'error-text' : ''}>
                                    <span className="required">*</span> Autorizo el uso y tratamiento de mis datos personales (Obligatorio).
                                </label>
                                {errors.autorizaDatos && <span className="error-message">{errors.autorizaDatos}</span>}
                            </div>

                            <div className="form-group checkbox-group">
                                <input type="checkbox" id="aceptaMarketing" name="aceptaMarketing" checked={formData.aceptaMarketing} onChange={handleChange} />
                                <label htmlFor="aceptaMarketing">Acepto recibir comunicaciones comerciales y de marketing.</label>
                            </div>

                            <div className="form-group checkbox-group">
                                <input type="checkbox" id="comparteTerceros" name="comparteTerceros" checked={formData.comparteTerceros} onChange={handleChange} />
                                <label htmlFor="comparteTerceros">Autorizo compartir datos con terceros aliados para ofertas de valor.</label>
                            </div>
                            
                            <div className="form-group checkbox-group">
                                <input type="checkbox" id="aceptaRetencion" name="aceptaRetencion" checked={formData.aceptaRetencion} onChange={handleChange} />
                                <label htmlFor="aceptaRetencion">Acepto la política de retención de información por el periodo estipulado.</label>
                            </div>
                        </div>
                    )}

                    {/* Paso 6: Confirmación Final */}
                    {currentStep === 6 && (
                        <div className="form-step final-confirmation">
                            <h2 className="step-title">6. Resumen Final</h2>
                            <p className="step-subtitle">Revise los datos y confirme para finalizar su registro.</p>

                            <div className="resumen-container">
  
  {/* --- Resumen de Credenciales (Paso 1) --- */}
  <div className="resumen-seccion">
    <h3>✅ 1. Credenciales de Acceso</h3>
    <p><strong>Nombre de la Empresa:</strong> {formData.companyName}</p>
    <p><strong>Correo (Usuario):</strong> {formData.email}</p>
    <p><strong>Teléfonos:</strong> {formData.phones}</p>
    <p><strong>Nombre de Contacto:</strong> {formData.contactName}</p>
    {/* Nota: No muestres la Contraseña */}
  </div>

  {/* --- Separador --- */}
  <hr /> 

  {/* --- Resumen de Ubicación (Paso 2) --- */}
  <div className="resumen-seccion">
    <h3>📍 2. Ubicación</h3>
    <p><strong>Dirección:</strong> {formData.address}</p>
    <p><strong>Ciudad:</strong> {formData.city}</p>
    {/* Agrega aquí cualquier otro campo de ubicación (departamento, código postal, etc.) */}
  </div>

</div>

{/* ... El resto del formulario del paso 6 (Confirmación) ... */}
                            
                            <div className="form-group checkbox-group final-check">
                                <input type="checkbox" id="confirmacionFinal" name="confirmacionFinal" checked={formData.confirmacionFinal} onChange={handleChange} />
                                <label htmlFor="confirmacionFinal" className={errors.confirmacionFinal ? 'error-text' : ''}>
                                    <span className="required">*</span> Confirmo que la información proporcionada es verídica y completa.
                                </label>
                                {errors.confirmacionFinal && <span className="error-message">{errors.confirmacionFinal}</span>}
                            </div>

                            <div className="alert-box">
                                ¡Importante! Al hacer clic en "Registrar Empresa", sus datos serán enviados.
                            </div>
                        </div>
                    )}



                {/* -------------------------------------------------------- */}
{/* BOTONES DE NAVEGACIÓN (GLOBAL) */}
{/* -------------------------------------------------------- */}
{/* 👈 NUEVA CONDICIÓN CLAVE: El div solo se renderiza a partir del Paso 2 */}
{currentStep > 1 && ( 
    <div className="form-navigation">
        
        {/* Botón de Retroceso (Ahora siempre se muestra, ya que currentStep > 1) */}
        <button type="button" onClick={prevStep} className="btn-secondary">
            &larr; Anterior
        </button>

        {/* Botón de Siguiente/Finalizar */}
        {/* 👇 Modificamos la condición para que solo muestre "Siguiente" hasta el Paso 5 */}
        {currentStep < 6 ? (
            <button type="button" onClick={handleNextStep} className="btn-primary">
                Siguiente &rarr;
            </button>
        ) : (
            <button type="submit" className="btn-success">
                Registrar Empresa
            </button>
        )}
    </div>
)}
                </form>
            </div>
        </div>
    );
}
