import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Montserrat: familia web institucional UdeC (Manual ECOM002 V_17), self-hosted.
// @fontsource incluye font-display: swap por defecto.
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/500.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/montserrat/800.css'

import './index.css'   // 👈 importante, aquí está Tailwind

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
