import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthModal.css';

import Logo360Pro from "../assets/Logo360Pro.png";
import API from '../services/api'; // Usar Axios con la URL de producción

// 🚨 IMPORTACIONES DE FIREBASE (Asegúrate de que estas rutas sean correctas)
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, microsoftProvider } from "./firebase"; 


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
    // 📌 VARIABLES DE ESTADO
    const [currentStep, setCurrentStep] = useState(STEPS.SELECT_ROLE);
    const [selectedRole, setSelectedRole] = useState(null); // Nuevo estado para guardar el rol

    const [isRegistering, setIsRegistering] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [identificador, setIdentificador] = useState(''); // Correo o Usuario
    const [contraseña, setContraseña] = useState('');
    const [loginError, setLoginError] = useState(null);

    const navigate = useNavigate();

    if (!isVisible) return null;

    // ------------------------------------------------------------------
    // 🔑 FUNCIONES CENTRALES DE AUTENTICACIÓN Y REDIRECCIÓN (Ajustadas)
    // ------------------------------------------------------------------

    // Función de redirección centralizada
    const redirectToDashboard = (usuario) => {
        const userRole = usuario.rol?.toLowerCase(); // Aseguramos minúsculas

        // ✅ Redirección para Egresados/Estudiantes
        if (userRole === 'estudiante' || userRole === 'persona' || userRole === 'egresado') {
            navigate('/vacantes-dashboard', { state: { usuario } });
        // ✅ Redirección para Empresas
        } else if (userRole === 'empresa' || userRole === 'compania') {
            navigate('/empresa-dashboard', { state: { usuario } });
        } else {
            console.error("Tipo de usuario no reconocido después del login:", usuario);
            setLoginError('Error: Rol de usuario desconocido. Contacta a soporte.');
        }
        onClose(); // Cerrar el modal al redirigir
    };
    
    // 🚨 FUNCIÓN CLAVE AJUSTADA: Solo verifica si el usuario existe o lo retorna.
    // Si NO existe, devuelve null para que se muestre el mensaje de error.
    const verifyUserExistence = async (firebaseUser) => {
        const idToken = await firebaseUser.getIdToken();

        try {
            // Asumiendo que este endpoint solo VERIFICA si el correo existe en tu BD.
            // Si existe, retorna 200 con el objeto de usuario final.
            const response = await API.post('/auth/verify-social-login', { 
                idToken: idToken,
                email: firebaseUser.email 
            });

            // Usuario encontrado y verificado
            return response.data; 

        } catch (error) {
            // Si el backend responde 404/400 (o similar) indicando que el correo no está registrado.
            if (error.response && (error.response.status === 404 || error.response.status === 400)) {
                // Indicamos que el usuario NO está registrado en la BD.
                return null; 
            }
            
            // Para otros errores (servidor caído, timeout, etc.)
            console.error("Error en la verificación del Backend:", error.response?.data || error.message);
            setLoginError("Fallo de comunicación con el servidor. Intenta más tarde.");
            return null;
        }
    };


    // ------------------------------------------------------------------
    // 🔑 MANEJADORES DE LOGIN SOCIAL (NUEVA LÓGICA DE VERIFICACIÓN)
    // ------------------------------------------------------------------
    
    // Función para Iniciar Sesión con Google
    const handleGoogleLogin = async () => {
        setLoginError(null);
        try {
            // 1. Autenticar con Firebase para obtener el token
            const result = await signInWithPopup(auth, googleProvider);
            const firebaseUser = result.user;

            // 2. Verificar existencia en el Backend (NUEVO PASO CLAVE)
            const backendUser = await verifyUserExistence(firebaseUser);
            
            // 3. Evaluar el resultado
            if (backendUser) {
                // A) Éxito: El usuario existe. Redirigir.
                redirectToDashboard(backendUser);
            } else if (!loginError) {
                // B) No existe y no es un error de comunicación: Mostrar mensaje de registro.
                setLoginError('Tu correo de Google no está registrado. Por favor, **debes registrar tu correo** primero o usar el formulario de login/contraseña.');
            }

        } catch (error) {
            if (error.code !== 'auth/popup-closed-by-user') {
                console.error("Error al iniciar sesión con Google:", error);
                setLoginError(`Error de autenticación de Google: ${error.message}`);
            }
        }
    };

    // Función para Iniciar Sesión con Microsoft (Mismo patrón)
    const handleMicrosoftLogin = async () => {
        setLoginError(null);
        try {
            const result = await signInWithPopup(auth, microsoftProvider);
            const firebaseUser = result.user;

            const backendUser = await verifyUserExistence(firebaseUser);
            
            if (backendUser) {
                redirectToDashboard(backendUser);
            } else if (!loginError) {
                setLoginError('Tu correo de Microsoft no está registrado. Por favor, **debes registrar tu correo** primero o usar el formulario de login/contraseña.');
            }

        } catch (error) {
            if (error.code !== 'auth/popup-closed-by-user') {
                console.error("Error al iniciar sesión con Microsoft:", error);
                setLoginError(`Error de autenticación de Microsoft: ${error.message}`);
            }
        }
    };
    // ------------------------------------------------------------------


    // --- Funciones de navegación del Modal (Mantenidas) ---

    const handleRoleSelectionBack = () => {
        setCurrentStep(STEPS.SELECT_ROLE);
        setSelectedRole(null);
        setIsRegistering(false); 
    }
    
    const startAuthFlow = (role) => {
        setSelectedRole(role);
        setCurrentStep(STEPS.AUTH_FORMS);
        setLoginError(null); // Limpiar errores al entrar al form
    };

    const togglePanel = () => {
        setIsRegistering(prev => !prev);
    };

    const handlePersonaClick = () => {
        // Redirigir a la página de registro de egresados/estudiantes
        navigate('/register/student');
        onClose();
    };

    const handleEmpresaClick = () => {
        // Redirigir a la página de registro de empresas
        navigate('/register/company');
        onClose();
    };

    const togglePasswordVisibility = () => setShowPassword(prev => !prev);

    const handleForgotPasswordClick = (e) => {
        e.preventDefault();
        navigate('/forgot-password');
        onClose();
    };

    // --- LÓGICA DE LOGIN por Correo y Contraseña (Mantenida, ya valida ambos roles) ---
    const attemptLogin = async (endpoint) => {
        setLoginError(null);
        try {
            const response = await API.post(endpoint, { identificador, contraseña });
            // Tu backend puede devolver el usuario en .data.usuario o solo .data
            return response.data.usuario || response.data; 
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

        // 1. Intentar el login como Estudiante/Egresado
        let usuario = await attemptLogin('/estudiantes/login');
        
        // 2. Si falla, intentar como Empresa
        if (!usuario) {
            usuario = await attemptLogin('/empresas/login');
        }

        // 3. Redirección basada en el resultado
        if (usuario) {
            // Si el login con credenciales es exitoso, redirige.
            redirectToDashboard(usuario);
        } else {
            setLoginError('Credenciales incorrectas. El correo/usuario o la contraseña no coinciden.');
        }
    };


    // --- JSX / Renderizado ---

    const panelContent = (
        // Contenido del panel izquierdo
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
                    <button 
                        className="auth-button fantasma" 
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

    const RoleSelectionForm = (
        // Formulario de selección de rol
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

    // 📌 Formulario de Login (CON BOTONES SOCIALES INTEGRADOS Y FUNCIONALES)
    const LoginForm = (
        <form className="formulario-container iniciar-sesion-container" onSubmit={handleLoginSubmit}>
            <h2 className="login-title-desktop">Iniciar sesión como {selectedRole === ROLES.EMPRESA ? 'Empresa' : 'Egresado'}</h2>

            {/* --- BOTONES SOCIALES --- */}
            <button 
                type="button" 
                className="social-login-btn google-btn" 
                onClick={handleGoogleLogin}
            >
                {/* SVG de Google */}
                <svg className="auth-icon" viewBox="0 0 24 24" width="20px" height="20px">
                    <path fill="#4285F4" d="M22.5 12.5c0-.6-.1-1.2-.2-1.7H12v3.4h5.6c-.3 1.7-1.3 3.1-2.9 4v2.7h3.5c2.1-1.9 3.4-4.8 3.4-8.4z"/>
                    <path fill="#34A853" d="M12 24c3.3 0 6.1-1.1 8.2-3.1l-3.5-2.7c-1.1.7-2.5 1.1-4.7 1.1-3.6 0-6.7-2.4-7.8-5.6H.7v2.8C2.9 21.6 7.1 24 12 24z"/>
                    <path fill="#FBBC05" d="M4.2 14.3c-.2-.7-.3-1.4-.3-2.3s.1-1.6.3-2.3V6.9H.7c-.5 1.1-.7 2.5-.7 4.1s.2 3 .7 4.1L4.2 14.3z"/>
                    <path fill="#EA4335" d="M12 4.6c2.1 0 4.1.8 5.6 2.1l3.1-3.1C18.1 1.7 15.3 0 12 0 7.1 0 2.9 2.4.7 6.9l3.5 2.8c1.1-3.2 4.2-5.6 7.8-5.6z"/>
                </svg>
                Continuar con Google
            </button>

            <button 
                type="button" 
                className="social-login-btn microsoft-btn" 
                onClick={handleMicrosoftLogin}
            >
                {/* SVG de Microsoft */}
                <svg className="auth-icon" viewBox="0 0 240 240" width="20px" height="20px">
                    <rect x="10" y="10" width="110" height="110" fill="#F25022"/>
                    <rect x="120" y="10" width="110" height="110" fill="#7FBA00"/>
                    <rect x="10" y="120" width="110" height="110" fill="#00A4EF"/>
                    <rect x="120" y="120" width="110" height="110" fill="#FFB900"/>
                </svg>
                Continuar con Microsoft
            </button>
            
            <div className="social-separator-top">
                    <span>O inicia sesión con correo y contraseña</span>
            </div>
            {/* ----------------------------------------------------------- */}

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

            {loginError && <p style={{ color: 'red', marginTop: '10px', textAlign: 'center', fontWeight: 'bold' }} dangerouslySetInnerHTML={{ __html: loginError }}></p>}

            <a href="#" className="forgot-password" onClick={handleForgotPasswordClick}>¿Has olvidado tu contraseña?</a>

            <button type="submit" className="form-submit-btn large-blue-btn">Iniciar sesión</button>

        </form>
    );


    // Renderizado del Panel Derecho
    const renderRightPanelContent = () => {
        if (currentStep === STEPS.SELECT_ROLE) {
            return RoleSelectionForm;
        }
        
        // En el paso AUTH_FORMS, siempre devuelve el LoginForm
        return LoginForm; 
    };

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