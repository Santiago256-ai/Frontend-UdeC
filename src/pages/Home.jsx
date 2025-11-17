import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const vacantes = [
    { id: 1, titulo: "Desarrollador Web Junior", empresa: "Empresa X", modalidad: "Remota" },
    { id: 2, titulo: "Analista de Datos", empresa: "Empresa Y", modalidad: "Presencial" },
    { id: 3, titulo: "Practicante en Sistemas", empresa: "Empresa Z", modalidad: "Mixta" },
    { id: 4, titulo: "Ingeniero de Software", empresa: "Empresa A", modalidad: "Remota" },
  ];

  const handleLogout = () => {
    // Aquí podrías limpiar datos de sesión si los tuvieras
    navigate("/"); // Redirige a la Landing
  };

  return (
    <div className="min-h-screen bg-olive-700 text-white flex flex-col">
      {/* Barra superior */}
      <header className="fixed top-0 left-0 w-full bg-olive-800 shadow-md p-4 flex justify-between items-center z-10">
        <h1 className="text-2xl font-bold">Portal de Empleo UdeC</h1>
        <nav className="space-x-6">
          <a href="#" className="hover:text-gray-300 transition-colors">Inicio</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Mi Perfil</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Vacantes</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Empresas</a>
          <button
            onClick={handleLogout}
            className="hover:text-gray-300 transition-colors font-semibold"
          >
            Cerrar Sesión
          </button>
        </nav>
      </header>

      {/* Contenedor principal */}
      <div className="flex flex-1 pt-24 px-6 gap-6">
        {/* Sidebar izquierda */}
        <aside className="w-1/4 bg-olive-800 rounded-lg p-4 flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-gray-300 mb-2"></div>
          <h2 className="text-xl font-semibold">Nombre Estudiante</h2>
          <p className="text-gray-200">Ingeniería de Sistemas</p>
          <p className="text-gray-200">7° Semestre</p>
          <button className="w-full bg-olive-600 hover:bg-olive-500 transition-colors px-4 py-2 rounded font-semibold">
            Editar Perfil
          </button>

          <div className="w-full mt-6">
            <h3 className="text-lg font-semibold mb-2">Mi Red</h3>
            <ul className="text-gray-200 space-y-1">
              <li>Conexiones: 34</li>
              <li>Mensajes: 5</li>
              <li>Notificaciones: 3</li>
            </ul>
          </div>
        </aside>

        {/* Feed central */}
        <main className="flex-1 flex flex-col gap-6 overflow-y-auto max-h-[80vh] pr-2">
          <div className="bg-olive-800 rounded-lg p-6 shadow hover:shadow-lg transition-shadow">
            <h3 className="font-semibold text-xl mb-2">Sube tu hoja de vida</h3>
            <p className="text-gray-200 mb-4">
              Mantén tu CV actualizado y postúlate a vacantes disponibles en la Universidad de Cundinamarca.
            </p>
            <button className="bg-olive-600 hover:bg-olive-500 transition-colors px-5 py-2 rounded font-semibold">
              Subir CV
            </button>
          </div>

          {vacantes.map((vacante) => (
            <div
              key={vacante.id}
              className="bg-olive-800 p-4 rounded shadow hover:shadow-lg transition-shadow flex flex-col gap-2"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-lg">{vacante.titulo}</h4>
                <span className="text-gray-300 text-sm">{vacante.modalidad}</span>
              </div>
              <p className="text-gray-200">{vacante.empresa}</p>
              <button className="self-start bg-olive-600 hover:bg-olive-500 transition-colors px-4 py-2 rounded font-semibold">
                Postular
              </button>
            </div>
          ))}
        </main>

        {/* Sidebar derecha */}
        <aside className="w-1/4 bg-olive-800 rounded-lg p-4 flex flex-col gap-4">
          <h2 className="text-xl font-semibold mb-2">Sugerencias</h2>
          <div className="bg-olive-700 p-3 rounded hover:bg-olive-600 transition-colors cursor-pointer">
            <p className="text-gray-200">Conéctate con más estudiantes</p>
          </div>
          <div className="bg-olive-700 p-3 rounded hover:bg-olive-600 transition-colors cursor-pointer">
            <p className="text-gray-200">Explora empresas</p>
          </div>
          <div className="bg-olive-700 p-3 rounded hover:bg-olive-600 transition-colors cursor-pointer">
            <p className="text-gray-200">Ver recomendaciones de empleo</p>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Top Empresas</h3>
            <ul className="text-gray-200 space-y-1">
              <li>Empresa X</li>
              <li>Empresa Y</li>
              <li>Empresa Z</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
