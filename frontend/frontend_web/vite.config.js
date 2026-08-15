import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0', // Forces Vite to listen on all local network interfaces
    port: 5173,      // Ensures it sticks to the port you exposed in Docker
    strictPort: true, // If 5173 is busy, fail instead of silently switching ports
    watch: {
      usePolling: true, // Essential for hot-reloading to work inside Docker containers
    },
  },
})