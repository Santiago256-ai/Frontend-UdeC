import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import SocialLoginButtons from './SocialLoginButtons.jsx'; 

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
    
    const handleLoginChange = (e) => {
        const { name, value, type, checked } = e.target;
        setLoginData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };
    
// 🚨 FUNCIÓN DE ENVÍO CON URLs REALES DE RAILWAY Y REDIRECCIÓN CONDICIONAL
const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    const isEgresado = selectedRole === 'egresado';
    
    // 1. URL Base de tu Backend en Railway
    const RAILWAY_BASE_URL = 'https://backend-udec-production.up.railway.app/api'; 
    
    // 2. Determina el Endpoint (Ruta completa de la API con /auth/)
    // 🚨 CAMBIO CLAVE AQUÍ: Se añade /auth/ para completar la ruta esperada.
    const endpoint = isEgresado
        ? `${RAILWAY_BASE_URL}/auth/egresado/login` // URL final: .../api/auth/egresado/login
        : `${RAILWAY_BASE_URL}/auth/empresa/login`;  // URL final: .../api/auth/empresa/login
        
    // 3. Determina la ruta de redirección
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

        // 🚨 Es crucial verificar si la respuesta NO fue OK antes de intentar leer JSON
        if (!response.ok) {
            // Si la respuesta no es 200, pero no es un error de red,
            // intentamos leer el error JSON o lanzamos un error genérico
            let errorData;
            try {
                errorData = await response.json();
            } catch (jsonError) {
                // Captura el error de JSON (como el SyntaxError original)
                throw new Error(`Error de conexión o respuesta inesperada (${response.status}): ${response.statusText}.`);
            }
            throw new Error(errorData.message || 'Credenciales inválidas o error desconocido.');
        }

        // Si la respuesta fue OK (response.ok es true)
        const data = await response.json(); 

        // Éxito: Guarda el token de sesión
        console.log("¡Inicio de sesión exitoso! Redirigiendo a:", redirectPath);
        
        if (data.token) {
            localStorage.setItem('authToken', data.token);
        }
        
        // REDIRECCIONAR 
        navigate(redirectPath); 
            
    } catch (error) {
        // Manejo mejorado del error que se captura del bloque try (ya sea de red o del servidor)
        console.error('Error durante el inicio de sesión:', error.message);
        alert(`Error al iniciar sesión: ${error.message}`);
    }
};
    
    // --- LÓGICA DINÁMICA DE INPUT (se mantiene) ---
    const inputPlaceholder = selectedRole === 'egresado' ? 'Usuario' : 'Email';
    const inputType = selectedRole === 'egresado' ? 'text' : 'email'; 
    const titleRole = selectedRole === 'egresado' ? 'Egresado' : 'Empresa';

    // --- RENDERIZADO JSX (se mantiene) ---

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
                <input
                    className="modern-input"
                    type={inputType} 
                    placeholder={inputPlaceholder}
                    name="identificador"
                    value={loginData.identificador}
                    onChange={handleLoginChange}
                    required
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
                        />
                        Recordar contraseña
                    </label>
                    
                    <a href="#" className="forgot-password">
                        ¿Olvidaste tu contraseña?
                    </a>
                </div>

                <button type="submit" className="large-blue-btn">
                    Iniciar Sesión
                </button>
            </form>
            
            
        </div>
    );
}