# Maan

> Luxury Wedding Live Gallery & AI-Powered Facial Recognition Guest Photo Retrieval Platform.

## 💍 Features
- **Real-Time Live Gallery**: Instant Google Drive sync and live streaming of wedding moments.
- **AI Guest Selfie Search**: Guests can upload a selfie to instantly retrieve all wedding photos featuring them using facial recognition embeddings.
- **Mobile-First Responsive Design**: Ultra-luxury warm golden aesthetics tailored for high-end celebrations.
- **Direct Drive Integration**: Integrated Google Apps Script web service for real-time photo uploads.

## 🚀 Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion
- **AI/ML Service**: Exadel CompreFace (Apache 2.0 ArcFace / MobileFaceNet), FastAPI, PyTorch
- **Cloud Storage**: Google Drive API via Apps Script Web Service

## 🧠 AI Model Setup (Exadel CompreFace)

1. **Start CompreFace Cluster**:
   ```powershell
   cd compreface
   .\start.ps1   # or docker compose up -d
   ```
2. **Access Web Console**:
   - Open [http://localhost:8000](http://localhost:8000)
   - Create your account and create a **Recognition Service**
   - Copy your generated API key
3. **Configure ML Service**:
   - Add `COMPREFACE_API_KEY=<your_key>` in `shaadisnap-ml/.env`
4. **Start Web Application**:
   ```powershell
   cd shaadisnap-web
   npm run dev
   ```
