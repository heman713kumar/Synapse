import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// This is correct for your GitHub Pages deployment.
export default defineConfig({
  plugins: [react()],
  base: '/Synapse/', // <-- MUST be present
})