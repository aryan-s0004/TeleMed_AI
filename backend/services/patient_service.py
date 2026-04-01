from __future__ import annotations

from datetime import datetime, timezone

from db import fetch_all, fetch_one, run_in_transaction
from utils.errors import NotFoundError, ServiceError


def list_doctors() -> list[dict]:
    return fetch_all(
        """
        SELECT id, name, email, specialization, qualification, experience, timeslots, unique_id
        FROM users
        WHERE role = 'doctor'
        ORDER BY specialization, name
        """
    )


def get_profile(user_id: int) -> dict:
    user = fetch_one(
        """
        SELECT id, name, email, role, specialization, qualification, experience, timeslots,
               weight, height, blood_group, phone, age, sex, unique_id, created_at
        FROM users
        WHERE id = ?
        """,
        (user_id,),
    )
    if not user:
        raise NotFoundError("User not found.")
    return user


def update_profile(user_id: int, payload) -> dict:
    def operation(connection):
        cursor = connection.execute(
            """
            UPDATE users
            SET name = ?, phone = ?, age = ?, weight = ?, height = ?, blood_group = ?, sex = ?
            WHERE id = ?
            """,
            (
                payload.name,
                payload.phone,
                payload.age,
                payload.weight,
                payload.height,
                payload.blood_group,
                payload.sex,
                user_id,
            ),
        )
        if cursor.rowcount == 0:
            raise NotFoundError("User not found.")
        return {"message": "Profile updated successfully."}

    return run_in_transaction(operation)


def delete_account(user_id: int) -> dict:
    def operation(connection):
        cursor = connection.execute("DELETE FROM users WHERE id = ?", (user_id,))
        if cursor.rowcount == 0:
            raise NotFoundError("User not found.")
        return {"message": "Account deleted permanently."}

    return run_in_transaction(operation)


def find_user_by_unique_id(unique_id: str) -> dict:
    user = fetch_one(
        "SELECT id, name, unique_id, role FROM users WHERE unique_id = ?",
        (unique_id,),
    )
    if not user:
        raise NotFoundError("No user found with this ID.")
    return user


def list_appointments(user_id: int, role: str) -> list[dict]:
    if role == "doctor":
        return fetch_all(
            """
            SELECT appointments.*, users.name AS patient_name
            FROM appointments
            JOIN users ON users.id = appointments.patient_id
            WHERE appointments.doctor_id = ?
            ORDER BY appointments.date, appointments.time
            """,
            (user_id,),
        )

    return fetch_all(
        """
        SELECT appointments.*, users.name AS doctor_name
        FROM appointments
        JOIN users ON users.id = appointments.doctor_id
        WHERE appointments.patient_id = ?
        ORDER BY appointments.date, appointments.time
        """,
        (user_id,),
    )


def create_appointment(payload) -> dict:
    def operation(connection):
        doctor = connection.execute(
            "SELECT id FROM users WHERE id = ? AND role = 'doctor'",
            (payload.doctor_id,),
        ).fetchone()
        patient = connection.execute(
            "SELECT id FROM users WHERE id = ?",
            (payload.patient_id,),
        ).fetchone()
        if not doctor:
            raise NotFoundError("Selected doctor was not found.")
        if not patient:
            raise NotFoundError("Patient was not found.")

        cursor = connection.execute(
            """
            INSERT INTO appointments (patient_id, doctor_id, date, time, reason, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
            """,
            (
                payload.patient_id,
                payload.doctor_id,
                payload.date,
                payload.time,
                payload.reason,
            ),
        )
        return {"message": "Appointment booked successfully.", "appointment_id": cursor.lastrowid}

    return run_in_transaction(operation)


def update_appointment_status(appointment_id: int, status: str) -> dict:
    def operation(connection):
        cursor = connection.execute(
            "UPDATE appointments SET status = ? WHERE id = ?",
            (status, appointment_id),
        )
        if cursor.rowcount == 0:
            raise NotFoundError("Appointment not found.")
        return {"message": "Appointment updated successfully."}

    return run_in_transaction(operation)


