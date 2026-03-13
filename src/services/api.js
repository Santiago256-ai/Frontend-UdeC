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

export default API;