import { useState } from 'react'
import './Login.css'

function Login({ onLoginRiuscito }) {

  const [username, setUsername]       = useState('')
  const [password, setPassword]       = useState('')
  const [errore, setErrore]           = useState('')
  const [caricamento, setCaricamento] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setErrore('')
    setCaricamento(true)
    try {
      const risposta = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const dati = await risposta.json()
      if (risposta.ok) {
        onLoginRiuscito(dati)
      } else {
        setErrore(dati.error || 'Username o password sbagliati!')
      }
    } catch {
      setErrore('Errore di rete: il backend è avviato sulla porta 11000?')
    } finally {
      setCaricamento(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-logo">
          <svg viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M9 12h6M12 9v6"/>
          </svg>
        </div>

        <h2>SmartCity Parking</h2>
        <p className="login-subtitle">Inserisci le tue credenziali per accedere</p>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="nome utente"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {errore && <p className="login-errore">{errore}</p>}

          <button type="submit" className="btn-login" disabled={caricamento}>
            {caricamento ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>

      </div>
    </div>
  )
}

export default Login