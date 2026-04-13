import { useState, useEffect } from 'react'

function Parcheggi() {

  const [aree, setAree] = useState([])

  useEffect(() => {
    caricaAree()
  }, [])

  async function caricaAree() {
    const risposta = await fetch('http://localhost:3000/api/parcheggi/disponibilita', {
      credentials: 'include'
    })
    const dati = await risposta.json()
    setAree(dati)
  }

  return (
    <div>
      <h2>Aree di parcheggio</h2>
      <button onClick={caricaAree}>Aggiorna</button>

      <table border="1">
        <thead>
          <tr>
            <th>Nome area</th>
            <th>Capienza totale</th>
            <th>Posti liberi</th>
          </tr>
        </thead>
        <tbody>
          {aree.map((area) => (
            <tr key={area.id}>
              <td>{area.nome || 'Area ' + area.id}</td>
              <td>{area.capienza_massima}</td>
              <td>{area.posti_disponibili}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Parcheggi