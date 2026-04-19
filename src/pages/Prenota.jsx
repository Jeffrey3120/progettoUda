import { useState, useEffect } from 'react'
import './Prenota.css'

function Prenota() {
  const [aree,        setAree]        = useState([])
  const [mieAttive,   setMieAttive]   = useState([])
  const [messaggio,   setMessaggio]   = useState(null) 
  const [eliminando,  setEliminando]  = useState(null)

  function mostraMsg(tipo, testo) {
    setMessaggio({ tipo, testo })
    setTimeout(() => setMessaggio(null), 3500)
  }

  async function caricaDati() {
    const [r1, r2] = await Promise.all([
      fetch('/api/aree',              { credentials: 'include' }),
      fetch('/api/prenotazioni/mie',  { credentials: 'include' }),
    ])
    if (r1.ok) setAree(await r1.json())
    if (r2.ok) {
      const tutte = await r2.json()
      setMieAttive(tutte.filter((p) => p.attiva && new Date(p.fine) > new Date()))
    }
  }

  useEffect(() => { caricaDati() }, [])

  async function handlePrenota(id) {
    const risposta = await fetch('/api/prenota', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ area_id: id }),
    })
    const dati = await risposta.json()
    if (risposta.ok) {
      mostraMsg('ok', 'Prenotazione confermata!')
      await caricaDati()
    } else {
      mostraMsg('err', dati.error || 'Errore durante la prenotazione.')
    }
  }

  async function handleElimina(prenotazioneId) {
    if (!confirm('Cancellare questa prenotazione?')) return
    setEliminando(prenotazioneId)
    try {
      const r = await fetch(`/api/prenotazioni/${prenotazioneId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || `Errore ${r.status}`)
      mostraMsg('ok', 'Prenotazione cancellata.')
      await caricaDati()
    } catch (err) {
      mostraMsg('err', err.message)
    } finally {
      setEliminando(null)
    }
  }

  return (
    <div className="parcheggi-page">

      {/* ── Header ── */}
      <div className="parcheggi-header">
        <div className="parcheggi-titoli">
          <h2>Prenota un posto</h2>
          <p>Seleziona l'area di sosta desiderata</p>
        </div>
      </div>

      {/* ── Feedback ── */}
      {messaggio && (
        <div className={`alert ${messaggio.tipo === 'ok' ? 'alert-success' : 'alert-error'}`}>
          {messaggio.testo}
        </div>
      )}

      {/* ── Griglia aree ── */}
      <div className="aree-grid">
        {aree.map((area) => {
          const percentuale = ((area.capienza_max - area.posti_disponibili) / area.capienza_max) * 100
          const piena = area.posti_disponibili <= 0

          return (
            <div key={area.id} className={`area-card ${piena ? 'piena' : ''}`}>
              <div className="area-nome">{area.nome}</div>
              <div className="area-stats">
                <span>Disponibili: {area.posti_disponibili}</span>
              </div>
              <div className="barra-sfondo">
                <div className="barra-riempimento" style={{ width: `${percentuale}%` }} />
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

      {/* ── Prenotazioni attive dell'utente ── */}
      {mieAttive.length > 0 && (
        <div className="mie-attive">
          <h3 className="mie-attive-titolo">Le mie prenotazioni attive</h3>
          <div className="mie-attive-lista">
            {mieAttive.map((p) => (
              <div key={p.id} className="prenotazione-attiva-card">
                <div className="pren-info">
                  <span className="pren-area">{p.area_nome}</span>
                  <span className="pren-orario">
                    {new Date(p.inizio).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    {' → '}
                    {new Date(p.fine).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button
                  className="btn-cancella"
                  onClick={() => handleElimina(p.id)}
                  disabled={eliminando === p.id}
                  title="Cancella prenotazione"
                >
                  {eliminando === p.id ? '…' : 'Cancella'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

export default Prenota