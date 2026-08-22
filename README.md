## Project archietcture

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
    ├── public/              
    ├── src/
    │   ├── components/      # Reusable UI components (Audio recorder, Map views)
    │   ├── context/         # AuthContext managing user sessions and JWT state
    │   ├── pages/           # Views: Login, Triage Portal, Doctor Dashboard
    │   └── services/        # Axios clients for backend API interaction
    └── package.json         # Frontend Node dependencies and scripts