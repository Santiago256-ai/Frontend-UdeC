import { useState, useEffect, useRef } from 'react';
import { Send, User, ArrowLeft } from 'lucide-react';
import API from '../services/api'; 
import { useNavigate, useParams } from 'react-router-dom'; // 👈 Añade useParams

export default function Mensajeria() {
    const navigate = useNavigate();
    const { empresaId } = useParams(); // 👈 Captura el ID de la URL (/mensajeria/45)
    const [usuario] = useState(JSON.parse(localStorage.getItem('usuario')));
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const scrollRef = useRef();

    // 1. FUNCIÓN PARA CARGAR MENSAJES
    const cargarMensajes = async () => {
        if (!usuario || !empresaId) return;
        try {
            // Usamos los IDs reales en la URL del backend
            const { data } = await API.get(`/mensajeria/historial/${usuario.id}/${empresaId}`);
            setMensajes(data);
        } catch (err) {
            console.error("Error al cargar chat", err);
        }
    };

    // 2. EFECTO PARA TIEMPO REAL
    useEffect(() => {
        cargarMensajes();
        const interval = setInterval(cargarMensajes, 3000); 
        return () => clearInterval(interval);
    }, [empresaId]); // 👈 Se reinicia si cambias de chat

    // 3. AUTO-SCROLL
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes]);

    // 4. ENVIAR MENSAJE
    const handleEnviar = async (e) => {
        e.preventDefault();
        if (!nuevoMensaje.trim()) return;

        try {
            const payload = {
                contenido: nuevoMensaje,
                senderType: 'USUARIO',
                senderId: usuario.id,
                // IMPORTANTE: En tu lógica de Prisma, el receptor de la notificación
                // suele ser el usuario, pero aquí el mensaje va hacia la empresa.
                // Ajustamos el receiverId para que el backend sepa quién es el destino.
                receiverId: usuario.id, 
                empresaDestinoId: parseInt(empresaId) // Dato extra para el backend
            };
            
            await API.post('/mensajeria/enviar', payload);
            setNuevoMensaje("");
            cargarMensajes(); 
        } catch (err) {
            alert("No se pudo enviar el mensaje");
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Header del Chat */}
            <div className="p-4 bg-indigo-600 text-white flex items-center shadow-lg">
                <button onClick={() => navigate('/vacantes-dashboard')} className="mr-4 hover:bg-indigo-700 p-1 rounded">
                    <ArrowLeft />
                </button>
                <div className="w-10 h-10 bg-indigo-400 rounded-full flex items-center justify-center mr-3 text-white font-bold">
                    {/* Podrías poner la inicial de la empresa aquí */}
                    E
                </div>
                <div>
                    <h2 className="font-bold text-lg">Chat de Soporte / Empresa</h2>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span className="text-xs text-indigo-100">Activo ahora</span>
                    </div>
                </div>
            </div>

            {/* Contenedor de Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5] dark:bg-gray-900">
                {mensajes.length === 0 && (
                    <div className="text-center text-gray-500 mt-10 bg-white/50 p-4 rounded-lg">
                        Inicia una conversación con la empresa sobre esta vacante.
                    </div>
                )}
                
                {mensajes.map((m) => (
                    <div 
                        key={m.id} 
                        className={`flex ${m.senderType === 'USUARIO' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[80%] p-3 rounded-xl shadow-md ${
                            m.senderType === 'USUARIO' 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white text-gray-800 rounded-tl-none'
                        }`}>
                            <p className="text-sm leading-relaxed">{m.contenido}</p>
                            <span className={`text-[10px] block text-right mt-1 ${m.senderType === 'USUARIO' ? 'text-indigo-200' : 'text-gray-400'}`}>
                                {new Date(m.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Input de Texto */}
            <form onSubmit={handleEnviar} className="p-4 bg-white border-t flex items-center gap-2">
                <input 
                    type="text"
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    placeholder="Escribe tu duda sobre la vacante..."
                    className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                />
                <button 
                    type="submit" 
                    disabled={!nuevoMensaje.trim()}
                    className={`p-3 rounded-full transition-all shadow-md ${
                        nuevoMensaje.trim() ? 'bg-indigo-600 text-white hover:scale-110' : 'bg-gray-200 text-gray-400'
                    }`}
                >
                    <Send className="w-6 h-6" />
                </button>
            </form>
        </div>
    );
}