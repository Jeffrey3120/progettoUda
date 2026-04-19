<div align="center">

# SmartCity Parking

**Applicazione web full-stack per la gestione intelligente di aree di parcheggio urbano**

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

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
- **Sviluppatore** — il manutentore del sistema, interessato alla manutenibilità, scalabilità ed estensibilità del codice

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
