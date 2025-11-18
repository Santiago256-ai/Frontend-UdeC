// vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // ESTA SECCIÓN ES CRUCIAL PARA SOLUCIONAR EL ERROR DE POP-UP
  server: {
    headers: {
      // Esta directiva permite que el pop-up se comunique con la ventana principal.
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups', 
    },
  },
})