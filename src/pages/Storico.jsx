import { useState, useEffect, useCallback } from 'react'
import './Storico.css'

function GraficoLinee({ giorni }) {
  const entries = Object.entries(giorni)
  const valori  = entries.map(([, v]) => v)
  const maxVal  = Math.max(...valori, 1)
  const W = 620, H = 160, PAD = { top: 16, right: 16, bottom: 36, left: 32 }
  const innerW  = W - PAD.left - PAD.right
  const innerH  = H - PAD.top  - PAD.bottom
  const n       = entries.length

  const pts = entries.map(([, v], i) => ({
    x: PAD.left + (i / Math.max(n - 1, 1)) * innerW,
    y: PAD.top  + innerH - (v / maxVal) * innerH,
  }))

  const linea = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const fill  = `${linea} L${pts[pts.length-1].x},${PAD.top+innerH} L${pts[0].x},${PAD.top+innerH} Z`
  const labelX = entries.map(([d], i) => ({ d, i })).filter((_, i) => i % 7 === 0 || i === n-1)
  const ticksY = [0, 0.5, 1].map((f) => ({ y: PAD.top + innerH - f * innerH, val: Math.round(f * maxVal) }))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="grafico-svg" aria-label="Andamento prenotazioni">
      <defs>
        <linearGradient id="gradLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#01696f" />
          <stop offset="100%" stopColor="#20a8b0" />
        </linearGradient>
        <linearGradient id="gradFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#01696f" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#01696f" stopOpacity="0"   />
        </linearGradient>
      </defs>
      {ticksY.map(({ y, val }) => (
        <g key={y}>
          <line x1={PAD.left} x2={PAD.left+innerW} y1={y} y2={y} stroke="#e8ecec" strokeWidth="1" strokeDasharray="4 3" />
          <text x={PAD.left-5} y={y+4} textAnchor="end" fontSize="9" fill="#aab">{val}</text>
        </g>
      ))}
      <path d={fill}  fill="url(#gradFill)" />
      <path d={linea} fill="none" stroke="url(#gradLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke="#01696f" strokeWidth="2" />)}
      {labelX.map(({ d, i }) => (
        <text key={d} x={pts[i].x} y={H-4} textAnchor="middle" fontSize="9" fill="#9aa">{d.slice(5)}</text>
      ))}
    </svg>
  )
}

