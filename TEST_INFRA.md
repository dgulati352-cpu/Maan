# ShaadiSnap AI — Test Infrastructure Specification (TEST_INFRA.md)

## 1. Test Philosophy & Principles

ShaadiSnap AI is an enterprise-grade, luxury wedding photo discovery web application that integrates generative design systems, ephemeral facial biometrics, Google Cloud Storage, and event management workflows. To guarantee exceptional reliability, privacy compliance (DPDP Act 2023 & GDPR), and design fidelity across all viewports, the test suite is governed by five core principles:

1. **Requirement-Driven Verification**: Every test case is derived directly from authoritative requirements and interface contracts defined in `PROJECT.md` and `ORIGINAL_REQUEST.md`. No test is authored without an explicit specification anchor.
2. **Opaque-Box & Interface-Centric**: Tests interact strictly with observable inputs, outputs, UI states, CSS token contracts, API request/response structures, and security boundaries. Implementation details are decoupled from test assertions.
3. **Progressive Testability & Isolation**: Tests are self-contained, deterministic, and independently verifiable. Each test configures its own state, executes without side effects, and produces reproducible outcomes.
4. **Test Integrity**: Facade tests that pass unconditionally without exercising real logic are strictly forbidden. All assertions enforce exact mathematical boundaries, string equality, status transitions, and error cascades.
5. **Adversarial & Boundary Verification**: Includes rigorous edge-case probing: extreme viewports (360px–3840px), file size thresholds (>20MB), unsupported MIME types, multi-face selfies, missing consent tokens, expired signed URLs, offline ML fallbacks, and XSS/SQL injection payloads.

---

## 2. 33-Feature Inventory & Test Mapping

The test infrastructure provides complete end-to-end coverage across all 33 features identified in `PROJECT.md`:

| # | Feature Key | Feature Name | Tier 1 (Coverage) | Tier 2 (Boundary) | Primary Spec / Contract |
|---|-------------|--------------|-------------------|-------------------|-------------------------|
| 1 | `F01_CSS_VARS` | Rose Champagne CSS Variables | 5 tests | 5 tests | `PROJECT.md` § Interface Contract 1 |
| 2 | `F02_TYPOGRAPHY` | Fluid Clamp Typography Scale | 5 tests | 5 tests | `PROJECT.md` § R1, Survey E2 |
| 3 | `F03_LAYOUT` | Layout Container & Width Constraints | 5 tests | 5 tests | `PROJECT.md` § R1, Code Layout |
| 4 | `F04_MOTION` | Micro-Interactions & Reduced Motion | 5 tests | 5 tests | `PROJECT.md` § R1, Survey E2 |
| 5 | `F05_NAV_FOOTER` | Global Navigation & Footer | 5 tests | 5 tests | `PROJECT.md` § R1, R2 |
| 6 | `F06_HOMEPAGE` | Editorial Homepage (/) | 5 tests | 5 tests | `PROJECT.md` § R2, Survey E2 |
| 7 | `F07_HOW_IT_WORKS` | How It Works Page (/how-it-works) | 5 tests | 5 tests | `PROJECT.md` § R2, Survey E2 |
| 8 | `F08_FEATURES` | Features Page (/features) | 5 tests | 5 tests | `PROJECT.md` § R2, Survey E2 |
| 9 | `F09_LEGAL` | Legal & Compliance Pages (/privacy, /terms) | 5 tests | 5 tests | `PROJECT.md` § R2, DPDP 2023 |
| 10 | `F10_CONTACT` | Contact Page (/contact) | 5 tests | 5 tests | `PROJECT.md` § R2, Survey E2 |
| 11 | `F11_AUTH` | Complete Auth Suite (/login, /register, ...) | 5 tests | 5 tests | `PROJECT.md` § R2, Survey E2 |
| 12 | `F12_FIND_PHOTOS` | Event Selection Route (/find-photos) | 5 tests | 5 tests | `PROJECT.md` § R3, Survey E2 |
| 13 | `F13_SELFIE_UPLOAD`| Selfie Upload & Camera Capture (/event/[slug]) | 5 tests | 5 tests | `PROJECT.md` § R3, Survey E1 |
| 14 | `F14_CONSENT` | Biometric Consent Gating | 5 tests | 5 tests | `PROJECT.md` § Interface Contract 3 |
| 15 | `F15_STEPPER` | Discrete Stage Processing Stepper | 5 tests | 5 tests | `PROJECT.md` § Interface Contract 4 |
| 16 | `F16_GALLERY` | Matched Photo Gallery (/event/.../gallery) | 5 tests | 5 tests | `PROJECT.md` § R3, Survey SM3 |
| 17 | `F17_LIGHTBOX` | Fullscreen Lightbox Experience | 5 tests | 5 tests | `PROJECT.md` § R3, Survey E2 |
| 18 | `F18_BATCH_DL` | Batch Multi-Select Download | 5 tests | 5 tests | `PROJECT.md` § R3, Survey E2 |
| 19 | `F19_PHOTO_DETAIL`| Single Photo Detail Route (/photo/[id]) | 5 tests | 5 tests | `PROJECT.md` § R3, Survey E2 |
| 20 | `F20_ADMIN_GUARD` | Admin Layout & Server Auth Guard (/admin) | 5 tests | 5 tests | `PROJECT.md` § R4, Survey E2 |
| 21 | `F21_METRICS` | Real Metric Cards with Skeletons | 5 tests | 5 tests | `PROJECT.md` § Interface Contract 2 |
| 22 | `F22_EVENT_CRUD` | Event Management CRUD (/admin/events) | 5 tests | 5 tests | `PROJECT.md` § R4, Survey E2 |
| 23 | `F23_PHOTO_QUEUE` | Photo Upload Queue (/admin/.../photos) | 5 tests | 5 tests | `PROJECT.md` § R4, Survey E1 |
| 24 | `F24_DPDP_ERASURE`| Guest Access & DPDP Erasure (/admin/.../guests)| 5 tests | 5 tests | `PROJECT.md` § R4, Survey SM3 |
| 25 | `F25_ANALYTICS` | Organizer Analytics (/admin/.../analytics) | 5 tests | 5 tests | `PROJECT.md` § R4, Survey E2 |
| 26 | `F26_SETTINGS` | Admin Settings (/admin/settings) | 5 tests | 5 tests | `PROJECT.md` § R4, Survey E2 |
| 27 | `F27_API_CLIENT` | Centralized Typed API Client Layer | 5 tests | 5 tests | `PROJECT.md` § Interface Contract 2 |
| 28 | `F28_GCS_SIGNED` | GCS Signed Upload & Read URLs | 5 tests | 5 tests | `PROJECT.md` § R5, Survey E1 |
| 29 | `F29_FACE_AI` | Face AI Integration & Provider Abstraction | 5 tests | 5 tests | `PROJECT.md` § R5, ArcFace tau=0.42 |
| 30 | `F30_ERASURE_API` | Biometric Erasure API Endpoint | 5 tests | 5 tests | `PROJECT.md` § Interface Contract 2 |
| 31 | `F31_OFFLINE_FALL`| Safe Offline Fallback Boundary | 5 tests | 5 tests | `PROJECT.md` § R5, Survey SM3 |
| 32 | `F32_E2E_SUITE` | Dual-Track E2E Test Suite (Tiers 1-4) | 5 tests | 5 tests | `PROJECT.md` § M6, AC |
| 33 | `F33_ADVERSARIAL` | Tier 5 Adversarial Coverage Hardening | 5 tests | 5 tests | `PROJECT.md` § M6, AC |

