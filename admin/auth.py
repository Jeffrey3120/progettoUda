from flask import session, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash


users = {
    "maria": {"password": generate_password_hash("coffani"), "role": "admin"},
    "luigi": {"password": generate_password_hash("verdi"),   "role": "user"},
}


def logged_user():
    """Recupera lo username dalla sessione."""
    return session.get("user")


def require_login():
    """Restituisce 401 se l'utente non è autenticato."""
    if not logged_user():
        return jsonify({"error": "Non autenticato"}), 401
    return None


def require_admin():
    """Restituisce 403 se l'utente non è admin."""
    if session.get("role") != "admin":
        return jsonify({"error": "Permessi insufficienti"}), 403
    return None


def login():
    data     = request.get_json() or {}
    username = data.get("username", "")
    password = data.get("password", "")

    user = users.get(username)
    if user and check_password_hash(user["password"], password):
        session["user"] = username
        session["role"] = user["role"]
        return jsonify({
            "message": "Login effettuato",
            "user":    username,
            "role":    session["role"],
        }), 200

    return jsonify({"error": "Credenziali errate"}), 401


def logout():
    session.clear()
    return jsonify({"message": "Logout effettuato"}), 200