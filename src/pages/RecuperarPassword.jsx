import React, { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const RecuperarPassword = ({ volverAlLogin, emailPrellenado }) => { 
  const [email, setEmail] = useState(emailPrellenado || "");
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  const auth = getAuth();

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setMensaje({ texto: "Por favor, ingresa tu correo.", tipo: "error" });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMensaje({ 
        texto: "¡Correo enviado! Revisa tu bandeja de entrada.", 
        tipo: "exito" 
      });
    } catch (error) {
      console.error(error.code);
      if (error.code === 'auth/user-not-found') {
        setMensaje({ texto: "Este correo no está registrado.", tipo: "error" });
      } else {
        setMensaje({ texto: "Error al enviar el correo. Intenta de nuevo.", tipo: "error" });
      }
    }
  };

  return (
    <div style={estilos.contenedor}>
      <h2 style={estilos.titulo}>Restablecer Contraseña</h2>
      <p style={estilos.subtitulo}>Te enviaremos un enlace para que recuperes el acceso a tu cuenta.</p>
      
      <form onSubmit={handleReset}>
        <input 
          type="email" 
          placeholder="Tu correo electrónico" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={estilos.input}
        />
        
        {mensaje.texto && (
          <p style={{ ...estilos.mensaje, color: mensaje.tipo === "exito" ? "#4CAF50" : "#F44336" }}>
            {mensaje.texto}
          </p>
        )}

        <button type="submit" style={estilos.botonEnviar}>
          Enviar enlace
        </button>
      </form>

      <button onClick={volverAlLogin} style={estilos.botonVolver}>
        ← Volver al inicio de sesión
      </button>
    </div>
  );
};

// Estilos rápidos para que combine con tu UI verde/oscura
const estilos = {
  contenedor: { padding: '20px', textAlign: 'center', color: 'white' },
  titulo: { fontSize: '24px', marginBottom: '10px' },
  subtitulo: { fontSize: '14px', marginBottom: '20px', color: '#ccc' },
  input: { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '5px', border: 'none' },
  botonEnviar: { width: '100%', padding: '12px', backgroundColor: '#76b852', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  botonVolver: { marginTop: '20px', background: 'none', border: 'none', color: '#4a90e2', cursor: 'pointer', fontSize: '12px' },
  mensaje: { fontSize: '13px', marginBottom: '10px' }
};

export default RecuperarPassword;