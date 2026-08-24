# AI Rural Health Assistant (GraminHealth)

> **An AI-powered, offline-resilient medical assistance and tele-triage platform connecting rural citizens, ASHA field workers, and remote physicians.**

---

## 🏗️ Full Project Architecture

```text
ai-rural-health-assistant/
├── backend/
│   ├── api/
│   │   ├── auth.py          # JWT Sign-up, Login, and Role-based Access Control
│   │   ├── triage.py        # Voice/Text processing pipeline & Emergency filter
│   │   ├── facilities.py    # Geospatial search endpoints for nearby PHCs
│   │   └── summary.py       # Patient summary exports (PDF / JSON) for doctors
│   ├── core/
│   │   ├── config.py        # Environment variables and application settings
│   │   └── security.py      # Password hashing (Bcrypt) & JWT token validation
│   ├── db/
│   │   ├── mongo.py         # Async MongoDB connection (Motor / PyMongo)
│   │   └── models.py        # Pydantic schemas (User, PHC, Triage records)
│   ├── rag/
│   │   ├── ingest.py        # PDF document loader & text chunking script
│   │   └── retriever.py     # MongoDB Vector Search pipeline
│   ├── data/
│   │   ├── docs/            # Storage directory for clinical reference PDFs
│   │   └── seeds/           # Seed JSON data for rural PHCs and regional hospitals
│   ├── red_flags.json       # Deterministic rule base for emergency symptom checks
│   ├── main.py              # FastAPI application entry point & CORS configuration
│   └── requirements.txt     # Backend Python dependencies
│
└── frontend/
    ├── public/              # Static assets, SVG icons, and HTML previews
    │   ├── favicon.svg
    │   └── ...
    ├── src/
    │   ├── components/      # Reusable UI components (Audio recorder, Map views)
    │   │   ├── AudioRecorder.jsx        # Voice symptom recorder with real-time waveform & dialect STT
    │   │   ├── MapView.jsx              # Leaflet OpenStreetMap view of PHCs, CHCs & mobile medical vans
    │   │   ├── Navbar.jsx               # Header with language picker (EN/HI), offline sync & 108 SOS
    │   │   ├── SymptomTriageCard.jsx    # Visual body map & symptom chips with severity rating
    │   │   ├── VitalsInput.jsx          # Smart vitals tracker (BP, SpO2, Temp, Glucose) with auto-alert ranges
    │   │   ├── TeleconsultationRoom.jsx # Live video/audio consultation modal with 2G bandwidth saver
    │   │   ├── OfflineSyncBadge.jsx     # Resilient network status and offline queue drawer
    │   │   ├── EmergencySOSModal.jsx    # Rapid 108 ambulance dispatch alert & live GPS radar
    │   │   └── PrescriptionViewer.jsx   # Visual prescription with dosage icons & audio read-aloud
    │   ├── context/         # AuthContext managing user sessions and JWT state
    │   │   ├── AuthContext.jsx          # JWT token management, user roles (Patient, ASHA, Doctor)
    │   │   ├── LanguageContext.jsx      # Multi-lingual translations (English, Hindi हिंदी)
    │   │   └── OfflineQueueContext.jsx  # Local caching & auto-sync of offline triage reports
    │   ├── pages/           # Views: Login, Triage Portal, Doctor Dashboard
    │   │   ├── LandingPage.jsx          # Welcoming home page with 4 service pillars & live stats
    │   │   ├── Login.jsx                # Auth with Phone OTP, ABHA ID login & 1-click role presets
    │   │   ├── TriagePortal.jsx         # Guided symptom assessment, voice dictation & urgency scoring
    │   │   ├── DoctorDashboard.jsx      # Telemedicine patient queue, urgency filters & e-prescriptions
    │   │   ├── ClinicLocator.jsx        # Fullscreen interactive map of Primary Healthcare Centres
    │   │   ├── HealthWorkerPortal.jsx   # ASHA corner: village surveys, ANC tracker, child immunization
    │   │   ├── PatientHistory.jsx       # Health records, past triage consultations & digital prescriptions
    │   │   └── EmergencySOS.jsx         # Dedicated emergency page with GPS vehicle beacon
    │   ├── services/        # Axios clients for backend API interaction
    │   │   ├── api.js                   # Configured Axios instance with JWT Bearer interceptors & fallback
    │   │   ├── authService.js           # Client for backend/api/auth.py (Login, OTP, ABHA)
    │   │   ├── triageService.js         # Client for backend/api/triage.py & red_flags.json
    │   │   ├── clinicService.js         # Client for backend/api/facilities.py (PHC GPS Search & 108 Dispatch)
    │   │   ├── consultationService.js   # Client for backend/api/summary.py (Rx generation & Tele-OPD)
    │   │   └── offlineSyncService.js    # Local caching engine for background sync
    │   ├── styles/
    │   │   └── index.css                # Tailwind CSS styling, calm color palette, custom animations
    │   ├── App.jsx                      # Router & layout setup
    │   └── main.jsx                     # Application entry point & Context providers
    ├── demo-preview.html    # Standalone zero-dependency interactive browser preview
    ├── index.html
    ├── package.json         # Frontend Node dependencies and scripts
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

---

## 🎨 Design Philosophy: Calm, Composed & Rural-Accessible

- **Color Palette**:
  - Medical Eucalyptus Sage (`#0d9488`, `#059669`) — healing, calming primary base.
  - Serene Slate Blue (`#0284c7`) — secondary accents.
  - Gentle Warm Stone Neutrals (`#f8fafc`, `#f1f5f9`) — non-fatiguing backgrounds.
  - Soft Alert Accents (Rose for Emergency Red, Amber for Moderate, Emerald for Mild/Safe).
