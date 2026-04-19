import { useState, useEffect, useCallback, useRef } from 'react'
import './Storico.css'

function GraficoLinee({ serie, nomeArea }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !serie?.length) return

    const renderChart = (Chart) => {
      if (chartRef.current) chartRef.current.destroy()
      chartRef.current = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels: serie.map(p => p.data.slice(5)),
          datasets: [{
            label:                nomeArea,
            data:                 serie.map(p => p.prenotazioni),
            borderColor:          '#01696f',
            backgroundColor:      'rgba(1,105,111,0.08)',
            borderWidth:          2.5,
            pointRadius:          3,
            pointBackgroundColor: '#fff',
            pointBorderColor:     '#01696f',
            pointBorderWidth:     2,
            tension:              0.3,
            fill:                 true,
          }],
        },
        options: {
          responsive:          true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: (items) => `Data: ${items[0].label}`,
                label: (item)  => ` ${item.raw} prenotazion${item.raw === 1 ? 'e' : 'i'}`,
              },
            },
          },
          scales: {
            x: {
              grid:  { display: false },
              ticks: { font: { size: 9 }, color: '#9aa', maxTicksLimit: 8 },
            },
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, precision: 0, font: { size: 9 }, color: '#9aa' },
              grid:  { color: '#f0f0f0' },
            },
          },
        },
      })
    }

    if (window.Chart) {
      renderChart(window.Chart)
    } else {
      const script    = document.createElement('script')
      script.src      = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
      script.onload   = () => renderChart(window.Chart)
      document.head.appendChild(script)
    }

    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [serie, nomeArea])

  return <canvas ref={canvasRef} className="grafico-canvas" />
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
      fetch('/api/aree',   { credentials: 'include' }),
      fetch('/api/utenti', { credentials: 'include' }),
    ]).then(async ([r1, r2]) => {
      if (r1.ok) setAreeList((await r1.json()).map(a => ({ id: a.id, nome: a.nome })))
      if (r2.ok) setUtentiList(await r2.json())
    })
  }, [])

  const caricaDati = useCallback(async () => {
    setCaricamento(true)
    setErrore(null)
    try {
      const params = new URLSearchParams()
      if (filtroArea)   params.set('area_id', filtroArea)
      if (filtroUtente) params.set('user',    filtroUtente)
      const qs = params.toString()

      const [r1, r2] = await Promise.all([
        fetch(`/api/prenotazioni/tutte${qs ? '?' + qs : ''}`,    { credentials: 'include' }),
        fetch(`/api/statistiche/andamento${qs ? '?' + qs : ''}`, { credentials: 'include' }),
      ])
      if (!r1.ok) throw new Error(`Prenotazioni: errore ${r1.status}`)
      if (!r2.ok) throw new Error(`Andamento: errore ${r2.status}`)

      setPrenotazioni((await r1.json()).prenotazioni || [])
      setAndamento(await r2.json())
    } catch (err) {
      setErrore(err.message)
    } finally {
      setCaricamento(false)
    }
  }, [filtroArea, filtroUtente])

  useEffect(() => { caricaDati() }, [caricaDati])

  async function eliminaPrenotazione(id) {
    if (!confirm('Eliminare questa prenotazione?')) return
    setEliminando(id)
    try {
      const r = await fetch(`/api/prenotazioni?id=${id}`, { method: 'DELETE', credentials: 'include' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || `Errore ${r.status}`)
      mostraFeedback('ok', d.message)
      caricaDati()
    } catch (err) {
      mostraFeedback('err', err.message)
    } finally {
      setEliminando(null)
    }
  }

  async function svuotaRisultati() {
    const nomeFiltroArea = areeList.find(a => a.id === filtroArea)?.nome
    let conferma
    if (filtroUtente && filtroArea)
      conferma = `Eliminare tutte le prenotazioni di "${filtroUtente}" nel "${nomeFiltroArea}"?`
    else if (filtroUtente)
      conferma = `Eliminare tutte le prenotazioni di "${filtroUtente}"?`
    else if (filtroArea)
      conferma = `Eliminare tutte le prenotazioni dell'area "${nomeFiltroArea}"?`
    else return

    if (!confirm(conferma)) return

    try {
      const params = new URLSearchParams()
      if (filtroArea)   params.set('area_id', filtroArea)
      if (filtroUtente) params.set('user',    filtroUtente)

      const r = await fetch(`/api/prenotazioni?${params}`, { method: 'DELETE', credentials: 'include' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || `Errore ${r.status}`)
      mostraFeedback('ok', d.message)
      caricaDati()
    } catch (err) {
      mostraFeedback('err', err.message)
    }
  }

  const nomeFiltroArea = areeList.find(a => a.id === filtroArea)?.nome
  const filtriAttivi   = [
    filtroArea   && { chiave: 'area',   label: `Area: ${nomeFiltroArea}`, reset: () => setFiltroArea(null)   },
    filtroUtente && { chiave: 'utente', label: `Utente: ${filtroUtente}`, reset: () => setFiltroUtente(null) },
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
            <select id="sel-area" value={filtroArea ?? ''} onChange={(e) => setFiltroArea(e.target.value || null)}>
              <option value="">Tutte le aree</option>
              {areeList.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>

          <div className="filtro-gruppo">
            <label htmlFor="sel-utente">Utente</label>
            <select id="sel-utente" value={filtroUtente ?? ''} onChange={(e) => setFiltroUtente(e.target.value || null)}>
              <option value="">Tutti gli utenti</option>
              {utentiList.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {(filtroArea || filtroUtente) && prenotazioni.length > 0 ? (
            <button className="btn-elimina-area" onClick={svuotaRisultati}>
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
          {filtriAttivi.map(f => (
            <span key={f.chiave} className="badge-filtro">
              {f.label}
              <button className="badge-filtro-reset" onClick={f.reset} title="Rimuovi">×</button>
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

      {!caricamento && Object.keys(andamento).length > 0 && (
        <section className="sezione-grafici">
          <h3 className="sezione-titolo">Andamento ultimi 30 giorni</h3>
          <div className="grafici-grid">
            {Object.entries(andamento).map(([areaId, { nome, serie }]) => (
              <div key={areaId} className="grafico-card">
                <p className="grafico-area-nome">{nome}</p>
                <GraficoLinee serie={serie} nomeArea={nome} />
              </div>
            ))}
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
              {prenotazioni.map(p => {
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