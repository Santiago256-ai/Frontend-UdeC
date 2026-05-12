import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api'; 
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

const ErrorModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalIcon}>✕</div>
        <h2 className={styles.modalTitle}>Hubo un inconveniente</h2>
        <p className={`${styles.modalMessage} ${styles.modalMessageJustify}`}>
          {message}
        </p>
        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.btnCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

const SuccessModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={`${styles.modalIcon} ${styles.iconSuccess}`}>✓</div>
        <h2 className={styles.modalTitle}>Operación Exitosa</h2>
        <p className={styles.modalMessage}>{message}</p>
        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.btnCerrar}>Ir al Inicio</button>
        </div>
      </div>
    </div>
  );
};

export default function RegistrarEgresado() {
  const navigate = useNavigate();
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
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
  // 🟢 NUEVO: Estado para saber si el usuario ya pasó por el recuadro
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [openMenus, setOpenMenus] = useState({
    facultad: false,
    programa: false
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(`.${styles['form-group']}`)) {
        setOpenMenus({ facultad: false, programa: false });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({
      facultad: menu === 'facultad' ? !prev.facultad : false,
      programa: menu === 'programa' ? !prev.programa : false
    }));
  };

  const validatePasswordStrength = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+~`|}{[\]:;"'<,>.?/])[A-Za-z\d!@#$%^&*()_+~`|}{[\]:;"'<,>.?/]{8,}$/;
    return passwordRegex.test(password);
  };

  // 🟢 NUEVO: Función centralizada para validar un solo campo a la vez
  const validateField = (name, value, currentData) => {
    switch (name) {
      case 'nombres': return !value.trim() ? 'Nombres requeridos' : '';
      case 'apellidos': return !value.trim() ? 'Apellidos requeridos' : '';
      case 'facultad': return !value ? 'Debe seleccionar una facultad' : '';
      case 'programa': return !value ? 'Debe seleccionar un programa' : '';
      case 'celular': return !value.trim() ? 'Celular requerido' : '';
      case 'correo': return !value.trim() || !/\S+@\S+\.\S+/.test(value) ? 'Correo inválido' : '';
      case 'contraseña': return !value || !validatePasswordStrength(value) ? 'Contraseña débil (8+ carac, Mayús, Núm, Especial (ej: #, $, @))' : '';
      case 'confirmarContraseña': return value !== currentData.contraseña ? 'Las contraseñas no coinciden' : '';
      default: return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'celular') {
      if (value !== '' && !/^[0-9]+$/.test(value)) return; 
      if (value.length > 10) return;
    }

    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'facultad') newData.programa = '';
      
      // Si el campo ya fue tocado, lo validamos mientras escribe
      if (touched[name]) {
        setErrors(prevErrors => ({ ...prevErrors, [name]: validateField(name, value, newData) }));
      }
      return newData;
    });
  };

  // 🟢 NUEVO: Función que se ejecuta cuando el usuario pasa al siguiente recuadro
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value, formData);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    const fields = Object.keys(formData);
    
    // Marcamos todos como tocados al intentar enviar
    const allTouched = fields.reduce((acc, field) => ({...acc, [field]: true}), {});
    setTouched(allTouched);

    fields.forEach(field => {
      const error = validateField(field, formData[field], formData);
      if (error) newErrors[field] = error;
    });

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
        setShowSuccessModal(true); 
      } catch (error) {
        setShowErrorModal(true); 
        console.error("Error en el registro:", error.response?.data);
      } finally {
        setLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate('/'); 
  };

  const isFormValid = () => {
    const requiredFields = Object.values(formData);
    const allFilled = requiredFields.every(field => field.trim() !== '');
    const noErrors = Object.values(errors).every(error => error === '');
    return allFilled && noErrors;
  };

  // 🟢 NUEVO: Renderizador de mensajes debajo de cada recuadro
  const renderValidationMessage = (fieldName) => {
    if (!touched[fieldName]) return null;
    
    if (errors[fieldName]) {
      return <span className={styles['error-message']}>❌ {errors[fieldName]}</span>;
    }
    
    if (formData[fieldName] !== '') {
      return <span className={styles['success-message']}>✅ Correcto</span>;
    }
    
    return null;
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
              <input 
                type="text" 
                name="nombres" 
                value={formData.nombres} 
                onChange={handleChange} 
                onBlur={handleBlur} /* 🟢 NUEVO */
                placeholder="Ingrese sus nombres completos" 
                className={errors.nombres && touched.nombres ? styles.error : ''} 
                disabled={loading} 
              />
              {renderValidationMessage('nombres')}
            </div>
            <div className={`${styles['form-group']} ${styles['half-width']}`}>
              <label>Apellidos</label>
              <input 
                type="text" 
                name="apellidos" 
                value={formData.apellidos} 
                onChange={handleChange} 
                onBlur={handleBlur} /* 🟢 NUEVO */
                placeholder="Ingrese sus apellidos completos" 
                className={errors.apellidos && touched.apellidos ? styles.error : ''} 
                disabled={loading} 
              />
              {renderValidationMessage('apellidos')}
            </div>
          </div>

          <div className={styles['form-row']}>
            {/* --- SELECTOR DE FACULTAD --- */}
            <div className={`${styles['form-group']} ${styles['half-width']}`} style={{ position: 'relative' }}>
              <label>Facultad</label>
              <div 
                className={`${styles.customSelectHeader} ${errors.facultad && touched.facultad ? styles.error : ''}`} 
                onClick={() => toggleMenu('facultad')}
              >
                {formData.facultad ? (
                  <span style={{ color: '#333', textTransform: 'capitalize' }}>
                    {formData.facultad.toLowerCase()}
                  </span>
                ) : (
                  <span style={{ color: '#999' }}>Seleccione su facultad...</span>
                )}
                <span className={styles.selectArrow}>▾</span>
              </div>

              {openMenus.facultad && (
                <div className={styles.customSelectDropdown}>
                  {Object.keys(programasPorFacultad).map((fac) => (
                    <div 
                      key={fac} 
                      className={styles.dropdownOption} 
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setFormData(prev => ({ ...prev, facultad: fac, programa: '' }));
                        toggleMenu('facultad');
                        // 🟢 Simulamos el "blur" y validamos
                        setTouched(prev => ({ ...prev, facultad: true, programa: false }));
                        setErrors(prev => ({ ...prev, facultad: '', programa: validateField('programa', '', formData) }));
                      }}
                    >
                      {fac.charAt(0) + fac.slice(1).toLowerCase()}
                    </div>
                  ))}
                </div>
              )}
              {renderValidationMessage('facultad')}
            </div>

            {/* --- SELECTOR DE PROGRAMA --- */}
            <div className={`${styles['form-group']} ${styles['half-width']}`} style={{ position: 'relative' }}>
              <label>Programa Académico</label>
              <div 
                className={`${styles.customSelectHeader} ${!formData.facultad ? styles.disabledSelect : ''} ${errors.programa && touched.programa ? styles.error : ''}`} 
                onClick={() => formData.facultad && toggleMenu('programa')}
              >
                {formData.programa ? (
                  <span style={{ color: '#333' }}>{formData.programa}</span>
                ) : (
                  <span style={{ color: '#999' }}>
                    {formData.facultad ? "Seleccione su programa..." : "Primero elija facultad"}
                  </span>
                )}
                <span className={styles.selectArrow}>▾</span>
              </div>

              {openMenus.programa && formData.facultad && (
                <div className={styles.customSelectDropdown}>
                  {programasPorFacultad[formData.facultad]?.map((prog) => (
                    <div 
                      key={prog} 
                      className={styles.dropdownOption} 
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setFormData(prev => ({ ...prev, programa: prog }));
                        toggleMenu('programa');
                        // 🟢 Simulamos el "blur" y validamos
                        setTouched(prev => ({ ...prev, programa: true }));
                        setErrors(prev => ({ ...prev, programa: '' }));
                      }}
                    >
                      {prog}
                    </div>
                  ))}
                </div>
              )}
              {renderValidationMessage('programa')}
            </div>
          </div>

          <div className={styles['form-row']}>
            <div className={`${styles['form-group']} ${styles['half-width']}`}>
              <label>Correo Institucional <span className={styles['info-icon']} title="Su correo será el mismo con el que iniciará sesión">i</span></label>
              <input 
                type="email" 
                name="correo" 
                value={formData.correo} 
                onChange={handleChange} 
                onBlur={handleBlur} /* 🟢 NUEVO */
                placeholder="ejemplo@ucundinamarca.edu.co" 
                className={errors.correo && touched.correo ? styles.error : ''} 
                disabled={loading} 
              />
              {renderValidationMessage('correo')}
            </div>
            <div className={`${styles['form-group']} ${styles['half-width']}`}>
              <label>Número de Celular</label>
              <input 
                type="tel" 
                name="celular" 
                value={formData.celular} 
                onChange={handleChange} 
                onBlur={handleBlur} /* 🟢 NUEVO */
                placeholder="Celular..." 
                className={errors.celular && touched.celular ? styles.error : ''} 
                disabled={loading} 
              />
              {renderValidationMessage('celular')}
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
                  onBlur={handleBlur} /* 🟢 NUEVO */
                  placeholder="Mín. 8 caracteres..." 
                  className={errors.contraseña && touched.contraseña ? styles.error : ''} 
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
              {renderValidationMessage('contraseña')}
            </div>

            <div className={`${styles['form-group']} ${styles['half-width']}`}>
              <label>Confirmar Contraseña</label>
              <div className={styles['password-wrapper']}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="confirmarContraseña" 
                  value={formData.confirmarContraseña} 
                  onChange={handleChange} 
                  onBlur={handleBlur} /* 🟢 NUEVO */
                  placeholder="Repita su contraseña" 
                  className={errors.confirmarContraseña && touched.confirmarContraseña ? styles.error : ''} 
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
              {renderValidationMessage('confirmarContraseña')}
            </div>
          </div>

          <div className={styles['form-actions']}>
            
            <button type="button" onClick={() => navigate('/')} className={`${styles['udec-button']} ${styles['secondary-button']}`} disabled={loading}>
              Regresar
            </button>
            <button 
              type="submit" 
              disabled={loading || !isFormValid()} 
              className={`
                ${styles['udec-button']} 
                ${styles['primary-button']} 
                ${(!isFormValid() || loading) ? styles.disabledButton : ''}
              `}
            >
              {loading ? 'Procesando...' : 'Crear Perfil'}
            </button>
          </div>
        </form>

        <div className={styles['udec-register-footer']}>
          <p>¿Ya tienes una cuenta? <a href="/" onClick={(e) => {e.preventDefault(); navigate('/')}} className={styles['login-link']}>Iniciar Sesión</a></p>
        </div>
      </div>
      
      <ErrorModal 
        isOpen={showErrorModal} 
        onClose={() => setShowErrorModal(false)} 
        message="No se pudo completar el registro. Es posible que el correo electrónico o Cédula ya se encuentren registrados en nuestra base de datos."
      />

      <SuccessModal 
        isOpen={showSuccessModal} 
        onClose={handleSuccessClose} 
        message="¡Registro Exitoso! El usuario ha sido vinculado correctamente en el sistema."
      />
    </div>
  );
}