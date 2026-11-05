import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { attachTabulator } from './server/tabulator.js'

const dataDir = path.resolve(__dirname, 'data')

// Runs the scoring server (server/tabulator.js) on the same port as the app,
// for both `npm run dev` and `npm start` (vite preview).
const tabulatorServer = () => ({
  name: 'icpep-tabulator-server',
  configureServer(server) {
    if (server.httpServer) attachTabulator(server.httpServer, { dataDir })
  },
  configurePreviewServer(server) {
    if (server.httpServer) attachTabulator(server.httpServer, { dataDir })
  }
})

export default defineConfig({
  plugins: [vue(), tabulatorServer()],
  clearScreen: false, // keep the Admin PIN visible in the terminal
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: '0.0.0.0', // Expose to local network
    port: 3000,
    watch: { ignored: ['**/data/**'] }
  },
  preview: {
    host: '0.0.0.0',
    port: 3000
  }
})
