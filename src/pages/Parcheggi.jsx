import { useState, useEffect } from 'react'
import './Parcheggi.css'

function Parcheggi({ utente }) {

  const [aree, setAree] = useState([])
  const [errore, setErrore] = useState(null)
  const [caricamento, setCaricamento] = useState(true)
  const [mostraModale, setMostraModale] = useState(false)
  const [nuovaArea, setNuovaArea] = useState({ id: '', nome: '', capienza_max: '' })
  const [invioStato, setInvioStato] = useState(null) 
  const [invioLoading, setInvioLoading] = useState(false)

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

  function apriModale() {
    setNuovaArea({ id: '', nome: '', capienza_max: '' })
    setInvioStato(null)
    setMostraModale(true)
  }

  function chiudiModale() {
    setMostraModale(false)
    setInvioStato(null)
  }

  async function handleCreaArea(e) {
    e.preventDefault()
    setInvioStato(null)
    setInvioLoading(true)

    const payload = {
      nome: nuovaArea.nome,
      capienza_max: parseInt(nuovaArea.capienza_max, 10),
    }
    if (nuovaArea.id.trim()) payload.id = nuovaArea.id.trim()

    try {
      const risposta = await fetch('/api/aree', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const dati = await risposta.json()
      if (!risposta.ok) {
        setInvioStato({ tipo: 'error', msg: dati.error || `Errore ${risposta.status}` })
      } else {
        setInvioStato({ tipo: 'success', msg: `Area "${dati.nome}" creata con successo!` })
        caricaAree()
        setTimeout(() => chiudiModale(), 1500)
      }
    } catch {
      setInvioStato({ tipo: 'error', msg: 'Errore di rete.' })
    } finally {
      setInvioLoading(false)
    }
  }

  if (caricamento) return <div className="stato-caricamento">Caricamento aree...</div>

  const isAdmin = utente?.role === 'admin'

  return (
    <div className="parcheggi-page">

      <div className="parcheggi-header">
        <div className="parcheggi-titoli">
          <h2>Aree di parcheggio</h2>
          <p>{aree.length} {aree.length === 1 ? 'area trovata' : 'aree trovate'}</p>
        </div>
        <div className="header-azioni">
          {isAdmin && (
            <button className="btn-crea" onClick={apriModale}>
              + Crea parcheggio
            </button>
          )}
        </div>
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

      {/* ── MODALE CREA AREA ── */}
      {mostraModale && (
        <div className="modale-overlay" onClick={(e) => e.target === e.currentTarget && chiudiModale()}>
          <div className="modale-card">

            <div className="modale-header">
              <h3>Crea nuovo parcheggio</h3>
              <button className="modale-chiudi" onClick={chiudiModale} aria-label="Chiudi">✕</button>
            </div>

            <form className="modale-form" onSubmit={handleCreaArea}>

              <div className="input-group">
                <label>Nome parcheggio <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="es. Parcheggio Ospedale"
                  value={nuovaArea.nome}
                  onChange={(e) => setNuovaArea({ ...nuovaArea, nome: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label>Capienza massima <span className="required">*</span></label>
                <input
                  type="number"
                  min="1"
                  placeholder="es. 20"
                  value={nuovaArea.capienza_max}
                  onChange={(e) => setNuovaArea({ ...nuovaArea, capienza_max: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label>ID personalizzato <span className="opzionale">(opzionale)</span></label>
                <input
                  type="text"
                  placeholder="es. area-004 (lascia vuoto per ID automatico)"
                  value={nuovaArea.id}
                  onChange={(e) => setNuovaArea({ ...nuovaArea, id: e.target.value })}
                />
              </div>

              {invioStato && (
                <p className={`modale-stato ${invioStato.tipo}`}>{invioStato.msg}</p>
              )}

              <div className="modale-footer">
                <button type="button" className="btn-annulla" onClick={chiudiModale}>
                  Annulla
                </button>
                <button type="submit" className="btn-conferma" disabled={invioLoading}>
                  {invioLoading ? 'Creazione...' : 'Crea parcheggio'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Parcheggi