def delete_appointment(appointment_id: int) -> dict:
    def operation(connection):
        cursor = connection.execute("DELETE FROM appointments WHERE id = ?", (appointment_id,))
        if cursor.rowcount == 0:
            raise NotFoundError("Appointment not found.")
        return {"message": "Appointment deleted successfully."}

    return run_in_transaction(operation)


def list_records(patient_id: int) -> list[dict]:
    return fetch_all(
        """
        SELECT medical_records.*, users.name AS doctor_name
        FROM medical_records
        LEFT JOIN users ON users.id = medical_records.doctor_id
        WHERE patient_id = ?
        ORDER BY created_at DESC
        """,
        (patient_id,),
    )


def create_record(payload) -> dict:
    def operation(connection):
        patient_id = payload.patient_id
        if not patient_id and payload.unique_id:
            user = connection.execute(
                "SELECT id FROM users WHERE unique_id = ?",
                (payload.unique_id,),
            ).fetchone()
            if not user:
                raise NotFoundError("No patient found with this ID.")
            patient_id = user["id"]

        if not patient_id:
            raise ServiceError("Patient ID is required to create a record.", 400)

        cursor = connection.execute(
            """
            INSERT INTO medical_records (patient_id, doctor_id, diagnosis, prescription, notes)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                patient_id,
                payload.doctor_id,
                payload.diagnosis,
                payload.prescription,
                payload.notes,
            ),
        )
        return {"message": "Medical record saved successfully.", "record_id": cursor.lastrowid}

    return run_in_transaction(operation)


def start_call(payload) -> dict:
    def operation(connection):
        cursor = connection.execute(
            """
            INSERT INTO video_calls (room, patient_id, doctor_id)
            VALUES (?, ?, ?)
            """,
            (payload.room, payload.patient_id, payload.doctor_id),
        )
        return {"message": "Call started.", "call_id": cursor.lastrowid}

    return run_in_transaction(operation)


def end_call(room: str, duration: str) -> dict:
    def operation(connection):
        cursor = connection.execute(
            """
            UPDATE video_calls
            SET ended_at = ?, duration = ?
            WHERE room = ? AND ended_at IS NULL
            """,
            (datetime.now(timezone.utc).isoformat(), duration, room),
        )
        if cursor.rowcount == 0:
            raise NotFoundError("Active call not found.")
        return {"message": "Call ended successfully."}

    return run_in_transaction(operation)


def delete_call(call_id: int) -> dict:
    def operation(connection):
        cursor = connection.execute("DELETE FROM video_calls WHERE id = ?", (call_id,))
        if cursor.rowcount == 0:
            raise NotFoundError("Call not found.")
        return {"message": "Call deleted successfully."}

    return run_in_transaction(operation)


def clear_calls(user_id: int, role: str) -> dict:
    def operation(connection):
        if role == "doctor":
            connection.execute("DELETE FROM video_calls WHERE doctor_id = ?", (user_id,))
        else:
            connection.execute("DELETE FROM video_calls WHERE patient_id = ?", (user_id,))
        return {"message": "Call history cleared successfully."}

    return run_in_transaction(operation)


def get_call_history(user_id: int, role: str) -> list[dict]:
    if role == "doctor":
        return fetch_all(
            """
            SELECT video_calls.*, users.name AS patient_name
            FROM video_calls
            LEFT JOIN users ON users.id = video_calls.patient_id
            WHERE video_calls.doctor_id = ?
            ORDER BY video_calls.started_at DESC
            """,
            (user_id,),
        )

    return fetch_all(
        """
        SELECT video_calls.*, users.name AS doctor_name
        FROM video_calls
        LEFT JOIN users ON users.id = video_calls.doctor_id
        WHERE video_calls.patient_id = ?
        ORDER BY video_calls.started_at DESC
        """,
        (user_id,),
    )
