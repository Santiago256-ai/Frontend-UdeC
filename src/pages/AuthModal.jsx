import { useState, useCallback } from 'react'; // Usamos useCallback para optimizar
import { useNavigate } from 'react-router-dom';
import './AuthModal.css';
import Logo360Pro from "../assets/Logo360Pro.png";
import API from '../services/api'; 

export default function AuthModal({ isVisible, onClose }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [showFloatOptions, setShowFloatOptions] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [identificador, setIdentificador] = useState(''); 
    const [contraseña, setContraseña] = useState('');
    const [loginError, setLoginError] = useState(null); 
    const [isLoading, setIsLoading] = useState(false); // 💡 NUEVO: Estado para bloqueo/UX

    const navigate = useNavigate();

    if (!isVisible) return null;

    const togglePanel = useCallback(() => {
        setIsRegistering(prev => !prev);
        setShowFloatOptions(false);
    }, []);

    const togglePasswordVisibility = useCallback(() => setShowPassword(prev => !prev), []);

    // 💡 FUNCIÓN CENTRALIZADA PARA LA REDIRECCIÓN
    const redirectToDashboard = (usuario) => {
        const userRole = usuario.rol?.toLowerCase(); // Aseguramos minúsculas
        onClose(); // Cerrar el modal antes de redirigir

        if (userRole === 'estudiante' || userRole === 'persona') {
            navigate('/vacantes-dashboard', { state: { usuario } });
        } else if (userRole === 'empresa' || userRole === 'compania') {
            navigate('/empresa-dashboard', { state: { usuario } });
        } else {
            console.error("Tipo de usuario no reconocido:", usuario);
            setLoginError('Login exitoso, pero el rol del usuario es desconocido.');
        }
    };


    // --- LOGIN con Axios ---
    const attemptLogin = async (endpoint) => {
        try {
            const response = await API.post(endpoint, { identificador, contraseña });
            // Devuelve el objeto usuario, sea en 'usuario' o directamente en data
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

        setIsLoading(true); // 💡 BLOQUEAR UI
        
        let usuario = null;

        // 1. Intentar como Estudiante/Persona
        usuario = await attemptLogin('/estudiantes/login');

        // 2. Si falla, intentar como Empresa/Compañía
        if (!usuario) {
            usuario = await attemptLogin('/empresas/login');
        }
        
        setIsLoading(false); // 💡 DESBLOQUEAR UI

        if (usuario) {
            redirectToDashboard(usuario);
        } else {
            setLoginError('Credenciales incorrectas. El correo/usuario o la contraseña no coinciden.');
        }
    };

    // --- Funciones de Registro y Navegación ---
    const handleRegisterStart = () => setShowFloatOptions(true);

    const handlePersonaClick = () => {
        navigate('/register/student');
        onClose();
    };

    const handleEmpresaClick = () => {
        navigate('/register/company');
        onClose();
    };

    const handleForgotPasswordClick = (e) => {
        e.preventDefault();
        navigate('/forgot-password');
        onClose();
    };


    // --- JSX / Renderizado ---

    // Contenido del Panel (Registro / Inicio de Sesión)
    const panelContent = isRegistering ? (
        <>
            <div className="logo-container-panel"> 
                <img src={Logo360Pro} alt="Logo 360PRO" className="panel-logo-img" /> 
            </div>
            <h1 className="auth-title">¡Bienvenido!</h1>
            <p className="auth-paragraph">Impulsa el rendimiento de tu empresa. Inicia sesión para llevar tu negocio al siguiente nivel.</p>
            <button className="auth-button fantasma" onClick={togglePanel}>
                Iniciar Sesión
            </button>
        </>
    ) : (
        <>
            <div className="logo-container-panel"> 
                <img src={Logo360Pro} alt="Logo 360PRO" className="panel-logo-img" /> 
            </div>
            <h1 className="auth-title">¡Hola!</h1>
            <p className="auth-paragraph">Introduce tus datos personales y comienza a llevar tu empresa al siguiente nivel.</p>
            
            <div className="register-action-area">
                {!showFloatOptions && (
                    <button 
                        className="auth-button fantasma register-main-btn"
                        onClick={handleRegisterStart}
                    >
                        Registrarse
                    </button>
                )}
                {showFloatOptions && (
                    <div className="float-options-container">
                        <button className="option-btn persona-btn float-btn" onClick={handlePersonaClick}>
                            👤 Persona Natural 
                        </button>
                        <button className="option-btn empresa-btn float-btn" onClick={handleEmpresaClick}>
                            🏢 Persona Jurídica
                        </button>
                        <a href="#" className="go-back-link-left" onClick={(e) => {e.preventDefault(); setShowFloatOptions(false);}}>
                            ← Volver
                        </a>
                    </div>
                )}
            </div>
        </>
    );

    // Formulario de Registro (Estático por ahora, solo para UI)
    const RegisterForm = (
        <form className="formulario-container registrarse-container" onSubmit={(e) => e.preventDefault()}>
            <h2>Crear Cuenta</h2>
            <input type="text" placeholder="Nombre" required />
            <input type="email" placeholder="Correo" required />
            <input type="password" placeholder="Contraseña" required />
            <button type="submit" className="form-submit-btn">Registrarse</button>
            <a href="#" className="go-back-link" onClick={togglePanel}>← Iniciar Sesión</a>
        </form>
    );

    // Formulario de Inicio de Sesión (Login real)
    const LoginForm = (
        <form className="formulario-container iniciar-sesion-container" onSubmit={handleLoginSubmit}>
            <h2 className="login-title-desktop">Iniciar sesión</h2>

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

            {loginError && <p style={{ color: 'red', marginTop: '10px', textAlign: 'center', fontSize: '0.9em' }}>{loginError}</p>}

            <a href="#" className="forgot-password" onClick={handleForgotPasswordClick}>¿Has olvidado tu contraseña?</a>

            <button 
                type="submit" 
                className="form-submit-btn large-blue-btn" 
                disabled={isLoading} // 💡 BLOQUEO DEL BOTÓN
            >
                {isLoading ? 'Cargando...' : 'Iniciar sesión'}
            </button>
        </form>
    );

    const containerClass = `auth-modal-overlay ${isRegistering ? 'panel-activo' : ''}`;


    return (
        <div className={containerClass} onClick={onClose}>
            <div className="auth-contenedor-principal" onClick={(e) => e.stopPropagation()}>
                <div className="panel-contenedor panel-izquierdo">
                    <div className="contenido-panel">
                        <button className="close-btn" onClick={onClose}>X</button>
                        <div className="content-wrapper">{panelContent}</div>
                    </div>
                </div>

                <div className="panel-contenedor panel-derecho">
                    {isRegistering ? RegisterForm : LoginForm}
                </div>
            </div>
        </div>
    );
}