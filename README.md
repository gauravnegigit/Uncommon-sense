# AI Rural Health Assistant (SIH 16133 / SIH26133 Solution)

A comprehensive, full-stack AI-powered healthcare triage, resource allocation, and longitudinal patient management ecosystem tailored for rural communities, Accredited Social Health Activists (ASHAs), Auxiliary Nurse Midwives (ANMs), Primary Health Centres (PHCs), and Community Health Centres (CHCs).

---

## 📌 Problem Alignment (SIH16133)

Rural healthcare faces severe challenges: delayed emergency responses, fragmented patient histories, stock-outs of essential medicines, long queues at PHCs, untracked high-risk pregnancies/chronic patients, and language barriers. 

This platform acts as an **end-to-end intelligent triage, referral, and facility management system** to bridge the gap between rural patients, field health workers (ASHAs/ANMs), and primary/secondary healthcare facilities.

---

## 🌟 Key Features & Core Modules

### 1. Appointment & Smart Queue Management
- **Token Generation:** Virtual queuing for PHC/CHC outpatient departments (OPDs) to reduce facility overcrowding.
- **Priority Queuing:** AI-driven queue re-prioritization based on emergency severity scores computed during triage.

### 2. Longitudinal Patient Record (LPR / EHR)
- **Timeline View:** Unified lifetime patient record linking past visits, diagnoses, prescriptions, and lab reports.
- **ABHA / Unique Patient ID Integration:** Standardized tracking across different PHCs, Sub-Centres, and District Hospitals.

### 3. Closed-Loop Referral Tracking
- **Inter-Facility Routing:** Automated referral generation from ASHA/PHC level to higher-tier CHCs or District Hospitals.
- **Closed-Loop Audit:** Real-time tracking of referral acceptance, bed reservation, arrival verification, and discharge summaries.

### 4. Diagnostic Coordination & Sample Tracking
- **Lab Order Workflow:** Direct ordering of diagnostic tests during AI triage or doctor consultation.
- **Sample Logistics Tracking:** Status tracking for lab samples collected at Sub-Centres and transported to central PHC/CHC labs.

### 5. Medicine Availability & Real-Time Inventory
- **Essential Drug Inventory:** Live tracking of stock levels at local Sub-Centres, PHCs, and Jan Aushadhi Kendras.
- **Stock-Out Predictor & AI Substitution:** Real-time alerts for low stock and AI-recommended alternative essential medicines.

### 6. High-Risk Follow-up & Facility Command Dashboard
- **High-Risk Patient Registry:** Automated flagging of high-risk pregnancies (ANC), severe malnutrition (SAM), hypertension, and diabetes.
- **ASHA Task List:** Automated follow-up schedules and home-visit reminders pushed to field workers.
- **Facility Dashboard:** Real-time analytics for Medical Officers (MOs) showing bed occupancy, queue depth, emergency counts, and referral bottlenecks.

### 7. Multilingual & Multimodal Interaction
- **Voice & Text Intake:** Audio transcription and translation in Indian regional languages (Hindi, Tamil, Telugu, Marathi, Bengali, etc.) powered by **Sarvam AI**.
- **Vernacular Conversational Triage:** Interactive voice assistant for low-literacy rural populations using **Google Gemini**.

### 8. Emergency Escalation & Automated Alerts
- **Red-Flag Detection:** Instant clinical triage engine for life-threatening symptoms (stroke, cardiac distress, postpartum hemorrhage).
- **Automated Dispatch & Alerts:** SMS/Email notifications sent immediately to nearby ambulance services, emergency response teams, and the nearest open emergency department.

---

