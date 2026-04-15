# Backend SmartCity – Gestione Parcheggi

from flask import Flask, request, jsonify, session
from flask_cors import CORS
import uuid
from datetime import datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "chiavesegretissima")
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///smartcity.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
CORS(app, supports_credentials=True)

from auth import require_login, require_admin, login, logout


# ─────────────────────────────────────────
# MODELLI
# ─────────────────────────────────────────

class Area(db.Model):
    id                = db.Column(db.String(50),  primary_key=True)
    nome              = db.Column(db.String(100))
    capienza_max      = db.Column(db.Integer,     nullable=False)
    posti_disponibili = db.Column(db.Integer,     nullable=False)

    def to_dict(self):
        return {
            "id":                self.id,
            "nome":              self.nome,
            "capienza_max":      self.capienza_max,
            "posti_disponibili": self.posti_disponibili,
        }


class Prenotazione(db.Model):
    id        = db.Column(db.String(50),  primary_key=True)
    user      = db.Column(db.String(50),  nullable=False)
    area_id   = db.Column(db.String(50),  db.ForeignKey('area.id'), nullable=False)
    area_nome = db.Column(db.String(100))
    inizio    = db.Column(db.DateTime,    nullable=False)
    fine      = db.Column(db.DateTime,    nullable=False)
    attiva    = db.Column(db.Boolean,     default=True)

    def to_dict(self):
        return {
            "id":        self.id,
            "user":      self.user,
            "area_id":   self.area_id,
            "area_nome": self.area_nome,
            "inizio":    self.inizio.isoformat(),
            "fine":      self.fine.isoformat(),
            "attiva":    self.attiva,
        }


# Crea le tabelle se non esistono
with app.app_context():
    db.create_all()


# ─────────────────────────────────────────
# HELPER
# ─────────────────────────────────────────

def ora():
    return datetime.now()

def scade_tra_un_ora():
    return ora() + timedelta(hours=1)

def aggiorna_disponibilita():
    """Marca come non attive le prenotazioni scadute e libera i posti."""
    now = ora()
    scadute = Prenotazione.query.filter(
        Prenotazione.attiva == True,
        Prenotazione.fine < now
    ).all()

    for p in scadute:
        p.attiva = False
        area = Area.query.get(p.area_id)
        if area:
            area.posti_disponibili = min(
                area.posti_disponibili + 1,
                area.capienza_max
            )

    if scadute:
        db.session.commit()


# ─────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────

@app.post("/api/login")
def login_route():
    return login()

@app.post("/api/logout")
def logout_route():
    return logout()


# ─────────────────────────────────────────
# ROUTE PUBBLICHE / UTENTE
# ─────────────────────────────────────────

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
    aree = Area.query.all()
    return jsonify([a.to_dict() for a in aree]), 200


@app.post("/api/prenota")
def prenota():
    """Prenota un posto in un'area (durata automatica: 1 ora)."""
    auth = require_login()
    if auth:
        return auth

    aggiorna_disponibilita()

    data    = request.get_json() or {}
    area_id = data.get("area_id")

    area = Area.query.get(area_id)
    if not area:
        return jsonify({"error": "Area non trovata"}), 404

    if area.posti_disponibili <= 0:
        return jsonify({"error": "Nessun posto disponibile in quest'area"}), 409

    inizio = ora()
    fine   = scade_tra_un_ora()

    nuova = Prenotazione(
        id        = str(uuid.uuid4()),
        user      = session["user"],
        area_id   = area_id,
        area_nome = area.nome,
        inizio    = inizio,
        fine      = fine,
        attiva    = True,
    )
    area.posti_disponibili -= 1

    db.session.add(nuova)
    db.session.commit()

    return jsonify(nuova.to_dict()), 201


@app.get("/api/prenotazioni/mie")
def get_mie_prenotazioni():
    """Storico delle prenotazioni dell'utente loggato."""
    auth = require_login()
    if auth:
        return auth

    aggiorna_disponibilita()
    utente = session["user"]
    mie = Prenotazione.query.filter_by(user=utente).all()
    return jsonify([p.to_dict() for p in mie]), 200


# ─────────────────────────────────────────
# ROUTE ADMIN
# ─────────────────────────────────────────

@app.post("/api/aree")
def crea_area():
    """[ADMIN] Aggiunge una nuova area di parcheggio."""
    auth = require_login()
    if auth:
        return auth
    admin = require_admin()
    if admin:
        return admin

    data         = request.get_json() or {}
    area_id      = data.get("id", str(uuid.uuid4()))
    nome         = data.get("nome", "Area senza nome")
    capienza_max = data.get("capienza_max")

    if not capienza_max or not isinstance(capienza_max, int) or capienza_max <= 0:
        return jsonify({"error": "capienza_max deve essere un intero positivo"}), 400

    if Area.query.get(area_id):
        return jsonify({"error": f"Esiste già un'area con id '{area_id}'"}), 409

    nuova_area = Area(
        id                = area_id,
        nome              = nome,
        capienza_max      = capienza_max,
        posti_disponibili = capienza_max,
    )
    db.session.add(nuova_area)
    db.session.commit()

    return jsonify(nuova_area.to_dict()), 201


@app.get("/api/prenotazioni/tutte")
def get_tutte_prenotazioni():
    """[ADMIN] Storico completo delle prenotazioni con filtri opzionali."""
    auth = require_login()
    if auth:
        return auth
    admin = require_admin()
    if admin:
        return admin

    aggiorna_disponibilita()

    query = Prenotazione.query

    filtro_area   = request.args.get("area_id")
    filtro_user   = request.args.get("user")
    filtro_attiva = request.args.get("attiva")

    if filtro_area:
        query = query.filter_by(area_id=filtro_area)
    if filtro_user:
        query = query.filter_by(user=filtro_user)
    if filtro_attiva is not None:
        flag  = filtro_attiva.lower() == "true"
        query = query.filter_by(attiva=flag)

    risultati = query.all()
    return jsonify({
        "totale":       len(risultati),
        "prenotazioni": [p.to_dict() for p in risultati],
    }), 200


@app.get("/api/statistiche/andamento")
def get_andamento():
    """[ADMIN] Prenotazioni giorno per giorno negli ultimi 30 giorni per area."""
    auth = require_login()
    if auth:
        return auth
    admin = require_admin()
    if admin:
        return admin

    oggi   = ora().date()
    limite = oggi - timedelta(days=29)

    aree = Area.query.all()

    andamento = {}
    for area in aree:
        giorni = {
            (limite + timedelta(days=i)).isoformat(): 0
            for i in range(30)
        }
        andamento[area.id] = {"nome": area.nome, "giorni": giorni}

    prenotazioni = Prenotazione.query.filter(
        Prenotazione.inizio >= datetime.combine(limite, datetime.min.time())
    ).all()

    for p in prenotazioni:
        data_p = p.inizio.date()
        if limite <= data_p <= oggi and p.area_id in andamento:
            andamento[p.area_id]["giorni"][data_p.isoformat()] += 1

    return jsonify(andamento), 200


if __name__ == "__main__":
    app.run("0.0.0.0", 11000, debug=True)