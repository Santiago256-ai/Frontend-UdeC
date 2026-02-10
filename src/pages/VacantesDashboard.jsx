import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api'; // ⚡ Instancia de Axios con tu URL de Railway
// Importamos los iconos
import { Bell, MessageSquare, Settings, LogOut, ChevronDown } from 'lucide-react';
import NotificationBadge from '../components/NotificationBadge'; // Ajusta la ruta
import Mensajeria from '../components/Chat-Vacantes';

// =========================================================
// ⚡ FUNCIONES AUXILIARES DENTRO DEL ARCHIVO (por requisito)
// =========================================================

// Función para obtener las iniciales del usuario para el avatar
const getInitials = (nombres) => {
    if (!nombres) return 'U';
    const parts = nombres.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
};

// Función para renderizar el Badge (Contador) de notificaciones/mensajes
const renderBadge = (count, colorClass) => {
    if (count <= 0) return null; // No renderizar si el contador es 0 o menos

    return (
        <span 
            className={`absolute top-0 right-0 h-5 min-w-5 px-1 ${colorClass} text-white text-xs font-bold rounded-full flex items-center justify-center transform translate-x-1/4 -translate-y-1/4`}
        >
            {/* Muestra 99+ si es mayor a 99 */}
            {count > 99 ? '99+' : count} 
        </span>
    );
};

// =========================================================
// ⚡ COMPONENTE NAVBAR DENTRO DEL ARCHIVO (por requisito)
// =========================================================

