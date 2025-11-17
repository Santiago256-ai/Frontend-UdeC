import { useState } from 'react';
import API from "../services/api"; // ⚡ Usar instancia axios con tu URL de Railway
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
    password: '',
    confirmPassword: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({}); 

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateStep = (step) => {
    let stepErrors = {};
    let isValid = true;

    if (step === 1) {
      if (!formData.companyName.trim()) stepErrors.companyName = 'El nombre es obligatorio.';
      if (!formData.email.trim()) stepErrors.email = 'El correo es obligatorio.';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) stepErrors.email = 'Correo inválido.';
      if (!formData.phones.trim()) stepErrors.phones = 'El teléfono es obligatorio.';
      if (!formData.contactName.trim()) stepErrors.contactName = 'El contacto es obligatorio.';
      if (!formData.password.trim()) stepErrors.password = 'La contraseña es obligatoria.';
      else if (formData.password.length < 8) stepErrors.password = 'Debe tener al menos 8 caracteres.';
      if (!formData.confirmPassword.trim()) stepErrors.confirmPassword = 'Debe confirmar la contraseña.';
      else if (formData.password !== formData.confirmPassword) stepErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    if (step === 2) {
      if (!formData.address.trim()) stepErrors.address = 'La dirección es obligatoria.';
      if (!formData.city.trim()) stepErrors.city = 'La ciudad es obligatoria.';
      if (!formData.department.trim()) stepErrors.department = 'El departamento es obligatorio.';
    }

    if (step === 3) {
      if (!formData.companyType) stepErrors.companyType = 'El tipo de empresa es obligatorio.';
      if (!formData.economicSector) stepErrors.economicSector = 'El sector es obligatorio.';
      if (!formData.foundationYear) stepErrors.foundationYear = 'El año es obligatorio.';
      if (!formData.employees) stepErrors.employees = 'El número de empleados es obligatorio.';
    }

    if (step === 4) {
      if (!formData.annualRevenue) stepErrors.annualRevenue = 'Los ingresos son obligatorios.';
      if (!formData.distributionChannels) stepErrors.distributionChannels = 'El canal es obligatorio.';
      if (!formData.mainClients) stepErrors.mainClients = 'Los clientes son obligatorios.';
    }

    setErrors(stepErrors);
    isValid = Object.keys(stepErrors).length === 0;
    return isValid;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, 5));
    else alert('Por favor, complete todos los campos obligatorios del paso actual.');
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) {
      alert('Aún faltan campos obligatorios por llenar.');
      return;
    }

    try {
      // ⚡ Usamos la instancia API con URL de Railway
      const response = await API.post("/empresas", formData);
      console.log("Empresa registrada:", response.data);
      alert("¡✅ Empresa registrada exitosamente! Ya puede iniciar sesión.");

      setCurrentStep(1);
      setFormData({
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
        password: '',
        confirmPassword: ''
      });
      setErrors({});
    } catch (error) {
      console.error("Error al registrar empresa:", error);
      const errorMessage = error.response?.data?.error || "Error al enviar el formulario. Intenta nuevamente.";
      alert(`❌ ${errorMessage}`);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="form-header">
          <h1 className="form-title">Registro de Empresa</h1>
          <p className="form-subtitle">
            Complete la información de su empresa para el registro en nuestro sistema
          </p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          {[1,2,3,4,5].map(step => (
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
          {/* Aquí van tus pasos 1-5 exactamente como los tienes */}
          {/* ... */}
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
