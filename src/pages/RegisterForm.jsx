import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// La URL base de tu Backend en Railway
const RAILWAY_BASE_URL = 'https://backend-udec-production.up.railway.app/api'; 

export default function RegisterForm({ 
    selectedRole, 
    setIsRegistering, // Prop para volver al modo Login
    handlePersonaClick, // Propagado desde AuthModal para redirección
    handleEmpresaClick // Propagado desde AuthModal para redirección
}) {
    
    // 🚨 Usamos useNavigate para la redirección después del registro
    const navigate = useNavigate();

    // --- ESTADOS ---
    const [registerData, setRegisterData] = useState({
        name: '',
        email: '',
        password: '',
    });
    
    // Estado para manejar errores de registro de la API
    const [registerError, setRegisterError] = useState(null);
    
    // Estado para la carga
    const [isLoading, setIsLoading] = useState(false);
    
    // --- MANEJADORES ---
    
    const handleRegisterChange = (e) => {
        const { name, value } = e.target;
        setRegisterData(prev => ({
            ...prev,
            [name]: value,
        }));
    };
    
    // FUNCIÓN PRINCIPAL DE ENVÍO CON LÓGICA DE API
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setRegisterError(null); // Limpiar errores
        setIsLoading(true); // Activar carga

        const isEgresado = selectedRole === 'egresado';
        
        // Determina el Endpoint de Registro
        // 🚨 NOTA: Verifica con tu Backend si el endpoint es /register o /auth/register
        // Asumiremos /auth/register por consistencia con el Login.
        const endpoint = isEgresado
            ? `${RAILWAY_BASE_URL}/auth/egresado/register` 
            : `${RAILWAY_BASE_URL}/auth/empresa/register`;
        
        // Los datos que envía el frontend al backend
        const payload = {
            ...registerData,
            role: selectedRole // Asegúrate de que tu backend espera el rol
        };
            
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (jsonError) {
                    throw new Error(`Error de servidor inesperado (${response.status}).`);
                }
                throw new Error(errorData.message || 'Error al crear la cuenta. Inténtalo de nuevo.');
            }

            // Si el registro es exitoso (status 201 o 200)
            const data = await response.json(); 
            
            console.log("¡Registro exitoso! Respuesta:", data);
            
            // 🚨 OPCIÓN 1 (Recomendada): Redirigir a una página de confirmación/primeros pasos.
            // O, si el registro es *fuera* del modal:
            if (isEgresado) {
                 handlePersonaClick(); // Redirige a /register/student
            } else {
                 handleEmpresaClick(); // Redirige a /register/company
            }
            
            // Opcional: Mostrar mensaje de éxito y cambiar a Login
            // alert("¡Registro exitoso! Por favor, inicia sesión."); 
            // setIsRegistering(false); 
            
        } catch (error) {
            // Manejo del error
            console.error('Error durante el registro:', error.message);
            setRegisterError(error.message); // Mostrar el error en la UI
        } finally {
            setIsLoading(false); // Desactivar el indicador de carga
        }
    };
    
    // Función para cambiar al modo de Login
    const handleGoToLogin = () => {
        setIsRegistering(false);
    };

    // --- RENDERIZADO JSX ---
    
    // Determinar el título y el rol para el texto
    const roleTitle = selectedRole === 'egresado' ? 'Egresado/Persona' : 'Empresa';

    return (
        <div className="formulario-container registrarse-container" style={{ zIndex: 3, opacity: 1 }}>
            <h2 className="login-title-desktop">
                🚀 Únete como **{roleTitle}**
            </h2>
            
            <p style={{ color: '#ccc', marginBottom: '20px', textAlign: 'center' }}>
                Crea tu cuenta con tu email. ¡Es rápido y fácil!
            </p>
            
            <form onSubmit={handleRegisterSubmit} style={{ width: '100%' }}>
                
                {/* Muestra el mensaje de error si existe */}
                {registerError && (
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
                        {registerError}
                    </div>
                )}
                
                {/* Campo de Nombre Completo */}
                <input
                    className="modern-input"
                    type="text"
                    placeholder={selectedRole === 'egresado' ? 'Nombre Completo' : 'Nombre de la Empresa'}
                    name="name"
                    value={registerData.name}
                    onChange={handleRegisterChange}
                    required
                    disabled={isLoading}
                />
                
                {/* Campo de Email */}
                <input
                    className="modern-input"
                    type="email"
                    placeholder="Email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    required
                    disabled={isLoading}
                />
                
                {/* Campo de Contraseña */}
                <div className="password-container">
                    <input
                        className="modern-input"
                        type="password"
                        placeholder="Contraseña (mín. 6 caracteres)"
                        name="password"
                        value={registerData.password}
                        onChange={handleRegisterChange}
                        required
                        minLength="6"
                        disabled={isLoading}
                    />
                </div>

                <p className="terms-text" style={{ marginTop: '10px' }}>
                    Al hacer clic en «Registrarse», aceptas las <a href="#" className="terms-link">Condiciones de uso</a> y la <a href="#" className="terms-link">Política de privacidad</a>.
                </p>

                <button 
                    type="submit" 
                    className="large-blue-btn"
                    disabled={isLoading}
                >
                    {isLoading ? 'Registrando...' : 'Registrarse'}
                </button>
            </form>
            
            {/* Enlace para volver a Login */}
            <p className="terms-text" style={{ marginTop: '20px' }}>
                ¿Ya tienes cuenta? 
                <a 
                    href="#" 
                    className="terms-link" 
                    onClick={(e) => { e.preventDefault(); handleGoToLogin(); }}
                >
                    &nbsp;Inicia Sesión
                </a>
            </p>
        </div>
    );
}