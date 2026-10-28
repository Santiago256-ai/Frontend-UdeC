// src/services/api.js
import axios from "axios";
import { ACCESO_ADMIN_EXPIRADA, cerrarSesionAdmin, leerSesionAdmin } from "./sesionAdmin";

const URL_BASE = "https://backend-ude-c.vercel.app/api";

const API = axios.create({
  baseURL: URL_BASE,
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

// Cliente del panel de administración. Sólo envía el token de admin-sesion
// (sessionStorage) y nunca el de egresado o empresa; el cliente API de arriba
// nunca envía el de administrador. Un 401 de una petición que llevaba token
// (vencido, o { codigo: "sesion_invalida" } si la cuenta se desactivó) borra sólo
// admin-sesion y lleva a /admin/acceso con el aviso. En /auth/admin/login un 401
// son credenciales incorrectas: no actúa. Un 403 nunca redirige.
export const APIAdmin = axios.create({
  baseURL: URL_BASE,
});

APIAdmin.interceptors.request.use((config) => {
  const sesion = leerSesionAdmin();
  if (sesion) config.headers.Authorization = `Bearer ${sesion.token}`;
  return config;
});

let redirigiendoAdmin = false;

APIAdmin.interceptors.response.use((respuesta) => respuesta, (error) => {
  const config = error.config || {};
  if (
    error.response?.status === 401 &&
    Boolean(config.headers?.Authorization) &&
    !/^\/?auth\//.test(config.url || "") &&
    !redirigiendoAdmin
  ) {
    redirigiendoAdmin = true;
    cerrarSesionAdmin();
    window.location.assign(ACCESO_ADMIN_EXPIRADA);
  }
  return Promise.reject(error);
});

export default API;