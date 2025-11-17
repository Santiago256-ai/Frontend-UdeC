import React, { useState } from 'react';
import './RegistrarEstudiante.css';
import API from '../services/api'; // Ajusta la ruta si es necesario

export default function RegistrarEstudiante() {
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
    if (!formData.contraseña) {
      newErrors.contraseña = 'La contraseña es requerida';
    } else if (formData.contraseña.length < 6) {
      newErrors.contraseña = 'La contraseña debe tener al menos 6 caracteres';
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
        rol: formData.rol
      };

      try {
        // ✅ Llamada al backend usando Axios, sin doble /api
        const response = await API.post("/estudiantes/registro", dataToSend);

        console.log('Registro exitoso:', response.data);
        alert('¡Registro de estudiante exitoso!');

        // Limpiar formulario
        setFormData({
          nombres: '',
          apellidos: '',
          rol: 'estudiante',
          correo: '',
          usuario: '',
          contraseña: '',
          confirmarContraseña: ''
        });

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
          <h1 className="register-title">Registro de Estudiante</h1>
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
              <option value="profesor">Profesor</option>
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
                placeholder="Mínimo 6 caracteres"
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
        </form>

        <div className="register-footer">
          <p>¿Ya tienes una cuenta? <a href="/login" className="login-link">Iniciar Sesión</a></p>
        </div>
      </div>
    </div>
  );
}
