import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthModal.css';
import Logo360Pro from "../assets/Logo360Pro.png";
import API from '../services/api'; // Usar Axios con la URL de producción

// 🚨 IMPORTACIÓN DE LOS NUEVOS COMPONENTES
import LoginForm from './LoginForm.jsx';
import RegisterForm from './RegisterForm.jsx';

// Definición de Pasos
const STEPS = {
    SELECT_ROLE: 1,
    AUTH_FORMS: 2,
};

// Roles
const ROLES = {
    EGRESADO: 'egresado',
    EMPRESA: 'empresa',
};

// 🚨 MODIFICACIÓN DE PROPS: Recibe las funciones de Login Social desde Landing.js
export default function AuthModal({ 
    isVisible, 
    onClose,
    handleGoogleLogin, 
    handleMicrosoftLogin 
}) {
    // --- ESTADOS DE CONTROL ---
    const [currentStep, setCurrentStep] = useState(STEPS.SELECT_ROLE);
    const [selectedRole, setSelectedRole] = useState(null); 
    const [isRegistering, setIsRegistering] = useState(false);
    
    // Estos estados ya no se usan en el nuevo flujo de componentes, pero los dejo si los necesitas en otra parte
    const [showFloatOptions, setShowFloatOptions] = useState(false); 
    const [showPassword, setShowPassword] = useState(false);
    const [identificador, setIdentificador] = useState(''); 
    const [contraseña, setContraseña] = useState('');
    const [loginError, setLoginError] = useState(null); 

    const navigate = useNavigate();

    // Resetear estados al abrir/cerrar (opcional, pero buena práctica)
    useEffect(() => {
        if (isVisible) {
            setCurrentStep(STEPS.SELECT_ROLE);
            setSelectedRole(null);
            setIsRegistering(false);
        }
    }, [isVisible]);

    if (!isVisible) return null;

    // --- Funciones de navegación del Modal ---

    // Vuelve al paso de selección de rol
    const handleRoleSelectionBack = () => {
        setCurrentStep(STEPS.SELECT_ROLE);
        setSelectedRole(null);
        setIsRegistering(false);
    }
    
    // Inicia el flujo de autenticación (Login/Registro) para un rol específico
    const startAuthFlow = (role) => {
        setSelectedRole(role);
        setCurrentStep(STEPS.AUTH_FORMS);
        setIsRegistering(false); // Siempre empezamos en Login
    };

    // Alterna entre Login y Registro (se usa en el panel izquierdo y dentro de los formularios)
    const togglePanel = () => {
        setIsRegistering(prev => !prev);
    };

    // Funciones de Redirección (Usadas cuando el registro no es "en el modal" sino en otra página)
    const handlePersonaClick = () => {
        navigate('/register/student');
        onClose();
    };

    const handleEmpresaClick = () => {
        navigate('/register/company');
        onClose();
    };

    // --- LÓGICA DE LOGIN (Se deja solo si planeas usarla, pero idealmente se mueve a LoginForm.js) ---
    // (Mantengo tu lógica de handleLoginSubmit aquí por si la necesitas para re-conectar)
    // Sin embargo, esta lógica DEBE ser movida a LoginForm.jsx para un diseño limpio.
    
    /* const attemptLogin = async (endpoint) => { ... }; 
    const handleLoginSubmit = async (e) => { ... }; */

    // --- JSX / Renderizado ---

    // 📌 1. Contenido del Panel (Izquierda)
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
                // Panel Izquierdo en modo Registro
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
                // Panel Izquierdo en modo Login
                <>
                    <h1 className="auth-title">¡Hola!</h1>
                    <p className="auth-paragraph">¿Aún no tienes cuenta? Regístrate gratis en pocos minutos y encuentra oportunidades o talentos.</p>
                    <button 
                        className="auth-button fantasma" 
                        // El botón de Registrarse aquí redirige al flujo de registro de la landing
                        onClick={selectedRole === ROLES.EMPRESA ? handleEmpresaClick : handlePersonaClick} 
                    >
                        Registrarse
                    </button>
                    <a href="#" className="go-back-link-left" onClick={(e) => {e.preventDefault(); handleRoleSelectionBack();}}>
                        ← Elegir Rol
                    </a>
                </>
            )}
        </>
    );

    // 📌 2. Formulario de Selección de Rol (Se deja aquí porque es la primera vista)
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

    // Renderizado del Panel Derecho
    const renderRightPanelContent = () => {
        if (currentStep === STEPS.SELECT_ROLE) {
            return RoleSelectionForm;
        }
        
        // Si estamos en STEPS.AUTH_FORMS
        if (isRegistering) {
            // 🚨 RENDERIZA EL COMPONENTE DE REGISTRO
            return (
                <RegisterForm 
                    selectedRole={selectedRole} 
                    setIsRegistering={setIsRegistering} // Pasa la función para volver a Login
                    handlePersonaClick={handlePersonaClick}
                    handleEmpresaClick={handleEmpresaClick}
                />
            );
        } else {
            // 🚨 RENDERIZA EL COMPONENTE DE LOGIN (con la integración Social)
            return (
                <LoginForm 
                    selectedRole={selectedRole}
                    setIsRegistering={setIsRegistering} // Pasa la función para ir a Registro
                    handleGoogleLogin={handleGoogleLogin} // Pasa la prop de Google
                    handleMicrosoftLogin={handleMicrosoftLogin} // Pasa la prop de Microsoft
                />
            );
        }
    };

    // Clase para el contenedor que controla la transición (si tienes CSS para ello)
    const containerClass = `auth-modal-overlay ${currentStep === STEPS.AUTH_FORMS ? 'panel-activo' : ''}`;


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