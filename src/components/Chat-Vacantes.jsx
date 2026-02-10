import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import API from '../services/api'; 

export default function Mensajeria({ empresaId, vacanteId, onClose }) {
    const [usuario] = useState(() => JSON.parse(localStorage.getItem('usuario')));
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const scrollRef = useRef();

    // ⚡ Carga mensajes filtrando por Usuario, Empresa Y Vacante
    const cargarMensajes = useCallback(async () => {
        if (!usuario?.id || !empresaId || !vacanteId) return;
        try {
            const { data } = await API.get(`/mensajeria/historial/${usuario.id}/${empresaId}/${vacanteId}`);            
            setMensajes(data);
        } catch (err) {
            console.error("Error al cargar chat:", err);
        }
    }, [usuario?.id, empresaId, vacanteId]); // ⚡ Dependencias corregidas

    // Efecto para limpieza y carga inicial al cambiar de vacante
    useEffect(() => {
        setMensajes([]); // Limpia el chat visualmente al cambiar de vacante
        cargarMensajes();
        
        const interval = setInterval(cargarMensajes, 4000);
        return () => clearInterval(interval);
    }, [cargarMensajes]);

    // Auto-scroll al final de la conversación
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes]);

    const handleEnviar = async (e) => {
        e.preventDefault();
        if (!nuevoMensaje.trim()) return;

        try {
            await API.post('/mensajeria/enviar', {
                contenido: nuevoMensaje,
                senderType: 'USUARIO',
                senderId: usuario.id,
                receiverId: parseInt(empresaId), // ⚡ Coma agregada aquí
                vacanteId: vacanteId             // ⚡ ID de vacante enviado correctamente
            });
            setNuevoMensaje("");
            cargarMensajes();
        } catch (err) {
            console.error("Error al enviar:", err);
            alert("No se pudo enviar el mensaje");
        }
    };

    return (
        <div className="fixed right-0 top-0 h-full w-full max-w-[400px] bg-white shadow-2xl z-[100] flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300">
            {/* Cabecera del Chat */}
            <div className="p-4 bg-[#4caf50] text-white flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-bold">Chat con Empresa</span>
                </div>
                <button 
                    onClick={onClose} 
                    className="hover:bg-black/10 p-1 rounded-full transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Cuerpo de Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {mensajes.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10 text-sm">
                        No hay mensajes en esta vacante aún.
                    </div>
                ) : (
                    mensajes.map((m) => (
                        <div 
                            key={m.id} 
                            className={`flex ${m.senderType === 'USUARIO' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                                m.senderType === 'USUARIO' 
                                    ? 'bg-[#4caf50] text-white rounded-tr-none' 
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                            }`}>
                                <p className="whitespace-pre-wrap">{m.contenido}</p>
                                <span className="text-[10px] block text-right mt-1 opacity-70">
                                    {new Date(m.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input de Mensaje */}
            <form onSubmit={handleEnviar} className="p-4 bg-white border-t flex items-center gap-2">
                <input 
                    type="text"
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
                <button 
                    type="submit" 
                    disabled={!nuevoMensaje.trim()}
                    className="bg-[#4caf50] text-white p-2 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}