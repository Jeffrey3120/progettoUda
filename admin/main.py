from flask import Flask, request, jsonify, session
from flask_cors import CORS
import uuid
from datetime import datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
import os

from admin.analytics import calcola_andamento

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "chiavesegretissima")
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///smartcity.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

from auth import require_login, require_admin, login, logout

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

with app.app_context():
    db.create_all()

def ora():
    return datetime.now()

def scade_tra_un_ora():
    return ora() + timedelta(hours=1)

def aggiorna_disponibilita():

    now     = ora()
    scadute = Prenotazione.query.filter(
        Prenotazione.attiva == True,
        Prenotazione.fine < now
    ).all()
    for p in scadute:
        p.attiva = False
        area = Area.query.get(p.area_id)
        if area:
            area.posti_disponibili = min(area.posti_disponibili + 1, area.capienza_max)
    if scadute:
        db.session.commit()

def _libera_posti(prenotazioni: list):

    aree_da_aggiornare = {}
    for p in prenotazioni:
        if p.attiva:
            aree_da_aggiornare[p.area_id] = aree_da_aggiornare.get(p.area_id, 0) + 1

    for area_id, posti in aree_da_aggiornare.items():
        area = Area.query.get(area_id)
        if area:
            area.posti_disponibili = min(area.posti_disponibili + posti, area.capienza_max)

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

    auth = require_login()
    if auth:
        return auth
    aggiorna_disponibilita()
    return jsonify([a.to_dict() for a in Area.query.all()]), 200

@app.post("/api/prenota")
def prenota():

    auth = require_login()
    if auth:
        return auth
    aggiorna_disponibilita()

    area_id = (request.get_json() or {}).get("area_id")
    area    = Area.query.get(area_id)
    if not area:
        return jsonify({"error": "Area non trovata"}), 404
    if area.posti_disponibili <= 0:
        return jsonify({"error": "Nessun posto disponibile in quest'area"}), 409

    nuova = Prenotazione(
        id        = str(uuid.uuid4()),
        user      = session["user"],
        area_id   = area_id,
        area_nome = area.nome,
        inizio    = ora(),
        fine      = scade_tra_un_ora(),
        attiva    = True,
    )
    area.posti_disponibili -= 1
    db.session.add(nuova)
    db.session.commit()
    return jsonify(nuova.to_dict()), 201

@app.get("/api/prenotazioni/mie")
def get_mie_prenotazioni():

    auth = require_login()
    if auth:
        return auth
    aggiorna_disponibilita()
    mie = Prenotazione.query.filter_by(user=session["user"]).all()
    return jsonify([p.to_dict() for p in mie]), 200

@app.post("/api/aree")
def crea_area():

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

@app.get("/api/utenti")
def get_utenti():

    auth = require_login()
    if auth:
        return auth
    admin = require_admin()
    if admin:
        return admin
    utenti = db.session.query(Prenotazione.user).distinct().all()
    return jsonify([u[0] for u in utenti]), 200

@app.get("/api/prenotazioni/tutte")
def get_tutte_prenotazioni():

    auth = require_login()
    if auth:
        return auth
    admin = require_admin()
    if admin:
        return admin

    aggiorna_disponibilita()
    query = Prenotazione.query

    if area_id := request.args.get("area_id"):
        query = query.filter_by(area_id=area_id)
    if user := request.args.get("user"):
        query = query.filter_by(user=user)
    if (attiva_str := request.args.get("attiva")) is not None:
        query = query.filter_by(attiva=attiva_str.lower() == "true")

    risultati = query.all()
    return jsonify({"totale": len(risultati), "prenotazioni": [p.to_dict() for p in risultati]}), 200

@app.get("/api/statistiche/andamento")
def get_andamento():

    auth = require_login()
    if auth:
        return auth
    admin = require_admin()
    if admin:
        return admin

    prenotazioni = [p.to_dict() for p in Prenotazione.query.all()]
    aree         = [a.to_dict() for a in Area.query.all()]

    andamento = calcola_andamento(
        prenotazioni,
        aree,
        filtro_user = request.args.get("user"),
        filtro_area = request.args.get("area_id"),
    )
    return jsonify(andamento), 200

@app.delete("/api/prenotazioni")
def elimina_prenotazioni():
    auth = require_login()
    if auth:
        return auth

    id_singolo  = request.args.get("id")
    filtro_user = request.args.get("user")
    filtro_area = request.args.get("area_id")

    if id_singolo:
        p = Prenotazione.query.get(id_singolo)
        if not p:
            return jsonify({"error": "Prenotazione non trovata"}), 404
        if session.get("role") != "admin" and p.user != session["user"]:
            return jsonify({"error": "Non puoi eliminare prenotazioni di altri utenti"}), 403
        _libera_posti([p])
        db.session.delete(p)
        db.session.commit()
        return jsonify({"message": "Prenotazione eliminata", "id": id_singolo}), 200

    admin = require_admin()
    if admin:
        return admin

    if not filtro_user and not filtro_area:
        return jsonify({"error": "Specificare almeno un filtro (user o area_id)"}), 400

    query = Prenotazione.query
    if filtro_user:
        query = query.filter_by(user=filtro_user)
    if filtro_area:
        query = query.filter_by(area_id=filtro_area)

    prenotazioni = query.all()
    _libera_posti(prenotazioni)
    for p in prenotazioni:
        db.session.delete(p)
    db.session.commit()

    if filtro_user and filtro_area:
        area = Area.query.get(filtro_area)
        msg = f"Eliminate {len(prenotazioni)} prenotazioni di '{filtro_user}' in '{area.nome if area else filtro_area}'"
    elif filtro_user:
        msg = f"Eliminate {len(prenotazioni)} prenotazioni di '{filtro_user}'"
    else:
        area = Area.query.get(filtro_area)
        msg = f"Eliminate {len(prenotazioni)} prenotazioni dell'area '{area.nome if area else filtro_area}'"

    return jsonify({"message": msg, "eliminate": len(prenotazioni)}), 200

if __name__ == "__main__":
    app.run("0.0.0.0", 11000, debug=True)