import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The API location comes from VITE_API_URL in Frontend/.env (no proxy needed).
export default defineConfig({
  plugins: [react()],
})