function Storico() {
  const [prenotazioni, setPrenotazioni] = useState([])
  const [andamento,    setAndamento]    = useState({})
  const [areeList,     setAreeList]     = useState([])  
  const [utentiList,   setUtentiList]   = useState([])   

  const [filtroArea,   setFiltroArea]   = useState(null)
  const [filtroUtente, setFiltroUtente] = useState(null)

  const [caricamento,  setCaricamento]  = useState(true)
  const [errore,       setErrore]       = useState(null)
  const [feedback,     setFeedback]     = useState(null)
  const [eliminando,   setEliminando]   = useState(null)

  function mostraFeedback(tipo, testo) {
    setFeedback({ tipo, testo })
    setTimeout(() => setFeedback(null), 3500)
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/statistiche/andamento', { credentials: 'include' }),
      fetch('/api/utenti',                { credentials: 'include' }),
    ]).then(async ([r1, r2]) => {
      if (r1.ok) {
        const d = await r1.json()
        setAndamento(d)
        setAreeList(Object.entries(d).map(([id, { nome }]) => ({ id, nome })))
      }
      if (r2.ok) setUtentiList(await r2.json())
    })
  }, [])

  const caricaPrenotazioni = useCallback(async () => {
    setCaricamento(true)
    setErrore(null)
    try {
      const params = new URLSearchParams()
      if (filtroArea)   params.set('area_id', filtroArea)
      if (filtroUtente) params.set('user',    filtroUtente)

      const url = `/api/prenotazioni/tutte${params.toString() ? '?' + params : ''}`
      const r = await fetch(url, { credentials: 'include' })
      if (!r.ok) throw new Error(`Errore ${r.status}`)
      const d = await r.json()
      setPrenotazioni(d.prenotazioni || [])
    } catch (err) {
      setErrore(err.message)
    } finally {
      setCaricamento(false)
    }
  }, [filtroArea, filtroUtente])

  useEffect(() => { caricaPrenotazioni() }, [caricaPrenotazioni])

  async function eliminaPrenotazione(id) {
    if (!confirm('Eliminare questa prenotazione?')) return
    setEliminando(id)
    try {
      const r = await fetch(`/api/prenotazioni/${id}`, { method: 'DELETE', credentials: 'include' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || `Errore ${r.status}`)
      mostraFeedback('ok', d.message || 'Prenotazione eliminata.')
      caricaPrenotazioni()
    } catch (err) {
      mostraFeedback('err', err.message)
    } finally {
      setEliminando(null)
    }
  }

  async function eliminaBulk() {
    let conferma
    if (filtroUtente && filtroArea) {
      conferma = `Eliminare tutte le prenotazioni di "${filtroUtente}" nel "${nomeFiltroArea}"?`
    } else if (filtroUtente) {
      conferma = `Eliminare tutte le prenotazioni di "${filtroUtente}"?`
    } else if (filtroArea) {
      conferma = `Eliminare tutte le prenotazioni dell'area "${nomeFiltroArea}"?`
    } else {
      return 
    }
    if (!confirm(conferma)) return

    try {
      const params = new URLSearchParams()
      if (filtroArea)   params.set('area_id', filtroArea)
      if (filtroUtente) params.set('user',    filtroUtente)

      const r = await fetch(`/api/prenotazioni?${params}`, { method: 'DELETE', credentials: 'include' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || `Errore ${r.status}`)
      mostraFeedback('ok', d.message || 'Prenotazioni eliminate.')
      caricaPrenotazioni()
    } catch (err) {
      mostraFeedback('err', err.message)
    }
  }

  const nomeFiltroArea   = areeList.find(a => a.id === filtroArea)?.nome
  const areeGrafico      = filtroArea ? areeList.filter(a => a.id === filtroArea) : areeList
  const filtriAttivi     = [
    filtroArea    && { chiave: 'area',   label: `Area: ${nomeFiltroArea}`,   reset: () => setFiltroArea(null)   },
    filtroUtente  && { chiave: 'utente', label: `Utente: ${filtroUtente}`,   reset: () => setFiltroUtente(null) },
  ].filter(Boolean)

  return (
    <div className="storico-page">

      <div className="storico-header">
        <div>
          <h2>Storico prenotazioni</h2>
          <p className="storico-sottotitolo">
            {caricamento ? 'Caricamento…' : `${prenotazioni.length} prenotazion${prenotazioni.length === 1 ? 'e' : 'i'}`}
          </p>
        </div>

        <div className="storico-header-azioni">
          <div className="filtro-gruppo">
            <label htmlFor="sel-area">Area</label>
            <select
              id="sel-area"
              value={filtroArea ?? ''}
              onChange={(e) => setFiltroArea(e.target.value || null)}
            >
              <option value="">Tutte le aree</option>
              {areeList.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>

          <div className="filtro-gruppo">
            <label htmlFor="sel-utente">Utente</label>
            <select
              id="sel-utente"
              value={filtroUtente ?? ''}
              onChange={(e) => setFiltroUtente(e.target.value || null)}
            >
              <option value="">Tutti gli utenti</option>
              {utentiList.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {(filtroArea || filtroUtente) && prenotazioni.length > 0 ? (
            <button className="btn-elimina-area" onClick={eliminaBulk}>
              🗑&nbsp;
              {filtroUtente && filtroArea
                ? `Elimina di ${filtroUtente} in area (${prenotazioni.length})`
                : filtroUtente
                ? `Elimina di ${filtroUtente} (${prenotazioni.length})`
                : `Elimina area (${prenotazioni.length})`}
            </button>
          ) : (!filtroArea && !filtroUtente) && (
            <button className="btn-elimina-area" disabled title="Seleziona almeno un filtro">
              🗑 Elimina tutti
            </button>
          )}
        </div>
      </div>

      {filtriAttivi.length > 0 && (
        <div className="filtri-attivi-bar">
          <span className="filtri-label">Filtri attivi:</span>
          {filtriAttivi.map((f) => (
            <span key={f.chiave} className="badge-filtro">
              {f.label}
              <button className="badge-filtro-reset" onClick={f.reset} title="Rimuovi filtro">×</button>
            </span>
          ))}
          <button className="reset-tutti" onClick={() => { setFiltroArea(null); setFiltroUtente(null) }}>
            Rimuovi tutti
          </button>
        </div>
      )}

      {feedback && (
        <div className={`alert-feedback ${feedback.tipo === 'ok' ? 'feedback-ok' : 'feedback-err'}`}>
          {feedback.testo}
        </div>
      )}

      {!filtroUtente && areeGrafico.length > 0 && (
        <section className="sezione-grafici">
          <h3 className="sezione-titolo">Andamento ultimi 30 giorni</h3>
          <div className="grafici-grid">
            {areeGrafico.map((a) =>
              andamento[a.id] ? (
                <div key={a.id} className="grafico-card">
                  <p className="grafico-area-nome">{a.nome}</p>
                  <GraficoLinee giorni={andamento[a.id].giorni} />
                </div>
              ) : null
            )}
          </div>
        </section>
      )}

      <section>
        <h3 className="sezione-titolo">Dettaglio prenotazioni</h3>

        {caricamento ? (
          <p className="stato-caricamento">Caricamento...</p>
        ) : errore ? (
          <p className="stato-caricamento errore">Errore: {errore}</p>
        ) : prenotazioni.length === 0 ? (
          <div className="nessun-dato">Nessuna prenotazione trovata con i filtri selezionati.</div>
        ) : (
          <table className="tabella-storico">
            <thead>
              <tr>
                <th>Area</th>
                <th>Utente</th>
                <th>Inizio</th>
                <th>Fine</th>
                <th>Stato</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {prenotazioni.map((p) => {
                const conclusa = new Date(p.fine) < new Date()
                return (
                  <tr key={p.id} className="riga-prenotazione">
                    <td className="td-area">
                      <span className="area-nome-tag">{p.area_nome}</span>
                      <span className="area-id-tag">{p.area_id}</span>
                    </td>
                    <td>{p.user}</td>
                    <td>{new Date(p.inizio).toLocaleString('it-IT')}</td>
                    <td>{new Date(p.fine).toLocaleString('it-IT')}</td>
                    <td>
                      <span className={`badge-stato ${conclusa ? 'stato-conclusa' : 'stato-attiva'}`}>
                        {conclusa ? 'Conclusa' : 'Attiva'}
                      </span>
                    </td>
                    <td className="td-azioni">
                      <button
                        className="btn-elimina-singola"
                        onClick={() => eliminaPrenotazione(p.id)}
                        disabled={eliminando === p.id}
                        title="Elimina prenotazione"
                      >
                        {eliminando === p.id ? '…' : '🗑'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

export default Storico