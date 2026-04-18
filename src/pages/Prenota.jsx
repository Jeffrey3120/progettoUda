import { useState, useEffect } from 'react'
import './Prenota.css'

function Prenota() {
  const [aree, setAree] = useState([])
  const [messaggio, setMessaggio] = useState('')

  useEffect(() => {
    fetch('http://localhost:3000/api/parcheggi/disponibilita', { credentials: 'include' })
      .then((r) => r.json())
      .then((dati) => setAree(dati))
  }, [])

  async function handlePrenota(id) {
    const risposta = await fetch('http://localhost:3000/api/prenota', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ area_id: id })
    })

    const dati = await risposta.json()

    if (risposta.ok) {
      setMessaggio('Prenotazione confermata!')
    } else {
      setMessaggio('Errore: ' + dati.error)
    }
  }

  return (
    <div className="parcheggi-page">
      <div className="parcheggi-header">
        <div className="parcheggi-titoli">
          <h2>Prenota un posto</h2>
          <p>Seleziona l'area di sosta desiderata</p>
        </div>
      </div>

      {messaggio && (
        <div className={`alert ${messaggio.includes('Errore') ? 'alert-error' : 'alert-success'}`}>
          {messaggio}
        </div>
      )}

      <div className="aree-grid">
        {aree.map((area) => {
          const percentuale = (area.posti_occupati / area.posti_totali) * 100
          const piena = area.posti_disponibili <= 0

          return (
            <div key={area.id} className={`area-card ${piena ? 'piena' : ''}`}>
              <div className="area-nome">{area.nome || 'Area ' + area.id}</div>
              <div className="area-stats">
                <span>Disponibili: {area.posti_disponibili}</span>
              </div>
              
              <div className="barra-sfondo">
                <div className="barra-riempimento" style={{ width: `${percentuale}%` }}></div>
              </div>

              <button 
                className={`btn-prenota ${piena ? 'pieno' : 'disponibile'}`}
                onClick={() => handlePrenota(area.id)}
                disabled={piena}
              >
                {piena ? 'Esaurito' : 'Prenota Ora'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Prenota