- **Typography & Accessibility**:
  - High-legibility fonts (*Plus Jakarta Sans* / *Inter*).
  - High-contrast enlarged touch targets for budget smartphones and tablets used in the field.
  - Multi-lingual support: **English** and **Hindi (हिंदी)**.
  - Visual morning/midday/night icons on digital prescriptions for low-literacy rural patients.

---

## 🧩 Frontend Architecture Details

### 1. Reusable Components (`frontend/src/components/`)
| Component | Description |
| :--- | :--- |
| **`AudioRecorder.jsx`** | Web Audio API voice recorder with live animated waveform equalizer, dialect speech-to-text transcription, and symptom keyword extraction. |
| **`MapView.jsx`** | Interactive OpenStreetMap / Leaflet map with custom color-coded markers for PHCs, CHCs, Sub-Centres, Mobile Vans, and user GPS location. |
| **`Navbar.jsx`** | Header with English/Hindi language toggle, network connectivity status, 1-click role switcher, and 108 SOS button. |
| **`SymptomTriageCard.jsx`** | Visual body area selector with symptom chips and 1–10 pain severity rating slider. |
| **`VitalsInput.jsx`** | Smart clinical vitals input (BP, SpO2, Pulse, Temp) with automatic crisis/warning threshold badges. |
| **`TeleconsultationRoom.jsx`** | Telemedicine video/audio consultation interface with 2G bandwidth saver mode and doctor notepad. |
| **`PrescriptionViewer.jsx`** | Printable e-Prescription view with visual dosage icons (🌅 Morning, ☀️ Afternoon, 🌙 Night) and audio read-aloud. |
| **`EmergencySOSModal.jsx`** | Rapid 108 ambulance dispatch modal with live GPS vehicle radar and crucial first-aid advice. |
| **`OfflineSyncBadge.jsx`** | Network status monitor and offline cache drawer. |

---

### 2. State & Context Layer (`frontend/src/context/`)
| Context | Purpose |
| :--- | :--- |
| **`AuthContext.jsx`** | Manages JWT token storage in `localStorage`, user sessions, and 1-click role switching between **Rural Patient**, **ASHA Health Worker**, and **Doctor / Medical Officer**. |
| **`LanguageContext.jsx`** | Provides real-time switching between **English** and **Hindi (हिंदी)** across all UI elements. |
| **`OfflineQueueContext.jsx`** | Manages local caching and background sync for offline field usage during low network connectivity. |

---

### 3. Views & Pages (`frontend/src/pages/`)
| Page | Route | Description |
| :--- | :--- | :--- |
| **Landing Page** | `/` | Welcoming hero section, 4 core service pillars, interactive PHC map preview, and live district health statistics. |
| **Login / Register** | `/login` | Phone OTP login, ABHA (Ayushman Bharat Health Account) sign-in, and 1-click demo credentials. |
| **Triage Portal** | `/triage` | Multi-step triage flow: Patient details, voice recording, body region symptom selector, vitals check, and automated urgency classification. |
| **Doctor Dashboard** | `/doctor` | Physician tele-OPD queue prioritized by triage urgency (Red, Amber, Green), video call launcher, and e-prescription writer. |
| **Clinic Locator** | `/clinics` | Fullscreen interactive map of rural health facilities with doctor rosters, bed availability, and pharmacy stock. |
| **ASHA Worker Portal** | `/health-worker` | Field surveillance tools: household screening register, maternal ANC tracker, and child immunization schedule. |
| **Patient History** | `/records` | Patient health pass, past triage cases, and digital prescriptions with audio explanation. |
| **Emergency SOS** | `/emergency` | Dedicated 108 emergency beacon dispatch page with real-time GPS ambulance telemetry. |

---

### 4. API Services Layer (`frontend/src/services/`)
Mapped directly to the FastAPI backend endpoints:

| Frontend Service (`src/services/`) | Backend Endpoint (`backend/api/`) | Description |
| :--- | :--- | :--- |
| **`api.js`** | `core/security.py` | Configured Axios client with JWT Bearer token request interceptor and 401 refresh handler. |
| **`authService.js`** | `api/auth.py` | Phone OTP, ABHA ID authentication, user registration, and profile fetching. |
| **`triageService.js`** | `api/triage.py` & `red_flags.json` | Voice/text symptom submission, automated triage scoring (Green/Amber/Red), and doctor queue. |
| **`clinicService.js`** | `api/facilities.py` | Geospatial search for nearby PHCs, CHCs, bed capacity, and 108 ambulance dispatch. |
| **`consultationService.js`** | `api/summary.py` | Telemedicine room signaling, e-prescription generation, and PDF summary exports. |
| **`offlineSyncService.js`** | `db/mongo.py` | Local storage queue processor for offline report sync. |

---

## ⚡ Quick Start & Running Instructions

### 1. Run the Frontend (Vite)
```bash
# Navigate to the frontend folder
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```
Frontend will be available at: `http://localhost:5173`

### 2. Standalone Browser Preview (Zero Installation)
Double-click or open [`frontend/demo-preview.html`](file:///c:/Users/HP/Downloads/PROJECT/frontend/demo-preview.html) in any web browser to test all pages, voice recorder, Leaflet map, triage grading, role switching, and 108 SOS without installing dependencies.

---

### 3. Run the Backend (FastAPI)
```bash
# Navigate to backend folder
cd backend

# Install python requirements
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload --port 5000
```
Backend API will be available at: `http://localhost:5000` (Docs at `http://localhost:5000/docs`)

---

## 🛡️ Compliance & Standards
- **ABDM (Ayushman Bharat Digital Mission)** aligned data models.
- **e-Sanjeevani** compatible teleconsultation workflows.
- **2G / Offline-First Resilience** for remote village field operations.
