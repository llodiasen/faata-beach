import { useEffect } from 'react'
import Home from './pages/Home'
import { useAuthStore } from './store/useAuthStore'

function App() {
  const { loadProfile } = useAuthStore()

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  return <Home />
}

export default App

