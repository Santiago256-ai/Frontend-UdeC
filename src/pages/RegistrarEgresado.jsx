import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api'; 
// 🟢 IMPORTANTE: Importamos como CSS Module
import styles from './RegistrarEgresado.module.css'; 

const programasPorFacultad = {
  "FACULTAD DE CIENCIAS ADMINISTRATIVAS, ECONÓMICAS Y CONTABLES": [
    "Administración de Empresas",
    "Contaduría Pública"
  ],
  "FACULTAD DE CIENCIAS AGROPECUARIAS": [
    "Ingeniería Agronómica",
    "Ingeniería Ambiental",
    "Ingeniería Topográfica y Geomática",
    "Medicina Veterinaria y Zootecnia",
    "Zootecnia Fusagasugá",
    "Zootecnia Ubaté"
  ],
  "FACULTAD DE CIENCIAS DEL DEPORTE Y LA EDUCACIÓN FÍSICA": [
    "Profesional en Ciencias del Deporte",
    "Licenciatura en Educación Física, Recreación y Deportes"
  ],
  "FACULTAD DE EDUCACIÓN": [
    "Licenciatura en Ciencias Sociales"
  ],
  "FACULTAD DE INGENIERÍA": [
    "Ingeniería Electrónica",
    "Ingeniería Industrial",
    "Ingeniería de Sistemas y Computación",
    "Ingeniería de Software",
    "Ingeniería Mecatrónica"
  ],
  "FACULTAD DE CIENCIAS DE LA SALUD": [
    "Enfermería",
    "Psicología"
  ],
  "FACULTAD DE CIENCIAS SOCIALES, HUMANIDADES Y CIENCIAS POLÍTICAS": [
    "Música"
  ]
};

