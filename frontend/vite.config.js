import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  optimizeDeps: {
    // Exclude packages that use dynamic imports Vite can't pre-bundle
    exclude: [
      '@imgly/background-removal',
      'onnxruntime-web',
      'onnxruntime-web/webgpu',
    ],
  },

  build: {
    rollupOptions: {
      external: ['onnxruntime-web/webgpu'],
    },
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})
