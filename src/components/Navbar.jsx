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
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold tracking-wide">
          UdeC JobPortal
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/" className="hover:text-gray-200">Inicio</Link>
          <Link to="/vacantes" className="hover:text-gray-200">Vacantes</Link>

          {!token ? (
            <>
              <Link to="/login" className="hover:text-gray-200">Login</Link>
              <Link to="/register" className="hover:text-gray-200">Registro</Link>
            </>
          ) : (
            <>
              {user?.rol === "estudiante" && (
                <Link to="/estudiante" className="hover:text-gray-200">Mi Perfil</Link>
              )}
              {user?.rol === "empresa" && (
                <Link to="/empresa" className="hover:text-gray-200">Panel Empresa</Link>
              )}
              <button onClick={logout} className="bg-white text-blue-600 px-3 py-1 rounded">Cerrar sesión</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
