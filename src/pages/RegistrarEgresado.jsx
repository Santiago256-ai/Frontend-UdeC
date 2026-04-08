import React, { useState, useEffect } from 'react'; // 👈 Agregué useEffect aquí
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

const ErrorModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalIcon}>✕</div>
        <h2 className={styles.modalTitle}>Hubo un inconveniente</h2>
        
        {/* 🟢 NUEVO: Usamos la clase modalMessageJustify */}
        <p className={`${styles.modalMessage} ${styles.modalMessageJustify}`}>
          {message}
        </p>
        
        <div className={styles.modalActions}>
          {/* 🔴 Botón 'Verificar Datos' ELIMINADO */}
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
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado para controlar qué menú está abierto
  const [openMenus, setOpenMenus] = useState({
    facultad: false,
    programa: false
  });

  // 🟢 Hook para cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Importante: Verifica que la clase coincida con tu CSS
      if (!event.target.closest(`.${styles['form-group']}`)) {
        setOpenMenus({ facultad: false, programa: false });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Función para alternar la visibilidad de los menús
  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({
      facultad: menu === 'facultad' ? !prev.facultad : false,
      programa: menu === 'programa' ? !prev.programa : false
    }));
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
      // 1. Intentamos el registro
      await API.post("/auth/register", dataToSend); 
      
      // 🟢 ÉXITO: En lugar de alert, activamos el SuccessModal
      setShowSuccessModal(true); 
      
      // Nota: No navegamos aquí directamente, dejamos que el usuario 
      // vea el mensaje y navegue al darle clic en "Ir al Inicio" (handleSuccessClose)
      
    } catch (error) {
      // 🔴 ERROR: Activamos el ErrorModal
      setShowErrorModal(true); 
      console.error("Error en el registro:", error.response?.data);
      
    } finally {
      setLoading(false);
    }
  } else {
    // Si hay errores de validación local (campos vacíos, etc.)
    setErrors(newErrors);
  }
};

// 🟢 Esta función es la que vinculamos al botón del SuccessModal
const handleSuccessClose = () => {
  setShowSuccessModal(false);
  navigate('/'); // Redirigimos al Login solo después de que el usuario cierre el aviso
};

  // --- Lógica para habilitar/deshabilitar botón ---
const isFormValid = () => {
  // 1. Verificamos que los campos requeridos tengan contenido
  const requiredFields = [
    formData.nombres, 
    formData.apellidos, 
    formData.facultad, 
    formData.programa, 
    formData.correo, 
    formData.celular, 
    formData.contraseña, 
    formData.confirmarContraseña
  ];

  const allFilled = requiredFields.every(field => field.trim() !== '');

  // 2. Verificamos que no existan mensajes de error y que las contraseñas coincidan
  const noErrors = Object.values(errors).every(error => error === '');
  const passwordsMatch = formData.contraseña === formData.confirmarContraseña;
  const passwordStrong = validatePasswordStrength(formData.contraseña);

  return allFilled && noErrors && passwordsMatch && passwordStrong;
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
  {/* --- SELECTOR DE FACULTAD --- */}
  <div className={`${styles['form-group']} ${styles['half-width']}`} style={{ position: 'relative' }}>
    <label>Facultad</label>
    <div 
      className={`${styles.customSelectHeader} ${errors.facultad ? styles.error : ''}`} 
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
              setErrors(prev => ({ ...prev, facultad: '' }));
            }}
          >
            {fac.charAt(0) + fac.slice(1).toLowerCase()}
          </div>
        ))}
      </div>
    )}
    {errors.facultad && <span className={styles['error-message']}>{errors.facultad}</span>}
  </div>

  {/* --- SELECTOR DE PROGRAMA --- */}
  <div className={`${styles['form-group']} ${styles['half-width']}`} style={{ position: 'relative' }}>
    <label>Programa Académico</label>
    <div 
      className={`${styles.customSelectHeader} ${!formData.facultad ? styles.disabledSelect : ''} ${errors.programa ? styles.error : ''}`} 
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
              setErrors(prev => ({ ...prev, programa: '' }));
            }}
          >
            {prog}
          </div>
        ))}
      </div>
    )}
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
            <button 
  type="submit" 
  /* 🟢 Se deshabilita si el formulario no es válido o si está cargando */
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
      {/* 🟢 AQUÍ EXACTAMENTE DEBES PEGAR EL MODAL 🟢 */}
      <ErrorModal 
        isOpen={showErrorModal} 
        onClose={() => setShowErrorModal(false)} 
        message="No se pudo completar el registro. Es posible que el correo electrónico o Cédula ya se encuentren registrados en nuestra base de datos."
      />

      {/* 🟢 NUEVO: Modal de Éxito */}
      <SuccessModal 
        isOpen={showSuccessModal} 
        onClose={handleSuccessClose} 
        message="¡Registro Exitoso! El usuario ha sido vinculado correctamente en el sistema."
      />
    </div>
  );
}