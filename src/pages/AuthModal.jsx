import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthModal.css';

// 📌 1. IMPORTAR LA IMAGEN DE TU EMPRESA
import Logo360Pro from "../assets/Logo360Pro.png";

// 💡 URLs de tu API
const API_URL = 'http://localhost:4000/api';

export default function AuthModal({ isVisible, onClose }) {

    // Estados principales
    const [isRegistering, setIsRegistering] = useState(false);
    const [showFloatOptions, setShowFloatOptions] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // 🔹 ESTADOS PARA LOGIN
    const [identificador, setIdentificador] = useState(''); // Correo o Usuario
    const [contraseña, setContraseña] = useState('');
    // 💡 Nuevo estado para manejar el error de login
    const [loginError, setLoginError] = useState(null); 

    const navigate = useNavigate();

    if (!isVisible) return null;

    // --- Funciones de control del Modal ---

    const togglePanel = () => {
        setIsRegistering(prev => !prev);
        setShowFloatOptions(false);
    };

    const handleRegisterStart = () => {
        setShowFloatOptions(true);
    };

    const handlePersonaClick = () => {
        navigate('/register/student');
        onClose();
    };

    const handleEmpresaClick = () => {
        navigate('/register/company');
        onClose();
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    const handleForgotPasswordClick = (e) => {
        e.preventDefault();
        navigate('/forgot-password');
        onClose();
    };

    // --- FUNCIÓN CENTRAL DE INTENTO DE LOGIN ---

    const attemptLogin = async (endpoint) => {
        setLoginError(null); // Limpiar errores anteriores
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // ✅ CORRECCIÓN CLAVE: Enviando 'contraseña'
                body: JSON.stringify({ identificador, contraseña }) 
            });

            const data = await response.json();

            if (!response.ok) {
                // Si la respuesta no es OK, lanza un error con el mensaje del servidor.
                throw new Error(data.error || data.message || `Credenciales incorrectas`);
            }

            // Si el login fue exitoso, devolvemos los datos del usuario.
            return data.usuario; 

        } catch (error) {
            // Manejamos errores de red, o los errores lanzados arriba.
            console.warn(`Intento fallido en ${endpoint}: ${error.message}`);
            return null; // Devuelve null si falla
        }
    };


    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError(null);

        // Validar que ambos campos tengan contenido antes de intentar
        if (!identificador || !contraseña) {
             setLoginError('Debes ingresar tu correo/usuario y contraseña.');
             return;
        }

        // 1. Intentar iniciar sesión como **PERSONA** (Ruta: /estudiantes/login)
        let usuario = await attemptLogin('/estudiantes/login');

        // 2. Si falló el intento como Persona, intentar como **EMPRESA** (Ruta: /empresas/login)
        if (!usuario) {
            usuario = await attemptLogin('/empresas/login');
        }

        // 3. Revisar el resultado del login y REDIRECCIONAR
        if (usuario) {
            console.log('✅ Login exitoso:', usuario);
            
            // Asumimos que el backend de PERSONA devuelve rol="estudiante" 
            // y el de EMPRESA devuelve rol="empresa" (o el rol que uses).
            const userRole = usuario.rol; 
            
            if (userRole === 'estudiante' || userRole === 'persona') {
                // Redireccionar a la persona
                navigate('/vacantes-dashboard', { state: { usuario: usuario } });
            } else if (userRole === 'empresa' || userRole === 'compania') {
                // 🚀 REDIRECCIÓN A EMPRESA
                navigate('/empresa-dashboard', { state: { usuario: usuario } });
            } else {
                // Rol desconocido
                console.error("Tipo de usuario no reconocido:", usuario);
                setLoginError('Login exitoso, pero el rol del usuario es desconocido. Contacta al soporte.');
                return;
            }

            // Cerrar el modal solo si la redirección fue exitosa
            onClose(); 
            
        } else {
            // 4. Mostrar error si ambos intentos fallaron
            setLoginError('Credenciales incorrectas. El correo/usuario o la contraseña no coinciden.');
        }
    };
    
    // --- JSX / Renderizado ---

    const containerClass = `auth-modal-overlay ${isRegistering ? 'panel-activo' : ''}`;

    // Contenido del panel izquierdo
    const panelContent = isRegistering ? (
        // Panel de REGISTRO (muestra botón de "Iniciar Sesión")
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
        // Panel de LOGIN (muestra botón de "Registrarse")
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
                        <button 
                            className="option-btn persona-btn float-btn" 
                            onClick={handlePersonaClick}
                        >
                            👤 Persona Natural 
                        </button>
                        <button 
                            className="option-btn empresa-btn float-btn" 
                            onClick={handleEmpresaClick}
                        >
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
    
    // Formulario de registro (Se mantiene)
    const RegisterForm = (
        <form className="formulario-container registrarse-container" onSubmit={(e) => e.preventDefault()}>
            <h2>Crear Cuenta</h2>
            <input type="text" placeholder="Nombre" required />
            <input type="email" placeholder="Correo" required />
            <input type="password" placeholder="Contraseña" required />
            <button type="submit" className="form-submit-btn">
                Registrarse
            </button>
            <a href="#" className="go-back-link" onClick={togglePanel}>
                ← Iniciar Sesión
            </a>
        </form>
    );

    // Formulario de login
    const LoginForm = (
        <form 
            className="formulario-container iniciar-sesion-container"
            onSubmit={handleLoginSubmit} 
        >
            <h2 className="login-title-desktop">Iniciar sesión</h2>

            {/* Botones sociales */}
            <button 
                type="button" 
                className="social-login-btn google-btn"
                onClick={handlePersonaClick}
            >
                <span className="icon-google"></span> Continue with Google
            </button>
            <button 
                type="button" 
                className="social-login-btn apple-btn"
                onClick={handlePersonaClick}
            >
                <span className="icon-apple"></span> Iniciar sesión con Apple
            </button>

            <p className="terms-text">
                Al hacer clic en «Continuar como» a continuación, aceptas las 
                <a href="#" className="terms-link"> Condiciones de uso</a>, la 
                <a href="#" className="terms-link"> Política de privacidad</a> y la 
                <a href="#" className="terms-link"> Política de cookies</a>.
            </p>

            <div className="form-separator">o</div>

            {/* Inputs conectados a estado */}
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
                <button 
                    type="button" 
                    className="show-password-btn"
                    onClick={togglePasswordVisibility}
                >
                    {showPassword ? '🙈' : '👁️'}
                </button> 
            </div>

            {/* 🛑 MOSTRAR EL MENSAJE DE ERROR SI EXISTE */}
            {loginError && (
                <p style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>
                    {loginError}
                </p>
            )}

            <a 
                href="#" 
                className="forgot-password"
                onClick={handleForgotPasswordClick} 
            >
                ¿Has olvidado tu contraseña?
            </a>

            <div className="keep-logged-in-container">
                <input type="checkbox" id="keep-logged-in" defaultChecked />
                <label htmlFor="keep-logged-in">Mantener la sesión iniciada</label>
            </div>

            <button type="submit" className="form-submit-btn large-blue-btn">Iniciar sesión</button>
        </form>
    );

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
                    {isRegistering ? RegisterForm : LoginForm}
                </div>
            </div>
        </div>
    );
}