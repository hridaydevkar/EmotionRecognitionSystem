# Emotion Recognition System

<div align="center">

![Python](https://img.shields.io/badge/Python-3.9+-3776ab?style=for-the-badge&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)
![Flask](https://img.shields.io/badge/Flask-3.1-000000?style=for-the-badge&logo=flask&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

**Real-time 7-class facial emotion classification · <200ms inference · full-stack analytics dashboard**

</div>

---

## Overview

Full-stack system that classifies facial emotions in real-time from a live webcam feed. Each frame is processed client-side via TensorFlow.js (`face-api.js`) — no video data ever leaves the browser. Session data is persisted to PostgreSQL for trend analytics and ML-generated wellness recommendations.

**7 classes detected:** Happy · Sad · Angry · Fearful · Disgusted · Surprised · Neutral

---

## Architecture

```
Browser (React + TypeScript + face-api.js)
  │   camera frames processed entirely client-side
  │   emotion label + confidence score →
  ▼
Flask REST API (Python 3.9+)
  ├── /api/auth/          JWT authentication
  ├── /api/emotions/      session recording & CRUD
  ├── /api/analytics/     trend analysis, wellness score (0–100)
  └── /api/ml/            personalized recommendations engine
        │
        └── PostgreSQL 16+  (SQLAlchemy ORM)
```

---

## Key Numbers

| Metric | Value |
|--------|-------|
| Emotion classes | 7 |
| Inference latency | < 200ms per frame |
| Processing location | Client-side (TensorFlow.js) — zero video stored |
| Auth | JWT (stateless) |
| Export formats | CSV, PDF |

---

## Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19 · TypeScript 4.9 · face-api.js · Recharts · Tailwind CSS |
| Backend | Flask 3.1 · SQLAlchemy · JWT · Werkzeug · ReportLab |
| Database | PostgreSQL 16+ |
| ML | TensorFlow.js (face-api.js) · custom recommendation engine |

---

## Setup

```bash
# 1. Clone
git clone https://github.com/hridaydevkar/EmotionRecognitionSystem.git
cd EmotionRecognitionSystem

# 2. Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # set DATABASE_URL, SECRET_KEY, JWT_SECRET_KEY
python init_db.py
python run.py            # → http://localhost:8000

# 3. Frontend
cd ../frontend
npm install
npm start                # → http://localhost:3000
```

**Environment variables (`backend/.env`):**

```env
DATABASE_URL=postgresql://user:password@localhost:5432/emotion_recognition
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
FLASK_ENV=development
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/emotions` | Save emotion record |
| GET | `/api/emotions/sessions` | List detection sessions |
| GET | `/api/analytics/summary` | Wellness score + dominant emotion |
| GET | `/api/analytics/trends` | Emotion trends over time |
| GET | `/api/analytics/export` | Export data (CSV / PDF) |
| GET | `/api/ml/recommendations` | Personalized suggestions |

---

## Project Structure

```
EmotionRecognitionSystem/
├── backend/
│   ├── app/
│   │   ├── models/          # User, EmotionRecord
│   │   ├── routes/          # auth, emotion, analytics, ml, user
│   │   └── utils/
│   ├── init_db.py
│   └── run.py
└── frontend/
    └── src/
        ├── components/      # EmotionDetector, EmotionChart, Navbar
        ├── pages/           # Login, Register, Dashboard, Analytics
        └── services/        # authService, emotionService, analyticsService
```

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">
<sub>Built by <a href="https://github.com/hridaydevkar">Hriday Devkar</a></sub>
</div>
