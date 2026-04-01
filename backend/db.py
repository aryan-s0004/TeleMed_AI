from __future__ import annotations

import sqlite3
from typing import Any, Callable, Iterable

from core.config import get_settings
from utils.ids import generate_numeric_id
from utils.security import hash_password
from utils.seed_data import DOCTOR_SEEDS

settings = get_settings()


def get_connection() -> sqlite3.Connection:
    settings.database_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(settings.database_path, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def row_to_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    return dict(row) if row else None


def fetch_one(query: str, params: Iterable[Any] = ()) -> dict[str, Any] | None:
    with get_connection() as connection:
        row = connection.execute(query, tuple(params)).fetchone()
    return row_to_dict(row)


def fetch_all(query: str, params: Iterable[Any] = ()) -> list[dict[str, Any]]:
    with get_connection() as connection:
        rows = connection.execute(query, tuple(params)).fetchall()
    return [dict(row) for row in rows]


def run_in_transaction(callback: Callable[[sqlite3.Connection], Any]) -> Any:
    with get_connection() as connection:
        result = callback(connection)
        connection.commit()
        return result


def generate_unique_user_id(connection: sqlite3.Connection) -> str:
    while True:
        candidate = generate_numeric_id(5)
        exists = connection.execute("SELECT 1 FROM users WHERE unique_id = ?", (candidate,)).fetchone()
        if not exists:
            return candidate


def _ensure_column(connection: sqlite3.Connection, name: str, definition: str) -> None:
    try:
        connection.execute(f"ALTER TABLE users ADD COLUMN {name} {definition}")
    except sqlite3.OperationalError:
        pass


def _seed_doctors(connection: sqlite3.Connection) -> None:
    default_password = hash_password("doctor123")
    for doctor in DOCTOR_SEEDS:
        existing = connection.execute(
            "SELECT id, unique_id FROM users WHERE email = ?",
            (doctor["email"],),
        ).fetchone()
        if existing:
            connection.execute(
                """
                UPDATE users
                SET name = ?, role = 'doctor', specialization = ?, qualification = ?, experience = ?, timeslots = ?
                WHERE email = ?
                """,
                (
                    doctor["name"],
                    doctor["specialization"],
                    doctor["qualification"],
                    doctor["experience"],
                    doctor["timeslots"],
                    doctor["email"],
                ),
            )
            if not existing["unique_id"]:
                connection.execute(
                    "UPDATE users SET unique_id = ? WHERE id = ?",
                    (generate_unique_user_id(connection), existing["id"]),
                )
            continue

        connection.execute(
            """
            INSERT INTO users (
                name, email, password, role, specialization, qualification, experience, timeslots, unique_id
            ) VALUES (?, ?, ?, 'doctor', ?, ?, ?, ?, ?)
            """,
            (
                doctor["name"],
                doctor["email"],
                default_password,
                doctor["specialization"],
                doctor["qualification"],
                doctor["experience"],
                doctor["timeslots"],
                generate_unique_user_id(connection),
            ),
        )


def init_db() -> None:
    settings.database_path.parent.mkdir(parents=True, exist_ok=True)
    with get_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'patient',
                specialization TEXT DEFAULT '',
                qualification TEXT DEFAULT '',
                experience TEXT DEFAULT '',
                timeslots TEXT DEFAULT '',
                weight TEXT DEFAULT '',
                height TEXT DEFAULT '',
                blood_group TEXT DEFAULT '',
                phone TEXT DEFAULT '',
                age TEXT DEFAULT '',
                sex TEXT DEFAULT '',
                unique_id TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS appointments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                reason TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS medical_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                diagnosis TEXT NOT NULL,
                prescription TEXT DEFAULT '',
                notes TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS video_calls (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                room TEXT NOT NULL,
                patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                doctor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP,
                duration TEXT DEFAULT ''
            );

            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
            CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
            CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
            CREATE INDEX IF NOT EXISTS idx_records_patient ON medical_records(patient_id);
            CREATE INDEX IF NOT EXISTS idx_calls_room ON video_calls(room);
            """
        )

        for column_name, column_definition in [
            ("qualification", "TEXT DEFAULT ''"),
            ("experience", "TEXT DEFAULT ''"),
            ("timeslots", "TEXT DEFAULT ''"),
            ("weight", "TEXT DEFAULT ''"),
            ("height", "TEXT DEFAULT ''"),
            ("blood_group", "TEXT DEFAULT ''"),
            ("phone", "TEXT DEFAULT ''"),
            ("age", "TEXT DEFAULT ''"),
            ("sex", "TEXT DEFAULT ''"),
            ("unique_id", "TEXT DEFAULT ''"),
        ]:
            _ensure_column(connection, column_name, column_definition)

        rows = connection.execute("SELECT id, unique_id FROM users").fetchall()
        for row in rows:
            if row["unique_id"]:
                continue
            connection.execute(
                "UPDATE users SET unique_id = ? WHERE id = ?",
                (generate_unique_user_id(connection), row["id"]),
            )

        _seed_doctors(connection)
        connection.commit()
