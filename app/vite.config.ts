import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Avoid auto-opening a possibly misconfigured Chrome instance.
    // Open your preferred browser manually at http://localhost:3000
    open: false,
  },
})
