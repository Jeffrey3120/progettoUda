import { useState, useEffect } from 'react'
import './style.css'

function Storico() {
  const [prenotazioni, setPrenotazioni] = useState([])

  useEffect(() => {
    fetch('http://localhost:3000/api/storico', { credentials: 'include' })
      .then((r) => r.json())
      .then((dati) => setPrenotazioni(dati))
  }, [])

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
              <td>{p.nome_area || 'Area ' + p.area_id}</td>
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