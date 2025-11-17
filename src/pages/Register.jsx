// src/pages/Register.jsx
import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [data, setData] = useState({ nombre: "", correo: "", password: "", rol: "estudiante" });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const onChange = e => setData({...data, [e.target.name]: e.target.value});

  const submit = async e => {
    e.preventDefault();
    try {
      await API.post("/auth/register", data);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Error registrando");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-semibold mb-4">Crear cuenta</h1>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <input name="nombre" placeholder="Nombre completo" value={data.nombre} onChange={onChange} className="w-full p-2 border rounded"/>
        <input name="correo" placeholder="Correo" value={data.correo} onChange={onChange} className="w-full p-2 border rounded"/>
        <input name="password" type="password" placeholder="Contraseña" value={data.password} onChange={onChange} className="w-full p-2 border rounded"/>
        <select name="rol" value={data.rol} onChange={onChange} className="w-full p-2 border rounded">
          <option value="estudiante">Estudiante/Egresado</option>
          <option value="empresa">Empresa</option>
        </select>
        <button className="w-full bg-blue-600 text-white p-2 rounded">Registrar</button>
      </form>
    </div>
  );
}
