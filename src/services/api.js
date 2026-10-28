// src/services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "https://backend-ude-c.vercel.app/api",
});

// Interceptor para agregar token automáticamente
API.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  
  // Solo agregamos el header si el token existe y no es la cadena "null"
  if (token && token !== "null" && token !== "undefined") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Sesión vencida: un 401 de una petición que llevaba token significa que el
// token ya no vale (vencido o inválido). Se borran sólo la sesión (token y
// usuario) y se vuelve a la landing, que muestra "Tu sesión expiró, vuelve a
// entrar.". Un 403 nunca redirige: el servidor lo usa para "no eres la dueña"
// y para las peticiones sin token.
const ENDPOINTS_PUBLICOS = /^\/?(auth\/|estudiantes\/login\b)/; // ahí un 401 es "credenciales incorrectas"
const PANTALLAS_PUBLICAS = /^\/(login|registro-egresado|register\/company|reset-password\/.*)?$/;
export const AVISO_SESION_EXPIRADA = "/?motivo=expirada";
let redirigiendo = false;

API.interceptors.response.use((respuesta) => respuesta, (error) => {
  const config = error.config || {};
  const llevabaToken = Boolean(config.headers?.Authorization);
  if (
    error.response?.status === 401 &&
    llevabaToken &&
    !ENDPOINTS_PUBLICOS.test(config.url || "") &&
    !PANTALLAS_PUBLICAS.test(window.location.pathname) &&
    !redirigiendo
  ) {
    redirigiendo = true; // varias peticiones pueden fallar a la vez (sondeos): una sola salida
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    // Recarga completa: no queda estado de la sesión en memoria.
    window.location.assign(AVISO_SESION_EXPIRADA);
  }
  return Promise.reject(error);
});

export default API;