# Project: ShaadiSnap AI

## Architecture
ShaadiSnap AI is a luxury Rose Champagne responsive wedding photo discovery web application with AI facial recognition and event organizer management.

```
                    ┌────────────────────────────────────────┐
                    │      Client Application (Next.js 16)   │
                    │      App Router, Tailwind CSS v4       │
                    └───────────────────┬────────────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│ Public Editorial     │    │ Guest Flow           │    │ Organizer Admin      │
│ - Homepage (/)       │    │ - /find-photos       │    │ - /admin (Overview)  │
│ - /how-it-works      │    │ - /event/[slug]      │    │ - /admin/events      │
│ - /features          │    │ - /event/.../process │    │ - /admin/.../photos  │
│ - /privacy, /terms   │    │ - /event/.../gallery │    │ - /admin/.../guests  │
│ - /login, /register  │    │ - /photo/[photoId]   │    │ - /admin/.../analytic│
│ - /verify, /forgot-pw│    │                      │    │ - /admin/settings    │
└──────────────────────┘    └──────────────────────┘    └──────────────────────┘
                                        │
                    ┌───────────────────┴────────────────────┐
                    │  Typed API Service Layer (src/lib/api) │
                    └───────────────────┬────────────────────┘
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         ▼                              ▼                              ▼
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│ Next.js API Routes   │    │ Google Cloud Storage │    │ Biometric AI Engine  │
│ - /api/face-search   │    │ - V4 Signed Upload   │    │ - ShaadiSnap-ML      │
│ - /api/photos/...    │    │ - V4 Signed Read     │    │   (FastAPI ArcFace)  │
│ - /api/storage/...   │    │ - Credential Shield  │    │ - CompreFace Cluster │
│ - /api/biometrics/...│    │ - Ephemeral Vault    │    │ - Safe Fallback Bound│
└──────────────────────┘    └──────────────────────┘    └──────────────────────┘
```

### Module Boundaries
1. **Design System & Foundation**: Global tokens, CSS variables, typography clamp rules, 16px/24px radii, light mode enforcement, 1280px max desktop content width.
2. **Public Marketing & Auth**: Static/editorial pages with luxury Indian wedding aesthetics, Playfair Display headers, Inter body, zero dead links, SEO metadata.
3. **Guest Discovery & Biometrics**: Privacy-first biometric discovery, camera reticle, DPDP/GDPR consent gating, 7-stage status visualizer (no fake percentages), masonry gallery, lightbox, batch download.
4. **Organizer Admin Dashboard**: 250px fixed sidebar, server-side auth guard, live metric cards with skeleton loaders, event CRUD, batch photo upload queue, guest access & biometric erasure.
5. **Backend, Storage & Face Integration**: Typed API client (`client.ts`, `types.ts`, `storageService.ts`, `faceService.ts`), server-side GCS V4 signed URLs, CompreFace / ShaadiSnap-ML adapters, DPDP erasure API, safe offline fallback boundaries.
6. **E2E Testing & Hardening**: Dual-track automated verification suite (Tiers 1-4) published via `TEST_READY.md`, followed by Tier 5 adversarial coverage hardening.

---

