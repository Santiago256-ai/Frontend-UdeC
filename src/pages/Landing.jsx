import React, { useState } from 'react';
import './Landing.css';
import { Link } from "react-router-dom"; 
import LoginDropdown from './LoginDropdown';

const Landing = () => {
  // Estados para el Chatbot
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');

  // ESTADO PARA EL MODAL DE INICIO DE SESIÓN
  const [showModal, setShowModal] = useState(false);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    setMessages([...messages, { text: inputValue, sender: 'user' }, { text: "¡Hola! Estamos para ayudarte.", sender: 'bot' }]);
    setInputValue('');
  };

  // Funciones para abrir/cerrar modal
  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

 return (
    <div className="landing-global-wrapper">
      
      {/* NAVBAR TOTALMENTE CORREGIDO */}
      <nav className="navbar-custom-main">
        <div className="navbar-content-container">
          
          {/* LOGO A LA IZQUIERDA */}
          <Link to="/" className="navbar-logo-link">
            <img src="/Logo.png" alt="Logo Empres360 PRO" className="navbar-logo-img" />
          </Link>

          {/* ESTE ES EL CONTENEDOR CLAVE */}
          <div className="navbar-auth-group" style={{ position: 'relative' }}>
            
            {/* MENÚ DESPLEGABLE REGISTRARSE */}
            <div className="dropdown-custom">
              <button className="nav-auth-button dropdown-toggle-custom">
                Registrarse
              </button>
              
              <div className="dropdown-content-custom">
                <Link to="/register/student" className="dropdown-item-custom">Egresado</Link>
                <Link to="/register/company" className="dropdown-item-custom">Empresa</Link>
              </div>
            </div>

            {/* BOTÓN INICIAR SESIÓN */}
            <button 
              onClick={handleOpenModal} 
              className="nav-auth-button"
              style={{ border: 'none', cursor: 'pointer' }}
            >
              Iniciar Sesión
            </button>

            {/* EL DROPDOWN AHORA ES HIJO DE navbar-auth-group */}
            <LoginDropdown 
                isVisible={showModal} 
                onClose={() => setShowModal(false)} 
            />

          </div> {/* Cierre de navbar-auth-group */}
        </div>
      </nav>

      {/* SECCIÓN HERO - TEXTO A LA IZQUIERDA */}
      <header className="hero-section">
        <div className="hero-content-wrapper">
          <div className="hero-text-container">
            <div className="glass-card-text">
              <h1 className="titulo-serif-hero">Empres360 PRO</h1>
              <hr className="linea-decorativa" />
              <p className="texto-descripcion">
                Somos una plataforma diseñada para vincular egresados altamente capacitados con empresas que buscan talento competitivo, actualizado y preparado para asumir nuevos retos.
              </p>
              <p className="texto-frase">
                En Empres360 PRO creemos que el éxito profesional comienza con la conexión adecuada.
              </p>
              {/* Puedes usar el mismo verde oliva aquí si deseas */}
              <button className="btn-donar-hero">Inicia Ahora</button>
            </div>
          </div>
        </div>
      </header>

      {/* SECCIÓN MISIÓN Y VISIÓN */}
      <section className="mision-vision-fav">
        <div className="mision-vision-content">
          <div className="glass-box left">
            <h2 className="titulo-serif">MISIÓN</h2>
            <hr />
            <p>
Hacer que encontrar trabajo o el talento ideal sea lo más fácil del mundo. Creamos un espacio donde los estudiantes pueden postularse a vacantes reales con un clic y las empresas pueden revisar perfiles y elegir a su próximo gran integrante sin complicaciones.            </p>
          </div>

          <div className="glass-box right">
            <h2 className="titulo-serif">VISIÓN</h2>
            <hr />
            <p>
Queremos ser el lugar favorito de todos para conectar: donde cada estudiante encuentre su primera gran oportunidad y cada empresa encuentre al profesional que estaba buscando, ayudando a que nadie se quede sin crecer.            </p>
          </div>
        </div>
      </section>

      {/* SECCIÓN OBJETIVOS */}
      <section className="objetivos-section">
        <h2 className="titulo-serif-objetivos">OBJETIVOS</h2>
        <div className="objetivos-container">
          {[
            { t: "CONECTAR TALENTO CON OPORTUNIDADES", d: "Ayudar a que cada estudiante encuentre la vacante ideal de forma rápida, permitiéndole postularse a las mejores ofertas con solo unos clics.", img: "/img5.jpg" },
            { t: "SIMPLIFICAR LA BÚSQUEDA DE PERSONAL", d: "Brindar a las empresas una herramienta fácil de usar para publicar sus vacantes, revisar perfiles de candidatos y elegir al mejor talento para su equipo.", img: "/img6.jpg" },
            { t: "CREAR PROCESOS DE SELECCIÓN TRANSPARENTE", d: "Ser el punto de encuentro donde empresas y postulantes se comunican de manera directa, haciendo que el proceso de contratación sea claro, ágil y efectivo para todos.", img: "/img1.jpg" }
          ].map((obj, i) => (
            <div className="obj-card-custom" key={i}>
              <div className="obj-img-wrapper">
                <img src={obj.img} alt={obj.t} className="obj-img-real" />
              </div>
              <h4 className="obj-titulo">{obj.t}</h4>
              <p className="obj-descripcion">{obj.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PIE DE PÁGINA - UNIVERSIDAD DE CUNDINAMARCA */}
      <footer className="footer-universidad">
        <div className="footer-content">
          <div className="footer-info">
            <p className="copyright-text">© 2026 Empres360 PRO. Todos los derechos reservados.</p>
            <p className="universidad-text">
              Proyecto Académico - <strong>Universidad de Cundinamarca</strong>
            </p>
          </div>
          <div className="footer-links">
            <a href="#terminos">Términos y Condiciones</a>
            <span className="separator">|</span>
            <a href="#privacidad">Política de Privacidad</a>
          </div>
        </div>
      </footer>   

      {/* REDES SOCIALES FLOTANTES */}
      <div className="social-sidebar">
        <a href="https://www.facebook.com/ucundinamarcaoficial/"><img src="/face.png" alt="FB" /></a>
        <a href="https://www.instagram.com/ucundinamarcaoficial/"><img src="/insta.png" alt="IG" /></a>
        <a href="https://www.ucundinamarca.edu.co/"><img src="/escudo_udec.png" alt="WA" /></a>
      </div>

      {/* CHATBOT */}
      <div className="chatbot-container">
        <div className="chat-pill" onClick={() => setChatOpen(!chatOpen)}>
          Hola 👋 ¿Necesitas ayuda?
        </div>
        {chatOpen && (
          <div className="chat-box shadow">
            <div className="chat-messages p-3">
              {messages.map((m, i) => <div key={i} className={`mb-2 ${m.sender}`}>{m.text}</div>)}
            </div>
            <div className="p-2 border-top d-flex">
              <input type="text" className="form-control me-2" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
              <button onClick={handleSendMessage} className="btn btn-info text-white">Ir</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;