export default function RegistrarEgresado() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    facultad: '',
    programa: '',
    correo: '',
    celular: '',
    contraseña: '',
    confirmarContraseña: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'celular') {
      if (value !== '' && !/^[0-9]+$/.test(value)) return; 
      if (value.length > 10) return;
    }

    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'facultad') newData.programa = '';
      return newData;
    });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePasswordStrength = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+~`|}{[\]:;"'<,>.?/])[A-Za-z\d!@#$%^&*()_+~`|}{[\]:;"'<,>.?/]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombres.trim()) newErrors.nombres = 'Nombres requeridos';
    if (!formData.apellidos.trim()) newErrors.apellidos = 'Apellidos requeridos';
    if (!formData.facultad) newErrors.facultad = 'Debe seleccionar una facultad';
    if (!formData.programa) newErrors.programa = 'Debe seleccionar un programa';
    if (!formData.celular.trim()) newErrors.celular = 'Celular requerido';
    if (!formData.correo.trim() || !/\S+@\S+\.\S+/.test(formData.correo)) newErrors.correo = 'Correo inválido';
    if (!formData.contraseña || !validatePasswordStrength(formData.contraseña)) {
      newErrors.contraseña = 'Contraseña débil (8+ carac, Mayús, Núm, Especial)';
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
        password: formData.contraseña,
        facultad: formData.facultad,
        programa: formData.programa,
        celular: formData.celular
      };

      try {
        await API.post("/auth/register", dataToSend); 
        alert('¡Registro de egresado exitoso!');
        navigate('/'); 
      } catch (error) {
        alert(error.response?.data?.error || 'Error al conectar');
      } finally {
        setLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className={styles['udec-register-container']}>
      <div className={styles['udec-register-card']}>
        
        <div className={styles['udec-register-header']}>
          <div className={styles['header-top-white']}>
            <div className={styles['header-logo-section']}>
              <img src="/Logo.png" alt="UdeC Logo" className={styles['udec-logo-img']} />
            </div>
            <div className={styles['header-divider']}></div>
            <div className={styles['header-portal-info']}>
              <img src="/UdeC2.png" alt="UdeC Logo" className={styles['udec-logo-small']} />
            </div>
          </div>

          <div className={styles['header-bottom-green']}>
            <h1 className={styles['register-title']}>Registro de Egresados</h1>
            <p className={styles['register-subtitle']}>Impulsa tu carrera profesional conectando hoy mismo con las mejores ofertas laborales.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles['udec-register-form']}>
          <div className={styles['form-row']}>
            <div className={`${styles['form-group']} ${styles['half-width']}`}>
              <label>Nombre</label>
              <input type="text" name="nombres" value={formData.nombres} onChange={handleChange} placeholder="Ingrese sus nombres completos" className={errors.nombres ? styles.error : ''} disabled={loading} />
              {errors.nombres && <span className={styles['error-message']}>{errors.nombres}</span>}
            </div>
            <div className={`${styles['form-group']} ${styles['half-width']}`}>
              <label>Apellidos</label>
              <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} placeholder="Ingrese sus apellidos completos" className={errors.apellidos ? styles.error : ''} disabled={loading} />
              {errors.apellidos && <span className={styles['error-message']}>{errors.apellidos}</span>}
            </div>
          </div>

          <div className={styles['form-row']}>
            <div className={`${styles['form-group']} ${styles['half-width']}`}>
              <label>Facultad</label>
              <select 
                name="facultad" 
                value={formData.facultad} 
                onChange={handleChange} 
                disabled={loading}
                className={errors.facultad ? styles.error : ''}
              >
                <option value="" disabled hidden>Seleccione su facultad...</option>
                <option value="FACULTAD DE CIENCIAS ADMINISTRATIVAS, ECONÓMICAS Y CONTABLES">Facultad de Ciencias Administrativas, Económicas y Contables</option>
                <option value="FACULTAD DE CIENCIAS AGROPECUARIAS">Facultad de Ciencias Agropecuarias</option>
                <option value="FACULTAD DE CIENCIAS DEL DEPORTE Y LA EDUCACIÓN FÍSICA">Facultad de Ciencias del Deporte y la Educación Física</option>
                <option value="FACULTAD DE EDUCACIÓN">Facultad de Educación</option>
                <option value="FACULTAD DE INGENIERÍA">Facultad de Ingeniería</option>
                <option value="FACULTAD DE CIENCIAS DE LA SALUD">Facultad de Ciencias de la Salud</option>
                <option value="FACULTAD DE CIENCIAS SOCIALES, HUMANIDADES Y CIENCIAS POLÍTICAS">Facultad de Ciencias Sociales, Humanidades y Ciencias Políticas</option>
              </select>
              {errors.facultad && <span className={styles['error-message']}>{errors.facultad}</span>}
            </div>

            <div className={`${styles['form-group']} ${styles['half-width']}`}>
              <label>Programa Académico</label>
              <select 
                name="programa" 
                value={formData.programa} 
                onChange={handleChange} 
                disabled={loading || !formData.facultad}
                className={errors.programa ? styles.error : ''}
              >
                <option value="" disabled hidden>Seleccione su programa...</option>
                {formData.facultad && programasPorFacultad[formData.facultad]?.map((prog) => (
                  <option key={prog} value={prog}>
                    {prog}
                  </option>
                ))}
              </select>
              {errors.programa && <span className={styles['error-message']}>{errors.programa}</span>}
            </div>
          </div>

          <div className={styles['form-row']}>
            <div className={`${styles['form-group']} ${styles['half-width']}`}>
              <label>Correo Institucional <span className={styles['info-icon']} title="Su correo será el mismo con el que iniciará sesión">i</span></label>
              <input type="email" name="correo" value={formData.correo} onChange={handleChange} placeholder="ejemplo@ucundinamarca.edu.co" className={errors.correo ? styles.error : ''} disabled={loading} />
              {errors.correo && <span className={styles['error-message']}>{errors.correo}</span>}
            </div>
            <div className={`${styles['form-group']} ${styles['half-width']}`}>
              <label>Número de Celular</label>
              <input type="tel" name="celular" value={formData.celular} onChange={handleChange} placeholder="Celular..." className={errors.celular ? styles.error : ''} disabled={loading} />
              {errors.celular && <span className={styles['error-message']}>{errors.celular}</span>}
            </div>
          </div>

          <div className={styles['form-row']}>
            <div className={`${styles['form-group']} ${styles['half-width']}`}>
              <label>Contraseña <span className={styles['info-icon']} title="Mínimo 8 caracteres, incluyendo una mayúscula, un número y un carácter especial (ej: #, $, @)">i</span></label>
              <div className={styles['password-wrapper']}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="contraseña" 
                  value={formData.contraseña} 
                  onChange={handleChange} 
                  placeholder="Mín. 8 caracteres..." 
                  className={errors.contraseña ? styles.error : ''} 
                  disabled={loading} 
                />
                <button 
                  type="button" 
                  className={styles['toggle-password-btn']} 
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles['eye-icon']}>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles['eye-icon']}>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {errors.contraseña && <span className={styles['error-message']}>{errors.contraseña}</span>}
            </div>

            <div className={`${styles['form-group']} ${styles['half-width']}`}>
              <label>Confirmar Contraseña</label>
              <div className={styles['password-wrapper']}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="confirmarContraseña" 
                  value={formData.confirmarContraseña} 
                  onChange={handleChange} 
                  placeholder="Repita su contraseña" 
                  className={errors.confirmarContraseña ? styles.error : ''} 
                  disabled={loading} 
                />
                <button 
                  type="button" 
                  className={styles['toggle-password-btn']} 
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles['eye-icon']}>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles['eye-icon']}>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmarContraseña && <span className={styles['error-message']}>{errors.confirmarContraseña}</span>}
            </div>
          </div>

          <div className={styles['form-actions']}>
            
            <button type="button" onClick={() => navigate('/')} className={`${styles['udec-button']} ${styles['secondary-button']}`} disabled={loading}>
              Regresar
            </button>
            <button type="submit" className={`${styles['udec-button']} ${styles['primary-button']}`} disabled={loading}>
              {loading ? 'Procesando...' : 'Crear Perfil'}
            </button>
          </div>
        </form>

        <div className={styles['udec-register-footer']}>
          <p>¿Ya tienes una cuenta? <a href="/" onClick={(e) => {e.preventDefault(); navigate('/')}} className={styles['login-link']}>Iniciar Sesión</a></p>
        </div>
      </div>
    </div>
  );
}