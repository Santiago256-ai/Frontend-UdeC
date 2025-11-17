import { useState, useRef } from "react";
import axios from "axios";

export default function Estudiante() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    programa: "",
    semestre: "",
  });
  const [cv, setCv] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null); // Ref para limpiar input file

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    setCv(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cv) {
      setMensaje("Por favor, selecciona tu hoja de vida en formato PDF.");
      return;
    }

    const data = new FormData();
    data.append("nombre", formData.nombre);
    data.append("correo", formData.correo);
    data.append("programa", formData.programa);
    data.append("semestre", formData.semestre);
    data.append("cv", cv);

    try {
      setLoading(true);
      setMensaje("");

      const response = await axios.post(
        "http://localhost:4000/api/postulaciones",
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.status === 201) {
        setMensaje("✅ Tu hoja de vida se ha enviado correctamente.");
        setFormData({ nombre: "", correo: "", programa: "", semestre: "" });
        setCv(null);

        // Limpiar input file visualmente
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setMensaje("❌ Error al enviar la información. Intenta de nuevo.");
      }
    } catch (error) {
      console.error("Error al enviar postulación:", error);
      const errorMsg =
        error.response?.data?.error ||
        "❌ Error al enviar la información. Intenta de nuevo.";
      setMensaje(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white shadow-lg p-6 rounded-2xl">
      <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">
        Subir Hoja de Vida
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium">Nombre completo</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium">Correo institucional</label>
          <input
            type="email"
            name="correo"
            value={formData.correo}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium">Programa académico</label>
          <input
            type="text"
            name="programa"
            value={formData.programa}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium">Semestre</label>
          <input
            type="number"
            name="semestre"
            value={formData.semestre}
            onChange={handleChange}
            min="1"
            max="10"
            required
            className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium">Hoja de vida (PDF)</label>
          <input
            type="file"
            accept=".pdf"
            ref={fileInputRef} // Asignar ref
            onChange={handleFileChange}
            required
            className="w-full border border-gray-300 rounded-md p-2 mt-1"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-md text-white transition duration-300 ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-900 hover:bg-blue-800"
          }`}
        >
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </form>

      {mensaje && (
        <p
          className={`mt-4 text-center font-medium ${
            mensaje.startsWith("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {mensaje}
        </p>
      )}
    </div>
  );
}
