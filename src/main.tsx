import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Désactiver complètement le service worker en développement AVANT le rendu
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Désinscrire immédiatement tous les service workers
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister().then((success) => {
        if (success) {
          console.log('✅ Service worker désinscrit en développement')
        }
      })
    })
  })
  
  // Désactiver le service worker pour cette session
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Enregistrer le service worker UNIQUEMENT en production
if (import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        console.info('Nouvelle version de FAATA Beach disponible')
      },
      onOfflineReady() {
        console.info('FAATA Beach est prête pour une utilisation hors-ligne')
      },
    })
  })
}

