import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ArrowLeft, Lock, MessageSquare } from 'lucide-react';
import API from '../services/api'; 
import { useNavigate, useParams } from 'react-router-dom';

export default function Mensajeria() {
    const navigate = useNavigate();
    // 💡 Ahora extraemos también vacanteId de la URL
    const { egresadoId: idDesdeUrl, empresaId, vacanteId } = useParams();

    const [usuario] = useState(() => JSON.parse(localStorage.getItem('usuario')));
    const eId = idDesdeUrl || usuario?.id;
    
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const [isChatActivo, setIsChatActivo] = useState(true); // 💡 Control de bloqueo
    const scrollRef = useRef();

    // 1. CARGAR MENSAJES Y ESTADO DE BLOQUEO
    const cargarMensajes = useCallback(async () => {
        if (!usuario?.id || !empresaId || !vacanteId) return;
        try {
            // 💡 Ruta actualizada con los 3 parámetros necesarios
            const { data } = await API.get(`/mensajeria/historial/${eId}/${empresaId}/${vacanteId}`);
            
            setMensajes(data.mensajes || []);
            // 💡 Sincronizamos si la empresa bloqueó el chat
            setIsChatActivo(data.chatActivo);
        } catch (err) {
            console.error("Error al cargar chat", err);
        }
    }, [empresaId, vacanteId, usuario?.id]);

    // 2. EFECTO PARA TIEMPO REAL
    useEffect(() => {
        cargarMensajes();
        const interval = setInterval(cargarMensajes, 3000);
        return () => clearInterval(interval);
    }, [cargarMensajes]);

    // 3. MARCAR COMO LEÍDOS
    useEffect(() => {
        const marcarLeidos = async () => {
            if (!usuario?.id || !empresaId) return;
            try {
                await API.put(`/mensajeria/leer/${usuario.id}/${empresaId}`);
            } catch (err) {
                console.error("Error al marcar leídos", err);
            }
        };
        marcarLeidos();
    }, [empresaId, usuario?.id]);

    // 4. AUTO-SCROLL (Corregido para suavidad)
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes]);

    // 5. ENVIAR MENSAJE
    const handleEnviar = async (e) => {
        e.preventDefault();
        
        if (!nuevoMensaje.trim() || !isChatActivo || !empresaId || !vacanteId) return;

        try {
            const payload = {
    contenido: nuevoMensaje.trim(),
    senderType: 'USUARIO',
    senderEgresadoId: usuario.id, // <--- Asegúrate de que diga senderEgresadoId
    receiverId: parseInt(empresaId),
    vacanteId: parseInt(vacanteId)
};
            
            const res = await API.post('/mensajeria/enviar', payload);
            setMensajes(prev => [...prev, res.data]);
            setNuevoMensaje(""); 
        } catch (err) {
            console.error("Error al enviar:", err.response?.data);
            alert("No se pudo enviar el mensaje.");
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc]">
            {/* Header Elegante Verde UdeC */}
            <div className="p-4 bg-[#006b3f] text-white flex items-center shadow-md">
                <button onClick={() => navigate(-1)} className="mr-4 hover:bg-black/10 p-2 rounded-full transition-all">
                    <ArrowLeft size={24} />
                </button>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3 font-bold border border-white/30">
                    {usuario?.nombres?.charAt(0) || 'E'}
                </div>
                <div>
                    <h2 className="font-bold text-lg leading-tight">Chat con Empresa</h2>
                    <span className="text-xs text-green-100 opacity-80">
                        {isChatActivo ? "● Chat habilitado" : "○ Chat finalizado"}
                    </span>
                </div>
            </div>

            {/* Contenedor de Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!isChatActivo && (
                    <div className="flex justify-center my-2">
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-sm">
                            <Lock size={14} /> La empresa ha cerrado esta conversación.
                        </div>
                    </div>
                )}

                {mensajes.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                        <MessageSquare size={48} strokeWidth={1} />
                        <p className="mt-2 text-sm">No hay mensajes aún.</p>
                    </div>
                )}
                
                {mensajes.map((m) => (
                    <div key={m.id} className={`flex ${m.senderType === 'USUARIO' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${
                            m.senderType === 'USUARIO' 
                            ? 'bg-[#006b3f] text-white rounded-tr-none' 
                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                        }`}>
                            <p className="text-sm leading-relaxed">{m.contenido}</p>
                            <span className={`text-[9px] block text-right mt-1 ${m.senderType === 'USUARIO' ? 'text-green-100' : 'text-gray-400'}`}>
                                {new Date(m.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Input de Texto */}
            <form onSubmit={handleEnviar} className="p-4 bg-white border-t flex items-center gap-3">
                <input 
                    type="text"
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    placeholder={isChatActivo ? "Escribe un mensaje..." : "Chat deshabilitado"}
                    disabled={!isChatActivo}
                    className="flex-1 border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006b3f] bg-gray-50 transition-all"
                />
                <button 
                    type="submit" 
                    disabled={!isChatActivo || !nuevoMensaje.trim()}
                    className={`p-3 rounded-full transition-all ${
                        nuevoMensaje.trim() && isChatActivo 
                        ? 'bg-[#006b3f] text-white shadow-lg hover:scale-110' 
                        : 'bg-gray-100 text-gray-400'
                    }`}
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
}