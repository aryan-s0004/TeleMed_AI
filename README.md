# TeleMed_AI

TeleMed_AI is a personal full-stack telemedicine project built with a React + Vite frontend and a FastAPI backend. It includes appointment booking, medical records, video consultations, an AI symptom checker, and OTP-based email verification.

## Stack

- Frontend: React, Vite, Socket.IO client
- Backend: FastAPI, Python Socket.IO, SQLite
- Email OTP: SendGrid preferred, Gmail SMTP app password fallback

## Features

- Patient and doctor portals
- OTP signup verification and password reset
- Appointment booking and status management
- Medical record creation and printable prescriptions
- WebRTC video consultations with call history
- AI symptom prediction flow

## Local Setup

### Backend

1. Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and fill in the backend values.

3. Initialize the database:

```bash
python setup_db.py
```

4. Start the API:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 10000
```

### Frontend

1. Install frontend dependencies:

```bash
cd frontend
npm install
```

2. Copy `frontend/.env.example` to `frontend/.env`.

3. Start the frontend:

```bash
npm run dev
```

## Required Environment Variables

### Backend

- `SECRET_KEY`
- `FRONTEND_URL`
- `SENDGRID_API_KEY`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_FROM_EMAIL`
- `OTP_DEBUG_PREVIEW`

Use `SENDGRID_API_KEY` for production when possible. If you use Gmail SMTP, create an App Password and place it in `MAIL_PASSWORD`.

### Frontend

- `VITE_API_URL`

Default local backend URL:

```text
http://localhost:10000
```

## API Highlights

- `GET /health`
- `POST /send-otp`
- `POST /verify-otp`
- `POST /auth/signup`
- `POST /auth/login`
- `POST /forgot-password`
- `POST /reset-password`

The same routes are also available under `/api/*` for frontend compatibility.

## Deployment

### Backend on Render

- Root directory: `backend`
- Build command: `pip install -r requirements.txt && python setup_db.py`
- Start command: `uvicorn main:app --host 0.0.0.0 --port 10000`

### Frontend on Vercel

- Framework preset: Vite
- Environment variable: `VITE_API_URL=https://your-render-service.onrender.com`

## Seed Accounts

Sample doctor accounts are created automatically. All seeded doctors use:

- Password: `doctor123`

## Testing

Backend smoke tests:

```bash
cd backend
pytest
```

When mail credentials are not configured, local OTP preview mode can be enabled with `OTP_DEBUG_PREVIEW=true` so you can verify the end-to-end flow without blocking on email infrastructure.
