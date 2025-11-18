import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import './AuthModal.css';

import Logo360Pro from "../assets/Logo360Pro.png";

import API from '../services/api'; // Usar Axios con la URL de producción



// Nuevos pasos:

// 1: Seleccionar Rol (Egresado/Empresa)

// 2: Login / Registro por Correo

const STEPS = {

    SELECT_ROLE: 1,

    AUTH_FORMS: 2,

};



// Roles para el formulario de registro (necesitas saber qué tipo de registro va a hacer el usuario)

const ROLES = {

    EGRESADO: 'egresado',

    EMPRESA: 'empresa',

};



export default function AuthModal({ isVisible, onClose }) {

    // 📌 NUEVA VARIABLE DE ESTADO

    const [currentStep, setCurrentStep] = useState(STEPS.SELECT_ROLE);

    const [selectedRole, setSelectedRole] = useState(null); // Nuevo estado para guardar el rol



    const [isRegistering, setIsRegistering] = useState(false);

    const [showFloatOptions, setShowFloatOptions] = useState(false); // Esta ya no es estrictamente necesaria, pero la mantengo

    const [showPassword, setShowPassword] = useState(false);



    const [identificador, setIdentificador] = useState(''); // Correo o Usuario

    const [contraseña, setContraseña] = useState('');

    const [loginError, setLoginError] = useState(null);



    const navigate = useNavigate();



    if (!isVisible) return null;



    // --- Funciones de navegación del Modal ---



    // Vuelve al paso de selección de rol

    const handleRoleSelectionBack = () => {

        setCurrentStep(STEPS.SELECT_ROLE);

        setSelectedRole(null);

        setIsRegistering(false); // Asegúrate de que no esté en registro al volver

        setShowFloatOptions(false);

    }

   

    // Inicia el flujo de autenticación (Login/Registro) para un rol específico

    const startAuthFlow = (role) => {

        setSelectedRole(role);

        setCurrentStep(STEPS.AUTH_FORMS);

    };



    // Alterna entre Login y Registro (como lo hacías antes, ahora en el Step 2)

    const togglePanel = () => {

        setIsRegistering(prev => !prev);

        setShowFloatOptions(false); // Es un toggle, no queremos ver las opciones flotantes

    };



    // Ya no lo usamos para el panel, pero mantenemos la lógica de navegación para los botones flotantes

    const handlePersonaClick = () => {

        navigate('/register/student');

        onClose();

    };



    const handleEmpresaClick = () => {

        navigate('/register/company');

        onClose();

    };



    const togglePasswordVisibility = () => setShowPassword(prev => !prev);



    const handleForgotPasswordClick = (e) => {

        e.preventDefault();

        navigate('/forgot-password');

        onClose();

    };



    // --- LÓGICA DE LOGIN (Sin cambios) ---

    const attemptLogin = async (endpoint) => {

        setLoginError(null);

        try {

            const response = await API.post(endpoint, { identificador, contraseña });

            return response.data.usuario || response.data; // Devuelve usuario

        } catch (error) {

            console.warn(`Intento fallido en ${endpoint}:`, error.response?.data || error.message);

            return null;

        }

    };



    const handleLoginSubmit = async (e) => {

        e.preventDefault();

        setLoginError(null);



        if (!identificador || !contraseña) {

            setLoginError('Debes ingresar tu correo/usuario y contraseña.');

            return;

        }



        let usuario = await attemptLogin('/estudiantes/login');



        if (!usuario) usuario = await attemptLogin('/empresas/login');



        if (usuario) {

            const userRole = usuario.rol;

            if (userRole === 'estudiante' || userRole === 'persona') {

                navigate('/vacantes-dashboard', { state: { usuario } });

            } else if (userRole === 'empresa' || userRole === 'compania') {

                navigate('/empresa-dashboard', { state: { usuario } });

            } else {

                console.error("Tipo de usuario no reconocido:", usuario);

                setLoginError('Login exitoso, pero el rol del usuario es desconocido.');

                return;

            }

            onClose();

        } else {

            setLoginError('Credenciales incorrectas. El correo/usuario o la contraseña no coinciden.');

        }

    };





    // --- JSX / Renderizado ---



    // 📌 1. Contenido del Panel (Izquierda) - Simplificado para el nuevo flujo

    const panelContent = (

        <>

            <div className="logo-container-panel">

                <img src={Logo360Pro} alt="Logo 360PRO" className="panel-logo-img" />

            </div>

            {currentStep === STEPS.SELECT_ROLE ? (

                <>

                    <h1 className="auth-title">Bienvenido a 360PRO</h1>

                    <p className="auth-paragraph">Selecciona un rol para comenzar tu experiencia.</p>

                </>

            ) : isRegistering ? (

                <>

                    <h1 className="auth-title">¡Bienvenido!</h1>

                    <p className="auth-paragraph">Impulsa tu carrera o negocio. Inicia sesión para llevar tu desarrollo al siguiente nivel.</p>

                    <button className="auth-button fantasma" onClick={togglePanel}>

                        Iniciar Sesión

                    </button>

                    <a href="#" className="go-back-link-left" onClick={(e) => {e.preventDefault(); handleRoleSelectionBack();}}>

                        ← Elegir Rol

                    </a>

                </>

            ) : (

                <>

                    <h1 className="auth-title">¡Hola!</h1>

                    <p className="auth-paragraph">¿Aún no tienes cuenta? Regístrate gratis en pocos minutos y encuentra oportunidades o talentos.</p>

                    <button className="auth-button fantasma" onClick={togglePanel}>

                        Registrarse

                    </button>

                    <a href="#" className="go-back-link-left" onClick={(e) => {e.preventDefault(); handleRoleSelectionBack();}}>

                        ← Elegir Rol

                    </a>

                </>

            )}

        </>

    );



    // 📌 2. Formulario de Selección de Rol (Nuevo)

    const RoleSelectionForm = (

        <div className="formulario-container role-selection-container">

            <h2 className="login-title-desktop">Selecciona tu Rol</h2>

            <p style={{ color: '#cccccc', margin: '0 0 30px 0', fontSize: '1rem', width: '100%', textAlign: 'left' }}>

                ¿Buscas empleo como egresado o buscas talento para tu empresa?

            </p>

           

            <button

                className="social-login-btn persona-btn float-btn"

                style={{ marginBottom: '20px' }}

                onClick={() => startAuthFlow(ROLES.EGRESADO)}

            >

                👤 Egresado (Busco Empleo)

            </button>

           

            <button

                className="social-login-btn empresa-btn float-btn"

                onClick={() => startAuthFlow(ROLES.EMPRESA)}

            >

                🏢 Empresa (Busco Talento)

            </button>



            <p style={{ color: '#cccccc', marginTop: '30px', fontSize: '0.85rem', width: '100%', textAlign: 'center' }}>

                Tu rol determinará las opciones que verás en la plataforma.

            </p>

        </div>

    );



    // 📌 3. Formulario de Registro por Correo (Mantenido, pero sin uso real ya que rediriges)

    const RegisterForm = (

        <form className="formulario-container registrarse-container" onSubmit={(e) => e.preventDefault()}>

            <h2>Crear Cuenta como {selectedRole === ROLES.EMPRESA ? 'Empresa' : 'Egresado'}</h2>

            <p style={{ color: '#cccccc', marginBottom: '20px', textAlign: 'center' }}>

                Redireccionando para completar el registro de **{selectedRole === ROLES.EMPRESA ? 'Empresa' : 'Egresado'}**

            </p>

           

            {/* Botón de redirección según el rol */}

            <button

                type="button"

                className="form-submit-btn large-blue-btn"

                onClick={selectedRole === ROLES.EMPRESA ? handleEmpresaClick : handlePersonaClick}

            >

                Continuar a Registro

            </button>

            <a href="#" className="go-back-link" onClick={togglePanel}>← Iniciar Sesión</a>

        </form>

    );



    // 📌 4. Formulario de Login (Sin cambios mayores)

    const LoginForm = (

        <form className="formulario-container iniciar-sesion-container" onSubmit={handleLoginSubmit}>

            <h2 className="login-title-desktop">Iniciar sesión como {selectedRole === ROLES.EMPRESA ? 'Empresa' : 'Egresado'}</h2>



            <input

                type="text"

                placeholder="Correo o Usuario"

                required

                className="modern-input"

                value={identificador}

                onChange={(e) => setIdentificador(e.target.value)}

            />

            <div className="password-container">

                <input

                    type={showPassword ? "text" : "password"}

                    placeholder="Contraseña"

                    required

                    className="modern-input"

                    value={contraseña}

                    onChange={(e) => setContraseña(e.target.value)}

                />

                <button type="button" className="show-password-btn" onClick={togglePasswordVisibility}>

                    {showPassword ? '🙈' : '👁️'}

                </button>

            </div>



            {loginError && <p style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>{loginError}</p>}



            <a href="#" className="forgot-password" onClick={handleForgotPasswordClick}>¿Has olvidado tu contraseña?</a>



            <button type="submit" className="form-submit-btn large-blue-btn">Iniciar sesión</button>

        </form>

    );





    // Renderizado del Panel Derecho

    const renderRightPanelContent = () => {

        if (currentStep === STEPS.SELECT_ROLE) {

            return RoleSelectionForm;

        }

       

        // Si estamos en STEPS.AUTH_FORMS

        if (isRegistering) {

             // Ya que el flujo es 'Registrarse' -> Redirigir, usamos este form modificado.

            return RegisterForm;

        } else {

            return LoginForm;

        }

    };



    const containerClass = `auth-modal-overlay ${currentStep === STEPS.AUTH_FORMS && isRegistering ? 'panel-activo' : ''}`;





    return (

        <div className={containerClass} onClick={onClose}>

            <div className="auth-contenedor-principal" onClick={(e) => e.stopPropagation()}>

                <div className="panel-contenedor panel-izquierdo">

                    <div className="contenido-panel">

                        <button className="close-btn" onClick={onClose}>X</button>

                        <div className="content-wrapper">

                            {panelContent}

                        </div>

                    </div>

                </div>



                <div className="panel-contenedor panel-derecho">

                    {/* Renderiza el contenido dinámico según el paso */}

                    {renderRightPanelContent()}

                </div>

            </div>

        </div>

    );

}