import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Info } from 'lucide-react';
import './Landing.css';
import AcercaDeModal from './AcercaDeModal';
import RecuperarModal from './RecuperarModal';

// URLs de Imágenes:
// Asegúrate de mover tus fotos a la carpeta /public/ con estos nombres
const logoUrl = '/Logo.png'; // Logo con escudo circular
const logoSecundarioUrl = '/UdeC2.png';
const graduadosImgUrl = '/grad1.jpg'; // Imagen de la izquierda
const negociosImgUrl = '/of3.jpg'; // Imagen de la derecha

function Landing() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  // Modal "Recuperar contraseña" (RecuperarModal): el envío, la validación y el
  // enfriamiento viven en el componente; aquí sólo se abre y se le devuelve el foco.
const [showResetModal, setShowResetModal] = useState(false);
const forgotLinkRef = useRef(null);
const [showAboutModal, setShowAboutModal] = useState(false); // Estado para el "Acerca de"
const infoTriggerRef = useRef(null);

  // ESTA ES LA FUNCIÓN DONDE VA EL CÓDIGO
  const handleLogin = async (e) => {
  e.preventDefault();
  setError('');

  // 🟢 VALIDACIÓN DE ADMINISTRADOR ÚNICO (Hardcoded)
  // Usamos el correo "admin@udec.edu.co" para que pase la validación de tipo email del navegador
  if (correo === 'admin@udec.edu.co' && password === 'Password123!') {
    const adminUser = {
      nombres: 'Administrador',
      apellidos: 'UdeC',
      rol: 'admin',
      correo: 'admin@udec.edu.co'
    };

    localStorage.setItem('token', 'token-falso-admin'); // Un token para sesión local
    localStorage.setItem('usuario', JSON.stringify(adminUser));
    
    // Redirección directa al panel que ya creamos
    navigate('/Admin'); 
    return; // Detenemos la ejecución aquí para que no intente ir al backend
  }
  try {
    // Usamos el dominio oficial que configuraste en Vercel
    const response = await fetch('https://backend-ude-c.vercel.app/api/auth/login', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password }),
    });

    const data = await response.json();

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
      } else {
        // ❌ Si success es false (o la respuesta no es ok), mostramos el mensaje sutil
        setError(data.message || "Credenciales no encontradas");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setError("No se pudo conectar con el servidor.");
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
            
            <form className="login-form-udec" onSubmit={handleLogin}>
              <input 
  type="email" 
  placeholder="Correo electrónico" 
  className="udec-input-field" 
  value={correo}
  onChange={(e) => {
    // Forzamos minúsculas en tiempo real
    setCorreo(e.target.value.toLowerCase()); 
    if (error) setError('');
  }}
  required 
/>
              
              {/* Contenedor para el campo de contraseña con el icono de ojo */}
              {/* Contenedor para el campo de contraseña */}
<div className="password-input-wrapper">
  <input 
    type={showPassword ? "text" : "password"} 
    placeholder="Contraseña" 
    className="udec-input-field password-field" 
    value={password}
    onChange={(e) => {
      setPassword(e.target.value); // Guarda el cambio
      if (error) setError('');     // <--- ¡ESTO TAMBIÉN BORRA EL MENSAJE!
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

  {/* 🔴 AGREGAMOS EL MENSAJE DE ERROR AQUÍ */}
  {error && <span className="error-message-sutil">{error}</span>}

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