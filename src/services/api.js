// src/services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api", // cambia si tu backend corre en otro puerto/URL
});

// Interceptor para agregar token automáticamente
API.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
