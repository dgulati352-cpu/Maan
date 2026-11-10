# ShaadiSnap AI — Unified Architecture

ShaadiSnap AI is a modern, unified wedding photography SaaS platform with zero login barriers for organizers:

```
wedding/
│
├── shaadisnap-web/         # Unified Full-Stack Application (Next.js 16 + React 19)
│   ├── src/
│   │   ├── app/            # Pages & API Routes (Gallery, Admin, RSVP, Upload, Find-Photos)
│   │   │   └── api/        # Native Serverless Endpoints (Events, Photos, Moderation, RSVP, Drive)
│   │   ├── components/     # UI Components, Rose Champagne design system
│   │   └── lib/            # SQLite Database Engine, Storage, Face Comparison
│   ├── data/
│   │   └── shaadisnap.db   # ACID SQLite Database File (16 Relational Tables)
│   └── package.json
│
├── shaadisnap-ml/          # Python ML Face Recognition Microservice (FastAPI + ArcFace)
│   ├── api/main.py         # 512-d embeddings & persistent vector indexing
│   └── start-backend.bat   # Starts Python microservice on Port 8001
│
├── start-all.bat           # Master Launcher (Web & Admin 3000 + ML Engine 8001)
├── start-backend.bat       # Starts Python ML Engine (Port 8001)
└── start-frontend.bat      # Starts Unified Web & Admin App (Port 3000)
```

---

## Key Highlights

1. **All-in-One Full-Stack App**:
   - Next.js powers both the luxury frontend UI and all backend REST API routes.
   - No separate port 5000 backend server required.
2. **Passwordless Direct Access**:
   - No login walls or mandatory passwords.
   - Admin operations (`/admin`, `/admin/photos`) are directly accessible for immediate management.
3. **Python ML Engine**:
   - ArcFace 512-d neural embeddings microservice running on port 8001 for high-accuracy, privacy-first facial discovery.
