import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import IniciarSesion from "./pages/IniciarSesion";
import RegistrarEstudiante from "./pages/RegistrarEstudiante";
import RegistrarEmpresa from "./pages/RegistrarEmpresa";
import Home from "./pages/Home";
import Estudiante from "./pages/Estudiante";
import Empresa from "./pages/Empresa";
import Vacantes from "./pages/Vacantes";
import VacantesDashboard from './pages/EgresadoDashboard/VacantesDashboard';
import EmpresaDashboard from './pages/EmpresaDashboard/EmpresaDashboard';
import Mensajeria from './pages/Mensajeria';
import CrearCV from './pages/CrearCV';
import Admin from "./pages/Admin/Admin";

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Página principal: Landing */}
        <Route path="/" element={<Landing />} />

        {/* Páginas de autenticación */}
        <Route path="/login" element={<IniciarSesion />} />
        <Route path="/register/student" element={<RegistrarEstudiante />} />
        <Route path="/register/company" element={<RegistrarEmpresa />} />

        {/* Rutas internas (solo accesibles después de login) */}
        <Route path="/home" element={<Home />} />
        <Route path="/estudiante" element={<Estudiante />} />
<Route path="/admin" element={<Admin />} />
{/* ✅ NUEVA RUTA PARA LA HOJA DE VIDA */}
        <Route path="/crear-cv" element={<CrearCV />} />
        {/* ✅ RUTA AÑADIDA: Coincide con la redirección de AuthModal.jsx */}
        <Route path="/empresa-dashboard" element={<EmpresaDashboard />} /> 
        {/* ------------------------------------------------------------- */}
        <Route path="/empresa" element={<Empresa />} />
        <Route path="/vacantes" element={<Vacantes />} />
        <Route path="/vacantes-dashboard" element={<VacantesDashboard />} />
<Route path="/mensajeria/:empresaId" element={<Mensajeria />} />
      </Routes>
    </Router>
  );
}

export default App;