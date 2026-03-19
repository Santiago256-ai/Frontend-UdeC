import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api'; 
import './LoginDropdown.css';

const LoginDropdown = ({ isVisible, onClose }) => {
    const [view, setView] = useState('login'); 
    const [identificador, setIdentificador] = useState('');
    const [contraseña, setContraseña] = useState('');
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Resetear estados al cerrar
    useEffect(() => {
        if (!isVisible) {
            setView('login');
            setIdentificador('');
            setContraseña('');
            setMensaje({ texto: "", tipo: "" });
        }
    }, [isVisible]);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };
        if (isVisible) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isVisible, onClose]);

const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setMensaje({ texto: "", tipo: "" });
        setLoading(true);

        try {
            // Intentamos login de estudiante, si falla probamos con empresa
            let res = await API.post('/estudiantes/login', { identificador, contraseña }).catch(() => null);
            if (!res) {
                res = await API.post('/empresas/login', { identificador, contraseña }).catch(() => null);
            }

        // --- DENTRO DE handleLoginSubmit ---
if (res && res.data) {
    const usuario = res.data.usuario || res.data;
    
    // CORRECCIÓN: Ahora esperamos explícitamente el token de Firebase
    const token = res.data.token; 

    if (token) {
        localStorage.setItem("token", token); // Este es el JWT de Firebase
        localStorage.setItem("usuario", JSON.stringify(usuario)); // <--- Corrección: Ahora dice "usuario"
    } else {
        // Si no llega token, el middleware rechazará las peticiones futuras
        console.error("No se recibió el token del servidor");
        setMensaje({ texto: "Error al autenticar sesión.", tipo: "error" });
        return; // Detenemos la ejecución
    }

                const rol = usuario.rol?.toLowerCase();
                
                // Redirección
                if (['estudiante', 'persona', 'egresado'].includes(rol)) {
                    navigate('/vacantes-dashboard', { state: { usuario } });
                } else {
                    navigate('/empresa-dashboard', { state: { usuario } });
                }
                onClose();
            } else {
                setMensaje({ texto: "Credenciales incorrectas.", tipo: "error" });
            }
        } catch (err) {
            setMensaje({ texto: "Error de conexión.", tipo: "error" });
        } finally {
            setLoading(false);
        }
    };

    // Cambia esto:
const handleRecoverPassword = async (e) => {
    e.preventDefault();
    if (!identificador) {
        setMensaje({ texto: "Ingresa tu correo primero.", tipo: "error" });
        return;
    }

    setLoading(true);
    try {
        // Llama a tu propio backend en lugar de a Firebase
        await API.post('/auth/recover-password', { correo: identificador });
        setMensaje({ texto: "¡Enlace enviado al correo!", tipo: "exito" });
    } catch (error) {
        setMensaje({ texto: "Error al intentar recuperar la contraseña.", tipo: "error" });
    } finally {
        setLoading(false);
    }
};

    if (!isVisible) return null;

    return (
        <div className="login-dropdown-container" ref={dropdownRef}>
            {view === 'login' ? (
                /* VISTA LOGIN */
                <form className="login-dropdown-form" onSubmit={handleLoginSubmit}>
                    <div className="login-inputs-group">
                        <div className="floating-group">
                            <label className="floating-label">Correo o Usuario</label>
                            <input 
                                type="text" 
                                className="floating-input"
                                value={identificador}
                                onChange={(e) => setIdentificador(e.target.value)}
                                required
                            />
                        </div>
                        <div className="floating-group">
                            <label className="floating-label">Contraseña</label>
                            <input 
                                type="password" 
                                className="floating-input"
                                value={contraseña}
                                onChange={(e) => setContraseña(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {mensaje.texto && (
                        <p className={`login-error-msg ${mensaje.tipo === 'exito' ? 'exito' : ''}`}>
                            {mensaje.texto}
                        </p>
                    )}

                    <div className="login-actions-footer">
                        <button 
                            type="button" 
                            className="forgot-password-link"
                            onClick={() => { setView('recover'); setMensaje({texto:"", tipo:""}); }}
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                        <button type="submit" className="btn-submit-login full-width" disabled={loading}>
                            {loading ? '...' : 'Entrar'}
                        </button>
                    </div>
                </form>
            ) : (
                /* VISTA RECUPERAR (MODIFICADA) */
                <div className="recover-view-container">
                    <h2 className="recover-title">Recuperar acceso</h2>
                    <p className="recover-subtitle">Enviaremos un link a tu correo.</p>
                    
                    <form onSubmit={handleRecoverPassword} className="recover-form">
                        <div className="floating-group">
                            <label className="floating-label">Correo electrónico</label>
                            <input 
                                type="email" 
                                className="floating-input"
                                value={identificador}
                                onChange={(e) => setIdentificador(e.target.value)}
                                required
                            />
                        </div>

                        {mensaje.texto && (
                            <p className={`login-error-msg ${mensaje.tipo === 'exito' ? 'exito' : ''}`}>
                                {mensaje.texto}
                            </p>
                        )}

                        <button type="submit" className="btn-submit-login full-width" disabled={loading}>
                            {loading ? 'Enviando...' : 'Enviar enlace'}
                        </button>
                    </form>

                    <button 
                        type="button"
                        className="btn-back-login-styled full-width"
                        onClick={() => { setView('login'); setMensaje({texto:"", tipo:""}); }}
                    >
                        ← Volver al inicio
                    </button>
                </div>
            )}
        </div>
    );
};

export default LoginDropdown;