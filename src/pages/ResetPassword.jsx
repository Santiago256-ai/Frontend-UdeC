import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import './ResetPassword.css';

// Reutilizamos tus logos
const logoUrl = '/Logo.png'; 
const logoSecundarioUrl = '/UdeC2_blanco.png';

function ResetPassword() {
    const { token } = useParams(); // Extrae el token de la URL
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '' });
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleReset = async (e) => {
    e.preventDefault();
    setStatus({ message: '', type: '' });

    // --- VALIDACIÓN DE FUERZA (Punto 4) ---
    // Mínimo 8 caracteres, 1 Mayúscula, 1 Número, 1 Carácter Especial
    const regexSeguridad = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!regexSeguridad.test(password)) {
        setStatus({ 
            message: "La clave debe tener 8 caracteres, una mayúscula, números y un carácter especial (@$!%*?&).", 
            type: 'error' 
        });
        return;
    }

    if (password !== confirmPassword) {
        setStatus({ message: "Las contraseñas no coinciden.", type: 'error' });
        return;
    }

    setLoading(true);

    try {
        const response = await fetch('https://backend-ude-c.vercel.app/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword: password }),
        });

        const data = await response.json();

        if (data.success) {
            setStatus({ message: "¡Contraseña actualizada con éxito!", type: 'success' });
            setTimeout(() => navigate('/'), 3000);
        } else {
            // Aquí el backend puede decirte si es la misma contraseña antigua (Punto 3)
            setStatus({ message: data.message || "Error al actualizar.", type: 'error' });
        }
    } catch (error) {
        setStatus({ message: "Error de conexión.", type: 'error' });
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="reset-main-container">
            {/* Navbar Minimalista */}
            <header className="navbar-reset">
                <img src={logoUrl} alt="UDEC" className="reset-logo-top" />
                <img src={logoSecundarioUrl} alt="UDEC" className="reset-logo-sec" />
            </header>

            <div className="reset-glass-card fade-in">
                <div className="reset-icon-header">
                    <Lock size={40} color="#1b4332" />
                </div>
                
                <h2>Nueva Contraseña</h2>
                <p>Crea una clave segura para acceder a tu cuenta del Portal de Empleo.</p>

                <form onSubmit={handleReset} className="reset-form">
                    <div className="input-group-reset">
                        <label>Nueva Contraseña</label>
                        <div className="password-wrapper-reset">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="input-group-reset">
    <label>Confirmar Contraseña</label>
    <div className="password-wrapper-reset">
        <input 
            type={showConfirmPassword ? "text" : "password"} 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="••••••••"
        />
        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
    </div>
</div>

                    {status.message && (
                        <div className={`status-msg-${status.type}`}>
                            {status.type === 'success' && <CheckCircle size={16} />}
                            {status.message}
                        </div>
                    )}

                    <button type="submit" className="udec-green-btn btn-full" disabled={loading}>
                        {loading ? "ACTUALIZANDO..." : "CAMBIAR CONTRASEÑA"}
                    </button>
                </form>
            </div>

            <footer className="reset-footer">
                <p>© 2026  Derechos Reservados - Universidad de Cundinamarca</p>
            </footer>
        </div>
    );
}

export default ResetPassword;