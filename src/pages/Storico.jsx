import { useState, useEffect } from 'react'
import './Storico.css'

function Storico() {
  const [prenotazioni, setPrenotazioni] = useState([])

  useEffect(() => {
    fetch('http://localhost:3000/api/storico', { credentials: 'include' })
      .then((r) => r.json())
      .then((dati) => setPrenotazioni(dati))
  }, [])

  return (
    <div className="storico-page">
      <div className="storico-header">
        <h2>Le mie prenotazioni</h2>
      </div>

      {prenotazioni.length === 0 ? (
        <div className="nessun-dato">Nessuna prenotazione trovata.</div>
      ) : (
        <table className="tabella-storico">
          <tbody>
            {prenotazioni.map((p) => {
              // Verifichiamo se la prenotazione è conclusa confrontando la data di fine con l'ora attuale
              const isConclusa = new Date(p.fine) < new Date();

              return (
                <tr key={p.id} className="riga-prenotazione">
                  <td>{p.nome_area || 'Area ' + p.area_id}</td>
                  <td>Inizio: {new Date(p.inizio).toLocaleString('it-IT')}</td>
                  <td>Fine: {new Date(p.fine).toLocaleString('it-IT')}</td>
                  <td>
                    {isConclusa ? (
                      <span className="badge-stato stato-conclusa">Conclusa</span>
                    ) : (
                      <span className="badge-stato stato-attiva">Attiva</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Storico