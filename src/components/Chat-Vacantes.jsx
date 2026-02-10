import { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';
import API from '../services/api'; 

export default function Mensajeria({ empresaId, vacanteId, onClose }) {
    const [usuario] = useState(() => JSON.parse(localStorage.getItem('usuario')));
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const scrollRef = useRef();

    // 1. MARCAR COMO LEÍDOS (Lógica de tu primer componente)
    useEffect(() => {
        const marcarLeidos = async () => {
            if (!usuario?.id || !empresaId) return;
            try {
                await API.put(`/mensajeria/leer/${usuario.id}/${empresaId}`);
            } catch (err) {
                console.error("Error al marcar mensajes como leídos", err);
            }
        };
        marcarLeidos();
    }, [empresaId, usuario?.id]);

    // 2. FUNCIÓN PARA CARGAR MENSAJES (Integrando vacanteId)
    const cargarMensajes = async () => {
        if (!usuario?.id || !empresaId || !vacanteId) return;
        try {
            // Usamos la ruta completa con vacanteId como en tu segunda lógica
            const { data } = await API.get(`/mensajeria/historial/${usuario.id}/${empresaId}/${vacanteId}`);
            setMensajes(data || []);
        } catch (err) {
            console.error("Error al cargar historial:", err);
        }
    };

    // 3. EFECTO PARA TIEMPO REAL
    useEffect(() => {
        cargarMensajes(); // Carga inicial

        const interval = setInterval(() => {
            cargarMensajes();
        }, 3000); 

        return () => clearInterval(interval);
    }, [empresaId, vacanteId, usuario?.id]); 

    // 4. AUTO-SCROLL
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes]);

    // 5. ENVIAR MENSAJE
    const handleEnviar = async (e) => {
        e.preventDefault();
        if (!nuevoMensaje.trim()) return;

        const texto = nuevoMensaje.trim();

        try {
            const payload = {
                contenido: texto,
                senderType: 'USUARIO',
                senderId: usuario.id,
                receiverId: parseInt(empresaId),
                vacanteId: parseInt(vacanteId)
            };
            
            await API.post('/mensajeria/enviar', payload);
            setNuevoMensaje(""); // Limpiar solo si el envío es exitoso
            cargarMensajes(); // Recargar inmediatamente
        } catch (err) {
            console.error("Error al enviar:", err.response?.data || err.message);
            alert("No se pudo enviar el mensaje");
        }
    };

    return (
        <div className="fixed right-5 bottom-5 w-[380px] h-[500px] bg-white shadow-2xl rounded-t-2xl flex flex-col border border-gray-200 z-[9999]">
            {/* Header del Modal */}
            <div className="p-4 bg-indigo-600 text-white rounded-t-2xl flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    <div>
                        <h2 className="font-bold text-sm">Chat de la Vacante</h2>
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <span className="text-[10px] text-indigo-100">Activo ahora</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="hover:bg-indigo-700 p-1 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Cuerpo del Chat (Estilo WhatsApp) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5]">
                {mensajes.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10 bg-white/50 p-3 rounded-lg text-xs">
                        Inicia una conversación con la empresa.
                    </div>
                ) : (
                    mensajes.map((m) => (
                        <div 
                            key={m.id} 
                            className={`flex ${m.senderType === 'USUARIO' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] p-3 rounded-xl shadow-sm ${
                                m.senderType === 'USUARIO' 
                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                : 'bg-white text-gray-800 rounded-tl-none'
                            }`}>
                                <p className="text-sm leading-relaxed">{m.contenido}</p>
                                <span className={`text-[10px] block text-right mt-1 opacity-70`}>
                                    {m.fechaEnvio ? new Date(m.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input de Texto */}
            <form onSubmit={handleEnviar} className="p-3 bg-white border-t flex items-center gap-2">
                <input 
                    type="text"
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    placeholder="Escribe tu duda..."
                    className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black outline-none"
                />
                <button 
                    type="submit" 
                    disabled={!nuevoMensaje.trim()}
                    className={`p-2 rounded-full transition-all ${
                        nuevoMensaje.trim() ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
                    }`}
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}