import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, Eye, EyeOff, Info } from 'lucide-react';
import './Landing.css';
import AcercaDeModal from './AcercaDeModal';
import RecuperarModal from './RecuperarModal';
import { validarCorreo } from './recuperarCorreo';

// URLs de Imágenes:
// Asegúrate de mover tus fotos a la carpeta /public/ con estos nombres
const logoUrl = '/Logo.png'; // Logo con escudo circular
const logoSecundarioUrl = '/UdeC2.png';
const graduadosImgUrl = '/grad1.jpg'; // Imagen de la izquierda
const negociosImgUrl = '/of3.jpg'; // Imagen de la derecha

// Aviso de error del login, concepto A "Renglón" (DESIGN.md §8). Un rechazo de
// credenciales siempre dice lo mismo, exista o no el correo: así la pantalla no
// revela qué cuentas están registradas.
const ERRORES_LOGIN = {
  credenciales: 'Correo o contraseña incorrectos.',
  vacios: 'Escribe tu correo y tu contraseña.',
  sinPassword: 'Escribe tu contraseña.',
  servidor: 'No pudimos iniciar sesión. Intenta de nuevo.',
  sinConexion: 'Sin conexión a internet. Revisa tu red y vuelve a intentarlo.',
  sinRespuesta: 'No se pudo conectar con el servidor. Espera un momento y vuelve a intentarlo.',
};
// Mientras el backend no envíe un código propio, la cuenta desactivada se reconoce
// por su texto (authController.js) y conserva su mensaje.
const esCuentaInactiva = (mensaje) => typeof mensaje === 'string' && /desactivada/i.test(mensaje);
const ID_ERROR_LOGIN = 'landing-login-error';

function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  // services/api.js trae aquí a quien perdió la sesión (401) con ?motivo=expirada.
  // El aviso se queda hasta que la persona vuelva a entrar; la URL se limpia para
  // que recargar la página no lo repita.
  const [sesionExpirada] = useState(() => new URLSearchParams(location.search).get('motivo') === 'expirada');
  useEffect(() => {
    if (sesionExpirada) navigate('/', { replace: true });
  }, [sesionExpirada, navigate]);
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // error: { texto, origen: 'local' | 'servidor', correo, password } (los dos últimos
  // marcan qué campos quedan con aria-invalid). 'local' aparece sin animación.
  const [error, setError] = useState(null);
  // Contador de rechazos: remonta el aviso para que un mismo texto se anuncie otra vez.
  const [intento, setIntento] = useState(0);
  // El aviso de sesión vencida ya cumplió su función en cuanto la persona intenta entrar.
  const [intentoLogin, setIntentoLogin] = useState(false);
  const correoRef = useRef(null);
  const passwordRef = useRef(null);
  // Modal "Recuperar contraseña" (RecuperarModal): el envío, la validación y el
  // enfriamiento viven en el componente; aquí sólo se abre y se le devuelve el foco.
