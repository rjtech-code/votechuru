import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Ready for when the Express API (server/index.js) is connected.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
