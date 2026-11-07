# Project: ShaadiSnap Authentic Photography & Face Matching

## Architecture
ShaadiSnap is a Next.js wedding web application that provides:
1. **Public Wedding Gallery & Album**: Displays authentic wedding moments.
2. **AI Face Match / Guest Photo Discovery (`/find-photos`)**: Allows guests to capture a live selfie or upload an image, extracts face embeddings via ArcFace, and searches indexed authentic wedding photos.
3. **Admin Portal (`/admin`)**: Allows event organizers to upload genuine event photographs, review approvals, and index faces.

Data and state flow:
- `src/lib/weddingPhotoStore.ts`: Central store managing approved wedding photos. Seeded strictly with `DEFAULT_COUPLE_PHOTO` (`/hero-couple.jpg`) and augmented via authentic organizer uploads in localStorage.
- `src/data/mockWeddingData.ts`: Static event metadata (`WEDDING_EVENT`). All mock stock photos (`MOCK_WEDDING_PHOTOS`) and demo guest profiles (`DEMO_SELFIES`) are purged.
- `src/components/GuestSelfieSearch.tsx`: Guest-facing biometric photo search. Strictly searches authentic approved photos, returns only genuine API matches, and displays an honest empty state when no match is detected.
- `src/components/FullWeddingGallery.tsx` & `src/components/LuxuryGalleryPreview.tsx`: Gallery views consuming `getApprovedWeddingPhotos()`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Purge Mock Wedding Photos | Eliminate `MOCK_WEDDING_PHOTOS` and Unsplash stock images from `mockWeddingData.ts` and `weddingPhotoStore.ts` | M1 | ORIGINAL_REQUEST §R3 |
| 2 | Purge Demo Guest Profiles | Eliminate `DEMO_SELFIES` (Ananya, Rohit, Priya) and `DemoSelfie` interface from `mockWeddingData.ts` and `GuestSelfieSearch.tsx` | M1 | ORIGINAL_REQUEST §R2 |
| 3 | Single Source of Authentic Photos | Ensure `weddingPhotoStore.ts` seeds only `DEFAULT_COUPLE_PHOTO` (`/hero-couple.jpg`) and authentic admin uploads | M1 | ORIGINAL_REQUEST §R3 |
| 4 | Eliminate Arbitrary Slicing & Fake Scores | Completely remove `photoPool.slice(0, 6)` and simulated similarity scores `(0.95 - idx * 0.04)` from `GuestSelfieSearch.tsx` | M2 | ORIGINAL_REQUEST §R1 |
| 5 | Genuine ArcFace Search against Authentic Photos | Ensure `/find-photos` queries strictly authentic approved photos and only displays genuine API face matches | M2 | ORIGINAL_REQUEST §R1 |
| 6 | Honest Empty State | Display elegant 'No Matching Photos Found' state with capture tips (lighting, angle, obstructions) and link to `/gallery` | M2 | ORIGINAL_REQUEST §R1 |
| 7 | Authentic Gallery & Album Presentation | Ensure `FullWeddingGallery.tsx` and `LuxuryGalleryPreview.tsx` display only `/hero-couple.jpg` and authentic admin uploads with zero broken cards | M3 | ORIGINAL_REQUEST §R3 |
| 8 | Clean Production Build | Verify `npm run build` completes with exit code 0 | M4 | ORIGINAL_REQUEST §R4 |
| 9 | Automated Test Suite Verification | Ensure existing automated tests in `tests/` pass cleanly without regressions | M4 | ORIGINAL_REQUEST §R4 |
| 10 | Forensic Integrity Audit | Independent forensic audit confirming no cheating, hardcoded matches, or mock facades | M4 | Audit Enforcement |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Mock Data & Demo Profile Purge | `src/data/mockWeddingData.ts`, `src/lib/weddingPhotoStore.ts` | none | DONE |
| 2 | M2: Genuine Face Matching & Honest Empty State | `src/components/GuestSelfieSearch.tsx` | M1 | IN_PROGRESS |
| 3 | M3: Authentic Gallery Presentation | `src/components/FullWeddingGallery.tsx`, `src/components/LuxuryGalleryPreview.tsx` | M1 | PLANNED |
| 4 | M4: Build, Test & Forensic Verification | Full repo build (`npm run build`), test suites (`tests/`), auditor verification | M1, M2, M3 | PLANNED |

## Interface Contracts
### `src/lib/weddingPhotoStore.ts` ↔ `src/components/GuestSelfieSearch.tsx`, `FullWeddingGallery.tsx`
- `getApprovedWeddingPhotos()`: Returns `WeddingPhoto[]` containing ONLY `DEFAULT_COUPLE_PHOTO` (id: `"hero_couple_photo"`, url: `"/hero-couple.jpg"`) and organizer-uploaded photos with `approvalStatus === "approved"`.
- `DEFAULT_COUPLE_PHOTO`: `{ id: "hero_couple_photo", url: "/hero-couple.jpg", caption: "The Happy Couple - Dhairya & Partner", ceremony: "reception", approvalStatus: "approved" }`.
- No photo in the returned array may have mock Unsplash URLs or broken links.

### Face Match API ↔ `GuestSelfieSearch.tsx`
- Request: `POST /api/face-search` with `FormData` (`file`, `eventId`, `hasConsent`, `consentToken`, `guestId`, `threshold`).
- Response: `{ success: boolean, matches: Array<{ id: string, photoId: string, similarity: number, photoUrl?: string }>, total_matches: number }`.
- When `matches.length === 0`, `matchedPhotos` is set to `[]`. No fallback slicing is permitted.

## Code Layout
- `shaadisnap-web/src/data/mockWeddingData.ts`: Wedding event metadata, constants.
- `shaadisnap-web/src/lib/weddingPhotoStore.ts`: Approved wedding photo store.
- `shaadisnap-web/src/components/GuestSelfieSearch.tsx`: Biometric face search component.
- `shaadisnap-web/src/components/FullWeddingGallery.tsx`: Full gallery component.
- `shaadisnap-web/src/components/LuxuryGalleryPreview.tsx`: Preview gallery component.
- `shaadisnap-web/tests/`: Automated test suites.
