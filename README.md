# AI Rural Health Assistant

A full-stack AI-powered healthcare triage and referral assistant designed for rural communities. The system helps users describe symptoms, identify emergency red flags, find nearby health facilities, and receive guidance through a bilingual interface.

## Overview

This project combines:
- A React + TypeScript frontend for patient/worker interaction
- A FastAPI backend for authentication, triage logic, and facility APIs
- MongoDB for user data, facility records, and conversational history
- AI-assisted clinical routing using Gemini / LangChain and speech-to-text via Sarvam AI
- Nearby facility lookup and emergency guidance for rural care access

## Tech Stack

### Frontend
- React 18
- Vite
- TypeScript
- Tailwind CSS
- Leaflet + React Leaflet for geolocation/facility maps
- Axios for API integration
- Lucide React icons
- jsPDF + html2canvas for report/export features

### Backend
- Python 3.11+
- FastAPI
- Uvicorn
- Pydantic + Pydantic Settings
- JWT authentication
- Passlib + bcrypt for password hashing
- Motor for asynchronous MongoDB access

### Database
- MongoDB (local instance or MongoDB Atlas)
- Geospatial queries for nearby PHCs/clinics
- Session chat history storage

### AI and External Services
- LangChain
- Google Generative AI (Gemini)
- Sarvam AI Speech-to-Text API for Hindi/audio intake
- RAG-based retrieval for rural health guidance documents

## Project Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
│  - Symptom input / voice capture                             │
│  - Emergency and facility UI                                 │
│  - User auth + chat history display                          │
│  - Maps and clinic search                                     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                       │
│  - /api/auth      : signup, login, JWT auth                 │
│  - /api/triage    : text + voice triage workflow            │
│  - /api/facilities: nearby PHC and emergency facility APIs   │
│  - /api/summary   : structured clinical summary generation  │
│  - /api/agent     : LangChain + LLM query routing           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data & AI Layer                          │
│  - MongoDB: users, facilities, chats, summaries             │
│  - RAG retriever: relevant health guideline documents       │
│  - Gemini LLM: symptom classification and recommendations    │
│  - Sarvam AI: audio transcription                             │
└─────────────────────────────────────────────────────────────┘
```

## Repository Structure

```text
ai-rural-health-assistant/
├── Backend/
│   ├── api/
│   │   ├── agent.py
│   │   ├── auth.py
│   │   ├── facilities.py
│   │   ├── summary.py
│   │   └── triage.py
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   ├── db/
│   │   ├── models.py
│   │   └── mongo.py
│   ├── rag/
│   │   ├── prompt.py
│   │   ├── retriever.py
│   │   └── ...
│   ├── main.py
│   ├── requirements.txt
│   └── test.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── config/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

## Features

- AI-assisted symptom triage for Indian rural healthcare scenarios
- Emergency detection for life-threatening symptoms
- Hindi/English support for user interaction
- Nearby PHC/clinic and emergency facility search
- Audio-to-text intake using Sarvam AI
- JWT-protected user workflows
- MongoDB-backed chat and summary persistence

## Local Setup

### Prerequisites

Before starting, make sure you have:
- Python 3.11 or above
- Node.js 18+ and npm
- MongoDB running locally or a MongoDB Atlas connection string
- A Google AI API key for Gemini access
- A Sarvam AI API key for speech transcription

### 1. Clone the project

```bash
git clone https://github.com/<your-username>/Uncommon-sense.git
cd Uncommon-sense
```

### 2. Backend setup

```bash
cd Backend
python -m venv .venv
```

For Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

For macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `Backend/` folder:

```env
MONGODB_URI=mongodb://localhost:27017
JWT_SECRET_KEY=your-super-secret-key
GOOGLE_API_KEY=your-google-ai-key
SARVAM_API_KEY=your-sarvam-api-key
SMTP_SERVER_EMAIL=your-email@example.com
```

Start the backend server:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:

```text
http://localhost:8000
```

A health check endpoint is available at:

```text
http://localhost:8000/health
```

### 3. Frontend setup

Open a new terminal and go to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs by default at:

```text
http://localhost:5173
```

## Common Development Commands

### Backend

```bash
cd Backend
source .venv/bin/activate   # or .venv\Scripts\Activate.ps1 on Windows
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
```

## Architecture Notes

The system follows a layered architecture:

1. Presentation layer
   - React frontend for user interaction, triage workflow, and location-based lookup

2. API layer
   - FastAPI serves secure endpoints for auth, triage, summary, and facilities

3. Service layer
   - Triage logic, session management, and RAG-driven clinical reasoning

4. Data layer
   - MongoDB stores user accounts, facility records, session histories, and summaries

5. AI layer
   - Gemini handles symptom routing and recommended action generation
   - LangChain retrieves relevant care guidelines for context-aware outputs
   - Sarvam AI converts voice input into transcripts before triage evaluation

## Notes

- This project is designed as a clinical decision-support tool, not a diagnostic replacement.
- For production deployment, add environment-specific security controls, rate limiting, and a more robust healthcare governance workflow.
- The project is optimized for rural healthcare scenarios and can be extended with region-specific facility and guideline data.

## License

Add the project license here if needed.
