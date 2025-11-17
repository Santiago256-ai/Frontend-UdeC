// C:/Users/ASUS/Pagina Web UdeC/frontend/src/pages/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";

// 1. 🚨 REEMPLAZA ESTOS VALORES CON TU CONFIGURACIÓN REAL DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyA3XqWMvhKN-Vh25pAtBa2P960Ay5rr1M4",
  authDomain: "pagina-udec.firebaseapp.com",
  projectId: "pagina-udec",
  storageBucket: "pagina-udec.firebasestorage.app",
  messagingSenderId: "868292565344",
  appId: "1:868292565344:web:584f935865b2c2cffaa605",
  measurementId: "G-0TLD8DTQH9"
};
// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firebase Authentication
export const auth = getAuth(app);

// Crear los proveedores de OAuth
export const googleProvider = new GoogleAuthProvider();
export const microsoftProvider = new OAuthProvider('microsoft.com');