import API from "./api";

// Lista de conversaciones de la empresa (cada una trae `pendientes`, los mensajes
// sin leer). La usan ChatSidebar (vista Mensajes) y el badge de "Mensajes" del
// menú de Empresa, para que ambos lean exactamente lo mismo.
export const obtenerMisChatsEmpresa = (empresaId) =>
    API.get(`/mensajeria/mis-chats/empresa/${empresaId}`);
