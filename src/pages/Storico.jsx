import { useState, useEffect } from 'react'
import './style.css'

function Storico() {
  const [prenotazioni, setPrenotazioni] = useState([])

const [errore, setErrore] = useState(null)
const [caricamento, setCaricamento] = useState(true)

useEffect(() => {
  fetch('/api/prenotazioni/mie', { credentials: 'include' })
    .then((r) => {
      if (!r.ok) throw new Error(`Errore ${r.status}`)
      return r.json()
    })
    .then((dati) => setPrenotazioni(dati))
    .catch((err) => setErrore(err.message))
    .finally(() => setCaricamento(false))
}, [])

if (caricamento) return <p>Caricamento...</p>
if (errore)      return <p>Errore: {errore}</p>
  return (
    <div className="container-user">
      <h2 className="titolo-sezione">Le mie prenotazioni</h2>

      {prenotazioni.length === 0 && <p>Nessuna prenotazione trovata.</p>}

      <table className="tabella-storico">
        <thead>
          <tr>
            <th>Area</th>
            <th>Inizio</th>
            <th>Fine</th>
          </tr>
        </thead>
        <tbody>
          {prenotazioni.map((p) => (
            <tr key={p.id}>
              <td>{p.area_nome || 'Area ' + p.area_id}</td>
              <td>{new Date(p.inizio).toLocaleString('it-IT')}</td>
              <td>{new Date(p.fine).toLocaleString('it-IT')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Storico