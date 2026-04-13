import { useState, useEffect } from 'react'

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
      setMessaggio('✅ Prenotazione confermata! Durata: 1 ora')
    } else {
      setMessaggio('❌ Errore: ' + dati.error)
    }
  }

  return (
    <div>
      <h2>Prenota un posto</h2>

      <select value={areaScelta} onChange={(e) => setAreaScelta(e.target.value)}>
        <option value="">-- Scegli un area --</option>
        {aree.map((area) => (
          <option key={area.id} value={area.id} disabled={area.posti_disponibili <= 0}>
            {area.nome || 'Area ' + area.id} ({area.posti_disponibili} posti liberi)
          </option>
        ))}
      </select>

      <br /><br />
      <button onClick={handlePrenota}>Conferma prenotazione</button>

      {messaggio && <p>{messaggio}</p>}
    </div>
  )
}

export default Prenota