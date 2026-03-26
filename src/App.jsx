import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import IniciarSesion from "./pages/IniciarSesion";
import RegistrarEgresado from './pages/RegistrarEgresado';
import RegistrarCompany from "./pages/RegistrarCompany"; // ✅ Importación correcta
import Home from "./pages/Home";
import Estudiante from "./pages/Estudiante";
import Empresa from "./pages/Empresa";
import Vacantes from "./pages/Vacantes";
import VacantesDashboard from './pages/EgresadoDashboard/VacantesDashboard';
import EmpresaDashboard from './pages/EmpresaDashboard/EmpresaDashboard';
import Mensajeria from './pages/Mensajeria';
import CrearCV from './pages/CrearCV';
import Admin from "./pages/Admin/Admin";
import ResetPassword from './pages/ResetPassword';

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Página principal: Landing */}
        <Route path="/" element={<Landing />} />

        {/* Páginas de autenticación */}
        <Route path="/login" element={<IniciarSesion />} />
        
        {/* Registro Egresado (Usa RegistrarEgresado.css encapsulado) */}
        <Route path="/registro-egresado" element={<RegistrarEgresado />} />
        
        {/* Registro Empresa (Usa el nuevo RegistrarCompany.module.css) */}
        <Route path="/register/company" element={<RegistrarCompany />} />

        {/* Rutas internas (solo accesibles después de login) */}
        <Route path="/home" element={<Home />} />
        <Route path="/estudiante" element={<Estudiante />} />
        <Route path="/admin" element={<Admin />} />
        
        {/* Hoja de Vida */}
        <Route path="/crear-cv" element={<CrearCV />} />
        
        {/* Dashboards y Gestión */}
        <Route path="/empresa-dashboard" element={<EmpresaDashboard />} /> 
        <Route path="/empresa" element={<Empresa />} />
        <Route path="/vacantes" element={<Vacantes />} />
        <Route path="/vacantes-dashboard" element={<VacantesDashboard />} />
        
        {/* Mensajería dinámica */}
        <Route path="/mensajeria/:empresaId" element={<Mensajeria />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;