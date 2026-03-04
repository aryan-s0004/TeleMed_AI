from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_mail import Mail, Message
import sqlite3, hashlib, os, random, string
from datetime import datetime, timedelta
from ml_model import predict_disease

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "telemedicine_secret_2024")
CORS(app, supports_credentials=True, origins=["http://localhost:3000", os.environ.get("FRONTEND_URL", "*")])
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# ── Email Config (Gmail SMTP) ─────────────────────────
app.config["MAIL_SERVER"]         = "smtp.gmail.com"
app.config["MAIL_PORT"]    = 465
app.config["MAIL_USE_TLS"] = False
app.config["MAIL_USE_SSL"] = True
app.config["MAIL_USERNAME"]       = os.environ.get("MAIL_USERNAME", "suryansh.unofficial08@gmail.com")
app.config["MAIL_PASSWORD"]       = os.environ.get("MAIL_PASSWORD", "ttfjngsnnncbjobc")
app.config["MAIL_DEFAULT_SENDER"] = os.environ.get("MAIL_USERNAME", "suryansh.unofficial08@gmail.com")
mail = Mail(app)

DB = "database/telemedicine.db"
os.makedirs("database", exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT NOT NULL,
        email       TEXT UNIQUE NOT NULL,
        password    TEXT NOT NULL,
        role        TEXT DEFAULT 'patient',
        specialization TEXT,
        weight      TEXT DEFAULT '',
        height      TEXT DEFAULT '',
        blood_group TEXT DEFAULT '',
        phone       TEXT DEFAULT '',
        age         TEXT DEFAULT '',
        unique_id   TEXT DEFAULT '',
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS appointments (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER REFERENCES users(id),
        doctor_id  INTEGER REFERENCES users(id),
        date       TEXT NOT NULL,
        time       TEXT NOT NULL,
        reason     TEXT,
        status     TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS medical_records (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id   INTEGER REFERENCES users(id),
        doctor_id    INTEGER REFERENCES users(id),
        diagnosis    TEXT,
        prescription TEXT,
        notes        TEXT,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS video_calls (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        room       TEXT NOT NULL,
        patient_id INTEGER REFERENCES users(id),
        doctor_id  INTEGER REFERENCES users(id),
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at   TIMESTAMP,
        duration   TEXT DEFAULT ''
    );
    """)

    for col_name, col_def in [
        ("weight","TEXT DEFAULT ''"), ("height","TEXT DEFAULT ''"),
        ("blood_group","TEXT DEFAULT ''"), ("phone","TEXT DEFAULT ''"),
        ("age","TEXT DEFAULT ''"), ("unique_id","TEXT DEFAULT ''")
    ]:
        try:
            c.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
        except sqlite3.OperationalError:
            pass

    doctors = [
        ("Dr. Priya Sharma","priya@clinic.com", hashlib.sha256("doctor123".encode()).hexdigest(),"doctor","General Physician"),
        ("Dr. Arjun Mehta", "arjun@clinic.com", hashlib.sha256("doctor123".encode()).hexdigest(),"doctor","Cardiologist"),
        ("Dr. Neha Gupta",  "neha@clinic.com",  hashlib.sha256("doctor123".encode()).hexdigest(),"doctor","Dermatologist"),
    ]
    for d in doctors:
        try:
            c.execute("INSERT INTO users (name,email,password,role,specialization) VALUES (?,?,?,?,?)", d)
        except sqlite3.IntegrityError:
            pass

    users = c.execute("SELECT id, unique_id FROM users").fetchall()
    for user in users:
        if not user[1]:
            while True:
                uid = ''.join(random.choices(string.digits, k=5))
                if not c.execute("SELECT id FROM users WHERE unique_id=?", (uid,)).fetchone():
                    c.execute("UPDATE users SET unique_id=? WHERE id=?", (uid, user[0]))
                    break

    conn.commit()
    conn.close()
    print("✅ Database initialized!")

init_db()
otp_store = {}

def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def generate_unique_id():
    db = get_db()
    while True:
        uid = ''.join(random.choices(string.digits, k=5))
        if not db.execute("SELECT id FROM users WHERE unique_id=?", (uid,)).fetchone():
            return uid

def send_otp_email(email, otp, name, subject="Email Verification", color="#4f46e5", title="Email Verification", msg_text="complete your registration"):
    try:
        msg = Message(subject=f"TeleMed AI — {subject}", recipients=[email])
        msg.html = f"""
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px;">
            <h2 style="color:#4f46e5;">💊 TeleMed AI</h2>
            <h3>{title}</h3>
            <p>Hi <strong>{name}</strong>,</p>
            <p>Use the code below to {msg_text}:</p>
            <div style="background:#f0f4ff;border-radius:10px;padding:20px;text-align:center;margin:24px 0;">
                <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:{color};">{otp}</span>
            </div>
            <p style="color:#64748b;font-size:14px;">Expires in <strong>10 minutes</strong>.</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
            <p style="color:#94a3b8;font-size:12px;">TeleMed AI — AI-Powered Telemedicine Platform</p>
        </div>"""
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

@app.route("/api/send-otp", methods=["POST"])
def send_otp():
    data  = request.json
    name  = data.get("name","User")
    email = data.get("email","").strip().lower()
    if not email: return jsonify({"error":"Email is required"}), 400
    db = get_db()
    if db.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone():
        return jsonify({"error":"Email already registered"}), 409
    otp = generate_otp()
    otp_store[email] = {"otp":otp,"expires_at":datetime.now()+timedelta(minutes=10),"user_data":data}
    if send_otp_email(email, otp, name):
        return jsonify({"message":f"Verification code sent to {email}"}), 200
    return jsonify({"error":"Failed to send email. Check Gmail config."}), 500

@app.route("/api/verify-otp", methods=["POST"])
def verify_otp():
    data  = request.json
    email = data.get("email","").strip().lower()
    code  = data.get("code","").strip()
    if email not in otp_store: return jsonify({"error":"No OTP found. Please register again."}), 400
    stored = otp_store[email]
    if datetime.now() > stored["expires_at"]:
        del otp_store[email]
        return jsonify({"error":"OTP expired. Please register again."}), 400
    if stored["otp"] != code: return jsonify({"error":"Invalid verification code. Try again."}), 400
    ud     = stored["user_data"]
    hashed = hashlib.sha256(ud["password"].encode()).hexdigest()
    try:
        db  = get_db()
        uid = generate_unique_id()
        db.execute("INSERT INTO users (name,email,password,role,unique_id) VALUES (?,?,?,?,?)",
                   (ud["name"], email, hashed, ud.get("role","patient"), uid))
        db.commit()
        del otp_store[email]
        return jsonify({"message":"Registration successful! You can now login."}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error":"Email already exists"}), 409

@app.route("/api/resend-otp", methods=["POST"])
def resend_otp():
    data  = request.json
    email = data.get("email","").strip().lower()
    if email not in otp_store: return jsonify({"error":"Session expired. Please start registration again."}), 400
    stored = otp_store[email]
    stored["otp"] = generate_otp()
    stored["expires_at"] = datetime.now()+timedelta(minutes=10)
    name = stored["user_data"].get("name","User")
    if send_otp_email(email, stored["otp"], name): return jsonify({"message":"New code sent!"}), 200
    return jsonify({"error":"Failed to resend email."}), 500

@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    data  = request.json
    email = data.get("email","").strip().lower()
    db    = get_db()
    user  = db.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    if not user: return jsonify({"error":"No account found with this email"}), 404
    otp = generate_otp()
    otp_store[email] = {"otp":otp,"expires_at":datetime.now()+timedelta(minutes=10),
                        "type":"reset","user_data":{"name":user["name"]}}
    if send_otp_email(email, otp, user["name"], subject="Password Reset Code",
                      color="#e11d48", title="Password Reset", msg_text="reset your password"):
        return jsonify({"message":f"Reset code sent to {email}"}), 200
    return jsonify({"error":"Failed to send email."}), 500

@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    data     = request.json
    email    = data.get("email","").strip().lower()
    code     = data.get("code","").strip()
    new_pass = data.get("new_password","")
    if email not in otp_store: return jsonify({"error":"No reset request found. Please try again."}), 400
    stored = otp_store[email]
    if datetime.now() > stored["expires_at"]:
        del otp_store[email]
        return jsonify({"error":"Code expired. Please request again."}), 400
    if stored["otp"] != code: return jsonify({"error":"Invalid code. Try again."}), 400
    if len(new_pass) < 6: return jsonify({"error":"Password must be at least 6 characters"}), 400
    hashed = hashlib.sha256(new_pass.encode()).hexdigest()
    db = get_db()
    db.execute("UPDATE users SET password=? WHERE email=?", (hashed, email))
    db.commit()
    del otp_store[email]
    return jsonify({"message":"Password reset successful! You can now login."}), 200

@app.route("/api/login", methods=["POST"])
def login():
    data   = request.json
    hashed = hashlib.sha256(data["password"].encode()).hexdigest()
    db     = get_db()
    user   = db.execute("SELECT * FROM users WHERE email=? AND password=?",
                        (data["email"], hashed)).fetchone()
    if user:
        session["user_id"] = user["id"]
        return jsonify({"id":user["id"],"name":user["name"],"role":user["role"],"unique_id":user["unique_id"]})
    return jsonify({"error":"Invalid email or password"}), 401

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message":"Logged out"})

@app.route("/api/profile/<int:user_id>", methods=["GET"])
def get_profile(user_id):
    db   = get_db()
    user = db.execute(
        "SELECT id,name,email,role,weight,height,blood_group,phone,age,unique_id,specialization FROM users WHERE id=?",
        (user_id,)).fetchone()
    if not user: return jsonify({"error":"User not found"}), 404
    return jsonify(dict(user))

@app.route("/api/profile/<int:user_id>", methods=["PUT"])
def update_profile(user_id):
    data = request.json
    db   = get_db()
    db.execute("UPDATE users SET name=?,weight=?,height=?,blood_group=?,phone=?,age=? WHERE id=?",
               (data.get("name",""), data.get("weight",""), data.get("height",""),
                data.get("blood_group",""), data.get("phone",""), data.get("age",""), user_id))
    db.commit()
    return jsonify({"message":"Profile updated successfully!"})

@app.route("/api/profile/<int:user_id>", methods=["DELETE"])
def delete_account(user_id):
    db = get_db()
    db.execute("DELETE FROM appointments    WHERE patient_id=? OR doctor_id=?", (user_id, user_id))
    db.execute("DELETE FROM medical_records WHERE patient_id=? OR doctor_id=?", (user_id, user_id))
    db.execute("DELETE FROM video_calls     WHERE patient_id=? OR doctor_id=?", (user_id, user_id))
    db.execute("DELETE FROM users WHERE id=?", (user_id,))
    db.commit()
    return jsonify({"message":"Account deleted permanently."})

@app.route("/api/user/find/<unique_id>", methods=["GET"])
def find_user_by_uid(unique_id):
    db   = get_db()
    user = db.execute("SELECT id,name,unique_id,role FROM users WHERE unique_id=?", (unique_id,)).fetchone()
    if not user: return jsonify({"error":"No user found with this ID"}), 404
    return jsonify(dict(user))

@app.route("/api/appointments", methods=["GET"])
def get_appointments():
    user_id = request.args.get("user_id")
    role    = request.args.get("role")
    db      = get_db()
    if role == "doctor":
        rows = db.execute(
            "SELECT a.*, u.name as patient_name FROM appointments a JOIN users u ON a.patient_id=u.id WHERE a.doctor_id=?",
            (user_id,)).fetchall()
    else:
        rows = db.execute(
            "SELECT a.*, u.name as doctor_name FROM appointments a JOIN users u ON a.doctor_id=u.id WHERE a.patient_id=?",
            (user_id,)).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/appointments", methods=["POST"])
def book_appointment():
    data = request.json
    db   = get_db()
    db.execute("INSERT INTO appointments (patient_id,doctor_id,date,time,reason,status) VALUES (?,?,?,?,?,?)",
               (data["patient_id"],data["doctor_id"],data["date"],data["time"],data["reason"],"pending"))
    db.commit()
    return jsonify({"message":"Appointment booked"}), 201

@app.route("/api/appointments/<int:apt_id>", methods=["PUT"])
def update_appointment(apt_id):
    data = request.json
    db   = get_db()
    db.execute("UPDATE appointments SET status=? WHERE id=?", (data["status"], apt_id))
    db.commit()
    return jsonify({"message":"Updated"})

@app.route("/api/appointments/<int:apt_id>", methods=["DELETE"])
def delete_appointment(apt_id):
    db = get_db()
    db.execute("DELETE FROM appointments WHERE id=?", (apt_id,))
    db.commit()
    return jsonify({"message":"Deleted"})

@app.route("/api/doctors", methods=["GET"])
def get_doctors():
    db   = get_db()
    rows = db.execute("SELECT id,name,specialization FROM users WHERE role='doctor'").fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/predict", methods=["POST"])
def predict():
    symptoms = request.json.get("symptoms", [])
    return jsonify(predict_disease(symptoms))

@app.route("/api/records/<int:patient_id>", methods=["GET"])
def get_records(patient_id):
    db   = get_db()
    rows = db.execute("SELECT * FROM medical_records WHERE patient_id=? ORDER BY created_at DESC",
                      (patient_id,)).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/records", methods=["POST"])
def add_record():
    data       = request.json
    db         = get_db()
    patient_id = data.get("patient_id")
    unique_id  = data.get("unique_id","")
    if unique_id and not patient_id:
        user = db.execute("SELECT id FROM users WHERE unique_id=?", (unique_id,)).fetchone()
        if not user: return jsonify({"error":"No patient found with this ID"}), 404
        patient_id = user["id"]
    db.execute("INSERT INTO medical_records (patient_id,doctor_id,diagnosis,prescription,notes) VALUES (?,?,?,?,?)",
               (patient_id, data["doctor_id"], data["diagnosis"], data["prescription"], data["notes"]))
    db.commit()
    return jsonify({"message":"Record saved"}), 201

@app.route("/api/calls/start", methods=["POST"])
def start_call():
    data = request.json
    db   = get_db()
    db.execute("INSERT INTO video_calls (room,patient_id,doctor_id) VALUES (?,?,?)",
               (data["room"], data.get("patient_id"), data.get("doctor_id")))
    db.commit()
    return jsonify({"message":"Call started"}), 201

@app.route("/api/calls/end", methods=["POST"])
def end_call():
    data = request.json
    db   = get_db()
    db.execute("UPDATE video_calls SET ended_at=?, duration=? WHERE room=? AND ended_at IS NULL",
               (datetime.now(), data.get("duration",""), data["room"]))
    db.commit()
    return jsonify({"message":"Call ended"})

@app.route("/api/calls/<int:user_id>", methods=["GET"])
def get_call_history(user_id):
    role = request.args.get("role")
    db   = get_db()
    if role == "doctor":
        rows = db.execute("""
            SELECT vc.*, u.name as patient_name FROM video_calls vc
            JOIN users u ON vc.patient_id=u.id
            WHERE vc.doctor_id=? ORDER BY vc.started_at DESC
        """, (user_id,)).fetchall()
    else:
        rows = db.execute("""
            SELECT vc.*, u.name as doctor_name FROM video_calls vc
            JOIN users u ON vc.doctor_id=u.id
            WHERE vc.patient_id=? ORDER BY vc.started_at DESC
        """, (user_id,)).fetchall()
    return jsonify([dict(r) for r in rows])

@socketio.on("join-room")
def on_join(data):
    room = data["room"]
    join_room(room)
    emit("user-joined", {"userId": request.sid}, room=room, skip_sid=request.sid)

@socketio.on("offer")
def on_offer(data):
    emit("offer", data, room=data["room"], skip_sid=request.sid)

@socketio.on("answer")
def on_answer(data):
    emit("answer", data, room=data["room"], skip_sid=request.sid)

@socketio.on("ice-candidate")
def on_ice(data):
    emit("ice-candidate", data, room=data["room"], skip_sid=request.sid)

@socketio.on("leave-room")
def on_leave(data):
    leave_room(data["room"])
    emit("user-left", {}, room=data["room"])

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, debug=False, host="0.0.0.0", port=port)