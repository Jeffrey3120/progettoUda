from flask import session, request, jsonify
 
users = {
    "maria": {"password": "coffani", "role": "admin"},
    "luigi": {"password": "verdi", "role": "user"}
}
 
# recupera lo username dalla sessione
def logged_user():
    return session.get("user")
 
# verifica se l'utente è loggato
def require_login():
    if not logged_user():
        return jsonify({"error": "Non autenticato"}), 401
    return None
 
# verifica se l'utente è admin
def require_admin():
    if session.get("role") != "admin":
        return jsonify({"error": "Permessi insufficienti"}), 403
    return None
 
# login
def login():
    data = request.get_json() or {}
    username = data.get("username", "")
    password = data.get("password", "")
 
    if username in users and users[username]["password"] == password:
        session["user"] = username
        session["role"] = users[username]["role"]
        return jsonify({
            "message": "Login effettuato",
            "user": username,
            "role": session["role"]
        }), 200
 
    return jsonify({"error": "Credenziali errate"}), 401
 
# logout
def logout():
    session.clear()
    return jsonify({"message": "Logout effettuato"}), 200
 













