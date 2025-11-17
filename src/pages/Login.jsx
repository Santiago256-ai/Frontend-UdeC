// src/pages/Login.jsx
import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [cred, setCred] = useState({ correo: "", password: "" });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const change = e => setCred({ ...cred, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", cred);
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      // redirige según rol
      if (user.rol === "empresa") navigate("/empresa");
      else navigate("/estudiante");
    } catch (err) {
      setError(err.response?.data?.error || "Error en login");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-semibold mb-4">Iniciar sesión</h1>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <input name="correo" placeholder="Correo" value={cred.correo} onChange={change} className="w-full p-2 border rounded"/>
        <input name="password" type="password" placeholder="Contraseña" value={cred.password} onChange={change} className="w-full p-2 border rounded"/>
        <button className="w-full bg-blue-600 text-white p-2 rounded">Entrar</button>
      </form>
    </div>
  );
}
