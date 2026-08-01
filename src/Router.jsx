import { useState, useEffect } from 'react'
import App from './App.jsx'
import ReiDaArena from './ReiDaArena.jsx'
import { naArena } from './rotas'

export default function Router() {
  const [caminho, setCaminho] = useState(window.location.pathname)

  useEffect(() => {
    const sincronizar = () => setCaminho(window.location.pathname)
    window.addEventListener('popstate', sincronizar)
    return () => window.removeEventListener('popstate', sincronizar)
  }, [])

  return naArena(caminho) ? <ReiDaArena /> : <App />
}
