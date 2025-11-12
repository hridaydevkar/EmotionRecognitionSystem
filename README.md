# 🎭 Emotion Recognition System

<div align="center">

![Emotion Recognition System](https://img.shields.io/badge/Version-1.0-blue.svg)
![React](https://img.shields.io/badge/React-19.1.1-61dafb?logo=react)
![Flask](https://img.shields.io/badge/Flask-3.1.1-000000?logo=flask)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-3178c6?logo=typescript)
![Python](https://img.shields.io/badge/Python-3.9+-3776ab?logo=python)

**A real-time facial emotion detection system with comprehensive analytics and ML-powered recommendations**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

The **Emotion Recognition System** is a full-stack web application that uses state-of-the-art computer vision to detect and analyze facial emotions in real-time. Built with React, Flask, and face-api.js, it provides users with insights into their emotional patterns and personalized recommendations for emotional well-being.

### 🎯 Key Highlights

- 🎥 **Real-time Emotion Detection** - Instant facial emotion recognition via webcam
- 📊 **Advanced Analytics** - Track emotional patterns with interactive charts and insights
- 🤖 **ML-Powered Recommendations** - Intelligent suggestions based on emotional state
- 🔒 **Privacy-First** - All video processing happens locally; no video data stored
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🎨 **Modern UI/UX** - Clean, intuitive interface with dark/light theme support

---

## ✨ Features

### Core Functionality

| Feature | Description |
|---------|-------------|
| **7 Emotion Detection** | Recognizes Happy, Sad, Angry, Fearful, Disgusted, Surprised, and Neutral emotions |
| **Real-time Processing** | <200ms latency for emotion detection |
| **Confidence Scoring** | Accuracy rating (0-100%) for each detection |
| **Session Management** | Start/stop detection sessions with unique session IDs |
| **Historical Tracking** | Store and analyze emotion data over time |

### Analytics Dashboard

- 📈 **Trend Analysis** - Visualize emotional patterns over time
- 🎯 **Dominant Emotion** - Identify your most frequent emotions
- 💯 **Wellness Score** - Overall emotional health indicator (0-100)
- 📊 **Interactive Charts** - Pie charts, line graphs, and emotion breakdowns
- 📥 **Export Data** - Download analytics as CSV or PDF reports

### ML Features

- 🧠 **Intelligent Recommendations** - Personalized suggestions based on:
  - Current dominant emotion
  - Confidence level
  - Wellness score
  - Emotional stability
- 🎯 **Severity Detection** - Categorizes emotional intensity (low/medium/high)
- 📚 **Action-Oriented Advice** - Practical steps to improve emotional well-being

---

## 🛠️ Technology Stack

### Frontend
- **React 19.1.1** - UI framework
- **TypeScript 4.9.5** - Type safety
- **face-api.js** - Client-side emotion detection
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### Backend
- **Flask 3.1.1** - Web framework
- **SQLAlchemy** - ORM
- **PostgreSQL 16+** - Database
- **JWT** - Authentication
- **Werkzeug** - Security utilities
- **ReportLab** - PDF generation

### ML/AI
- **face-api.js** - TensorFlow.js-based face detection
- **Custom ML algorithms** - Recommendation engine

---

## 🚀 Installation

### Prerequisites

- **Node.js** 16+ and npm
- **Python** 3.9+
- **PostgreSQL** 16+
- **Git**

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/hridaydevkar/EmotionRecognitionSystem.git
   cd EmotionRecognitionSystem
   ```

2. **Set up PostgreSQL Database**
   ```bash
   # Start PostgreSQL service
   # macOS (Homebrew)
   brew services start postgresql@16
   
   # Linux
   sudo systemctl start postgresql
   
   # Windows - Start from Services
   
   # Create database
   psql -U postgres
   CREATE DATABASE emotion_recognition;
   \q
   ```

3. **Backend Setup**
   ```bash
   cd backend
   
   # Create virtual environment
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Initialize database
   python init_db.py
   
   # Run backend server
   python run.py
   ```
   Backend runs on `http://localhost:8000`

4. **Frontend Setup**
   ```bash
   cd frontend
   
   # Install dependencies
   npm install
   
   # Start development server
   npm start
   ```
   Frontend runs on `http://localhost:3000`

5. **Access the Application**
   - Open browser and navigate to `http://localhost:3000`
   - Register a new account
   - Grant camera permissions when prompted
   - Start detecting emotions!

---

## 📁 Project Structure

```
EmotionRecognitionSystem/
├── backend/                    # Flask backend
│   ├── app/
│   │   ├── __init__.py        # App factory
│   │   ├── models/            # Database models
│   │   │   ├── user.py        # User model
│   │   │   └── emotion.py     # Emotion data model
│   │   ├── routes/            # API endpoints
│   │   │   ├── auth.py        # Authentication
│   │   │   ├── emotion.py     # Emotion CRUD
│   │   │   ├── analytics.py   # Analytics & export
│   │   │   ├── ml.py          # ML recommendations
│   │   │   └── user.py        # User management
│   │   └── utils/             # Utilities
│   ├── migrations/            # Database migrations
│   ├── requirements.txt       # Python dependencies
│   ├── init_db.py            # Database initializer
│   └── run.py                # Entry point
│
├── frontend/                  # React frontend
│   ├── public/
│   │   └── models/           # face-api.js models
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── EmotionDetector.tsx
│   │   │   ├── EmotionChart.tsx
│   │   │   └── Navbar.tsx
│   │   ├── pages/            # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── Analytics.tsx
│   │   ├── services/         # API services
│   │   │   ├── authService.ts
│   │   │   ├── emotionService.ts
│   │   │   └── analyticsService.ts
│   │   ├── context/          # React context
│   │   └── utils/            # Utilities
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                     # Documentation
├── .gitignore
├── README.md
└── LICENSE
```

---

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### Emotions
- `POST /api/emotions` - Save emotion data
- `GET /api/emotions` - Get user's emotions
- `GET /api/emotions/sessions` - Get detection sessions

### Analytics
- `GET /api/analytics/summary` - Get analytics summary
- `GET /api/analytics/trends` - Get emotion trends
- `GET /api/analytics/export` - Export data (CSV/PDF)

### ML Recommendations
- `GET /api/ml/recommendations` - Get personalized recommendations

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
pytest --cov=app tests/  # With coverage
```

### Frontend Tests
```bash
cd frontend
npm test
npm test -- --coverage  # With coverage
```

---

## 🔧 Configuration

### Backend Environment Variables
Create `backend/.env`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/emotion_recognition
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
FLASK_ENV=development
```

### Frontend Environment Variables
Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:8000
```

---

## 🚢 Deployment

### Backend Deployment (Heroku/Railway)
```bash
# Using Railway CLI
railway login
railway init
railway up
```

### Frontend Deployment (Vercel/Netlify)
```bash
# Build for production
cd frontend
npm run build

# Deploy to Vercel
vercel --prod
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and development process.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Hriday Devkar**
- GitHub: [@hridaydevkar](https://github.com/hridaydevkar)

---

## 🙏 Acknowledgments

- [face-api.js](https://github.com/justadudewhohacks/face-api.js) - Face detection and emotion recognition
- [Flask](https://flask.palletsprojects.com/) - Web framework
- [React](https://reactjs.org/) - UI library
- [PostgreSQL](https://www.postgresql.org/) - Database

---

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on [GitHub Issues](https://github.com/hridaydevkar/EmotionRecognitionSystem/issues)
- Email: hridaydevkar@gmail.com

---

<div align="center">

**Made with ❤️ and 🤖 by Hriday Devkar**

⭐ Star this repo if you find it helpful!

</div>