---

## 3. 4-Tier Test Methodology

The test suite architecture organizes tests into four complementary tiers designed to validate every layer from unit tokens to macro end-to-end wedding day scenarios:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Tier 4: Real-World Scenarios                         │
│             20 End-to-End User Journeys & Workload Sims                │
├────────────────────────────────────────────────────────────────────────┤
│                Tier 3: Cross-Feature Combinations                      │
│             35 Pairwise & Multi-Stage Integration Flows                │
├────────────────────────────────────────────────────────────────────────┤
│                 Tier 2: Boundary & Corner Cases                        │
│          165 Negative Tests, Viewport Extremes, Error Cascades         │
├────────────────────────────────────────────────────────────────────────┤
│                  Tier 1: Feature Coverage (Core)                       │
│           165 Positive Tests (5 tests x 33 features in PROJECT.md)     │
└────────────────────────────────────────────────────────────────────────┘
```

### Tier 1: Feature Coverage (165 Tests)
- **Objective**: Verify standard positive path ("happy path") operation for all 33 features.
- **Criteria**: Each feature has >= 5 distinct, deterministic test cases exercising design tokens, DOM element expectations, valid API contracts, default state initializations, and standard user interactions.
- **Count**: 33 features * 5 = **165 test cases**.

### Tier 2: Boundary & Corner Cases (165 Tests)
- **Objective**: Verify application resilience against unexpected, malformed, or boundary-condition inputs.
- **Criteria**: Each feature has >= 5 adversarial or boundary test cases covering file size limits (>20MB), unsupported MIME types, zero matches, multiple faces in selfies, missing consent tokens, expired signed URLs, offline ML fallbacks, responsive viewport stress (360px–3840px), and injection protection.
- **Count**: 33 features * 5 = **165 test cases**.

### Tier 3: Cross-Feature Combinations (35 Tests)
- **Objective**: Verify seamless interoperability between adjacent features across user and organizer workflows.
- **Criteria**: Pairwise and sequential multi-step integration flows, such as:
  1. Event creation -> Slug generation -> Public guest lookup
  2. Batch photo upload -> Ceremony tagging -> Guest gallery filter isolation
  3. Selfie capture -> Mandatory consent verification -> 7-stage processing stepper
  4. AI face recognition match -> Masonry gallery render -> Fullscreen lightbox inspection
  5. Lightbox photo selection -> Multi-select counter -> Client-side ZIP download
  6. Guest search completion -> Admin guest history logging -> DPDP erasure trigger
  7. DPDP erasure -> Vector purging -> Re-search vector mismatch verification
  8. Private event access code creation -> Guest verification gate pass/fail
  9. ML service outage -> Fallback boundary activation -> Degradation notice display
  10. GCS V4 signed upload -> Authenticated read -> Direct photo detail route
- **Count**: **35 test cases**.

### Tier 4: Real-World Application Scenarios (20 Tests)
- **Objective**: Simulate realistic, end-to-end wedding operations under real-world conditions.
- **Scenarios**:
  1. `SCEN-01`: Sangeet Candid Bulk Upload & Guest Face Discovery
  2. `SCEN-02`: Multi-Guest Concurrent Selfie Matching Simulation
  3. `SCEN-03`: DPDP Act 2023 Biometric Erasure Workflow
  4. `SCEN-04`: Low-Bandwidth Wedding Guest Network Drop & Retry
  5. `SCEN-05`: Multi-Ceremony Wedding Weekend Journey (Haldi, Mehendi, Sangeet, Phere, Reception)
  6. `SCEN-06`: High-Security VIP Wedding Access Control
  7. `SCEN-07`: Family Album Curated Lightbox Selection & Batch Download
  8. `SCEN-08`: Photographer Live Ingestion Queue During Reception
  9. `SCEN-09`: ML Pipeline Outage & Safe Fallback Recovery
  10. `SCEN-10`: Responsive Mobile Guest Experience at Venue (360px Viewport)
  11. `SCEN-11`: Expired Signed URL Automatic Refresh Cycle
  12. `SCEN-12`: Zero-Match Guest Empathetic Guidance Experience
  13. `SCEN-13`: Accidental Unchecked Consent Prevention & Form Protection
  14. `SCEN-14`: High-Scale Wedding Event Metrics & Admin Load Simulation
  15. `SCEN-15`: Single Photo Deep-Link Social Sharing Flow
  16. `SCEN-16`: Wedding Planner Multi-Event Administration & Switching
  17. `SCEN-17`: Non-Image & Corrupt File Upload Protection
  18. `SCEN-18`: Malicious Input & XSS Protection in Event Creation
  19. `SCEN-19`: Complete Organizer Onboarding to Gallery Delivery Cycle
  20. `SCEN-20`: End-to-End Privacy Audit Trail Verification
- **Count**: **20 test cases**.

### Total Test Case Count
$$\text{Total} = 165 + 165 + 35 + 20 = 385 \text{ tests}$$
This strictly satisfies the project formula requirement: $\ge 11 \times 33 + \max(5, 33/2) = 363 + 17 = 380$ tests.

---

## 4. Test Directory Layout

All E2E test files and runners are co-located in `shaadisnap-web/tests/e2e/`:

```
shaadisnap-web/
└── tests/
    └── e2e/
        ├── runner.mjs                     # Central test runner with ANSI reporting
        ├── tier1-features.test.mjs        # Tier 1: 165 Feature Coverage tests
        ├── tier2-boundaries.test.mjs      # Tier 2: 165 Boundary & Corner tests
        ├── tier3-combinations.test.mjs    # Tier 3: 35 Pairwise Integration tests
        ├── tier4-scenarios.test.mjs       # Tier 4: 20 Real-World Wedding Scenarios
        └── helpers/
            └── contracts.mjs              # Shared schemas, contracts, tokens, assertions
