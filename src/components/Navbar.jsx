// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

return (
    <nav className="w-full bg-[#0077cc] text-white shadow-lg sticky top-0 z-50">
      {/* max-w-full para que no se vea cortado en Vercel */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-extrabold tracking-tighter hover:opacity-90 transition-opacity">
          UdeC JobPortal
        </Link>

        <div className="flex items-center gap-8 font-medium">
          <Link to="/" className="hover:text-blue-200 transition-colors">Inicio</Link>
          <Link to="/vacantes-dashboard" className="hover:text-blue-200 transition-colors">Vacantes</Link>

          {!token ? (
            <div className="flex gap-4">
              <Link to="/login" className="hover:text-blue-200">Login</Link>
              <Link to="/register/student" className="bg-white text-[#0077cc] px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-all">
                Registro
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {user?.rol === "estudiante" && (
                <Link to="/estudiante" className="bg-blue-500/30 px-3 py-1 rounded-md hover:bg-blue-500/50">Mi Perfil</Link>
              )}
              {user?.rol === "empresa" && (
                <Link to="/empresa-dashboard" className="bg-blue-500/30 px-3 py-1 rounded-md hover:bg-blue-500/50">Panel Empresa</Link>
              )}
              <button 
                onClick={logout} 
                className="ml-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-transform active:scale-95 shadow-md"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