const [showResetModal, setShowResetModal] = useState(false);
const forgotLinkRef = useRef(null);
const [showAboutModal, setShowAboutModal] = useState(false); // Estado para el "Acerca de"
const infoTriggerRef = useRef(null);

  // ESTA ES LA FUNCIÓN DONDE VA EL CÓDIGO
  const mostrarError = (texto, origen, campos = {}) => {
    setError({ texto, origen, correo: false, password: false, ...campos });
    setIntento((n) => n + 1);
  };

  const handleLogin = async (e) => {
  e.preventDefault();
  setIntentoLogin(true);
  setError(null);

  // Validación propia (el formulario lleva noValidate), con los mismos mensajes de
  // correo que la Ventanilla (recuperarCorreo.js).
  const fallaCorreo = validarCorreo(correo);
  if (!correo.trim() && !password) {
    mostrarError(ERRORES_LOGIN.vacios, 'local', { correo: true, password: true });
    correoRef.current?.focus();
    return;
  }
  if (fallaCorreo) {
    mostrarError(fallaCorreo, 'local', { correo: true });
    correoRef.current?.focus();
    return;
  }
  if (!password) {
    mostrarError(ERRORES_LOGIN.sinPassword, 'local', { password: true });
    passwordRef.current?.focus();
    return;
  }

  try {
    // Usamos el dominio oficial que configuraste en Vercel
    const response = await fetch('https://backend-ude-c.vercel.app/api/auth/login', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password }),
    });

    // Un 5xx o una página de error de Vercel puede no traer JSON.
    const data = await response.json().catch(() => null);
    if (!data) {
      mostrarError(ERRORES_LOGIN.servidor, 'servidor');
      return;
    }

    if (response.ok && data.success !== false) {
        // 1. Guardamos el token
        localStorage.setItem('token', data.token);
        
        // 2. Guardamos el objeto usuario (necesario para los Dashboards)
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        
        // 3. Redireccionamos según el tipo que viene del Backend
        if (data.tipo === "egresado") {
          navigate('/vacantes-dashboard');
        } else if (data.tipo === "empresa") {
          navigate('/empresa-dashboard');
        }
      } else if (response.status >= 500) {
        mostrarError(ERRORES_LOGIN.servidor, 'servidor');
      } else if (esCuentaInactiva(data.message)) {
        mostrarError(data.message, 'servidor');
      } else {
        // Rechazo de credenciales: se vacía la contraseña y se vuelve a ella.
        mostrarError(ERRORES_LOGIN.credenciales, 'servidor', { correo: true, password: true });
        setPassword('');
        passwordRef.current?.focus();
      }
    } catch {
      // Sin respuesta legible: red caída, tiempo agotado o un rechazo sin cabeceras CORS.
      mostrarError(navigator.onLine === false ? ERRORES_LOGIN.sinConexion : ERRORES_LOGIN.sinRespuesta, 'servidor');
    }
  };

  return (
    <div className="landing-udec-main">

      {/* --- NAVBAR SUPERIOR --- */}
      <header className="navbar-udec">
        <div className="navbar-logo">
          <img src={logoUrl} alt="Portal de Empleo UDEC" />
        </div>
        <div className="navbar-right-group">
          <div className="navbar-secondary-logo">
            <img src={logoSecundarioUrl} alt="Logo Institucional" className="secondary-logo-img" />
          </div>
          <button
            type="button"
            ref={infoTriggerRef}
            className="info-trigger-btn"
            onClick={() => setShowAboutModal(true)}
            aria-label="Acerca de Empres360 PRO"
          >
            <span className="info-trigger-visual">
              <Info size={15} strokeWidth={2.4} />
            </span>
          </button>
        </div>
      </header>

      {/* --- DOBLE VITRINA: panel de hero + panel de acciones comparten el alto disponible --- */}
      <div className="vitrina-udec">

      {/* --- SECCIÓN HERO --- */}
      <section className="hero-udec">
        {/* Lado Izquierdo (Graduados + Overlay Verde) */}
        <div className="hero-half left-side">
          <img src={graduadosImgUrl} alt="Graduados" className="hero-img" />
          {/* Este div crea el efecto de desvanecimiento verde exacto */}
          <div className="hero-green-overlay"></div>
        </div>

        {/* Lado Derecho (Negocios Puros) — oculto en Doble Vitrina (≥900px), visible en el apilado actual */}
        <div className="hero-half right-side">
          <img src={negociosImgUrl} alt="Negocios" className="hero-img" />
        </div>

        {/* Texto Central Superpuesto */}
        <div className="hero-text-overlay">
          <div className="text-container">
            <h1>TU FUTURO PROFESIONAL<br /> COMIENZA AQUÍ</h1>
            <p>VINCULANDO LA EXCELENCIA ACADÉMICA<br /> CON EL SECTOR PRODUCTIVO</p>
          </div>
        </div>
      </section>


      {/* --- SECCIÓN DE ACCIONES (Fondo Blanco - Iniciar Sesión y Registrarse) --- */}
      <section className="actions-section-white">
        <div className="actions-section-grid">
          
          {/* Columna de INICIAR SESIÓN */}
          <div className="action-column login-col">
            <h2>INICIAR SESIÓN</h2>

            {sesionExpirada && !intentoLogin && (
              <p className="landing-aviso-sesion" role="status">
                <Clock size={18} strokeWidth={2} aria-hidden="true" />
                <span>Tu sesión expiró, vuelve a entrar.</span>
              </p>
            )}
            
            <form className="login-form-udec" onSubmit={handleLogin} noValidate>
              <input
  ref={correoRef}
  type="email"
  placeholder="Correo electrónico"
  className="udec-input-field"
  value={correo}
  aria-invalid={error?.correo ? 'true' : undefined}
  aria-describedby={error?.correo ? ID_ERROR_LOGIN : undefined}
  onChange={(e) => {
    // Forzamos minúsculas en tiempo real
    setCorreo(e.target.value.toLowerCase());
    if (error) setError(null);
  }}
  required
/>
              
              {/* Contenedor para el campo de contraseña con el icono de ojo */}
              {/* Contenedor para el campo de contraseña */}
<div className="password-input-wrapper">
  <input
    ref={passwordRef}
    type={showPassword ? "text" : "password"}
    placeholder="Contraseña"
    className="udec-input-field password-field"
    value={password}
    aria-invalid={error?.password ? 'true' : undefined}
    aria-describedby={error?.password ? ID_ERROR_LOGIN : undefined}
    onChange={(e) => {
      setPassword(e.target.value); // Guarda el cambio
      if (error) setError(null);   // escribir de nuevo limpia el aviso
    }}
    required 
  />
  
  {/* --- ICONO CON FUNCIONALIDAD --- */}
  <button 
  type="button" 
  className="password-toggle-btn"
  onClick={() => setShowPassword(!showPassword)}
  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
>
  {/* Siempre renderizamos ambos, controlamos visibilidad con CSS */}
  <EyeOff 
    size={20} 
    className={`password-icon icon-off ${showPassword ? 'visible' : 'hidden'}`} 
  />
  <Eye 
    size={20} 
    className={`password-icon icon-on ${!showPassword ? 'visible' : 'hidden'}`} 
  />
</button>
</div>
              
              {/* Renglón del error: región viva siempre montada (anuncia cada error nuevo);
                  se despliega sólo cuando hay error, así que en reposo no ocupa espacio. */}
              <div
                className="landing-error-vivo"
                data-visible={error ? error.origen : undefined}
                aria-live="assertive"
                aria-atomic="true"
              >
                <div className="landing-error-marco">
                  {error && (
                    <p key={intento} id={ID_ERROR_LOGIN} className="landing-error" data-origen={error.origen}>
                      <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
                      <span>{error.texto}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Busca la sección del formulario de login */}
<div className="login-form-extras">
  <a
  href="#olvidaste"
  ref={forgotLinkRef}
  className="forgot-password-link"
  onClick={(e) => { e.preventDefault(); setShowResetModal(true); }}
>
  ¿Olvidaste tu contraseña?
</a>

  <button type="submit" className="udec-green-btn btn-login-submit">
    INGRESAR
  </button>
</div>
            </form>
          </div>

          {/* Columna de REGISTRARSE */}
          {/* Columna de REGISTRARSE */}
<div className="action-column register-col">
  <h2>REGISTRARSE</h2>
  
  <div className="register-buttons-group">
    <button 
      className="udec-green-btn register-big-btn"
      onClick={() => navigate('/registro-egresado')} // Redirección a Estudiante
    >
      SOY GRADUADO
    </button>
    
    <button 
      className="udec-green-btn register-big-btn"
      onClick={() => navigate('/register/company')} // Redirección a Empresa
    >
      SOY EMPRESA
    </button>
  </div>
</div>

        </div>
      </section>

      </div>
      {/* --- fin Doble Vitrina --- */}
      {/* Créditos y copyright ya no viven en un footer fijo: se accede a ellos
          desde el ícono ⓘ del navbar, que abre el modal "Acerca de" de abajo. */}

      {/* --- MODAL INTERACTIVO: ACERCA DE --- */}
{showAboutModal && (
  <AcercaDeModal
    logoUrl={logoUrl}
    triggerRef={infoTriggerRef}
    onClose={() => setShowAboutModal(false)}
  />
)}
{/* --- MODAL: RECUPERAR CONTRASEÑA (precarga el correo ya escrito en el Login) --- */}
{showResetModal && (
  <RecuperarModal
    logoUrl={logoUrl}
    correoInicial={correo}
    triggerRef={forgotLinkRef}
    onClose={() => setShowResetModal(false)}
  />
)}
    </div>
  );

  
}

export default Landing;