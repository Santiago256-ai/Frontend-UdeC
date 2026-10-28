import React, { useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Clock, Eye, EyeOff } from 'lucide-react';
import { APIAdmin } from '../services/api';
import { guardarSesionAdmin, leerSesionAdmin, sesionVencida } from '../services/sesionAdmin';
import './AccesoAdmin.css';

// /admin/acceso: inicio de sesión del panel de administración (concepto A ·
// "Portería", DESIGN.md §8). No se enlaza desde la landing pública: se entra por la
// dirección o un marcador, y el panel devuelve aquí cuando la sesión vence
// (?motivo=expirada).
const ERROR_CREDENCIALES = 'Usuario o contraseña incorrectos';

const mensajeDeError = (error) => {
    const status = error.response?.status;
    if (status === 401) return ERROR_CREDENCIALES;
    if (status === 429) return 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.';
    if (!error.response) return 'No se pudo conectar con el servidor.'; // red caída o tiempo agotado
    return 'No pudimos iniciar sesión. Intenta de nuevo.';
};

export default function AccesoAdmin() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const expirada = params.get('motivo') === 'expirada';
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [verPassword, setVerPassword] = useState(false);
    const [error, setError] = useState('');
    // 'local': validación del formulario (Enter o clic), aparece sin animación;
    // 'servidor': respuesta del servidor, con el fundido corto.
    const [origenError, setOrigenError] = useState('servidor');
    const [cargando, setCargando] = useState(false);
    const enVueloRef = useRef(false);
    const passwordRef = useRef(null);
    const usuarioRef = useRef(null);

    // Con una sesión válida no tiene sentido volver a entrar.
    const [sesionPrevia] = useState(() => {
        const sesion = leerSesionAdmin();
        return sesion && !sesionVencida(sesion) ? sesion : null;
    });
    if (sesionPrevia) return <Navigate to="/admin" replace />;

    const enviar = async (e) => {
        e.preventDefault();
        if (enVueloRef.current) return;
        if (!usuario.trim() || !password) {
            setOrigenError('local');
            setError('Escribe tu usuario y tu contraseña.');
            (usuario.trim() ? passwordRef : usuarioRef).current?.focus();
            return;
        }
        enVueloRef.current = true;
        setCargando(true);
        setError('');
        try {
            const { data } = await APIAdmin.post(
                '/auth/admin/login',
                { usuario: usuario.trim().toLowerCase(), password },
                { timeout: 15000 },
            );
            if (!guardarSesionAdmin(data)) {
                setOrigenError('servidor');
                setError('No pudimos iniciar sesión. Intenta de nuevo.');
                return;
            }
            navigate('/admin', { replace: true });
        } catch (fallo) {
            const mensaje = mensajeDeError(fallo);
            setOrigenError('servidor');
            setError(mensaje);
            if (mensaje === ERROR_CREDENCIALES) {
                setPassword('');
                passwordRef.current?.focus();
            }
        } finally {
            enVueloRef.current = false;
            setCargando(false);
        }
    };

    const idError = 'acceso-admin-error';

    return (
        <main className="acceso-admin">
            <div className="acceso-admin-envoltura">
                <div className="acceso-admin-marco">
                    <div className="acceso-admin-tarjeta">
                        <header className="acceso-admin-banda">
                            <img src="/Logo.png" alt="Empres360 PRO" className="acceso-admin-logo" />
                            <span className="acceso-admin-divisor" aria-hidden="true" />
                            <img src="/UdeC2.png" alt="Universidad de Cundinamarca" className="acceso-admin-udec" />
                        </header>
                        <div className="acceso-admin-cuerpo">
                            <form className="acceso-admin-form" onSubmit={enviar} noValidate aria-labelledby="acceso-admin-titulo">
                                <h1 id="acceso-admin-titulo" className="acceso-admin-titulo">Acceso administrativo</h1>
                                <p className="acceso-admin-lead">Solo para el equipo que administra Empres360 PRO.</p>

                                {expirada && (
                                    <p className="acceso-admin-aviso" role="status">
                                        <Clock size={18} strokeWidth={2} aria-hidden="true" />
                                        <span>Tu sesión expiró, vuelve a entrar.</span>
                                    </p>
                                )}

                                <div className="acceso-admin-campo">
                                    <label htmlFor="acceso-admin-usuario" className="acceso-admin-label">Usuario</label>
                                    <input
                                        id="acceso-admin-usuario"
                                        ref={usuarioRef}
                                        className="acceso-admin-input"
                                        name="username"
                                        type="text"
                                        autoComplete="username"
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck={false}
                                        maxLength={64}
                                        value={usuario}
                                        aria-invalid={error ? 'true' : undefined}
                                        aria-describedby={error ? idError : undefined}
                                        onChange={(e) => setUsuario(e.target.value)}
                                    />
                                </div>

                                <div className="acceso-admin-campo">
                                    <label htmlFor="acceso-admin-password" className="acceso-admin-label">Contraseña</label>
                                    <div className="acceso-admin-password">
                                        <input
                                            id="acceso-admin-password"
                                            ref={passwordRef}
                                            className="acceso-admin-input"
                                            name="password"
                                            type={verPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            maxLength={128}
                                            value={password}
                                            aria-invalid={error ? 'true' : undefined}
                                            aria-describedby={error ? idError : undefined}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="acceso-admin-ojo"
                                            aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                            aria-pressed={verPassword}
                                            aria-controls="acceso-admin-password"
                                            onClick={() => setVerPassword((v) => !v)}
                                        >
                                            {verPassword ? <EyeOff size={20} strokeWidth={1.75} /> : <Eye size={20} strokeWidth={1.75} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Región viva siempre montada: el lector de pantalla anuncia cada error nuevo. */}
                                <div className="acceso-admin-vivo" aria-live="assertive" aria-atomic="true">
                                    {error && (
                                        <p id={idError} className="acceso-admin-error" data-origen={origenError}>
                                            <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
                                            <span>{error}</span>
                                        </p>
                                    )}
                                </div>

                                <button type="submit" className="acceso-admin-boton" disabled={cargando} aria-busy={cargando || undefined}>
                                    {cargando && <span className="acceso-admin-spinner" aria-hidden="true" />}
                                    <span>{cargando ? 'Verificando…' : 'Entrar al panel'}</span>
                                    {!cargando && (
                                        <span className="acceso-admin-boton-icono" aria-hidden="true">
                                            <ArrowRight size={16} strokeWidth={2.25} />
                                        </span>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                <Link to="/" className="acceso-admin-volver">
                    <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
                    Volver al portal
                </Link>
            </div>
        </main>
    );
}
