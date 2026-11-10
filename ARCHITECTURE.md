# ShaadiSnap AI — Decoupled Frontend & Backend Architecture

This project is partitioned into distinct, decoupled tiers:

```
wedding/
│
├── frontend/               # Dedicated Next.js Frontend Application (Port 3000)
│   ├── src/
│   │   ├── app/            # Pages & Routing (Gallery, Admin, RSVP, Login, Guest)
│   │   ├── components/     # UI Components, Rose Champagne design system
│   │   └── lib/            # Client utilities, Google Picker hook, Face Compare
│   ├── .env.local          # BACKEND_URL=http://localhost:5000
│   ├── next.config.ts      # Proxies /api/* to http://localhost:5000
│   └── start-frontend.bat  # Starts the frontend on Port 3000
│
├── backend/                # Standalone Node.js + Express REST API Server (Port 5000)
│   ├── src/
│   │   ├── routes/         # Auth, Events, Photos, Moderation, RSVP, Drive, Guest
│   │   ├── db.ts           # SQLite Database Engine (16 Relational Tables)
│   │   ├── auth.ts         # Scrypt Password Hashing, Sessions, RBAC Middleware
│   │   ├── storage.ts      # Private Storage, SHA-256 Hashes, Signed URLs
│   │   └── server.ts       # Express Server & CORS Configuration
│   ├── data/
│   │   └── shaadisnap.db   # ACID SQLite Database File
│   ├── tests/              # Standalone Backend Test Suite (14/14 Passed)
│   ├── .env                # PORT=5000, ML_SERVICE_URL=http://localhost:8001
│   └── start-backend.bat   # Starts backend on Port 5000
│
├── shaadisnap-ml/          # Python ML Face Recognition Microservice (Port 8001)
│   ├── api/main.py         # FastAPI Service (ArcFace 512-d embeddings)
│   ├── data/indices/       # Persistent Vector Indexes
│   └── start-backend.bat   # Starts Python microservice on Port 8001
│
├── start-all.bat           # Master Launcher (Frontend 3000 + Backend 5000 + ML 8001)
├── start-backend.bat       # Starts Backend (5000) + ML Microservice (8001)
└── start-frontend.bat      # Starts Frontend (3000)
```

---

## Port Allocation & Service Directory

| Service | Port | Description |
| :--- | :--- | :--- |
| **Frontend UI** | `3000` | Next.js Client, Guest Gallery, Admin Photo Management Studio |
| **REST API Backend** | `5000` | Express REST API, SQLite Relational Database, Auth & RBAC |
| **ML Microservice** | `8001` | FastAPI, ArcFace 512-d embeddings, biometric face search |

---

## How to Run

### Option 1: Master Launcher (Runs All 3)
Double-click `start-all.bat` or run:
```cmd
.\start-all.bat
```

### Option 2: Run Backend Separately
Double-click `start-backend.bat` or run:
```cmd
.\start-backend.bat
```
*(Starts Node.js API on port 5000 and Python ML microservice on port 8001)*

### Option 3: Run Frontend Separately
Double-click `start-frontend.bat` or run:
```cmd
.\start-frontend.bat
```
*(Starts Next.js UI on port 3000 connected to http://localhost:5000)*

