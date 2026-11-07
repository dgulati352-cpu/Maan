# Project: Marwaha & Gulati Wedding Web Application (ShaadiSnap AI)
**Venue**: Deventure Shimla Hills Resort, Solan (HP) — Nov 12-13, 2026

## Architecture
ShaadiSnap AI is an ultra-luxury Rose Champagne responsive wedding photo discovery web application featuring AI facial retrieval, guest engagement, executive leadership showcase, and organizer admin management.

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
│ - Homepage (/)       │    │ - /find-photos       │    │ - /admin (Console)   │
│   • Hero             │    │   • Selfie Search    │    │   • Photo Moderation │
│   • Gallery Preview  │    │   • Biometric Vault  │    │   • CEO Approval Desk│
│   • Leadership Team  │    │   • Share Pass & QR  │    │   • Guest Links Gate │
│   • CEO Approval Flow│    │ - /gallery           │    │   • DPDP Erasure     │
│ - /how-it-works      │    │   • Approved Photos  │    │ - /upload-photos     │
│ - /features, /contact│    │   • Ceremony Filters │    │   (Master Upload)    │
└──────────────────────┘    └──────────────────────┘    └──────────────────────┘
```

## Feature Inventory
| # | Feature | Description | Milestone | Status | Source |
|---|---------|-------------|-----------|--------|--------|
| 1 | ShareGuestLinkModal | Scannable QR code, copy-to-clipboard, WhatsApp share intent with Solan wedding invitation copy | M1-SHARE | DONE | R1, Survey E1/E2 |
| 2 | Share Touchpoints | One-click triggers across Navbar, Hero, /find-photos, /gallery, and Admin | M1-SHARE | DONE | R1, Survey E1/E2 |
| 3 | Executive Leadership Section | Dedicated luxury section on `/` showcasing CEO, CFO, CTO, and full organizing team in Rose Champagne palette | M2-LEADERSHIP | DONE | R2, Survey E2 |
| 4 | "Ask CEO for Approval" Flow | Interactive CEO desk review simulation, celebratory confetti, certified "CEO Approved" VIP badge, localStorage persistence | M2-LEADERSHIP | DONE | Follow-up 1, Survey E2 |
| 5 | Gallery Guest Upload Removal | Absence of guest "Upload Photos" button on `/gallery`, preserving admin master upload | M3-CLEANUP-VENUE | DONE | R3, Survey SM3 |
| 6 | Venue String Harmonization | Replace all "royal Udaipur celebration" and Udaipur references with "Deventure Shimla Hills Resort, Solan (HP)" | M3-CLEANUP-VENUE | DONE | R3, Survey SM3 |
| 7 | Photo Batch CEO Approval Gating | Model `approvalStatus` (`pending_ceo_approval` vs `approved`); public galleries show only approved photos | M4-ADMIN-APPROVAL | DONE | Follow-up 2, Survey E2/SM3 |
| 8 | Guest Access Link CEO Approval | Admin Portal interface to approve and authorize guest facial retrieval links before live activation | M4-ADMIN-APPROVAL | DONE | Follow-up 2, Survey E2/SM3 |
| 9 | Platform Build & Lint Verification | `npm run build` exits 0 with zero errors; linter clean; 172/172 tests passed | M5-FINAL-VERIF | DONE | AC, Survey SM3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1-SHARE | Shareable Guest Link, WhatsApp Intent & QR Code Modal | none | DONE |
| 2 | M2-LEADERSHIP | Luxury Executive Leadership Team Section & CEO Approval Flow | none | DONE |
| 3 | M3-CLEANUP-VENUE | Gallery Guest Upload Removal & Venue String Harmonization | none | DONE |
| 4 | M4-ADMIN-APPROVAL | CEO/Organizer Photo Batch & Guest Link Approval in Admin Portal | M3-CLEANUP-VENUE | DONE |
| 5 | M5-FINAL-VERIF | End-to-End Build, Lint, Test Verification & Forensic Integrity Audit | M1, M2, M3, M4 | DONE |

## Gate Verification Summary
- **Reviewer 1** (`enhancement_rev_1`): **APPROVE**
- **Reviewer 2** (`enhancement_rev_2`): **APPROVE**
- **Challenger 1** (`enhancement_chal_1`): **APPROVE**
- **Challenger 2** (`enhancement_chal_2`): **APPROVE**
- **Forensic Auditor** (`enhancement_auditor_1`): **CLEAN**
- **Final Result**: **PASS (100%)**
