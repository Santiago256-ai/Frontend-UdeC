import React, { useState } from 'react';

export default function RegisterForm({ 
    selectedRole, 
    setIsRegistering // Prop para volver al modo Login
}) {
    
    // Estado para los datos del nuevo usuario
    const [registerData, setRegisterData] = useState({
        name: '',
        email: '',
        password: '',
    });
    
    // Función para manejar los cambios en los inputs
    const handleRegisterChange = (e) => {
        const { name, value } = e.target;
        setRegisterData(prev => ({
            ...prev,
            [name]: value,
        }));
    };
    
    // Función para manejar el envío del formulario de Registro
    const handleRegisterSubmit = (e) => {
        e.preventDefault();
        
        console.log("Registrando nuevo usuario:", registerData, "con rol:", selectedRole);
        
        // 🚨 Aquí iría tu lógica de registro con el Backend 
        // (API.post('/auth/register', { ...registerData, rol: selectedRole }))
        
        alert(`Registro de prueba como ${selectedRole} exitoso para: ${registerData.email}`);
        
        // Opcional: Después del registro exitoso, podrías iniciar sesión o redirigir
        
        // Simplemente volvemos al modo de Login después de la simulación
        setIsRegistering(false);
    };
    
    // Función para cambiar al modo de Login
    const handleGoToLogin = () => {
        setIsRegistering(false);
    };

    return (
        <div className="formulario-container registrarse-container" style={{ zIndex: 3, opacity: 1 }}>
            <h2 className="login-title-desktop">
                🚀 Únete como {selectedRole === 'student' ? '**Egresado/Persona**' : '**Empresa**'}
            </h2>
            
            <p style={{ color: '#ccc', marginBottom: '20px', textAlign: 'center' }}>
                Crea tu cuenta con tu email. ¡Es rápido y fácil!
            </p>
            
            <form onSubmit={handleRegisterSubmit} style={{ width: '100%' }}>
                
                {/* Campo de Nombre Completo (Opcional, pero común en registros) */}
                <input
                    className="modern-input"
                    type="text"
                    placeholder="Nombre Completo"
                    name="name"
                    value={registerData.name}
                    onChange={handleRegisterChange}
                    required
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
                    />
                </div>

                <p className="terms-text" style={{ marginTop: '10px' }}>
                    Al hacer clic en «Registrarse», aceptas las <a href="#" className="terms-link">Condiciones de uso</a> y la <a href="#" className="terms-link">Política de privacidad</a>.
                </p>

                <button type="submit" className="large-blue-btn">
                    Registrarse
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