import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Using an absolute base path ensures that assets are referenced correctly
// from the root, which is the most robust way to handle service workers.
export default defineConfig({
  plugins: [react()],
  base: '/Synapse/',
})