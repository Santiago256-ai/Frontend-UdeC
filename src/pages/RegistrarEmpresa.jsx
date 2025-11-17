import { useState } from 'react';
import axios from "axios";
import './RegistrarEmpresa.css';

export default function RegistrarEmpresa() {
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phones: '',
    contactName: '',
    nit: '',
    address: '',
    city: '',
    department: '',
    companyType: '',
    economicSector: '',
    foundationYear: '',
    annualRevenue: '',
    totalAssets: '',
    equity: '',
    employees: '',
    distributionChannels: '',
    mainClients: '',
    emailAuthorization: false,
    // 💡 NUEVOS CAMPOS DE AUTENTICACIÓN
    password: '',
    confirmPassword: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({}); 

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Limpiar el error cuando el usuario comienza a escribir
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: '' 
    }));
  };

  // Función de validación por paso
  const validateStep = (step) => {
    let stepErrors = {};
    let isValid = true;

    // Campos requeridos para el Paso 1 (Ahora incluye la contraseña)
    if (step === 1) {
      if (!formData.companyName.trim()) stepErrors.companyName = 'El nombre es obligatorio.';
      
      // Validación de Email
      if (!formData.email.trim()) {
        stepErrors.email = 'El correo es obligatorio.';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        stepErrors.email = 'Correo inválido.';
      }

      if (!formData.phones.trim()) stepErrors.phones = 'El teléfono es obligatorio.';
      if (!formData.contactName.trim()) stepErrors.contactName = 'El contacto es obligatorio.';

      // 💡 VALIDACIÓN DE CONTRASEÑA
      if (!formData.password.trim()) {
        stepErrors.password = 'La contraseña es obligatoria.';
      } else if (formData.password.length < 8) {
        stepErrors.password = 'Debe tener al menos 8 caracteres.';
      }

      if (formData.password !== formData.confirmPassword) {
        stepErrors.confirmPassword = 'Las contraseñas no coinciden.';
      }
      if (!formData.confirmPassword.trim()) {
          stepErrors.confirmPassword = 'Debe confirmar la contraseña.';
      }
    }

    // Campos requeridos para el Paso 2
    if (step === 2) {
      if (!formData.address.trim()) stepErrors.address = 'La dirección es obligatoria.';
      if (!formData.city.trim()) stepErrors.city = 'La ciudad es obligatoria.';
      if (!formData.department.trim()) stepErrors.department = 'El departamento es obligatorio.';
    }

    // Campos requeridos para el Paso 3
    if (step === 3) {
      if (!formData.companyType) stepErrors.companyType = 'El tipo de empresa es obligatorio.';
      if (!formData.economicSector) stepErrors.economicSector = 'El sector es obligatorio.';
      if (!formData.foundationYear) stepErrors.foundationYear = 'El año es obligatorio.';
      if (!formData.employees) stepErrors.employees = 'El número de empleados es obligatorio.';
    }

    // Campos requeridos para el Paso 4
    if (step === 4) {
      if (!formData.annualRevenue) stepErrors.annualRevenue = 'Los ingresos son obligatorios.';
      if (!formData.distributionChannels) stepErrors.distributionChannels = 'El canal es obligatorio.';
      if (!formData.mainClients) stepErrors.mainClients = 'Los clientes son obligatorios.';
    }

    setErrors(stepErrors);
    isValid = Object.keys(stepErrors).length === 0;
    return isValid;
  };

  // Nueva función que valida antes de avanzar
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      alert('Por favor, complete todos los campos obligatorios del paso actual.');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({}); // Limpiar errores al retroceder
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Opcional: una validación final antes de enviar, incluyendo el paso 4
    if (!validateStep(4)) {
      alert('Aún faltan campos obligatorios por llenar.');
      return;
    }
    
    try {
      // ⚠️ IMPORTANTE: Aquí se envían todos los datos, incluyendo 'password' y 'confirmPassword'.
      // Tu backend DEBE USAR 'password' y HASHEARLA ANTES DE GUARDAR.
      const response = await axios.post(
        "http://localhost:4000/api/empresas",
        formData
      );
      console.log("Empresa registrada:", response.data);
      alert("¡✅ Empresa registrada exitosamente! Ya puede iniciar sesión.");
      
      setCurrentStep(1); // Volver al paso 1
      setFormData( /* ... (resetear estado) ... */ ); // Aquí se recomienda resetear a los valores iniciales.
    } catch (error) {
      console.error("Error al registrar empresa:", error);
      // Mostrar el error específico del backend si existe (ej: email ya registrado)
      const errorMessage = error.response?.data?.error || "Error al enviar el formulario. Intenta nuevamente.";
      alert(`❌ ${errorMessage}`);
    }
  };


  return (
    <div className="register-container">
      <div className="register-card">
        {/* ... (Header y Progress Steps se mantienen igual) ... */}
        <div className="form-header">
          <h1 className="form-title">Registro de Empresa</h1>
          <p className="form-subtitle">
            Complete la información de su empresa para el registro en nuestro sistema
          </p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className={`step ${step === currentStep ? 'active' : ''}`}>
              <div className="step-number">{step}</div>
              <div className="step-label">
                {step === 1 && 'Credenciales'} 
                {step === 2 && 'Ubicación'}
                {step === 3 && 'Empresarial'}
                {step === 4 && 'Financiero'}
                {step === 5 && 'Confirmación'}
              </div>
            </div>
          ))}
        </div>


        <form onSubmit={handleSubmit} className="company-form">
          {/* Paso 1: Información Básica y Credenciales */}
          {currentStep === 1 && (
            <div className="form-step">
              <h2 className="step-title">Información Básica y Credenciales de Acceso</h2>
              
              <div className="form-group">
                <label className="form-label">
                  Nombre de la Empresa <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className={`form-input ${errors.companyName ? 'input-error' : ''}`}
                  placeholder="Ingrese el nombre legal de la empresa"
                />
                {errors.companyName && <span className="error-message">{errors.companyName}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Correo Electrónico (Será su usuario) <span className="required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'input-error' : ''}`}
                  placeholder="correo@empresa.com"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              {/* 💡 CAMPOS DE CONTRASEÑA AÑADIDOS */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Contraseña <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`form-input ${errors.password ? 'input-error' : ''}`}
                    placeholder="Mínimo 8 caracteres"
                  />
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Confirmar Contraseña <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Repita su contraseña"
                  />
                  {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>
              </div>
              {/* FIN CAMPOS DE CONTRASEÑA */}


              <div className="form-group">
                <label className="form-label">
                  Teléfonos <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  name="phones"
                  value={formData.phones}
                  onChange={handleChange}
                  className={`form-input ${errors.phones ? 'input-error' : ''}`}
                  placeholder="+57 300 123 4567"
                />
                {errors.phones && <span className="error-message">{errors.phones}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Nombre de Contacto <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className={`form-input ${errors.contactName ? 'input-error' : ''}`}
                  placeholder="Nombre completo del contacto principal"
                />
                {errors.contactName && <span className="error-message">{errors.contactName}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  NIT <span className="optional">(Opcional)</span>
                </label>
                <input
                  type="text"
                  name="nit"
                  value={formData.nit}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Número de Identificación Tributaria"
                />
              </div>
            </div>
          )}

          {/* Resto de los pasos (2, 3, 4, 5) siguen iguales */}
          {/* Paso 2: Ubicación */}
          {currentStep === 2 && (
            <div className="form-step">
              <h2 className="step-title">Ubicación</h2>
              
              <div className="form-group">
                <label className="form-label">
                  Dirección <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`form-input ${errors.address ? 'input-error' : ''}`}
                  placeholder="Dirección completa de la sede principal"
                />
                {errors.address && <span className="error-message">{errors.address}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Ciudad <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`form-input ${errors.city ? 'input-error' : ''}`}
                    placeholder="Ciudad donde opera la empresa"
                  />
                {errors.city && <span className="error-message">{errors.city}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Departamento <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={`form-input ${errors.department ? 'input-error' : ''}`}
                    placeholder="Departamento o estado"
                  />
                {errors.department && <span className="error-message">{errors.department}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: Información Empresarial */}
          {currentStep === 3 && (
            <div className="form-step">
              <h2 className="step-title">Información Empresarial</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Tipo de Empresa <span className="required">*</span>
                  </label>
                  <select
                    name="companyType"
                    value={formData.companyType}
                    onChange={handleChange}
                    className={`form-select ${errors.companyType ? 'input-error' : ''}`}
                  >
                    <option value="">Seleccione un tipo de empresa</option>
                    <option value="sa">Sociedad Anónima</option>
                    <option value="ltda">Sociedad Limitada</option>
                    <option value="eirl">Empresa Individual</option>
                    <option value="coop">Cooperativa</option>
                  </select>
                {errors.companyType && <span className="error-message">{errors.companyType}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Sector Económico <span className="required">*</span>
                  </label>
                  <select
                    name="economicSector"
                    value={formData.economicSector}
                    onChange={handleChange}
                    className={`form-select ${errors.economicSector ? 'input-error' : ''}`}
                  >
                    <option value="">Seleccione un sector económico</option>
                    <option value="manufactura">Manufactura</option>
                    <option value="servicios">Servicios</option>
                    <option value="comercio">Comercio</option>
                    <option value="tecnologia">Tecnología</option>
                  </select>
                {errors.economicSector && <span className="error-message">{errors.economicSector}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Año de Fundación <span className="required">*</span>
                  </label>
                  <select
                    name="foundationYear"
                    value={formData.foundationYear}
                    onChange={handleChange}
                    className={`form-select ${errors.foundationYear ? 'input-error' : ''}`}
                  >
                    <option value="">Seleccione el año de fundación</option>
                    {Array.from({length: 50}, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                {errors.foundationYear && <span className="error-message">{errors.foundationYear}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Número de Empleados <span className="required">*</span>
                  </label>
                  <select
                    name="employees"
                    value={formData.employees}
                    onChange={handleChange}
                    className={`form-select ${errors.employees ? 'input-error' : ''}`}
                  >
                    <option value="">Seleccione el número de empleados</option>
                    <option value="1-10">1-10 empleados</option>
                    <option value="11-50">11-50 empleados</option>
                    <option value="51-200">51-200 empleados</option>
                    <option value="201-500">201-500 empleados</option>
                    <option value="501+">Más de 500 empleados</option>
                  </select>
                {errors.employees && <span className="error-message">{errors.employees}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Paso 4: Información Financiera */}
          {currentStep === 4 && (
            <div className="form-step">
              <h2 className="step-title">Información Financiera y Comercial</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Ingresos Anuales <span className="required">*</span>
                  </label>
                  <select
                    name="annualRevenue"
                    value={formData.annualRevenue}
                    onChange={handleChange}
                    className={`form-select ${errors.annualRevenue ? 'input-error' : ''}`}
                  >
                    <option value="">Seleccione el rango de ingresos</option>
                    <option value="menos-100">Menos de 100 millones</option>
                    <option value="100-500">100-500 millones</option>
                    <option value="500-1000">500-1000 millones</option>
                    <option value="1000-5000">1000-5000 millones</option>
                    <option value="mas-5000">Más de 5000 millones</option>
                  </select>
                {errors.annualRevenue && <span className="error-message">{errors.annualRevenue}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Activos Totales <span className="optional">(Opcional)</span>
                  </label>
                  <select
                    name="totalAssets"
                    value={formData.totalAssets}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Seleccione el valor de activos</option>
                    <option value="menos-50">Menos de 50 millones</option>
                    <option value="50-200">50-200 millones</option>
                    <option value="200-500">200-500 millones</option>
                    <option value="500-1000">500-1000 millones</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Patrimonio <span className="optional">(Opcional)</span>
                  </label>
                  <select
                    name="equity"
                    value={formData.equity}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Seleccione el valor de patrimonio</option>
                    <option value="menos-20">Menos de 20 millones</option>
                    <option value="20-100">20-100 millones</option>
                    <option value="100-300">100-300 millones</option>
                    <option value="300-800">300-800 millones</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Canales de Distribución <span className="required">*</span>
                  </label>
                  <select
                    name="distributionChannels"
                    value={formData.distributionChannels}
                    onChange={handleChange}
                    className={`form-select ${errors.distributionChannels ? 'input-error' : ''}`}
                  >
                    <option value="">Seleccione un canal</option>
                    <option value="directo">Venta Directa</option>
                    <option value="distribuidores">Distribuidores</option>
                    <option value="minoristas">Minoristas</option>
                    <option value="ecommerce">E-commerce</option>
                  </select>
                {errors.distributionChannels && <span className="error-message">{errors.distributionChannels}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Principales Clientes <span className="required">*</span>
                </label>
                <select
                  name="mainClients"
                  value={formData.mainClients}
                  onChange={handleChange}
                  className={`form-select ${errors.mainClients ? 'input-error' : ''}`}
                >
                  <option value="">Seleccione sus principales clientes</option>
                  <option value="consumidor-final">Consumidor Final</option>
                  <option value="empresas">Empresas (B2B)</option>
                  <option value="gobierno">Gobierno</option>
                  <option value="exportacion">Exportación</option>
                </select>
                {errors.mainClients && <span className="error-message">{errors.mainClients}</span>}
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="emailAuthorization"
                  name="emailAuthorization"
                  checked={formData.emailAuthorization}
                  onChange={handleChange}
                  className="checkbox-input"
                />
                <label htmlFor="emailAuthorization" className="checkbox-label">
                  ¿Da su autorización para recibir correos?
                </label>
              </div>
            </div>
          )}

          {/* Paso 5: Confirmación */}
          {currentStep === 5 && (
            <div className="form-step">
              <h2 className="step-title">Confirmación de Registro</h2>
              {/* ... (Contenido de confirmación) ... */}
              <div className="confirmation-content">
                <div className="success-icon">✓</div>
                <h3>¡Formulario Completado!</h3>
                <p>Revise la información antes de enviar el registro.</p>
                
                <div className="summary-section">
                  <h4>Resumen de Información</h4>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span>Empresa:</span>
                      <strong>{formData.companyName}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Email (Usuario):</span>
                      <strong>{formData.email}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Contacto:</span>
                      <strong>{formData.contactName}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Ubicación:</span>
                      <strong>{formData.city}, {formData.department}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navegación */}
          <div className="form-navigation">
            {currentStep > 1 && (
              <button type="button" onClick={prevStep} className="btn btn-secondary">
                Anterior
              </button>
            )}
            
            {currentStep < 5 ? (
              <button type="button" onClick={handleNextStep} className="btn btn-primary">
                Siguiente
              </button>
            ) : (
              <button type="submit" className="btn btn-success">
                Enviar Registro
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}