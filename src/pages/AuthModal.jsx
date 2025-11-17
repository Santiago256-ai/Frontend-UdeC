import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthModal.css';
import Logo360Pro from "../assets/Logo360Pro.png";
import API from '../services/api'; // Usar Axios con la URL de producción

export default function AuthModal({ isVisible, onClose }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [showFloatOptions, setShowFloatOptions] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [identificador, setIdentificador] = useState(''); // Correo o Usuario
    const [contraseña, setContraseña] = useState('');
    const [loginError, setLoginError] = useState(null); 

    const navigate = useNavigate();

    if (!isVisible) return null;

    const togglePanel = () => {
        setIsRegistering(prev => !prev);
        setShowFloatOptions(false);
    };

    const handleRegisterStart = () => setShowFloatOptions(true);

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

    // --- LOGIN con Axios ---
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
    const containerClass = `auth-modal-overlay ${isRegistering ? 'panel-activo' : ''}`;

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

            {loginError && <p style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>{loginError}</p>}

            <a href="#" className="forgot-password" onClick={handleForgotPasswordClick}>¿Has olvidado tu contraseña?</a>

            <button type="submit" className="form-submit-btn large-blue-btn">Iniciar sesión</button>
        </form>
    );

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
