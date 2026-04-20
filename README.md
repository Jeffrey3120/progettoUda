<div align="center">

# SmartCity Parking

**Applicazione web full-stack per la gestione intelligente di aree di parcheggio urbano**

Python,
Flask,
React,
SQLite,
Vite

</div>

---

## Descrizione

**SmartCity Parking** è un'applicazione web per la gestione in tempo reale di aree di parcheggio urbano.  
Gli utenti possono visualizzare la disponibilità dei posti ed effettuare prenotazioni; gli amministratori dispongono di strumenti avanzati per il monitoraggio, la gestione delle aree e l'analisi statistica.

---

## Analisi dei Requisiti

### Stakeholder

I soggetti coinvolti nel progetto sono:

- **Utente standard (`user`)** — l'automobilista che utilizza il sistema per visualizzare la disponibilità dei parcheggi, prenotare e cancellare posti
- **Amministratore (`admin`)** — il gestore del sistema, responsabile della creazione delle aree, del monitoraggio delle prenotazioni e dell'analisi statistica

---

### Requisiti Funzionali
> Descrivono **cosa fa il sistema**.

- Il sistema consente l'autenticazione degli utenti tramite username e password
- Il sistema mostra tutte le aree di parcheggio con i posti disponibili aggiornati in tempo reale
- L'utente può prenotare un posto in un'area selezionata, con durata automatica di 1 ora
- L'utente può cancellare le proprie prenotazioni attive
- Il sistema aggiorna automaticamente i posti disponibili allo scadere delle prenotazioni
- L'amministratore può creare nuove aree di parcheggio
- L'amministratore può visualizzare lo storico completo delle prenotazioni con filtri per area e utente
- L'amministratore può eliminare prenotazioni singole o in blocco
- Il sistema espone statistiche sull'andamento delle prenotazioni negli ultimi 30 giorni per area

---

### Requisiti Non Funzionali
> Descrivono **come opera il sistema**.

- **Prestazioni** — la funzione `aggiorna_disponibilita()` viene eseguita in modo sincrono ad ogni chiamata critica per garantire la coerenza dei dati
- **Sicurezza** — le password sono cifrate con hashing PBKDF2 tramite `werkzeug.security`; la `SECRET_KEY` è configurabile tramite variabile d'ambiente
- **Usabilità** — l'interfaccia fornisce feedback visivi immediati tramite alert, stati di caricamento e barre di occupazione percentuale
- **Portabilità** — il frontend è compatibile con i principali browser moderni; il backend è eseguibile su qualsiasi sistema con Python 3 installato
- **Manutenibilità** — le responsabilità sono separate tra `auth.py` e `main.py`; il frontend è organizzato a componenti con CSS isolato per pagina

---

### Requisiti di Dominio
> Derivano dal **contesto applicativo** della gestione parcheggi urbani.

- Una prenotazione occupa esattamente **1 posto** e ha una durata fissa di **1 ora**
- Il numero di `posti_disponibili` non può mai essere negativo né superare la `capienza_max`
- Le prenotazioni con `fine < now` vengono automaticamente marcate `attiva = False` e il posto viene restituito all'area
- Un utente standard può cancellare **solo le proprie** prenotazioni; un amministratore può cancellare qualsiasi prenotazione
- Non è possibile prenotare un posto in un'area con `posti_disponibili = 0`

---

### Requisiti di Vincolo
> Limiti tecnici e organizzativi entro cui il sistema è sviluppato.

- Il backend è sviluppato in **Python 3** con il framework **Flask** e l'ORM **SQLAlchemy**
- Il database utilizzato è **SQLite** (file `smartcity.db`), senza necessità di un server DB esterno
- Il frontend è sviluppato in **React 18** con **Vite** come build tool
- Il backend è esposto sulla porta **11000**; il frontend sulla porta **5173** in fase di sviluppo
- La comunicazione frontend-backend avviene tramite **API REST JSON** con autenticazione basata su **cookie di sessione** (`credentials: 'include'`)
- Le dipendenze Python sono gestite con **uv** tramite `pyproject.toml` e `uv.lock`
---

## Come Avviare il Progetto

### Prerequisiti

- **Python 3.13+** installato sul sistema
- **Node.js** installato sul sistema

### Installazione delle Dipendenze

1. **Dipendenze Python**:
   Esegui `pip install -r requirements.txt` per installare le dipendenze dal file `requirements.txt`.

2. **Dipendenze Frontend**: Esegui `npm install` nella directory principale del progetto per installare tutte le dipendenze JavaScript specificate in `package.json`.

### Avvio dell'Applicazione

1. **Avvia il Backend**: 
   Esegui `python admin/main.py` (assicurati che le dipendenze siano installate nell'ambiente Python attivo).
   Il backend sarà disponibile su `http://localhost:11000`.

2. **Avvia il Frontend**: In un altro terminale, scrivi il comando `npm install` ed esegui `npm run dev`. Il frontend sarà disponibile su `http://localhost:5173` e proxy le richieste API al backend.

3. Apri il browser e vai su `http://localhost:5173` per utilizzare l'applicazione.

### Inizializzazione del Database

- Dopo aver avviato il backend almeno una volta (per permettere a SQLAlchemy di creare le tabelle nel database `smartcity.db`), esegui `python admin/seed.py` per popolare il database con alcune aree di parcheggio di esempio.

---

### Note Aggiuntive

- Assicurati che la variabile d'ambiente `SECRET_KEY` sia impostata per la sicurezza delle sessioni (es. `export SECRET_KEY="tuachiave"`, ha un valore di default se non impostata).
- Il database SQLite `smartcity.db` verrà creato automaticamente nella directory `admin/instance/` alla prima esecuzione.
- Per lo sviluppo, entrambi i server (backend e frontend) possono essere lasciati in esecuzione contemporaneamente.
