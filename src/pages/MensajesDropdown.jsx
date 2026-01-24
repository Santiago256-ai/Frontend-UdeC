import { useState, useEffect } from 'react';
import { User, MessageSquare } from 'lucide-react';
import API from '../services/api';

export default function MensajesDropdown({ usuarioId, onSeleccionarChat }) {
    const [conversaciones, setConversaciones] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const fetchConversaciones = async () => {
            try {
                // Endpoint que creamos antes para ver con quién hay chats
                const { data } = await API.get(`/mensajeria/contadores/${usuarioId}`);
                // Aquí podrías llamar a un endpoint que traiga los últimos mensajes resumidos
                setConversaciones(data.ultimosMensajes || []);
            } catch (err) {
                console.error("Error al cargar previas", err);
            } finally {
                setCargando(false);
            }
        };
        fetchConversaciones();
    }, [usuarioId]);

    return (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
            <div className="p-3 border-b bg-gray-50 font-bold text-gray-700">
                Mensajes Recientes
            </div>
            <div className="max-h-96 overflow-y-auto">
                {conversaciones.length > 0 ? (
                    conversaciones.map((chat) => (
                        <div 
                            key={chat.id}
                            onClick={() => onSeleccionarChat(chat.empresaId)}
                            className="p-3 flex items-center hover:bg-indigo-50 cursor-pointer border-b last:border-0 transition"
                        >
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                <User className="text-indigo-600 w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800">{chat.nombreEmpresa}</p>
                                <p className="text-xs text-gray-500 truncate">{chat.ultimoTexto}</p>
                            </div>
                            {chat.noLeido && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                        </div>
                    ))
                ) : (
                    <div className="p-6 text-center text-gray-400 text-sm">
                        No tienes mensajes pendientes
                    </div>
                )}
            </div>
            <div className="p-2 border-t text-center bg-gray-50">
                <button className="text-xs text-indigo-600 font-bold hover:underline">Ver todos los mensajes</button>
            </div>
        </div>
    );
}