```

---

## 5. Execution & Verification

### Standalone Node.js Runner
Execute all 385 tests directly using Node.js v20+ / v24+:
```bash
node tests/e2e/runner.mjs
```

### Standard NPM Test Command
Run via `npm test` from within `shaadisnap-web/`:
```bash
npm test
```

### Individual Tier Execution
Execute an individual tier file:
```bash
node tests/e2e/runner.mjs --tier=1
node tests/e2e/runner.mjs --tier=2
node tests/e2e/runner.mjs --tier=3
node tests/e2e/runner.mjs --tier=4
```

---

## 6. Authoritative Specifications & Expected Output Derivation

All expected values in the test suite are derived from:
1. **Design System**: Colors, token names, clamp formulas, and layout bounds defined in `PROJECT.md` § Interface Contract 1.
2. **Biometric Consent**: Exact verbatim copy specified in `PROJECT.md` § Interface Contract 3.
3. **Stage Sequence**: Exactly 7 discrete stages specified in `PROJECT.md` § Interface Contract 4.
4. **API Payloads**: Types and structures matching `PROJECT.md` § Interface Contract 2 (`ApiResponse<T>`, `MatchedPhoto`, `FaceSearchResponse`, `BiometricErasureResponse`, `AdminMetrics`).
5. **AI Matching**: ArcFace threshold $\tau = 0.42$, confidence tiering ('high' $\ge 0.70$, 'medium' $[0.42, 0.70)$), cosine similarity formula: $\cos(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}$.
6. **DPDP Compliance**: Ephemeral storage, zero permanent face embedding retention without consent, permanent deletion audit response.
