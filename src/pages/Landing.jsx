import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Info, Target, Award, Eye as VisionIcon, Users } from 'lucide-react';
import './Landing.css';

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
  // --- Agrega estos estados al inicio de tu componente Landing ---
const [showResetModal, setShowResetModal] = useState(false);
const [emailRecuperacion, setEmailRecuperacion] = useState('');
const [resetLoading, setResetLoading] = useState(false);
const [resetMessage, setResetMessage] = useState({ texto: '', tipo: '' });
const [showAboutModal, setShowAboutModal] = useState(false); // Estado para el "Acerca de"

// --- Función para enviar el correo de recuperación ---
const handleRequestReset = async (e) => {
  e.preventDefault();
  setResetLoading(true);
  setResetMessage({ texto: '', tipo: '' });

  try {
    const response = await fetch('https://backend-ude-c.vercel.app/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: emailRecuperacion }),
    });

    const data = await response.json();

    if (data.success) {
      setResetMessage({ texto: "Enlace enviado. Revisa tu correo.", tipo: 'success' });
      setTimeout(() => {
        setShowResetModal(false);
        setEmailRecuperacion('');
        setResetMessage({ texto: '', tipo: '' });
      }, 3000);
    } else {
      setResetMessage({ texto: data.message || "Error al enviar el correo.", tipo: 'error' });
    }
  } catch (error) {
    setResetMessage({ texto: "Error de conexión con el servidor.", tipo: 'error' });
  } finally {
    setResetLoading(false);
  }
};

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
        <div className="navbar-secondary-logo">
    <img src={logoSecundarioUrl} alt="Logo Institucional" className="secondary-logo-img" />
  </div>
      </header>

      {/* --- SECCIÓN HERO --- */}
      <section className="hero-udec">
        {/* Lado Izquierdo (Graduados + Overlay Verde) */}
        <div className="hero-half left-side">
          <img src={graduadosImgUrl} alt="Graduados" className="hero-img" />
          {/* Este div crea el efecto de desvanecimiento verde exacto */}
          <div className="hero-green-overlay"></div>
        </div>

        {/* Lado Derecho (Negocios Puros) */}
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
      SOY EGRESADO
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

      {/* --- FOOTER (Verde Oscuro) --- */}
      <footer className="footer-dark-green">
        <div className="footer-logo-and-info">
          <img src={logoUrl} alt="UDEC" className="footer-logo-small" />
          <div className="footer-info-text">
            <p>© 2026 Todos los derechos reservados.</p>
            {/* Texto clickable en azul profesional */}
            <p>
              Desarrollado por{" "}
              <span 
                className="e360-clickable-brand" 
                onClick={() => setShowAboutModal(true)}
              >
                Empres360 PRO.
              </span>
            </p>
            <p>Universidad de Cundinamarca.</p>
          </div>
        </div>
      </footer>

      {/* --- MODAL INTERACTIVO: ACERCA DE --- */}
{showAboutModal && (
  <div className="e360-about-overlay" onClick={() => setShowAboutModal(false)}>
    <div className="e360-about-card" onClick={(e) => e.stopPropagation()}>
      <button className="e360-close-btn" onClick={() => setShowAboutModal(false)}>×</button>
      
      <div className="e360-modal-header">
        {/* Logo imponente y protagonista */}
        <img src={logoUrl} alt="Empres360 PRO" className="e360-modal-logo" />
      </div>

      <div className="e360-modal-body">
        {/* 1. ¿Qué es el Portal? */}
        <section className="e360-section">
          <h3><Info size={18} /> 1. ¿Qué es Empres360 PRO?</h3>
          <p>
            Es una plataforma digital estratégica diseñada para fortalecer el vínculo entre nuestra comunidad académica y el sector productivo. Este ecosistema facilita el encuentro entre el talento de alta calidad y las organizaciones que buscan perfiles innovadores, éticos y con responsabilidad social.
          </p>
        </section>

        {/* 2. Objetivos */}
        <section className="e360-section">
          <h3><Target size={18} /> 2. Objetivos</h3>
          <p>
            Dinamizar la empleabilidad de los <strong>Egresados UdeC</strong>, permitiéndoles gestionar sus perfiles profesionales de manera integral, acceder a ofertas exclusivas del sector y potenciar su trayectoria laboral mediante herramientas tecnológicas.
          </p>
        </section>

        {/* 3. Nuestra Misión */}
        <section className="e360-section">
          <h3><Award size={18} /> 3. Nuestra Misión</h3>
          <p>
            Brindar una solución tecnológica eficiente y centralizada que simplifique los procesos de reclutamiento para las empresas y optimice la búsqueda de oportunidades para nuestros graduados, bajo los principios de transparencia y excelencia académica.
          </p>
        </section>

        {/* 4. Nuestra Visión */}
        <section className="e360-section">
          <h3><Eye size={18} /> 4. Nuestra Visión</h3>
          <p>
            Consolidarnos para los proximos años como el principal ecosistema de vinculación laboral universitaria en la región, siendo reconocidos por la innovación en nuestros procesos de intermediación y por el alto impacto en el desarrollo profesional de nuestra comunidad de egresados.
          </p>
        </section>

        {/* 5. Equipo de Desarrollo y Diseño */}
        <section className="e360-section">
          <h3><Users size={18} /> 5. Equipo de Desarrollo y Diseño</h3>
          <p>
            Esta plataforma ha sido desarrollada bajo estándares modernos de ingeniería de sistemas/software, integrando tecnologías de última generación para garantizar seguridad, velocidad y una experiencia de usuario intuitiva.
          </p>
          
          <div className="e360-team-box">
            <p><strong>• Dirección de Proyecto:</strong> Universidad de Cundinamarca.</p>
            <p><strong>• Arquitectura y Desarrollo Full-stack:</strong> Empres360 PRO.</p>
            <p><strong>• Diseño de Interfaz (UI/UX):</strong> Empres360 PRO.</p>
          </div>
        </section>
      </div>

      <div className="e360-modal-footer">
        <p>Institución de Educación Superior sujeta a inspección y vigilancia por el Ministerio de Educación Nacional.</p>
      </div>
    </div>
  </div>
)}
{showResetModal && (
  <div className="modal-overlay-reset fade-in">
    <div className="modal-content-reset scale-up">
      <button className="close-modal-btn" onClick={() => setShowResetModal(false)}>×</button>
      
      <h2>Recuperar Contraseña</h2>
      <p>Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu clave.</p>

      <form onSubmit={handleRequestReset}>
        <input 
          type="email" 
          placeholder="tu-correo@ejemplo.com"
          className="udec-input-field"
          value={emailRecuperacion}
          onChange={(e) => setEmailRecuperacion(e.target.value)}
          required
        />

        {resetMessage.texto && (
          <span className={`message-sutil-${resetMessage.tipo}`}>
            {resetMessage.texto}
          </span>
        )}

        <div className="modal-actions-reset">
          <button 
            type="submit" 
            className="udec-green-btn btn-reset-submit"
            disabled={resetLoading}
          >
            {resetLoading ? "Enviando..." : "ENVIAR ENLACE"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );

  
}

export default Landing;