import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import prerender from 'vite-plugin-prerender'

// All routes to prerender at build time — generates real HTML for Google to crawl
const routes = [
  '/',
  // PDF Conversion
  '/tools/pdf-to-word',
  '/tools/word-to-pdf',
  '/tools/pdf-to-jpg',
  '/tools/jpg-to-pdf',
  '/tools/pdf-to-png',
  '/tools/png-to-pdf',
  '/tools/excel-to-pdf',
  '/tools/pdf-to-excel',
  '/tools/powerpoint-to-pdf',
  '/tools/pdf-to-powerpoint',
  '/tools/pdf-to-zip',
  // PDF Editing
  '/tools/pdf-merge',
  '/tools/pdf-split',
  '/tools/pdf-compress',
  '/tools/pdf-page-extractor',
  '/tools/pdf-page-remover',
  '/tools/pdf-page-reorder',
  '/tools/pdf-rotate-pages',
  '/tools/add-page-numbers',
  '/tools/pdf-watermark',
  '/tools/remove-watermark',
  '/tools/protect-pdf',
  '/tools/edit-pdf',
  '/tools/sign-pdf',
  '/tools/fill-forms',
  '/tools/add-text',
  '/tools/add-image',
  '/tools/annotate-pdf',
  '/tools/highlight-pdf',
  '/tools/draw-pdf',
  '/tools/view-pdf',
  '/tools/add-header-footer',
  // Image Tools
  '/tools/image-to-pdf',
  '/tools/pdf-to-image',
  '/tools/ocr-image-to-text',
  '/tools/screenshot-to-text',
  '/tools/color-picker',
  '/tools/hex-to-rgb',
  '/tools/rgb-to-hex',
  '/tools/image-metadata',
  '/tools/remove-exif',
  '/tools/qr-code-generator',
  '/tools/bg-remover',
  '/tools/image-compressor',
  '/tools/image-to-svg',
  '/tools/svg-to-image',
  '/tools/passport-maker',
  // Developer Tools
  '/tools/favicon-generator',
];

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    prerender({
      staticDir: 'dist',
      routes,
      renderer: '@prerenderer/renderer-puppeteer',
      rendererOptions: {
        // Wait for the app to finish rendering before snapshotting
        renderAfterDocumentEvent: 'render-event',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      // Post-process each prerendered page
      postProcess(renderedRoute) {
        // Fix absolute URLs (prerender uses localhost)
        renderedRoute.html = renderedRoute.html
          .replace(/http:\/\/localhost:\d+\//g, 'https://toolnix.pro/')
          .replace(/href="\//g, 'href="/')  // keep relative links
          .replace(/<script[^>]*module[^>]*><\/script>/g, ''); // strip module preload hints
        return renderedRoute;
      },
    }),
  ],

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
      },
    },
  },
})
