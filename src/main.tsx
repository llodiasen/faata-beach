import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info('Nouvelle version de FAATA Beach disponible')
  },
  onOfflineReady() {
    console.info('FAATA Beach est prête pour une utilisation hors-ligne')
  },
})

