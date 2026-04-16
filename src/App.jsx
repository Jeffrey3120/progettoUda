import { useState } from 'react'
import Login    from './pages/Login'
import Parcheggi from './pages/Parcheggi'
import Prenota  from './pages/Prenota'
import Storico  from './pages/Storico'
import './App.css'

const PAGINE = [
  { id: 'parcheggi', label: 'Parcheggi' },
  { id: 'prenota',   label: 'Prenota'   },
  { id: 'storico',   label: 'Storico'   },
]

function App() {

  const [utente, setUtente]               = useState(null)
  const [paginaAttuale, setPaginaAttuale] = useState('parcheggi')

  function handleLogout() {
    fetch('/api/logout', { method: 'POST', credentials: 'include' })
    setUtente(null)
    setPaginaAttuale('parcheggi')
  }

  if (utente === null) {
    return <Login onLoginRiuscito={setUtente} />
  }

  return (
    <div>
      <nav className="navbar">

        {/* Logo */}
        <div className="navbar-brand">
          <svg viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M9 12h6M12 9v6"/>
          </svg>
          SmartCity Parking
        </div>

        {/* Navigazione centrale */}
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

        {/* Utente + logout */}
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
        {paginaAttuale === 'parcheggi' && <Parcheggi />}
        {paginaAttuale === 'prenota'   && <Prenota />}
        {paginaAttuale === 'storico'   && <Storico />}
      </div>
    </div>
  )
}

export default App