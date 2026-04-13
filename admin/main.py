# Backend SmartCity – Gestione Parcheggi

from flask import Flask, request, jsonify, session
import uuid
from datetime import datetime, timedelta
from collections import defaultdict

from auth import require_login, require_admin, login, logout

app = Flask(__name__)
app.secret_key = "chiavesegretissima"



# Aree di parcheggio: { id, nome, capienza_max, posti_disponibili }
aree = [
    {"id": "area-001", "nome": "Parcheggio Centrale",  "capienza_max": 50, "posti_disponibili": 50},
    {"id": "area-002", "nome": "Parcheggio Stazione",  "capienza_max": 30, "posti_disponibili": 30},
]

# Prenotazioni: { id, user, area_id, inizio, fine, attiva }
prenotazioni = []



def ora():
    return datetime.now()

def scade_tra_un_ora():
    return ora() + timedelta(hours=1)

def aggiorna_disponibilita():
    """Marca come non attive le prenotazioni scadute e libera i posti."""
    now = ora()
    for p in prenotazioni:
        if p["attiva"] and now > p["fine"]:
            p["attiva"] = False
            for area in aree:
                if area["id"] == p["area_id"]:
                    area["posti_disponibili"] = min(
                        area["posti_disponibili"] + 1,
                        area["capienza_max"]
                    )



@app.post("/api/login")
def login_route():
    return login()

@app.post("/api/logout")
def logout_route():
    return logout()



@app.get("/")
def home():
    return "SmartCity Parking – Server attivo"

@app.get("/api/aree")
def get_aree():
    """Visualizza tutte le aree di parcheggio con i posti disponibili."""
    auth = require_login()
    if auth:
        return auth

    aggiorna_disponibilita()
    return jsonify(aree), 200

@app.post("/api/prenota")
def prenota():
    """Prenota un posto in un'area (durata automatica: 1 ora)."""
    auth = require_login()
    if auth:
        return auth

    aggiorna_disponibilita()

    data = request.get_json() or {}
    area_id = data.get("area_id")

    # cerca l'area
    area = next((a for a in aree if a["id"] == area_id), None)
    if not area:
        return jsonify({"error": "Area non trovata"}), 404

    if area["posti_disponibili"] <= 0:
        return jsonify({"error": "Nessun posto disponibile in quest'area"}), 409

    # crea prenotazione
    inizio = ora()
    fine   = scade_tra_un_ora()
    nuova = {
        "id":      str(uuid.uuid4()),
        "user":    session["user"],
        "area_id": area_id,
        "area_nome": area["nome"],
        "inizio":  inizio.isoformat(),
        "fine":    fine.isoformat(),
        "attiva":  True,
    }
    prenotazioni.append(nuova)
    area["posti_disponibili"] -= 1

    return jsonify(nuova), 201

@app.get("/api/prenotazioni/mie")
def get_mie_prenotazioni():
    """Storico delle prenotazioni dell'utente loggato."""
    auth = require_login()
    if auth:
        return auth

    aggiorna_disponibilita()
    utente = session["user"]
    mie = [p for p in prenotazioni if p["user"] == utente]
    return jsonify(mie), 200


@app.post("/api/aree")
def crea_area():
    """
    [ADMIN] Aggiunge una nuova area di parcheggio.
    Body JSON: { "id": "...", "nome": "..." (opzionale), "capienza_max": N }
    """
    auth = require_login()
    if auth:
        return auth
    admin = require_admin()
    if admin:
        return admin

    data = request.get_json() or {}

    area_id      = data.get("id", str(uuid.uuid4()))
    nome         = data.get("nome", "Area senza nome")
    capienza_max = data.get("capienza_max")

    if not capienza_max or not isinstance(capienza_max, int) or capienza_max <= 0:
        return jsonify({"error": "capienza_max deve essere un intero positivo"}), 400

    # id duplicato?
    if any(a["id"] == area_id for a in aree):
        return jsonify({"error": f"Esiste già un'area con id '{area_id}'"}), 409

    nuova_area = {
        "id":                area_id,
        "nome":              nome,
        "capienza_max":      capienza_max,
        "posti_disponibili": capienza_max,   # all'inizio tutti liberi
    }
    aree.append(nuova_area)
    return jsonify(nuova_area), 201


@app.get("/api/prenotazioni/tutte")
def get_tutte_prenotazioni():
    """
    [ADMIN] Restituisce lo storico completo delle prenotazioni di tutti gli utenti.
    Parametri query opzionali:
      - area_id   filtra per area
      - user      filtra per utente
      - attiva    "true"/"false" filtra per stato
    """
    auth = require_login()
    if auth:
        return auth
    admin = require_admin()
    if admin:
        return admin

    aggiorna_disponibilita()

    risultati = list(prenotazioni)  # copia

    # filtri opzionali
    filtro_area  = request.args.get("area_id")
    filtro_user  = request.args.get("user")
    filtro_attiva = request.args.get("attiva")

    if filtro_area:
        risultati = [p for p in risultati if p["area_id"] == filtro_area]
    if filtro_user:
        risultati = [p for p in risultati if p["user"] == filtro_user]
    if filtro_attiva is not None:
        flag = filtro_attiva.lower() == "true"
        risultati = [p for p in risultati if p["attiva"] == flag]

    return jsonify({
        "totale": len(risultati),
        "prenotazioni": risultati
    }), 200


@app.get("/api/statistiche/andamento")
def get_andamento():
    """
    [ADMIN] Per ciascuna area, restituisce il numero di prenotazioni
    giorno per giorno negli ultimi 30 giorni.

    Risposta:
    {
      "area-001": {
        "nome": "Parcheggio Centrale",
        "giorni": {
          "2025-03-15": 3,
          "2025-03-16": 7,
          ...
        }
      },
      ...
    }
    """
    auth = require_login()
    if auth:
        return auth
    admin = require_admin()
    if admin:
        return admin

    oggi   = ora().date()
    limite = oggi - timedelta(days=29)   # ultimi 30 giorni (oggi incluso)

    # prepara struttura: area_id -> { "nome": ..., "giorni": { data: count } }
    andamento = {}
    for area in aree:
        # inizializza tutti e 30 i giorni a 0
        giorni = {}
        for i in range(30):
            giorno = (limite + timedelta(days=i)).isoformat()
            giorni[giorno] = 0
        andamento[area["id"]] = {
            "nome":   area["nome"],
            "giorni": giorni
        }

    # conta le prenotazioni per area e giorno
    for p in prenotazioni:
        data_prenotazione = datetime.fromisoformat(p["inizio"]).date()
        if limite <= data_prenotazione <= oggi:
            area_id = p["area_id"]
            if area_id in andamento:
                giorno_str = data_prenotazione.isoformat()
                andamento[area_id]["giorni"][giorno_str] += 1

    return jsonify(andamento), 200


if __name__ == "__main__":
    app.run("0.0.0.0", 11000, debug=True)