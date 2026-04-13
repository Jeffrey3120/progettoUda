
function App() {


  const [utente, setUtente] = useState(null)


  const [paginaAttuale, setPaginaAttuale] = useState('parcheggi')


  if (utente === null) {
    return <Login onLoginRiuscito={setUtente} />
  }

  return (
    <div>
      <h1>Smart Parking Brescia</h1>
      <p>Benvenuto, {utente.username}!</p>

      <button onClick={() => setPaginaAttuale('parcheggi')}>Parcheggi</button>
      <button onClick={() => setPaginaAttuale('prenota')}>Prenota</button>
      <button onClick={() => setPaginaAttuale('storico')}>Storico</button>
      <button onClick={() => setUtente(null)}>Logout</button>

      <hr />

      {paginaAttuale === 'parcheggi' && <Parcheggi />}
      {paginaAttuale === 'prenota'   && <Prenota />}
      {paginaAttuale === 'storico'   && <Storico />}
    
    </div>
  )
}

export default App