## 🏗️ Architecture & System Design

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    FRONTEND (React 18 + Vite)                               │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────────────────────┐  │
│  │ Patient & ASHA Portal │  │ Facility Dashboard    │  │ Geolocation Maps & Facilities   │  │
│  │ - Voice/Text Intake   │  │ - Bed/Queue Analytics │  │ - Leaflet Live Inventory/Queue  │  │
│  │ - Longitudinal Record │  │ - Referral Tracking   │  │ - Emergency Dispatch Marker     │  │
│  └───────────────────────┘  └───────────────────────┘  └─────────────────────────────────┘  │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │ HTTP / REST / WebSockets / JSON
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   BACKEND (FastAPI Microservices)                           │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌─────────────────────┐  │
│  │ /api/auth         │ │ /api/triage       │ │ /api/appointments │ │ /api/referrals      │  │
│  │ (JWT, Roles, ABHA)│ │ (Clinical Rules)  │ │ (Queue & Tokens)  │ │ (Closed-Loop Track) │  │
│  └───────────────────┘ └───────────────────┘ └───────────────────┘ └─────────────────────┘  │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌─────────────────────┐  │
│  │ /api/diagnostics  │ │ /api/inventory    │ │ /api/highrisk     │ │ /api/emergency      │  │
│  │ (Lab & Sample Track)│ (Medicines Engine)│ │ (ASHA Task Engine)│ │ (Escalation Alerts) │  │
│  └───────────────────┘ └───────────────────┘ └───────────────────┘ └─────────────────────┘  │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     DATA & AI SERVICE LAYER                                 │
│  ┌───────────────────────────────────────────┐ ┌───────────────────────────────────────────┐  │
│  │ MongoDB (Async Motor Engine)              │ │ AI & Speech Pipeline                      │  │
│  │ - Collections: Users, LongitudinalRecords,│ │ - Sarvam AI (Speech-to-Text & Regional TTS│  │
│  │   Appointments, Referrals, Diagnostics,   │ │ - Google Gemini LLM (Clinical Triage)     │  │
│  │   Inventory, HighRiskRegistry, Facilities │ │ - LangChain RAG (Rural Health Guidelines) │  │
│  └───────────────────────────────────────────┘ └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

## Repository Structure

```text
ai-rural-health-assistant/
├── Backend/
│   ├── api/
│   │   ├── agent.py               # LangChain + LLM clinical query routing
│   │   ├── appointments.py        # Queue management, token issuance & scheduling
│   │   ├── auth.py                # User signup, login, RBAC & JWT security
│   │   ├── diagnostics.py         # Lab order management & sample tracking
│   │   ├── emergency.py           # Emergency escalation, SOS & automated alerts
│   │   ├── facilities.py          # Geospatial PHC/CHC lookup & capacity APIs
│   │   ├── highrisk.py            # High-risk registries & ASHA follow-up task scheduling
│   │   ├── inventory.py           # Real-time medicine stock tracking & substitute logic
│   │   ├── patient_records.py     # Longitudinal Patient Record (LPR/EHR) management
│   │   ├── referrals.py           # Inter-facility closed-loop referral tracking
│   │   ├── summary.py             # Structured clinical summary generation
│   │   └── triage.py              # Text/Voice symptom intake & clinical severity scoring
│   ├── core/
│   │   ├── config.py              # Application settings & environment configurations
│   │   └── security.py            # Password hashing, JWT creation & role verification
│   ├── db/
│   │   ├── models.py              # Pydantic schemas for inputs, outputs, & domain entities
│   │   └── mongo.py               # Async Mongo Engine connections & database setup
│   ├── rag/
│   │   ├── prompt.py              # System prompts for clinical decision guidance
│   │   ├── retriever.py           # RAG retrieval for Indian Rural Health Guidelines (NRHM/NHM)
│   │   └── vector_store.py        # Embeddings & document store initialization
│   ├── services/
│   │   ├── emergency_service.py   # Alert notifications (SMS/Email/Push) for red-flag cases
│   │   ├── inventory_service.py   # Stock alerts & AI medicine matching algorithms
│   │   └── sarvam_service.py      # Audio processing, regional STT & TTS translation
│   ├── main.py                    # FastAPI entrypoint, router declarations & CORS setup
│   ├── requirements.txt           # Python dependencies
│   └── test.py                    # API test suites
│
├── frontend/
│   ├── public/
│   │   └── locales/               # Vernacular translation dictionary files
│   ├── src/
│   │   ├── components/
│   │   │   ├── appointments/      # Queue token cards, slot selection & live wait times
│   │   │   ├── common/            # Navbar, Sidebar, Badges, Modals & UI primitives
│   │   │   ├── dashboard/         # Facility analytics charts, queue depth & emergency alerts
│   │   │   ├── diagnostics/       # Lab request forms & sample tracking status steppers
│   │   │   ├── emergency/         # Red-flag banner & 108 Emergency Dispatch controls
│   │   │   ├── inventory/         # Stock indicators & alternative medicine search
│   │   │   ├── patient/           # Longitudinal health timeline & medical history UI
│   │   │   ├── referrals/         # Inter-facility referral workflow & status tracker
│   │   │   └── triage/            # Multilingual voice recorder & interactive symptom checker
│   │   ├── config/                # API base URLs, Leaflet map styles, & constant definitions
│   │   ├── context/               # Auth, Language, and Patient state contexts
│   │   ├── hooks/                 # Custom React hooks (useVoice, useLocation, useAuth)
│   │   ├── pages/
│   │   │   ├── AppointmentPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── DiagnosticPage.tsx
│   │   │   ├── EmergencyPage.tsx
│   │   │   ├── InventoryPage.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── PatientHistoryPage.tsx
│   │   │   ├── ReferralPage.tsx
│   │   │   └── TriagePage.tsx
│   │   ├── services/              # Axios API wrappers (auth, triage, records, facilities)
│   │   ├── utils/                 # Audio formatters, date helpers & PDF exporters
│   │   ├── App.tsx                # Main routing configuration
│   │   └── main.tsx               # React application entrypoint
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

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
