## Project archietcture

ai-rural-health-assistant/
├── backend/
│   ├── api/
│   │   ├── auth.py          # JWT Sign-up / Login / Role Check
│   │   ├── triage.py        # Voice/Text processing & Emergency filter
│   │   ├── facilities.py    # Geospatial search endpoints
│   │   └── summary.py       # Doctor PDF / JSON summary export
│   │── core/
│   │   ├── config.py        # Environment variables & Settings
│   │   └── security.py      # Password hashing & JWT token validation
│   │── db/
│   │   ├── mongo.py         # Motor / PyMongo Async connection
│   │   └── models.py        # Pydantic schemas for User, PHC, Triage
│   │── rag/
│   │   ├── ingest.py        # PDF loader & chunker for your 5 documents
│   │   └── retriever.py     # MongoDB Vector Search pipeline
│   │
│   │── red_flags.json   # Deterministic emergency symptom checks
│   │── main.py              # FastAPI app initialization & CORS setup
│   ├── data/
│   │   ├── docs/                # Place your 5 PDF files here
│   │   └── seeds/               # Seed JSON for rural PHCs/Hospitals
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/          
│   │   ├── context/             # AuthContext for Token/User session
│   │   ├── pages/               # Login, Triage, DoctorDashboard
│   │   └── services/            # Axios API clients
│   └── package.json