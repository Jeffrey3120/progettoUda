const API_BASE = "/api"; // URL del backend REST 

// Gestione Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    // Logica di autenticazione che riceve il cookie di sessione dal server 
    const credentials = { /* ... */ };
    loginUser(credentials);
});

// 1 & 2) Visualizza aree e posti disponibili [cite: 4, 5]
async function loadParkingAreas() {
    const response = await fetch(`${API_BASE}/parkings`);
    const areas = await response.json();
    const container = document.getElementById('parking-list');
    
    container.innerHTML = areas.map(area => `
        <div class="card">
            <h3>${area.nome || 'Area ' + area.id}</h3>
            <p>Posti disponibili: <strong>${area.postiLiberi}</strong> / ${area.capienza}</p>
            <button onclick="bookSpot(${area.id})" ${area.postiLiberi === 0 ? 'disabled' : ''}>
                Prenota 1 Ora
            </button>
        </div>
    `).join('');
}

// 3) Prenotazione automatica di 1 ora 
async function bookSpot(areaId) {
    const response = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parkingId: areaId, duration: 1 }) 
    });
    
    if (response.ok) {
        alert("Prenotazione effettuata con successo!");
        loadParkingAreas(); // Aggiorna i dati 
    }
}

// 4) Visualizza lo storico 
async function loadHistory() {
    const response = await fetch(`${API_BASE}/user/bookings`);
    const history = await response.json();
    const body = document.getElementById('history-body');
    
    body.innerHTML = history.map(res => `
        <tr>
            <td>${new Date(res.dataInizio).toLocaleString()}</td>
            <td>${res.areaNome}</td>
            <td>1 ora</td>
            <td>${res.stato}</td>
        </tr>
    `).join('');
}