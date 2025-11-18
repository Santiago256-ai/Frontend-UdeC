import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import SocialLoginButtons from './SocialLoginButtons.jsx'; 
// Asumimos que también tienes un componente para mostrar notificaciones, pero usaremos un div simple por ahora.

// La URL base de tu Backend en Railway
const RAILWAY_BASE_URL = 'https://backend-udec-production.up.railway.app/api'; 

export default function LoginForm({ 
    selectedRole, 
    setIsRegistering, 
    handleGoogleLogin, 
    handleMicrosoftLogin 
}) {
    
    // 🚨 INICIALIZAR EL HOOK DE NAVEGACIÓN
    const navigate = useNavigate();
    
    // --- ESTADOS Y LÓGICA DE FORMULARIO ---
    const [loginData, setLoginData] = useState({
        identificador: '', // Usuario o Email
        password: '',
        keepLoggedIn: false,
    });

    // Nuevo estado para manejar y mostrar errores sin usar alert()
    const [loginError, setLoginError] = useState(null);
    
    // Estado para deshabilitar el botón y mostrar un indicador de carga
    const [isLoading, setIsLoading] = useState(false);
    
    const handleLoginChange = (e) => {
        const { name, value, type, checked } = e.target;
        setLoginData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };
    
// FUNCIÓN DE ENVÍO CON URLs REALES DE RAILWAY Y REDIRECCIÓN CONDICIONAL
const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null); // Limpiar errores anteriores
    setIsLoading(true); // Activar el indicador de carga
    
    const isEgresado = selectedRole === 'egresado';
    
    // 1. Determina el Endpoint (Ruta completa de la API con /auth/)
    const endpoint = isEgresado
        ? `${RAILWAY_BASE_URL}/auth/egresado/login` 
        : `${RAILWAY_BASE_URL}/auth/empresa/login`;
        
    // 2. Determina la ruta de redirección
    const redirectPath = isEgresado
        ? '/vacantesdashboard' 
        : '/empresadashboard'; 

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                identificador: loginData.identificador, 
                password: loginData.password,
            }),
        });

        // Verificar si la respuesta NO fue OK
        if (!response.ok) {
            let errorData;
            try {
                // Intentar leer el JSON de error del servidor
                errorData = await response.json();
            } catch (jsonError) {
                // Si falla al leer JSON, es un error de servidor inesperado
                throw new Error(`Error de conexión o respuesta inesperada (${response.status}).`);
            }
            // Lanzar el error con el mensaje proporcionado por el backend
            throw new Error(errorData.message || 'Credenciales inválidas o error desconocido.');
        }

        // Si la respuesta fue OK (response.ok es true)
        const data = await response.json(); 

        // Éxito: Guarda el token de sesión (se mantiene en localStorage para tokens de backends externos)
        console.log("¡Inicio de sesión exitoso! Redirigiendo a:", redirectPath);
        
        if (data.token) {
            localStorage.setItem('authToken', data.token);
        }
        
        // REDIRECCIONAR 
        navigate(redirectPath); 
            
    } catch (error) {
        // Manejo del error
        console.error('Error durante el inicio de sesión:', error.message);
        setLoginError(error.message); // Mostrar el error en la UI
    } finally {
        setIsLoading(false); // Desactivar el indicador de carga
    }
};
    
    // --- LÓGICA DINÁMICA DE INPUT (se mantiene) ---
    const inputPlaceholder = selectedRole === 'egresado' ? 'Usuario o Email' : 'Email';
    const inputType = selectedRole === 'egresado' ? 'text' : 'email'; 
    const titleRole = selectedRole === 'egresado' ? 'Egresado' : 'Empresa';

    // --- RENDERIZADO JSX ---

    return (
        <div className="formulario-container iniciar-sesion-container">
            <h2 className="login-title-desktop">
                👋 Iniciar Sesión {titleRole}
            </h2>
            
            {/* 1. BOTONES DE LOGIN SOCIAL */}
            <SocialLoginButtons 
                handleGoogleLogin={handleGoogleLogin} 
                handleMicrosoftLogin={handleMicrosoftLogin} 
            />

            <div className="form-separator">o</div>
            
            {/* 2. FORMULARIO DE LOGIN TRADICIONAL */}
            <form onSubmit={handleLoginSubmit} style={{ width: '100%' }}>
                {loginError && (
                    <div 
                        className="error-message" 
                        style={{ 
                            backgroundColor: '#fee2e2', 
                            color: '#ef4444', 
                            padding: '10px', 
                            borderRadius: '8px', 
                            marginBottom: '15px',
                            textAlign: 'center'
                        }}
                    >
                        {loginError}
                    </div>
                )}
                
                <input
                    className="modern-input"
                    type={inputType} 
                    placeholder={inputPlaceholder}
                    name="identificador"
                    value={loginData.identificador}
                    onChange={handleLoginChange}
                    required
                    disabled={isLoading}
                />
                
                <div className="password-container">
                    <input
                        className="modern-input"
                        type="password"
                        placeholder="Contraseña"
                        name="password"
                        value={loginData.password}
                        onChange={handleLoginChange}
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="keep-logged-in-container">
                    <label htmlFor="keep-logged-in">
                        <input
                            type="checkbox"
                            id="keep-logged-in"
                            name="keepLoggedIn"
                            checked={loginData.keepLoggedIn}
                            onChange={handleLoginChange}
                            disabled={isLoading}
                        />
                        Recordarme
                    </label>
                    
                    <a href="#" className="forgot-password">
                        ¿Olvidaste tu contraseña?
                    </a>
                </div>

                <button 
                    type="submit" 
                    className="large-blue-btn"
                    disabled={isLoading}
                >
                    {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
                </button>
                
                {/* Enlace para ir a registro, si el panel izquierdo no lo maneja */}
                <p className="no-account-prompt">
                    ¿No tienes cuenta? 
                    <a href="#" onClick={(e) => { e.preventDefault(); setIsRegistering(true); }}> Regístrate aquí</a>
                </p>
            </form>
        </div>
    );
}