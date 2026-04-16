import { useState, useEffect } from 'react'
import './Parcheggi.css'

function Parcheggi() {

  const [aree, setAree]               = useState([])
  const [errore, setErrore]           = useState(null)
  const [caricamento, setCaricamento] = useState(true)

  useEffect(() => { caricaAree() }, [])

  async function caricaAree() {
    setErrore(null)
    setCaricamento(true)
    try {
      const risposta = await fetch('/api/aree', { credentials: 'include' })
      const dati = await risposta.json()
      if (!risposta.ok) throw new Error(dati.error || `Errore ${risposta.status}`)
      setAree(dati)
    } catch (err) {
      setErrore(err.message)
    } finally {
      setCaricamento(false)
    }
  }

  if (caricamento) return <div className="stato-caricamento">Caricamento aree...</div>

  return (
    <div className="parcheggi-page">

      <div className="parcheggi-header">
        <div className="parcheggi-titoli">
          <h2>Aree di parcheggio</h2>
          <p>{aree.length} {aree.length === 1 ? 'area trovata' : 'aree trovate'}</p>
        </div>
        <button className="btn-aggiorna" onClick={caricaAree}>Aggiorna</button>
      </div>

      {errore && <div className="alert alert-error">{errore}</div>}

      <div className="aree-grid">
        {aree.map((area) => {
          const occupazione = Math.round(
            ((area.capienza_max - area.posti_disponibili) / area.capienza_max) * 100
          )
          const piena = area.posti_disponibili === 0

          return (
            <div key={area.id} className={`area-card${piena ? ' piena' : ''}`}>

              <p className="area-nome">{area.nome}</p>

              <div className="area-stats">
                <span>Capienza: <strong>{area.capienza_max}</strong></span>
                <span className={`badge-posti ${piena ? 'rosso' : 'verde'}`}>
                  {piena ? 'Pieno' : `${area.posti_disponibili} liberi`}
                </span>
              </div>

              <div className="barra-sfondo">
                <div className="barra-riempimento" style={{ width: `${occupazione}%` }} />
              </div>
              <p className="barra-label">{occupazione}% occupato</p>

            </div>
          )
        })}
      </div>

    </div>
  )
}

export default Parcheggi