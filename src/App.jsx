import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import API from "./services/api";

// --- NOTIFICACIONES TOAST (Configuración Global) ---
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- IMPORTACIÓN DE PÁGINAS ---
import Landing from "./pages/Landing";
import IniciarSesion from "./pages/IniciarSesion";
import RegistrarEgresado from './pages/RegistrarEgresado';
import RegistrarCompany from "./pages/RegistrarCompany";
import Home from "./pages/Home";
import Estudiante from "./pages/Estudiante";
import Vacantes from "./pages/Vacantes";
import VacantesDashboard from './pages/EgresadoDashboard/VacantesDashboard';
import EmpresaDashboard from './pages/EmpresaDashboard/EmpresaDashboard';
import Mensajeria from './pages/Mensajeria';
import CrearCV from './pages/CrearCV';
import Admin from "./components/Admin/Admin";
import ResetPassword from './pages/ResetPassword';

import "./App.css";

// --- COMPONENTE VIGILANTE DE NOTIFICACIONES ---
const NotificadorGlobal = () => {
  const [totalPendientesPrev, setTotalPendientesPrev] = useState(0);
  const audioRef = useRef(new Audio("/sounds/notification2.mp3"));
  const avisoMostradoRef = useRef(false);

  // 1. DESBLOQUEADOR DE AUDIO
  useEffect(() => {
    const desbloquear = () => {
      audioRef.current.play()
        .then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          if (!avisoMostradoRef.current) {
            console.log("🔔 Notificaciones de sonido activadas.");
            avisoMostradoRef.current = true;
          }
        })
        .catch(() => { /* Bloqueado por el navegador, esperar interacción */ });
    };

    document.addEventListener("click", desbloquear);
    document.addEventListener("keydown", desbloquear);
    
    return () => {
      document.removeEventListener("click", desbloquear);
      document.removeEventListener("keydown", desbloquear);
    };
  }, []);

  // 2. VIGILANTE DE MENSAJES (POLLING)
  useEffect(() => {
    const checkMensajes = async () => {
      try {
        const userStr = localStorage.getItem('usuario');
        if (!userStr) return;
        
        const usuario = JSON.parse(userStr);
        const idParaConsulta = usuario.empresaId || usuario.id;
        
        if (!idParaConsulta) return;

        const res = await API.get(`/mensajeria/mis-chats/empresa/${idParaConsulta}`);
        const totalActual = res.data.reduce((acc, chat) => acc + (chat.pendientes || 0), 0);

        if (totalActual > totalPendientesPrev) {
          audioRef.current.currentTime = 0; 
          audioRef.current.play().catch(() => {});
        }
        
        setTotalPendientesPrev(totalActual);
      } catch (err) {
        console.error("❌ Error en notificador:", err);
      }
    };

    const interval = setInterval(checkMensajes, 8000);
    checkMensajes(); 

    return () => clearInterval(interval);
  }, [totalPendientesPrev]); 

  return null;
};

// --- COMPONENTE PRINCIPAL APP ---
function App() {
    return (
        <Router>
            {/* Vigilante de sonido de mensajes */}
            <NotificadorGlobal /> 
            
            {/* 🟢 CONTENEDOR GLOBAL DE BURBUJAS (TOASTS) 
                Al estar aquí, cualquier componente hijo (como PerfilEmpresa) 
                podrá mostrar avisos elegantes sin error. */}
            <ToastContainer 
                position="bottom-right" 
                autoClose={3000} 
                hideProgressBar={false} 
                newestOnTop={false} 
                closeOnClick 
                rtl={false} 
                pauseOnFocusLoss 
                draggable 
                pauseOnHover 
                theme="colored" 
            />
            
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<IniciarSesion />} />
                <Route path="/registro-egresado" element={<RegistrarEgresado />} />
                <Route path="/register/company" element={<RegistrarCompany />} />
                <Route path="/home" element={<Home />} />
                <Route path="/estudiante" element={<Estudiante />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/crear-cv" element={<CrearCV />} />
                <Route path="/empresa-dashboard" element={<EmpresaDashboard />} /> 
                <Route path="/vacantes" element={<Vacantes />} />
                <Route path="/vacantes-dashboard" element={<VacantesDashboard />} />
                <Route path="/mensajeria/:empresaId" element={<Mensajeria />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
            </Routes>
        </Router>
    );
}

export default App;