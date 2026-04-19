# seed.py – popola il database con alcune aree di esempio.
# Esegui UNA SOLA VOLTA dopo aver avviato l'app almeno una volta
# (così db.create_all() ha già creato le tabelle).
#
from main import app, db
from main import Area

AREE_INIZIALI = [
    {"id": "area-001", "nome": "Parcheggio Centrale",  "capienza_max": 50},
    {"id": "area-002", "nome": "Parcheggio Stazione",  "capienza_max": 30},
]

with app.app_context():
    for dati in AREE_INIZIALI:
        if not Area.query.get(dati["id"]):
            area = Area(
                id                = dati["id"],
                nome              = dati["nome"],
                capienza_max      = dati["capienza_max"],
                posti_disponibili = dati["capienza_max"],
            )
            db.session.add(area)
    db.session.commit()
    print("Seed completato.")