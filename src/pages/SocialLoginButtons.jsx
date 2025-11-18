import React from 'react';

export default function SocialLoginButtons({ handleGoogleLogin, handleMicrosoftLogin }) {
    
    // El estado local ya no es necesario aquí ya que los botones son de acción directa.
    // Usaremos los mismos iconos SVG que tienes en tu Landing.js.

    return (
        <div className="social-login-group">
            <button 
                className="social-login-btn google-btn"
                onClick={handleGoogleLogin} 
            >
                <svg className="auth-icon" viewBox="0 0 24 24" width="20px" height="20px">
                    <path fill="#4285F4" d="M22.5 12.5c0-.6-.1-1.2-.2-1.7H12v3.4h5.6c-.3 1.7-1.3 3.1-2.9 4v2.7h3.5c2.1-1.9 3.4-4.8 3.4-8.4z"/>
                    <path fill="#34A853" d="M12 24c3.3 0 6.1-1.1 8.2-3.1l-3.5-2.7c-1.1.7-2.5 1.1-4.7 1.1-3.6 0-6.7-2.4-7.8-5.6H.7v2.8C2.9 21.6 7.1 24 12 24z"/>
                    <path fill="#FBBC05" d="M4.2 14.3c-.2-.7-.3-1.4-.3-2.3s.1-1.6.3-2.3V6.9H.7c-.5 1.1-.7 2.5-.7 4.1s.2 3 .7 4.1L4.2 14.3z"/>
                    <path fill="#EA4335" d="M12 4.6c2.1 0 4.1.8 5.6 2.1l3.1-3.1C18.1 1.7 15.3 0 12 0 7.1 0 2.9 2.4.7 6.9l3.5 2.8c1.1-3.2 4.2-5.6 7.8-5.6z"/>
                </svg>
                Continuar con Google
            </button>

            <button 
                className="social-login-btn microsoft-btn" // Cambiado a microsoft-btn para distinguirlo
                onClick={handleMicrosoftLogin}
            >
                <svg className="auth-icon" viewBox="0 0 240 240" width="20px" height="20px">
                    <rect x="10" y="10" width="110" height="110" fill="#F25022"/>
                    <rect x="120" y="10" width="110" height="110" fill="#7FBA00"/>
                    <rect x="10" y="120" width="110" height="110" fill="#00A4EF"/>
                    <rect x="120" y="120" width="110" height="110" fill="#FFB900"/>
                </svg>
                Continuar con Microsoft
            </button>
        </div>
    );
}