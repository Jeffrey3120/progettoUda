import { useState, useEffect } from 'react'
import './style.css'

function Prenota() {
  const [aree, setAree] = useState([])
  const [areaScelta, setAreaScelta] = useState('')
  const [messaggio, setMessaggio] = useState('')

  useEffect(() => {
    fetch('http://localhost:3000/api/parcheggi/disponibilita', { credentials: 'include' })
      .then((r) => r.json())
      .then((dati) => setAree(dati))
  }, [])

  async function handlePrenota() {
    if (!areaScelta) {
      setMessaggio('Scegli prima un area!')
      return
    }

    const risposta = await fetch('http://localhost:3000/api/prenota', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ area_id: areaScelta })
    })

    const dati = await risposta.json()

    if (risposta.ok) {
      setMessaggio('Prenotazione confermata! Durata: 1 ora')
    } else {
      setMessaggio('Errore: ' + dati.error)
    }
  }

  return (
    <div className="container-user">
      <div className="box-prenotazione">
        <h2 className="titolo-sezione">Prenota un posto</h2>

        <select 
          className="select-area" 
          value={areaScelta} 
          onChange={(e) => setAreaScelta(e.target.value)}
        >
          <option value="">-- Scegli un area --</option>
          {aree.map((area) => (
            <option key={area.id} value={area.id} disabled={area.posti_disponibili <= 0}>
              {area.nome || 'Area ' + area.id} ({area.posti_disponibili} posti liberi)
            </option>
          ))}
        </select>

        <br /><br />
        <button className="bottone-conferma" onClick={handlePrenota}>
          Conferma prenotazione
        </button>

        {messaggio && (
          <div className={`messaggio-stato ${messaggio.includes('Errore') ? 'errore' : 'successo'}`}>
            {messaggio}
          </div>
        )}
      </div>
    </div>
  )
}

export default Prenota