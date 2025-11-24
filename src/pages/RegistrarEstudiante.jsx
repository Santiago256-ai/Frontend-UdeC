import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 Se añadió para navegación
import './RegistrarEstudiante.css';
import API from '../services/api'; // Ajusta la ruta si es necesario

export default function RegistrarEstudiante() {
  const navigate = useNavigate(); // Inicializar useNavigate

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    rol: 'estudiante',
    correo: '',
    usuario: '',
    contraseña: '',
    confirmarContraseña: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 1. Redirecciona a la ruta de Landing.jsx
  const handleGoBack = () => {
    navigate('/'); // Asume que Landing.jsx es la ruta '/'
  };

  // 2. Redirecciona a la ruta de AuthModal
  const handleLoginRedirect = (e) => {
    e.preventDefault();
    // Se asume que AuthModal es la página de Login
    navigate('/'); // O la ruta que uses para AuthModal/Login
  };

  // Función de validación de contraseña fuerte
  const validatePasswordStrength = (password) => {
    // 3. Expresión regular: 8+ caracteres, 1+ minúscula, 1+ mayúscula, 1+ número, 1+ caracter especial
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+~`|}{[\]:;"'<,>.?/])[A-Za-z\d!@#$%^&*()_+~`|}{[\]:;"'<,>.?/]{8,}$/;
    
    return passwordRegex.test(password);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombres.trim()) newErrors.nombres = 'Los nombres son requeridos';
    if (!formData.apellidos.trim()) newErrors.apellidos = 'Los apellidos son requeridos';
    
    if (!formData.correo.trim()) {
      newErrors.correo = 'El correo es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.correo)) {
      newErrors.correo = 'El correo no es válido';
    }
    
    if (!formData.usuario.trim()) newErrors.usuario = 'El usuario es requerido';
    
    // 3. Nueva validación de contraseña fuerte
    if (!formData.contraseña) {
      newErrors.contraseña = 'La contraseña es requerida';
    } else if (!validatePasswordStrength(formData.contraseña)) {
      newErrors.contraseña = 'Mín. 8 caracteres: mayúscula, minúscula, número y un caracter especial';
    }

    if (formData.contraseña !== formData.confirmarContraseña) {
      newErrors.confirmarContraseña = 'Las contraseñas no coinciden';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      setErrors({});
      setLoading(true);

      const dataToSend = { 
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        correo: formData.correo,
        usuario: formData.usuario,
        contraseña: formData.contraseña,
        // 4. El rol se envía (incluido 'egresado')
        rol: formData.rol 
      };

      try {
        // ✅ Volviendo a la ruta que sabes que funciona en tu backend
        const response = await API.post("/estudiantes/registro", dataToSend);

        console.log('Registro exitoso:', response.data);
        alert('¡Registro exitoso!');

        // Redireccionar al login después de registro exitoso (como solicitaste)
        navigate('/'); 

      } catch (error) {
        console.error('Error de backend o conexión:', error);

        if (error.response && error.response.data) {
          alert(`Fallo el registro: ${error.response.data.error || 'Error desconocido del servidor'}`);
        } else {
          alert('Error de conexión. Revisa tu backend.');
        }
      } finally {
        setLoading(false);
      }

    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1 className="register-title">Registro de Usuario</h1>
          <p className="register-subtitle">Complete sus datos para crear su cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombres" className="form-label">Nombres *</label>
              <input
                type="text"
                id="nombres"
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                className={`form-input ${errors.nombres ? 'error' : ''}`}
                placeholder="Ingrese sus nombres"
                disabled={loading}
              />
              {errors.nombres && <span className="error-message">{errors.nombres}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="apellidos" className="form-label">Apellidos *</label>
              <input
                type="text"
                id="apellidos"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                className={`form-input ${errors.apellidos ? 'error' : ''}`}
                placeholder="Ingrese sus apellidos"
                disabled={loading}
              />
              {errors.apellidos && <span className="error-message">{errors.apellidos}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="rol" className="form-label">Rol</label>
            <select
              id="rol"
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              className="form-input"
              disabled={loading}
            >
              <option value="estudiante">Estudiante</option>
              <option value="egresado">Egresado</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="correo" className="form-label">Correo Electrónico *</label>
            <input
              type="email"
              id="correo"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              className={`form-input ${errors.correo ? 'error' : ''}`}
              placeholder="ejemplo@correo.com"
              disabled={loading}
            />
            {errors.correo && <span className="error-message">{errors.correo}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="usuario" className="form-label">Usuario *</label>
            <input
              type="text"
              id="usuario"
              name="usuario"
              value={formData.usuario}
              onChange={handleChange}
              className={`form-input ${errors.usuario ? 'error' : ''}`}
              placeholder="Ingrese su nombre de usuario"
              disabled={loading}
            />
            {errors.usuario && <span className="error-message">{errors.usuario}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contraseña" className="form-label">Contraseña *</label>
              <input
                type="password"
                id="contraseña"
                name="contraseña"
                value={formData.contraseña}
                onChange={handleChange}
                className={`form-input ${errors.contraseña ? 'error' : ''}`}
                placeholder="Mín. 8 caracteres, letras, números, especial"
                disabled={loading}
              />
              {errors.contraseña && <span className="error-message">{errors.contraseña}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmarContraseña" className="form-label">Confirmar Contraseña *</label>
              <input
                type="password"
                id="confirmarContraseña"
                name="confirmarContraseña"
                value={formData.confirmarContraseña}
                onChange={handleChange}
                className={`form-input ${errors.confirmarContraseña ? 'error' : ''}`}
                placeholder="Repita su contraseña"
                disabled={loading}
              />
              {errors.confirmarContraseña && <span className="error-message">{errors.confirmarContraseña}</span>}
            </div>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Registrando...' : 'Crear Cuenta'} 
          </button>
          
          {/* Botón Regresar con estilo submit-button */}
          <button 
            type="button" 
            onClick={handleGoBack} 
            className="submit-button secondary-button" 
            disabled={loading}
          >
            Regresar
          </button>
        </form>

        <div className="register-footer">
          <p>
            ¿Ya tienes una cuenta? 
            {/* Enlace para redireccionar al AuthModal */}
            <a 
              href="/" 
              onClick={handleLoginRedirect} 
              className="login-link"
            >
              Iniciar Sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}