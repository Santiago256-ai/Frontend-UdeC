import { useState, useEffect } from 'react';
import { User, MessageSquare, Bell } from 'lucide-react';
import API from '../services/api';

export default function MensajesDropdown({ usuarioId, onSeleccionarChat }) {
    const [conversaciones, setConversaciones] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const fetchConversaciones = async () => {
            if (!usuarioId) return;
            try {
                // 💡 Usamos el endpoint que ya devuelve las conversaciones formateadas
                const { data } = await API.get(`/mensajeria/mis-conversaciones/${usuarioId}`);
                // Solo mostramos las 5 más recientes para el dropdown
                setConversaciones(data.slice(0, 5) || []);
            } catch (err) {
                console.error("Error al cargar notificaciones de mensajes", err);
            } finally {
                setCargando(false);
            }
        };
        fetchConversaciones();
    }, [usuarioId]);

    return (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
            {/* Header del Dropdown */}
            <div className="p-4 border-b bg-[#f8fafc] flex justify-between items-center">
                <span className="font-extrabold text-sm text-[#1e293b] uppercase tracking-wider">
                    Mensajes Recientes
                </span>
                <span className="bg-[#006b3f] text-white text-[10px] px-2 py-0.5 rounded-full">
                    Nuevos
                </span>
            </div>

            {/* Lista de Conversaciones */}
            <div className="max-h-80 overflow-y-auto">
                {cargando ? (
                    <div className="p-6 text-center text-gray-400 text-xs italic">Cargando mensajes...</div>
                ) : conversaciones.length > 0 ? (
                    conversaciones.map((chat) => (
                        <div 
                            key={`${chat.vacanteId}-${chat.empresaId}`}
                            onClick={() => onSeleccionarChat(chat)}
                            className="p-4 flex items-center hover:bg-[#f0fdf4] cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                        >
                            {/* Avatar con inicial */}
                            <div className="w-10 h-10 bg-[#e8f5e9] rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                <span className="text-[#006b3f] font-bold text-sm">
                                    {chat.nombreEmpresa?.charAt(0)}
                                </span>
                            </div>

                            {/* Info del mensaje */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-[#1e293b] truncate">
                                    {chat.nombreEmpresa}
                                </p>
                                <p className="text-[11px] text-[#006b3f] font-medium truncate mb-0.5">
                                    {chat.tituloVacante}
                                </p>
                                <p className="text-xs text-gray-500 truncate italic">
                                    "{chat.ultimoMensaje}"
                                </p>
                            </div>

                            {/* Punto indicador (siempre elegante) */}
                            <div className="ml-2 w-2 h-2 bg-[#006b3f] rounded-full opacity-40"></div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center flex flex-col items-center gap-2">
                        <MessageSquare className="text-gray-200" size={32} />
                        <p className="text-gray-400 text-xs">No tienes mensajes pendientes</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t text-center bg-[#f8fafc]">
                <button 
                    onClick={() => onSeleccionarChat('VER_TODOS')}
                    className="text-xs text-[#006b3f] font-bold hover:underline"
                >
                    Ver todas las conversaciones
                </button>
            </div>
        </div>
    );
}