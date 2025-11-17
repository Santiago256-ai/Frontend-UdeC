import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import './Landing.css';
import AuthModal from './AuthModal'; // <-- IMPORTADO: Se asume que existe este componente modal.
import img1 from '../assets/carrusel1.jpg';
import img2 from '../assets/carrusel2.jpg';
import img3 from '../assets/carrusel3.jpg';
import imagenPrincipal from '../assets/equipo.jpg';

export default function Landing() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [authMethod, setAuthMethod] = useState({
        google: false,
        microsoft: false,
        email: false,
    });

    const [showDropdown, setShowDropdown] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false); // ESTADO: Para el nuevo modal
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleAuth = (method) => {
        setAuthMethod((prev) => ({
            ...prev,
            [method]: !prev[method],
        }));
    };

    const handleRegisterClick = () => {
        setShowDropdown(!showDropdown);
    };

    const handlePersonaClick = () => {
        navigate('/register/student');
        setShowDropdown(false);
    };

    const handleEmpresaClick = () => {
        navigate('/register/company');
        setShowDropdown(false);
    };

    // FUNCIÓN: Para abrir el modal de autenticación
    const handleLoginClick = () => {
        setShowAuthModal(true);
    };

    const slides = [
        {
            title: "Informa a las personas adecuadas de que buscas empleo 🚀",
            text: "La funcionalidad «Open To Work» te permite indicar que buscas empleo...",
            img: img1
        },
        {
            title: "Las conversaciones de hoy podrían ser las oportunidades de mañana 💡",
            text: "Enviar mensajes a personas que conoces es una gran manera de reforzar relaciones...",
            img: img2
        },
        {
            title: "Tu red profesional crece contigo 📈",
            text: "Conecta con expertos y descubre nuevas oportunidades laborales.",
            img: img3
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [slides.length]);

    return (
        <div className="landing-container">
            
            <header className="landing-header">
                <div className="landing-logo">
                    <span className="landing-logo-express">Empres</span>
                    <span className="landing-logo-360">360</span>
                    <span className="landing-logo-pro">PRO</span>
                </div>

                <div className="landing-menu">
                    {/* Emojis modernos en el menú de navegación */}
                    <Link to="/learning">📚 Learning</Link>
                    <Link to="/empleos">💼 Empleos</Link>
                    <Link to="/juegos">🎮 Juegos</Link>
                    <Link to="/descargar">📲 App</Link>
                </div>

                <div className="landing-auth-buttons">
                    
                    {/* Botón que abre el Modal de Iniciar Sesión */}
                    <button 
                        className="landing-login-btn"
                        onClick={handleLoginClick} 
                    >
                        Iniciar sesión
                    </button>
                    
                    <div className="landing-register-dropdown" ref={dropdownRef}>
                        <button 
                            className="landing-register-btn"
                            onClick={handleRegisterClick}
                        >
                            Registrarse
                        </button>
                        
                        <div className={`landing-dropdown-menu ${showDropdown ? 'show' : ''}`}>
                            {/* Emojis en el Dropdown de Registro */}
                            <button 
                                className="landing-dropdown-item"
                                onClick={handlePersonaClick}
                            >
                                👥 Como Persona
                            </button>
                            <button 
                                className="landing-dropdown-item"
                                onClick={handleEmpresaClick}
                            >
                                🏢 Como Empresa
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* MAIN: Contenedor principal con centrado y sin ancho fijo total para el diseño de tarjetas unificadas */}
            <main className="landing-main">
                <div className="landing-card">
                    <h1 className="landing-welcome">
                        ¡Te damos la bienvenida a tu comunidad profesional! 🌐
                    </h1>

                    {/* Botones de Autenticación actualizados para verse más limpios */}
                    <div className="landing-options">
                        <button 
                            className={`landing-btn landing-auth-google ${authMethod.google ? 'active' : ''}`}
                            onClick={() => toggleAuth("google")}
                        >
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="auth-icon" />
                            Continuar con Google
                        </button>

                        <button 
                            className={`landing-btn landing-auth-microsoft ${authMethod.microsoft ? 'active' : ''}`}
                            onClick={() => toggleAuth("microsoft")}
                        >
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/1024px-Microsoft_logo_%282012%29.svg.png" alt="Microsoft" className="auth-icon" />
                            Continuar con Microsoft
                        </button>
                    </div>

                    <button className="landing-continue-btn">
                        Continuar
                    </button>

                    <p className="landing-legal">
                        Al hacer clic en «Continuar» para unirte o iniciar sesión, aceptas las <a href="#">Condiciones de uso</a>, la <a href="#">Política de privacidad</a> y la <a href="#">Política de cookies</a> de <strong>Empres360PRO</strong>.
                    </p>

                    <div className="landing-separator">o</div>

                    <button 
                        className={`landing-btn landing-auth-email ${authMethod.email ? 'active' : ''}`}
                        onClick={() => toggleAuth("email")}
                    >
                        <i className="fas fa-envelope auth-icon"></i>
                        Iniciar sesión con el email
                    </button>

                    <p className="landing-signup-link">
                        ¿Estás empezando a usar Empres360PRO? <a href="#">Únete ahora</a>
                    </p>
                </div>

                <div className="landing-image">
                    <img 
                        src= {imagenPrincipal}
                        alt="Comunidad profesional Empres360PRO" 
                    />
                </div>
            </main>
            
            {/* SECCIÓN ADICIONAL INFERIOR: Diseño de lado a lado */}
            <section className="landing-extra-section">
                
                {/* === BLOQUE 1: Artículos === */}
                <div className="landing-info-block">
                    <div className="landing-info-text">
                        <h2>Echa un vistazo a los artículos colaborativos 📰</h2>
                        <p>
                            Queremos impulsar los conocimientos de la comunidad de una forma nueva. Los expertos añadirán información directamente a cada artículo, generado inicialmente con inteligencia artificial.
                        </p>
                    </div>

                    <div className="landing-tags">
                        {[
                            { name: "Marketing", url: "#" },
                            { name: "Administración pública", url: "#" },
                            { name: "Asistencia sanitaria", url: "#" },
                            { name: "Ingeniería", url: "#" },
                            { name: "Servicios de TI", url: "#" },
                            { name: "Sostenibilidad", url: "#" },
                            { name: "Administración de empresas", url: "#" },
                            { name: "Telecomunicaciones", url: "#" },
                            { name: "Gestión de RR. HH.", url: "#" },
                        ].map((tag) => (
                            <a key={tag.name} href={tag.url} className="landing-tag">
                                {tag.name}
                            </a>
                        ))}
                        <a href="#" className="landing-tag show-all">
                            Mostrar todo »
                        </a>
                    </div>
                </div>

                {/* === BLOQUE 2: Empleos === */}
                <div className="landing-info-block">
                    <div className="landing-info-text">
                        <h2>Encuentra el empleo o las prácticas adecuadas para ti 🎯</h2>
                    </div>

                    <div className="landing-tags">
                        {[
                            { name: "Ingeniería", url: "#" },
                            { name: "Desarrollo empresarial", url: "#" },
                            { name: "Finanzas", url: "#" },
                            { name: "Asistente administrativo", url: "#" },
                            { name: "Empleado de tienda", url: "#" },
                            { name: "Servicio al cliente", url: "#" },
                            { name: "Operaciones", url: "#" },
                            { name: "TI", url: "#" },
                            { name: "Marketing", url: "#" },
                            { name: "Recursos humanos", url: "#" },
                        ].map((tag) => (
                            <a key={tag.name} href={tag.url} className="landing-tag">
                                {tag.name}
                            </a>
                        ))}
                        <a href="#" className="landing-tag show-all">
                            Mostrar más »
                        </a>
                    </div>
                </div>

                {/* === BLOQUE 3: Promo de Empleo === */}
                <div className="landing-job-promo">
                    <h3>Publica tu anuncio de empleo para que lo vean millones de personas 📢</h3>
                    <a
                        href="#"
                        className="landing-publish-btn"
                    >
                        Publicar un empleo
                    </a>
                </div>

            </section>

            {/* === CARRUSEL INFORMATIVO: Diseño de lado a lado con margen === */}
            <div className="landing-carousel">
                <button
                    className="carousel-btn prev"
                    onClick={() =>
                        setCurrentSlide((prev) =>
                            prev === 0 ? slides.length - 1 : prev - 1
                        )
                    }
                >
                    ‹
                </button>

                <div
                    className="carousel-wrapper"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                    {slides.map((slide, index) => (
                        <div className="carousel-item" key={index}>
                            <div className="carousel-content">
                                <div className="carousel-text">
                                    <h2>{slide.title}</h2>
                                    <p>{slide.text}</p>
                                </div>
                                <div className="carousel-image">
                                    {/* Utilizamos un div para centrar la imagen circular */}
                                    <img src={slide.img} alt={slide.title} /> 
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    className="carousel-btn next"
                    onClick={() =>
                        setCurrentSlide((prev) => (prev + 1) % slides.length)
                    }
                >
                    ›
                </button>

                <div className="carousel-indicators">
                    {slides.map((_, i) => (
                        <span
                            key={i}
                            className={i === currentSlide ? "active" : ""}
                            onClick={() => setCurrentSlide(i)}
                        ></span>
                    ))}
                </div>
            </div>


            {/* === FOOTER: Diseño de lado a lado === */}
            <footer className="landing-footer">
                <div className="footer-container">
                    <div className="footer-section">
                        <h4>Empres360PRO</h4>
                        <p>
                            Conectando talento, innovación y oportunidades laborales en un solo lugar.
                        </p>
                    </div>

                    <div className="footer-section">
                        <h4>Enlaces útiles</h4>
                        <ul>
                            <li><a href="#">Acerca de nosotros</a></li>
                            <li><a href="#">Términos y condiciones</a></li>
                            <li><a href="#">Política de privacidad</a></li>
                            <li><a href="#">Contáctanos</a></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>Síguenos</h4>
                        <div className="footer-socials">
                            {/* Íconos de redes sociales modernos con emojis */}
                            <a href="#">📘</a> 
                            <a href="#">🐦</a> 
                            <a href="#">🔗</a> 
                            <a href="#">📸</a> 
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} Empres360PRO. Todos los derechos reservados.</p>
                </div>
            </footer>
            
            {/* RENDERIZAR EL MODAL DE AUTENTICACIÓN */}
            <AuthModal 
                isVisible={showAuthModal} 
                onClose={() => setShowAuthModal(false)}
            />
        </div>
    );
}