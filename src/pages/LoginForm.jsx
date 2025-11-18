import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import SocialLoginButtons from './SocialLoginButtons.jsx'; 

// La URL base de tu Backend en Railway
const RAILWAY_BASE_URL = 'https://backend-udec-production.up.railway.app/api'; 

export default function LoginForm({ 
    selectedRole, 
    setIsRegistering, 
    handleGoogleLogin, 
    handleMicrosoftLogin 
}) {
    
    const navigate = useNavigate();
    
    // --- ESTADOS ---
    const [loginData, setLoginData] = useState({
        identificador: '', // Usuario o Email (El valor del input)
        password: '',
        keepLoggedIn: false,
    });

    const [loginError, setLoginError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleLoginChange = (e) => {
        const { name, value, type, checked } = e.target;
        setLoginData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };
    
// 🚨 FUNCIÓN DE ENVÍO CORREGIDA
const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null); 
    setIsLoading(true); 
    
    const isEgresado = selectedRole === 'egresado';
    
    // 1. Determinar el Endpoint (Asumimos que estas rutas son correctas en tu backend)
    const endpoint = isEgresado
        ? `${RAILWAY_BASE_URL}/auth/egresado/login` 
        : `${RAILWAY_BASE_URL}/auth/empresa/login`;
        
    const redirectPath = isEgresado
        ? '/vacantesdashboard' 
        : '/empresadashboard'; 

    try {
        const payloadKey = isEgresado ? 'usuario' : 'correo'; // Ajuste el nombre de la clave según el rol
        
        // 🚨 CAMBIO CRÍTICO AQUÍ: Aseguramos que se envíe el campo correcto
        // para que tu backend pueda desestructurarlo (ej. const { correo, password } = req.body;).
        const loginPayload = {
            [payloadKey]: loginData.identificador, // Usa 'usuario' o 'correo' como clave
            password: loginData.password,
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginPayload), // 👈 Envía el objeto corregido
        });

        // Verificar respuesta OK
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (jsonError) {
                // Si el 404/500 no devuelve JSON (devuelve HTML), capturamos el error genérico
                throw new Error(errorData?.message || `Error de conexión o respuesta inesperada (${response.status}).`);
            }
            throw new Error(errorData.message || 'Credenciales inválidas o error desconocido.');
        }

        // Éxito
        const data = await response.json(); 
        
        if (data.token) {
            localStorage.setItem('authToken', data.token);
        }
        
        navigate(redirectPath); 
            
    } catch (error) {
        console.error('Error durante el inicio de sesión:', error.message);
        setLoginError(error.message); 
    } finally {
        setIsLoading(false); 
    }
};
    
    // --- RENDERIZADO JSX (Se mantiene) ---
    const inputPlaceholder = selectedRole === 'egresado' ? 'Usuario o Email' : 'Email';
    // Mantenemos 'text' para egresado si tu backend acepta el usuario o email
    const inputType = selectedRole === 'egresado' ? 'text' : 'email'; 
    const titleRole = selectedRole === 'egresado' ? 'Egresado' : 'Empresa';

    return (
        <div className="formulario-container iniciar-sesion-container">
            <h2 className="login-title-desktop">👋 Iniciar Sesión {titleRole}</h2>
            
            <SocialLoginButtons 
                handleGoogleLogin={handleGoogleLogin} 
                handleMicrosoftLogin={handleMicrosoftLogin} 
            />

            <div className="form-separator">o</div>
            
            <form onSubmit={handleLoginSubmit} style={{ width: '100%' }}>
                {loginError && (
                    <div className="error-message" style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' }}>
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
                    {/* ... checkbox y olvido de contraseña ... */}
                </div>

                <button 
                    type="submit" 
                    className="large-blue-btn"
                    disabled={isLoading}
                >
                    {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
                </button>
                
                <p className="no-account-prompt">
                    ¿No tienes cuenta? 
                    <a href="#" onClick={(e) => { e.preventDefault(); setIsRegistering(true); }}> Regístrate aquí</a>
                </p>
            </form>
        </div>
    );
}