## Feature Inventory

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Rose Champagne CSS Variables | Centralized CSS variables for Rose Champagne palette in light mode only | M1 | R1, Survey E1/E2 |
| 2 | Fluid Clamp Typography Scale | Playfair Display headings & Inter body with clamp() scaling for 360px-1440px | M1 | R1, Survey E2 |
| 3 | Layout Container & Width Constraints | Max 1280px desktop width, 4px spacing unit, 16px/24px card border radii | M1 | R1, Survey E2 |
| 4 | Micro-Interactions & Reduced Motion | Restrained Framer Motion / CSS micro-interactions adhering to prefers-reduced-motion | M1 | R1, Survey E2 |
| 5 | Global Navigation & Footer | Luxury editorial Navbar and 4-column Footer with zero dead links | M1 | R1, R2, Survey E2 |
| 6 | Editorial Homepage (/) | Hero ("Your Wedding Memories, Just One Face Away."), Trust pillars, 4-step How It Works, 3-column Features, Final CTA | M2 | R2, Survey E2 |
| 7 | How It Works Page (/how-it-works) | Deep-dive 4-step walkthrough for couples, guests, and photographers | M2 | R2, Survey E2 |
| 8 | Features Page (/features) | Complete feature showcase (AI matching, privacy vault, organizer tools) | M2 | R2, Survey E2 |
| 9 | Legal & Compliance Pages (/privacy, /terms) | DPDP Act 2023 & GDPR compliance documentation, biometric terms | M2 | R2, Survey E2/SM3 |
| 10 | Contact Page (/contact) | Luxury inquiry form with validation and support channels | M2 | R2, Survey E2 |
| 11 | Complete Auth Suite (/login, /register, /verify, /forgot-password) | Form validation, password recovery, verification flows | M2 | R2, Survey E2 |
| 12 | Event Selection Route (/find-photos) | Event lookup by slug, couple name, or access code | M3 | R3, Survey E2 |
| 13 | Selfie Upload & Camera Capture (/event/[eventSlug]) | Drag-and-drop file upload (JPG/PNG/WebP, max 20MB) + live camera capture with face guide | M3 | R3, Survey E1/E2 |
| 14 | Biometric Consent Gating | Mandatory unchecked DPDP/GDPR consent checkbox with exact legal copy before processing | M3 | R3, Survey SM3 |
| 15 | Discrete Stage Processing Stepper (/event/[eventSlug]/processing) | 7 discrete stages (Uploading, Validating, Detecting, Embedding, Searching, Preparing, Completed) without fake percentages | M3 | R3, Survey E2/SM3 |
| 16 | Matched Photo Gallery (/event/[eventSlug]/gallery) | Responsive masonry grid, lazy loading, ceremony filter tabs, empty state explaining probabilistic matching | M3 | R3, Survey E2/SM3 |
| 17 | Fullscreen Lightbox Experience | Next/Previous controls, keyboard navigation, metadata display, original download | M3 | R3, Survey E2 |
| 18 | Batch Multi-Select Download | Select-all, counter, client-side ZIP packaging and download | M3 | R3, Survey E2 |
| 19 | Single Photo Detail Route (/photo/[photoId]) | Dedicated shareable high-res photo route with ceremony info | M3 | R3, Survey E2 |
| 20 | Admin Layout & Server Auth Guard (/admin) | 250px fixed sidebar, breadcrumbs, session guard, noindex robots meta | M4 | R4, Survey E2 |
| 21 | Real Metric Cards with Skeletons (/admin) | Total Events, Total Photos, Guest Searches, Successful Matches with skeleton loaders | M4 | R4, Survey E2 |
| 22 | Event Management CRUD (/admin/events, /admin/events/create) | Event creation, edit, couple names, venue, date, custom slug, access code | M4 | R4, Survey E2 |
| 23 | Photo Upload Queue (/admin/events/[eventId]/photos) | Multi-photo batch upload, ceremony assignment, queue progress, deletion with confirmation | M4 | R4, Survey E1/E2 |
| 24 | Guest Access & DPDP Erasure (/admin/events/[eventId]/guests) | Guest search history, consent tracking, 1-click permanent biometric data erasure | M4 | R4, Survey E2/SM3 |
| 25 | Organizer Analytics (/admin/events/[eventId]/analytics) | Search volume, match confidence breakdown, ceremony photo distribution | M4 | R4, Survey E2 |
| 26 | Admin Settings (/admin/settings) | Organizer profile, storage status, CompreFace/ML service status | M4 | R4, Survey E2 |
| 27 | Centralized Typed API Client Layer | Standardized client in `src/lib/api/` with error normalization, timeout, and request cancellation | M5 | R5, Survey SM3 |
| 28 | Google Cloud Storage Signed Upload/Read URLs | Server-side V4 signed URLs for uploads and authenticated reads, service account credentials isolated | M5 | R5, Survey E1/SM3 |
| 29 | Face Recognition Integration & Provider Abstraction | Unified adapter for ShaadiSnap-ML (ArcFace) and CompreFace with calibrated threshold (tau=0.42) | M5 | R5, Survey E1/SM3 |
| 30 | Biometric Erasure API Endpoint | Backend route `DELETE /api/biometrics/erasure` triggering physical embedding purging | M5 | R5, Survey SM3 |
| 31 | Safe Offline Fallback Boundary | Graceful degraded mode when ML services are offline without fabricating match scores | M5 | R5, Survey SM3 |
| 32 | Dual-Track E2E Test Suite (Tiers 1-4) | Automated requirement-driven test suite with >=11xN test cases published via TEST_READY.md | M6 | AC, Project Pattern |
| 33 | Tier 5 Adversarial Coverage Hardening | White-box stress testing, edge-case probing, zero regressions | M6 | AC, Project Pattern |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Design System & Global UI Foundation | Rose Champagne CSS variables, fluid clamp typography, 16px/24px radii, light mode enforcement, 1280px max desktop width, Navbar, Footer, zero dead links | none | DONE |
| M2 | Public Editorial & Auth Routes | Rebuilt `/`, `/how-it-works`, `/features`, `/privacy`, `/terms`, `/contact`, `/login`, `/register`, `/verify`, `/forgot-password`, SEO metadata | M1 | PLANNED |
| M3 | Guest Photo Discovery & AI Experience | `/find-photos`, `/event/[eventSlug]`, `/event/[eventSlug]/processing` (7 stages), `/event/[eventSlug]/gallery` (masonry grid, ceremony filters, batch download), `/photo/[photoId]`, biometric consent gating | M1, M2 | PLANNED |
| M4 | Event Organizer Admin Dashboard | `/admin` layout (250px sidebar, auth guard, `noindex`), live metric cards with skeletons, `/admin/events` CRUD, photo upload queue, guest access & DPDP biometric erasure, analytics, settings | M1, M3 | PLANNED |
| M5 | Backend API, Storage & Face Integration | Typed API client (`src/lib/api/`), server-side GCS V4 signed URLs, CompreFace / ShaadiSnap-ML adapter, DPDP erasure endpoint, safe offline fallback boundary | M3, M4 | PLANNED |
| M6 | E2E Testing Track & Final Hardening | Requirement-driven test suite (Tiers 1-4) published via `TEST_READY.md`, 100% test pass, Tier 5 adversarial coverage hardening | M1-M5, E2E Track | PLANNED |

