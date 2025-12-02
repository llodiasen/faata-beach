import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'node:module'
import manifest from './public/manifest.json' with { type: 'json' }

const require = createRequire(import.meta.url)
const { VitePWA } = require('vite-plugin-pwa') as typeof import('vite-plugin-pwa')

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'images/icon.png', 'images/logo.png', 'icons/*.png', 'offline.html'],
      manifest,
      devOptions: {
        enabled: false, // Désactiver le service worker en développement pour éviter les conflits avec les routes API
        type: 'module',
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webp}'],
        rollupFormat: 'es',
      },
    }),
  ],
})