const Navbar = ({ usuario, onLogout, unreadNotificationsCount, unreadMessagesCount, navigate }) => {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                
                {/* Logo */}
                <div className="text-xl font-bold text-indigo-600">
                    <span className="hidden sm:inline">Portal de Empleo</span>
                    <span className="sm:hidden">PE</span>
                </div>

                {/* Secciones de Iconos */}
                <div className="flex items-center space-x-6">
                    
                    {/* Icono de Notificaciones (Campanita) */}
                    <button className="p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-indigo-600 relative transition duration-150">
                        <Bell className="w-6 h-6" />
                        {renderBadge(unreadNotificationsCount, 'bg-red-500')}
                    </button>

                    {/* Icono de Mensajes (Solo uno, bien posicionado) */}
                    <NotificationBadge />

                    {/* Menú de Perfil */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                            className="flex items-center space-x-1 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition duration-150"
                        >
                            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm ring-2 ring-indigo-300">
                                {getInitials(usuario.nombres)}
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        </button>

                        {isProfileMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 border border-gray-100 z-10">
                                <div className="px-4 py-2 text-sm text-gray-700 truncate border-b border-gray-100">
                                    ¡Hola, <b>{usuario.nombres}</b>!
                                </div>
                                <button
                                    onClick={() => { onLogout(); setIsProfileMenuOpen(false); }}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition duration-150"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

// =========================================================
// COMPONENTE PRINCIPAL: VacantesDashboard
// =========================================================

export default function VacantesDashboard() {
    const location = useLocation();
    const navigate = useNavigate();

    const [usuario, setUsuario] = useState(() => {
        const storedUser = localStorage.getItem('usuario');
        const initialUser = location.state?.usuario || (storedUser ? JSON.parse(storedUser) : null);
        
        if (initialUser) {
            localStorage.setItem('usuario', JSON.stringify(initialUser));
        }
        return initialUser;
    });

    const [vacantes, setVacantes] = useState([]);
    const [selectedVacante, setSelectedVacante] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chatAbierto, setChatAbierto] = useState(false);
    
    // ⚡ NUEVOS ESTADOS PARA LOS CONTADORES
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

    // Lógica de Autenticación/Redirección
    useEffect(() => {
        if (!usuario) {
            if (!loading) { 
                localStorage.removeItem('usuario');
                navigate('/'); 
            }
        } else if (usuario.rol !== 'estudiante' && usuario.rol !== 'egresado') {
            localStorage.removeItem('usuario');
            navigate('/'); 
        } else {
            setLoading(false);
        }
    }, [usuario, navigate, loading]);

    // Lógica para cargar vacantes con Axios
    useEffect(() => {
        if (!usuario) {
            setLoading(false);
            return;
        }

        const fetchVacantes = async () => {
            try {
                const { data } = await API.get('/vacantes'); 
                setVacantes(data);
                setError(null);
            } catch (err) {
                console.error('Error al cargar vacantes:', err);
                setError('Error al cargar las vacantes. Revisa tu backend.');
            }
        };

        fetchVacantes();
    }, [usuario]);
    
    // ⚡ LÓGICA PARA CARGAR LOS CONTADORES (REEMPLAZAR CON LLAMADA REAL A LA API)
useEffect(() => {
    if (!usuario) return;

    const fetchCounters = async () => {
        try {
            // Llamada al nuevo endpoint en Vercel
            const { data } = await API.get(`/mensajeria/contadores/${usuario.id}`);
            
            setUnreadMessagesCount(data.unreadMessages);
            setUnreadNotificationsCount(data.unreadNotifications);
        } catch (err) {
            console.error('Error al obtener contadores:', err);
        }
    };

    fetchCounters(); 
    
    // Polling: Preguntar cada 10 segundos para actualizar el Navbar
    const intervalId = setInterval(fetchCounters, 5000);
    return () => clearInterval(intervalId);
    
}, [usuario]);
    
    // Función para cerrar sesión
    const handleLogout = () => {
        localStorage.removeItem('usuario');
        navigate('/', { replace: true }); 
    };

    // Funciones de manejo de postulación
    const handleSelectVacante = (vacante) => setSelectedVacante(vacante);
    const handleFileChange = (e) => setPdfFile(e.target.files[0]);

    const handlePostular = async () => {
        if (!selectedVacante || !pdfFile) {
            alert('Selecciona una vacante y un archivo PDF.');
            return;
        }

        if (!usuario) {
            alert('Error de autenticación. Por favor, inicia sesión.');
            navigate('/');
            return;
        }

        const formData = new FormData();
        formData.append('cv', pdfFile);
        formData.append('vacanteId', selectedVacante.id);
        formData.append('usuarioId', usuario.id);
        formData.append('telefono', usuario.telefono || 'N/A');

        try {
            const { data } = await API.post('/postulaciones/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log('Postulación enviada con éxito:', data);
            alert('Postulación enviada con éxito!');
            setSelectedVacante(null);
            setPdfFile(null);
        } catch (err) {
            console.error('Error en la postulación:', err);
            const message = err.response?.data?.error || 'Error desconocido.';
            alert(`Ocurrió un error al enviar tu postulación: ${message}`);
        }
    };
    
    // Renderizado de carga y error
    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-gray-100 text-gray-700">Cargando dashboard...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen bg-red-100 text-red-700">Error: {error}</div>;
    }

    if (!usuario) return null;

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            {/* ⚡ Navbar Integrada */}
            <Navbar 
    usuario={usuario} 
    onLogout={handleLogout} 
    unreadNotificationsCount={unreadNotificationsCount}
    unreadMessagesCount={unreadMessagesCount}
    navigate={navigate} // ⬅️ IMPORTANTE: Pasa la función de navegación aquí
/>

            <div className="max-w-7xl mx-auto p-4 sm:p-8">
                
                <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-700 mb-6 border-b-4 border-indigo-300 pb-2">
                    Panel de Vacantes
                </h1>
                
                {/* Contenido Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sección de Vacantes */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-2xl">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Vacantes Disponibles ({vacantes.length})</h2>
                        <div className="space-y-4">
                            {vacantes.length === 0 ? (
                                <p className="text-gray-500 italic">No hay vacantes disponibles en este momento.</p>
                            ) : (
                                vacantes.map((v) => (
                                    <div 
                                        key={v.id} 
                                        onClick={() => handleSelectVacante(v)} 
                                        className={`p-5 border-l-4 rounded-lg shadow-md cursor-pointer transition duration-300 ease-in-out 
                                            ${selectedVacante?.id === v.id 
                                                ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500' 
                                                : 'bg-white hover:bg-gray-50 border-gray-200'
                                            }`}
                                    >
                                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{v.titulo}</h3>
                                        <p className="text-sm font-medium text-indigo-600 mb-2">
                                            Empresa: <span className="font-bold">{v.empresa?.nombre || 'N/A'}</span>
                                        </p>
                                        <p className="text-gray-600 text-sm line-clamp-2">{v.descripcion}</p>
                                        {selectedVacante?.id === v.id && (
                                            <span className="mt-2 inline-block text-xs font-semibold text-indigo-700">
                                                SELECCIONADA
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Sección de Postulación */}
                    <div className="lg:col-span-1 sticky top-20 h-fit bg-white p-6 rounded-xl shadow-2xl border-t-4 border-emerald-500">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Postular a Vacante</h2>
                        {selectedVacante ? (
                            <div className="space-y-5">
                                <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-md">
                                    <p className="text-base font-semibold text-emerald-700">
                                        Vacante: {selectedVacante.titulo}
                                    </p>
                                    <p className="text-sm text-emerald-600">
                                        Empresa: {selectedVacante.empresa?.nombre || 'N/A'}
                                    </p>
                                </div>

                                <label className="block text-sm font-medium text-gray-700">
                                    Subir CV (PDF)
                                </label>
                                <input 
                                    type="file" 
                                    accept="application/pdf" 
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-indigo-50 file:text-indigo-700
                                        hover:file:bg-indigo-100"
                                />

                                <button 
                                    onClick={handlePostular} 
                                    className={`w-full py-3 px-4 rounded-full font-bold transition duration-150 ease-in-out shadow-lg 
                                        ${pdfFile && selectedVacante 
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                        }`}
                                    disabled={!pdfFile || !selectedVacante}
                                >
                                    Enviar Postulación
   </button>

                                {/* ⚡ BOTÓN DE CONTACTO ⚡ */}
                                <button 
                                    onClick={() => setChatAbierto(true)}
                                    className="w-full py-3 rounded-full font-bold text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50 transition shadow-md"
                                >
                                    Contactar Empresa
                                </button>

                                <p className="text-xs text-gray-500 text-center pt-2">
                                    Asegúrate de que tu CV esté en formato PDF.
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-md">
                                <p className="text-yellow-900">Por favor, selecciona una vacante de la lista para ver el formulario de postulación.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ⚡ RENDER DEL CHAT FLOTANTE ⚡ */}
                {/* En VacantesDashboard.jsx */}
{chatAbierto && selectedVacante && (
    <Mensajeria 
        empresaId={selectedVacante.empresaId} 
        vacanteId={selectedVacante.id} // ⚡ NUEVA PROP: ID de la vacante
        onClose={() => setChatAbierto(false)} 
    />
)}
            </div>
        </div>
    );
}