---

## Interface Contracts

### 1. Design System Tokens (`src/app/globals.css`)
```css
:root {
  --color-rose-primary: #A85D70;
  --color-rose-hover: #914C60;
  --color-rose-soft: #F1D5D5;
  --color-ivory-warm: #FFF8F3;
  --color-burgundy-deep: #633C49;
  --color-champagne: #D9B7A0;
  --color-white-pure: #FFFFFF;
  --color-text-body: #765D62;
  --color-text-muted: #947A80;
  --color-border-subtle: #EADDE0;
  --color-success: #3D7A5A;
  --color-warning: #B87B2E;
  --color-error: #A63B48;

  --max-width-content: 1280px;
  --sidebar-width-admin: 250px;
  --radius-card-sm: 16px;
  --radius-card-lg: 24px;
}
```

### 2. Typed API Client Contract (`src/lib/api/types.ts`)
```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: ApiErrorCode;
  timestamp: number;
}

export interface MatchedPhoto {
  photoId: string;
  url: string;
  ceremony: string;
  title?: string;
  maxSimilarity: number;
  confidenceTier: 'high' | 'medium';
  aspectRatio?: 'portrait' | 'landscape' | 'square';
  facesCount?: number;
}

export interface FaceSearchResponse {
  success: boolean;
  engine: string;
  eventId: string;
  guestId: string;
  totalMatches: number;
  thresholdUsed: number;
  matches: MatchedPhoto[];
  isOfflineFallback?: boolean;
}

export interface BiometricErasureResponse {
  success: boolean;
  guestId: string;
  eventId: string;
  deletedFaceSignatures: number;
  auditTimestamp: number;
  message: string;
}

export interface AdminMetrics {
  totalEvents: number;
  totalPhotos: number;
  guestSearches: number;
  successfulMatches: number;
}
```

### 3. Biometric Consent Verbatim Copy
```
"I authorize ShaadiSnap to perform ephemeral facial biometric analysis solely for the purpose of discovering my photographs. My selfie is never added to public models, and my biometric data can be erased at any time in compliance with DPDP Act 2023 & GDPR."
```

### 4. Discrete Stage Progression
1. `Uploading selfie`
2. `Validating image`
3. `Detecting face`
4. `Generating embedding`
5. `Searching photos`
6. `Preparing gallery`
7. `Completed`

