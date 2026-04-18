import { useState, useEffect } from 'react'
import './style.css'

function Prenota() {

  const [aree, setAree]           = useState([])
  const [areaScelta, setAreaScelta] = useState('')
  const [messaggio, setMessaggio] = useState(null)
  const [tipoMsg, setTipoMsg]     = useState('success')
  const [inCorso, setInCorso]     = useState(false)

  useEffect(() => { caricaAree() }, [])

  async function caricaAree() {
    try {
      const risposta = await fetch('/api/aree', { credentials: 'include' })
      const dati = await risposta.json()
      if (risposta.ok) setAree(dati)
    } catch {
      // aree rimane vuoto
    }
  }

  async function handlePrenota() {
    if (!areaScelta) {
      setMessaggio('Scegli prima un area dal menu.')
      setTipoMsg('warning')
      return
    }

    setMessaggio(null)
    setInCorso(true)

    try {
      const risposta = await fetch('/api/prenota', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area_id: areaScelta }),
      })
      const dati = await risposta.json()

      if (risposta.ok) {
        setMessaggio('Prenotazione confermata! Posto riservato per 1 ora.')
        setTipoMsg('success')
        setAreaScelta('')
        caricaAree()
      } else {
        setMessaggio(dati.error || 'Errore durante la prenotazione.')
        setTipoMsg('error')
      }
    } catch {
      setMessaggio('Errore di rete: il backend è avviato sulla porta 11000?')
      setTipoMsg('error')
    } finally {
      setInCorso(false)
    }
  }

  const areaInfo = aree.find((a) => a.id === areaScelta)

  return (
    <div className="prenota-page">
      <h2>Prenota un posto</h2>
      <p className="prenota-sottotitolo">Seleziona un'area e conferma la prenotazione</p>

      <div className="prenota-card">

        <div className="campo-gruppo">
          <label>Area di parcheggio</label>
          <select
            value={areaScelta}
            onChange={(e) => { setAreaScelta(e.target.value); setMessaggio(null) }}
            disabled={aree.length === 0}
          >
            <option value="">-- Scegli un area --</option>
            {aree.map((area) => (
              <option
                key={area.id}
                value={area.id}
                disabled={area.posti_disponibili <= 0}
              >
                {area.nome} — {area.posti_disponibili > 0
                  ? `${area.posti_disponibili} posti liberi`
                  : 'Pieno'}
              </option>
            ))}
          </select>
        </div>

        {areaInfo && (
          <div className="info-area">
            <span>{areaInfo.nome}</span>
            <span className="info-area-posti">
              {areaInfo.posti_disponibili} / {areaInfo.capienza_max} liberi
            </span>
          </div>
        )}

        <p className="info-durata">La prenotazione ha una durata automatica di 1 ora</p>

        {messaggio && (
          <div className={`alert alert-${tipoMsg}`}>{messaggio}</div>
        )}

        <button
          className="btn-conferma"
          onClick={handlePrenota}
          disabled={inCorso || !areaScelta || (areaInfo && areaInfo.posti_disponibili <= 0)}
        >
          {inCorso ? 'Prenotazione in corso...' : 'Conferma prenotazione'}
        </button>

      </div>
    </div>
  )
}

export default Prenota