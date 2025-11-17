import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import './Landing.css';
import AuthModal from './AuthModal'; 

// 🚨 1. IMPORTACIONES DE FIREBASE
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, microsoftProvider } from "./firebase"; 

// 🚨 2. IMPORTACIÓN DE AXIOS/API
import API from '../services/api'; 

// Importaciones de imágenes (rutas relativas)
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
    const [showAuthModal, setShowAuthModal] = useState(false); 
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // ------------------------------------------------------------------
    // 🚨 FUNCIONES CENTRALES DE AUTENTICACIÓN Y REDIRECCIÓN
    // ------------------------------------------------------------------

    // Función de redirección centralizada
    const redirectToDashboard = (usuario) => {
        const userRole = usuario.rol?.toLowerCase(); // Aseguramos minúsculas

        if (userRole === 'estudiante' || userRole === 'persona') {
            navigate('/vacantes-dashboard', { state: { usuario } });
        } else if (userRole === 'empresa' || userRole === 'compania') {
            navigate('/empresa-dashboard', { state: { usuario } });
        } else {
            console.error("Tipo de usuario no reconocido después del login social:", usuario);
            alert('Error: Rol de usuario desconocido. Contacta a soporte.');
        }
    };
    
    // 🚨 FUNCIÓN CLAVE: Envía el token de Firebase a tu Backend para login/registro
    const registerOrLoginWithBackend = async (firebaseUser) => {
        // 1. Obtener el token de ID de Firebase
        const idToken = await firebaseUser.getIdToken();

        try {
            // 2. Enviar el token a tu endpoint de login social
            const response = await API.post('/auth/social-login', { 
                idToken: idToken,
                email: firebaseUser.email 
            });

            // 3. El Backend devuelve el objeto de usuario final (con 'rol', 'id', etc.)
            return response.data; 

        } catch (error) {
            console.error("Error al autenticar con el Backend:", error.response?.data || error.message);
            // Re-lanzar error para manejarlo en la función llamante y mostrar un mensaje
            throw new Error("Fallo la comunicación con el Backend. No se pudo iniciar sesión.");
        }
    };


    // ------------------------------------------------------------------
    // 🚨 MANEJADORES DE LOGIN SOCIAL (Actualizados)
    // ------------------------------------------------------------------
    
    // Función para Iniciar Sesión con Google
    const handleGoogleLogin = async () => {
        try {
            // 1. Autenticar con Firebase
            const result = await signInWithPopup(auth, googleProvider);
            const firebaseUser = result.user;

            // 2. Autenticar/registrar en tu Backend
            const backendUser = await registerOrLoginWithBackend(firebaseUser);
            
            // 3. Redirigir
            redirectToDashboard(backendUser);

        } catch (error) {
            // Manejar error si el usuario cierra el pop-up o hay un error de Firebase/Backend
            if (error.code !== 'auth/popup-closed-by-user') {
                console.error("Error al iniciar sesión con Google:", error);
                alert(`Error de autenticación con Google. Mensaje: ${error.message}`);
            }
        }
    };

    // Función para Iniciar Sesión con Microsoft
    const handleMicrosoftLogin = async () => {
        try {
            // 1. Autenticar con Firebase
            const result = await signInWithPopup(auth, microsoftProvider);
            const firebaseUser = result.user;

            // 2. Autenticar/registrar en tu Backend
            const backendUser = await registerOrLoginWithBackend(firebaseUser);
            
            // 3. Redirigir
            redirectToDashboard(backendUser);

        } catch (error) {
            if (error.code !== 'auth/popup-closed-by-user') {
                console.error("Error al iniciar sesión con Microsoft:", error);
                alert(`Error de autenticación con Microsoft. Mensaje: ${error.message}`);
            }
        }
    };

    // Función para Iniciar Sesión con Email (abre el modal)
    const handleEmailLoginClick = () => {
        setShowAuthModal(true); 
    };
    
    // ------------------------------------------------------------------
    // OTRAS FUNCIONES (Mantienen la lógica de UI)
    // ------------------------------------------------------------------

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

    // FUNCIÓN: Para abrir el modal de autenticación (Se mantiene para el botón de la cabecera)
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

    // ------------------------------------------------------------------
    // JSX / RENDERIZADO
    // ------------------------------------------------------------------
    return (
        <div className="landing-container">
            
            <header className="landing-header">
                <div className="landing-logo">
                    <span className="landing-logo-express">Empres</span>
                    <span className="landing-logo-360">360</span>
                    <span className="landing-logo-pro">PRO</span>
                </div>

                <div className="landing-menu">
                    <Link to="/learning">📚 Learning</Link>
                    <Link to="/empleos">💼 Empleos</Link>
                    <Link to="/juegos">🎮 Juegos</Link>
                    <Link to="/descargar">📲 App</Link>
                </div>

                <div className="landing-auth-buttons">
                    
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

            {/* MAIN: Contenedor principal */}
            <main className="landing-main">
                <div className="landing-card">
                    <h1 className="landing-welcome">
                        ¡Te damos la bienvenida a tu comunidad profesional!
                    </h1>

                    {/* Botones de Autenticación actualizados */}
                    <div className="landing-options">
                        <button 
                            className={`landing-btn landing-auth-google ${authMethod.google ? 'active' : ''}`}
                            onClick={handleGoogleLogin} 
                        >
                            <svg class="auth-icon" viewBox="0 0 24 24" width="20px" height="20px">
                                <path fill="#4285F4" d="M22.5 12.5c0-.6-.1-1.2-.2-1.7H12v3.4h5.6c-.3 1.7-1.3 3.1-2.9 4v2.7h3.5c2.1-1.9 3.4-4.8 3.4-8.4z"/>
                                <path fill="#34A853" d="M12 24c3.3 0 6.1-1.1 8.2-3.1l-3.5-2.7c-1.1.7-2.5 1.1-4.7 1.1-3.6 0-6.7-2.4-7.8-5.6H.7v2.8C2.9 21.6 7.1 24 12 24z"/>
                                <path fill="#FBBC05" d="M4.2 14.3c-.2-.7-.3-1.4-.3-2.3s.1-1.6.3-2.3V6.9H.7c-.5 1.1-.7 2.5-.7 4.1s.2 3 .7 4.1L4.2 14.3z"/>
                                <path fill="#EA4335" d="M12 4.6c2.1 0 4.1.8 5.6 2.1l3.1-3.1C18.1 1.7 15.3 0 12 0 7.1 0 2.9 2.4.7 6.9l3.5 2.8c1.1-3.2 4.2-5.6 7.8-5.6z"/>
                            </svg>
                            Continuar con Google
                        </button>

                        <button 
                            className={`landing-btn landing-auth-microsoft ${authMethod.microsoft ? 'active' : ''}`}
                            onClick={handleMicrosoftLogin}
                        >
                            <svg className="auth-icon" viewBox="0 0 240 240" width="20px" height="20px">
                                <rect x="10" y="10" width="110" height="110" fill="#F25022"/>
                                <rect x="120" y="10" width="110" height="110" fill="#7FBA00"/>
                                <rect x="10" y="120" width="110" height="110" fill="#00A4EF"/>
                                <rect x="120" y="120" width="110" height="110" fill="#FFB900"/>
                            </svg>
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
                        onClick={handleEmailLoginClick}
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
            
            <section className="landing-extra-section">
                
                {/* === BLOQUE 1: Artículos === */}
                <div className="landing-info-block">
                    <div className="landing-info-text">
                        <h2>Echa un vistazo a los artículos colaborativos</h2>
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
                        <h2>Encuentra el empleo o las prácticas adecuadas para ti</h2>
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
                    <h3>Publica tu anuncio de empleo para que lo vean millones de personas</h3>
                    <a
                        href="#"
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