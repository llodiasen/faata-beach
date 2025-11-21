import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// PWA désactivé temporairement pour le déploiement - problème avec workbox-build en ESM
// import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // VitePWA désactivé temporairement - à réactiver plus tard si besoin
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: ['favicon.ico', 'icons/*.png'],
    //   manifest: {
    //     name: 'FAATA Beach',
    //     short_name: 'FAATA',
    //     description: 'Application de commande pour FAATA Beach',
    //     theme_color: '#DC2626',
    //     background_color: '#000000',
    //     display: 'standalone',
    //     icons: [
    //       {
    //         src: 'icons/icon-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'icons/icon-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png'
    //       }
    //     ]
    //   },
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg}']
    //   }
    // })
  ],
})
