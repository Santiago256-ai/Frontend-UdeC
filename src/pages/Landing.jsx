import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import './Landing.css';
import AuthModal from './AuthModal'; // <-- 1. IMPORTAR EL NUEVO MODAL
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
    const [showAuthModal, setShowAuthModal] = useState(false); // <-- 2. NUEVO ESTADO PARA EL MODAL
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

    // 3. FUNCIÓN PARA ABRIR EL MODAL
    const handleLoginClick = () => {
        setShowAuthModal(true);
    };

    const slides = [
        {
            title: "Informa a las personas adecuadas de que buscas empleo",
            text: "La funcionalidad «Open To Work» te permite indicar que buscas empleo...",
            img: img1
        },
        {
            title: "Las conversaciones de hoy podrían ser las oportunidades de mañana",
            text: "Enviar mensajes a personas que conoces es una gran manera de reforzar relaciones...",
            img: img2
        },
        {
            title: "Tu red profesional crece contigo",
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
                    <span className="landing-logo-365">360</span>
                    <span className="landing-logo-pro">PRO</span>
                </div>

                <div className="landing-menu">
                    <Link to="/learning">Learning</Link>
                    <Link to="/empleos">Empleos</Link>
                    <Link to="/juegos">Juegos</Link>
                    <Link to="/descargar">Descargar la aplicación</Link>
                </div>

                <div className="landing-auth-buttons">
                    
                    {/* 4. MODIFICACIÓN: Usamos un botón y la función para abrir el modal */}
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
                            <button 
                                className="landing-dropdown-item"
                                onClick={handlePersonaClick}
                            >
                                👤 Como Persona
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

            <main className="landing-main">
                {/* ... (Contenido principal - sin cambios) ... */}
                <div className="landing-card">
                    <h1 className="landing-welcome">
                        ¡Te damos la bienvenida a tu comunidad profesional!
                    </h1>

                    <div className="landing-options">
                        <button 
                            className={`landing-btn ${authMethod.google ? 'active' : ''}`}
                            onClick={() => toggleAuth("google")}
                        >
                            {authMethod.google && '✔ '}Continuar con Google
                        </button>

                        <button 
                            className={`landing-btn ${authMethod.microsoft ? 'active' : ''}`}
                            onClick={() => toggleAuth("microsoft")}
                        >
                            {authMethod.microsoft && '✔ '}Continuar con Microsoft
                        </button>
                    </div>

                    <button className="landing-continue-btn">
                        Continuar
                    </button>

                    <p className="landing-legal">
                        Al hacer clic en «Continuar» para unirte o iniciar sesión, aceptas las <a href="#">Condiciones de uso</a>, la <a href="#">Política de privacidad</a> y la <a href="#">Política de cookies</a> de <strong>Express365PRO</strong>.
                    </p>

                    <div className="landing-separator">o</div>

                    <button 
                        className={`landing-btn ${authMethod.email ? 'active' : ''}`}
                        onClick={() => toggleAuth("email")}
                    >
                        {authMethod.email && '✔ '}Iniciar sesión con el email
                    </button>

                    <p className="landing-signup-link">
                        ¿Estás empezando a usar Express365PRO? <a href="#">Únete ahora</a>
                    </p>
                </div>

                <div className="landing-image">
                    <img 
                        src= {imagenPrincipal}
                        alt="Comunidad profesional Express365PRO" 
                    />
                </div>
            </main>
            
            {/* SECCIÓN ADICIONAL INFERIOR */}
            <section className="landing-extra-section">
                {/* === BLOQUE 1 === */}
                <div className="landing-info-block">
                    <div className="landing-info-text">
                        <h2>Echa un vistazo a los artículos colaborativos</h2>
                        <p>
                            Queremos impulsar los conocimientos de la comunidad de una forma nueva.
                            Los expertos añadirán información directamente a cada artículo,
                            generado inicialmente con inteligencia artificial.
                        </p>
                    </div>

                    <div className="landing-tags">
                        {[
                            { name: "Marketing", url: "https://www.linkedin.com/feed/topic/marketing" },
                            { name: "Administración pública", url: "https://www.linkedin.com/feed/topic/public-administration" },
                            { name: "Asistencia sanitaria", url: "https://www.linkedin.com/feed/topic/healthcare" },
                            { name: "Ingeniería", url: "https://www.linkedin.com/feed/topic/engineering" },
                            { name: "Servicios de TI", url: "https://www.linkedin.com/feed/topic/it-services" },
                            { name: "Sostenibilidad", url: "https://www.linkedin.com/feed/topic/sustainability" },
                            { name: "Administración de empresas", url: "https://www.linkedin.com/feed/topic/business-management" },
                            { name: "Telecomunicaciones", url: "https://www.linkedin.com/feed/topic/telecommunications" },
                            { name: "Gestión de recursos humanos", url: "https://www.linkedin.com/feed/topic/human-resources" },
                        ].map((tag) => (
                            <a key={tag.name} href={tag.url} target="_blank" rel="noopener noreferrer" className="landing-tag">
                                {tag.name}
                            </a>
                        ))}
                        <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" className="landing-tag show-all">
                            Mostrar todo
                        </a>
                    </div>
                </div>

                {/* === BLOQUE 2 === */}
                <div className="landing-info-block">
                    <div className="landing-info-text">
                        <h2>Encuentra el empleo o las prácticas adecuadas para ti</h2>
                    </div>

                    <div className="landing-tags">
                        {[
                            { name: "Ingeniería", url: "https://www.linkedin.com/jobs/search/?keywords=ingenieria" },
                            { name: "Desarrollo empresarial", url: "https://www.linkedin.com/jobs/search/?keywords=business%20development" },
                            { name: "Finanzas", url: "https://www.linkedin.com/jobs/search/?keywords=finanzas" },
                            { name: "Asistente administrativo", url: "https://www.linkedin.com/jobs/search/?keywords=administrativo" },
                            { name: "Empleado de tienda", url: "https://www.linkedin.com/jobs/search/?keywords=tienda" },
                            { name: "Servicio al cliente", url: "https://www.linkedin.com/jobs/search/?keywords=cliente" },
                            { name: "Operaciones", url: "https://www.linkedin.com/jobs/search/?keywords=operaciones" },
                            { name: "TI", url: "https://www.linkedin.com/jobs/search/?keywords=tecnologia" },
                            { name: "Marketing", url: "https://www.linkedin.com/jobs/search/?keywords=marketing" },
                            { name: "Recursos humanos", url: "https://www.linkedin.com/jobs/search/?keywords=recursos%20humanos" },
                        ].map((tag) => (
                            <a key={tag.name} href={tag.url} target="_blank" rel="noopener noreferrer" className="landing-tag">
                                {tag.name}
                            </a>
                        ))}
                        <a href="https://www.linkedin.com/jobs/" target="_blank" rel="noopener noreferrer" className="landing-tag show-all">
                            Mostrar más
                        </a>
                    </div>
                </div>

                {/* === BLOQUE 3 === */}
                <div className="landing-job-promo">
                    <h3>Publica tu anuncio de empleo para que lo vean millones de personas</h3>
                    <a
                        href="https://www.linkedin.com/talent/post-a-job/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="landing-publish-btn"
                    >
                        Publicar un empleo
                    </a>
                </div>

            </section>

            {/* === CARRUSEL INFORMATIVO === */}
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


            {/* === FOOTER === */}
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
                            <a href="#"><i className="fab fa-facebook"></i></a>
                            <a href="#"><i className="fab fa-twitter"></i></a>
                            <a href="#"><i className="fab fa-linkedin"></i></a>
                            <a href="#"><i className="fab fa-instagram"></i></a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} Empres360PRO. Todos los derechos reservados.</p>
                </div>
            </footer>
            
            {/* 5. RENDERIZAR EL MODAL DE AUTENTICACIÓN */}
            <AuthModal 
                isVisible={showAuthModal} 
                onClose={() => setShowAuthModal(false)}
            />
        </div>
    );
}