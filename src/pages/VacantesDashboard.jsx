import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

// URL de tu API
const API_URL = 'http://localhost:4000/api';

export default function VacantesDashboard() {
    const location = useLocation();
    const navigate = useNavigate();

    // Persistencia del usuario
    const [usuario, setUsuario] = useState(() => {
        const storedUser = localStorage.getItem('usuario');
        const initialUser = location.state?.usuario || (storedUser ? JSON.parse(storedUser) : null);
        if (initialUser) localStorage.setItem('usuario', JSON.stringify(initialUser));
        return initialUser;
    });

    const [vacantes, setVacantes] = useState([]);
    const [selectedVacante, setSelectedVacante] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState(null);

    // Redirección si la sesión no es válida
    useEffect(() => {
        if (!usuario || (usuario.rol !== 'estudiante' && usuario.rol !== 'persona')) {
            localStorage.removeItem('usuario');
            navigate('/');
        } else {
            setLoading(false);
        }
    }, [usuario, navigate]);

    // Cargar vacantes desde el backend
    useEffect(() => {
        if (!usuario) return;

        const fetchVacantes = async () => {
            try {
                const res = await axios.get(`${API_URL}/vacantes`);
                setVacantes(res.data);
                setError(null);
            } catch (err) {
                console.error("Error al cargar vacantes:", err);
                setError("Error al cargar las vacantes. Asegúrate de que tu backend esté corriendo.");
            }
        };

        fetchVacantes();
    }, [usuario]);

    // Manejar selección de vacante
    const handleSelectVacante = (vacante) => {
        setSelectedVacante(vacante);
    };

    // Manejar subida de CV
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            alert("Solo se permite subir archivos PDF.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB
            alert("El CV no puede superar los 5 MB.");
            return;
        }
        setPdfFile(file);
    };

    // Enviar postulación
    const handlePostular = async () => {
        if (!selectedVacante || !pdfFile) {
            alert("Selecciona una vacante y un archivo PDF."); 
            return;
        }
        if (!usuario) {
            alert("Error de autenticación. Por favor, inicia sesión.");
            navigate('/');
            return;
        }

        const formData = new FormData();
        formData.append('cv', pdfFile);
        formData.append('vacanteId', selectedVacante.id);
        formData.append('usuarioId', usuario.id);
        formData.append('telefono', usuario.telefono || 'N/A');

        try {
            setPosting(true);
            const res = await axios.post(`${API_URL}/postulaciones/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("✅ Postulación enviada con éxito!");
            setSelectedVacante(null);
            setPdfFile(null);
        } catch (err) {
            console.error("Error en la postulación:", err);
            const msg = err.response?.data?.error || err.message || "Error desconocido";
            alert(`❌ Ocurrió un error al enviar tu postulación: ${msg}`);
        } finally {
            setPosting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-gray-100 text-gray-700">Cargando dashboard...</div>;
    }
    
    if (error) {
        return <div className="flex justify-center items-center h-screen bg-red-100 text-red-700">Error: {error}</div>;
    }

    if (!usuario) return null;

    return (
        <div className="min-h-screen p-4 sm:p-8 bg-gray-100 font-sans">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-700 mb-6 border-b-4 border-indigo-300 pb-2">
                    Bienvenido, {usuario.nombres}!
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Vacantes */}
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

                    {/* Postulación */}
                    <div className="lg:col-span-1 sticky top-4 h-fit bg-white p-6 rounded-xl shadow-2xl border-t-4 border-emerald-500">
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
                                        ${pdfFile && selectedVacante && !posting
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                        }`}
                                    disabled={!pdfFile || !selectedVacante || posting}
                                >
                                    {posting ? "Enviando..." : "Enviar Postulación"}
                                </button>
                                <p className="text-xs text-gray-500 text-center pt-2">
                                    Asegúrate de que tu CV esté en formato PDF y no supere 5 MB.
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-md">
                                <p className="text-yellow-900">Por favor, selecciona una vacante de la lista para ver el formulario de postulación.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
