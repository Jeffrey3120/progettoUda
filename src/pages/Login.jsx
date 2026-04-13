import { useState } from 'react'

function Login({ onLoginRiuscito }) {

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState('')

  async function handleLogin() {
    const risposta = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    if (risposta.ok) {
      const dati = await risposta.json()
      onLoginRiuscito(dati)
    } else {
      setErrore('Username o password sbagliati!')
    }
  }

  return (
    <div>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <br />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <button onClick={handleLogin}>Accedi</button>

      {errore && <p style={{ color: 'red' }}>{errore}</p>}
    </div>
  )
}

export default Login