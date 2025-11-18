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
    const RAILWAY_BASE_URL = 'https://backend-udec-production.up.railway.app/api/auth'; 
    
    // 2. Determina el Endpoint (Ruta completa de la API)
    const endpoint = isEgresado
        ? `${RAILWAY_BASE_URL}/egresado/login` // URL para Egresado
        : `${RAILWAY_BASE_URL}/empresa/login`;  // URL para Empresa
        
    // 3. Determina la ruta de redirección
    const redirectPath = isEgresado
        ? '/vacantesdashboard' // Redirige a VacantesDashboard si es Egresado
        : '/empresadashboard';  // Redirige a EmpresaDashboard si es Empresa

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                identificador: loginData.identificador, // Usuario o Email
                password: loginData.password,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            // Éxito: Guarda el token de sesión (si existe)
            console.log("¡Inicio de sesión exitoso! Redirigiendo a:", redirectPath);
            
            if (data.token) {
                localStorage.setItem('authToken', data.token);
            }
            
            // REDIRECCIONAR USANDO LA RUTA CONDICIONAL
            navigate(redirectPath); 
            
        } else {
            // Error: Muestra el mensaje de error del servidor
            alert(`Error al iniciar sesión: ${data.message || 'Credenciales inválidas o error desconocido.'}`);
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        alert('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
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