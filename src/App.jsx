import { useState, useEffect } from 'react'
import Login    from './pages/Login'
import Parcheggi from './pages/Parcheggi'
import Prenota  from './pages/Prenota'
import Storico  from './pages/Storico'
import './App.css'

const PAGINE = [
  { id: 'parcheggi', label: 'Parcheggi', adminOnly: false },
  { id: 'prenota',   label: 'Prenota',   adminOnly: false },
  { id: 'storico',   label: 'Storico',   adminOnly: true  },
]

function App() {

  const [utente, setUtente]               = useState(null)
  const [controllo, setControllo]         = useState(true)   
  const [paginaAttuale, setPaginaAttuale] = useState('parcheggi')

  useEffect(() => {
    fetch('/api/aree', { credentials: 'include' })
      .then((r) => {
        if (r.ok) {
          const salvato = localStorage.getItem('utente')
          if (salvato) setUtente(JSON.parse(salvato))
        }
      })
      .catch(() => {})
      .finally(() => setControllo(false))
  }, [])

  function handleLoginRiuscito(dati) {
    localStorage.setItem('utente', JSON.stringify(dati))  
    setUtente(dati)
  }

  function handleLogout() {
    fetch('/api/logout', { method: 'POST', credentials: 'include' })
    localStorage.removeItem('utente')                
    setUtente(null)
    setPaginaAttuale('parcheggi')
  }

  if (controllo) return null

  if (utente === null) {
    return <Login onLoginRiuscito={handleLoginRiuscito} />
  }

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-brand">
          <svg viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M9 12h6M12 9v6"/>
          </svg>
          SmartCity Parking
        </div>

        <div className="navbar-nav">
          {PAGINE.map((p) => (
            <button
              key={p.id}
              className={`nav-btn${paginaAttuale === p.id ? ' attivo' : ''}`}
              onClick={() => setPaginaAttuale(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="navbar-right">
          <p className="navbar-utente">
            Ciao, <span>{utente.user}</span>
            {utente.role === 'admin' && ' (admin)'}
          </p>
          <button className="btn-logout" onClick={handleLogout}>
            Esci
          </button>
        </div>
      </nav>

      <div className="app-content">
        {paginaAttuale === 'parcheggi' && <Parcheggi utente={utente}/>}
        {paginaAttuale === 'prenota'   && <Prenota />}
        {paginaAttuale === 'storico'   && <Storico />}
      </div>
    </div>
  )
}

export default App