---

## Code Layout

```
shaadisnap-web/
├── package.json
├── next.config.ts
├── tsconfig.json
├── .gitignore
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Root layout (Rose Champagne tokens, fonts)
│   │   ├── globals.css                    # Centralized CSS variables, typography clamp
│   │   ├── page.tsx                       # Homepage (Editorial luxury aesthetic)
│   │   ├── how-it-works/page.tsx          # 4-step walkthrough
│   │   ├── features/page.tsx              # 3-column features showcase
│   │   ├── privacy/page.tsx               # DPDP 2023 & GDPR privacy policy
│   │   ├── terms/page.tsx                 # Terms of service
│   │   ├── contact/page.tsx               # Contact form
│   │   ├── login/page.tsx                 # Sign-in
│   │   ├── register/page.tsx              # Account creation
│   │   ├── verify/page.tsx                # Email/access code verification
│   │   ├── forgot-password/page.tsx       # Password recovery
│   │   ├── find-photos/page.tsx           # Event discovery
│   │   ├── event/
│   │   │   └── [eventSlug]/
│   │   │       ├── page.tsx               # Event landing & selfie uploader
│   │   │       ├── processing/page.tsx    # 7-stage processing visualizer
│   │   │       └── gallery/page.tsx       # Matched masonry gallery & batch download
│   │   ├── photo/
│   │   │   └── [photoId]/page.tsx         # Single photo detail & download
│   │   ├── admin/
│   │   │   ├── layout.tsx                 # Admin layout (250px sidebar, auth guard)
│   │   │   ├── page.tsx                   # Admin metrics overview
│   │   │   ├── events/
│   │   │   │   ├── page.tsx               # Events table
│   │   │   │   └── create/page.tsx        # Create event form
│   │   │   ├── events/[eventId]/
│   │   │   │   ├── photos/page.tsx        # Photo upload queue
│   │   │   │   ├── guests/page.tsx        # Guest history & DPDP erasure
│   │   │   │   └── analytics/page.tsx     # Guest & match analytics
│   │   │   └── settings/page.tsx          # Admin settings
│   │   └── api/
│   │       ├── face-search/route.ts       # Facial recognition search proxy
│   │       ├── biometrics/erasure/route.ts# DPDP/GDPR biometric erasure
│   │       ├── storage/signed-url/route.ts# GCS V4 signed URLs
│   │       └── admin/metrics/route.ts     # Real aggregated metrics
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx                 # Brand navigation (zero dead links)
│   │   │   └── Footer.tsx                 # 4-column luxury footer
│   │   ├── public/
│   │   │   ├── Hero.tsx                   # "Your Wedding Memories, Just One Face Away."
│   │   │   ├── TrustSection.tsx           # Privacy & biometric vault pillars
│   │   │   ├── HowItWorks.tsx             # 4 numbered steps
│   │   │   ├── FeaturesSection.tsx        # 3-column features
│   │   │   └── FinalCTASection.tsx        # Editorial call to action
│   │   ├── guest/
│   │   │   ├── SelfieUploader.tsx         # Drag-drop + camera capture with reticle
│   │   │   ├── BiometricConsentCard.tsx   # DPDP/GDPR consent checkbox
│   │   │   ├── ProcessingStepper.tsx      # 7-stage discrete progress
│   │   │   ├── MatchedGallery.tsx         # Masonry grid, ceremony filters, batch ZIP
│   │   │   └── LightboxModal.tsx          # Fullscreen zoom, next/prev, original download
│   │   └── admin/
│   │       ├── AdminSidebar.tsx           # Fixed 250px sidebar
│   │       ├── MetricCard.tsx             # Metric card with skeleton loader
│   │       ├── PhotoUploadQueue.tsx       # Batch photo upload table
│   │       └── GuestManagementTable.tsx   # Guest access & DPDP erasure
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts                  # Typed HTTP client
│   │   │   ├── types.ts                   # Domain types
│   │   │   ├── faceService.ts             # Face AI service
│   │   │   ├── storageService.ts          # GCS storage service
│   │   │   └── adminService.ts            # Admin metrics service
│   │   └── weddingPhotoStore.ts           # Store & local caching
│   └── data/
│       └── mockWeddingData.ts             # Seed wedding & gallery data
```
