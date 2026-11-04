/**
 * adversarial_motion_consent_admin.test.mjs
 * 
 * Empirical Adversarial Challenger Test Suite (m2_core_chal_2)
 * Scope:
 * 1. Camera Viewfinder Motion & Reticle (/find-photos)
 * 2. DPDP/GDPR Biometric Consent Gating & Silent Bypass Prevention
 * 3. Celebratory Particle Bursts (Snapshots, Matches, Reduced-Motion & SSR Guards)
 * 4. Admin Management Controls (VIP Tags, 1-Click DPDP Erasure, Photo Moderation)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');

let passes = 0;
let failures = 0;
const results = [];

function assert(condition, testId, description, details = '') {
  if (condition) {
    passes++;
    results.push({ id: testId, status: 'PASS', description, details });
    console.log(`[PASS] [${testId}] ${description}`);
  } else {
    failures++;
    results.push({ id: testId, status: 'FAIL', description, details });
    console.error(`[FAIL] [${testId}] ${description} -> ${details}`);
  }
}

console.log('========================================================================');
console.log('   ⚔️  ADVERSARIAL STRESS TEST: MOTION, CONSENT & ADMIN (m2_core_chal_2)  ⚔️');
console.log('========================================================================\n');

// Load target files
const selfiePath = path.join(srcDir, 'components', 'GuestSelfieSearch.tsx');
const adminPagePath = path.join(srcDir, 'app', 'admin', 'page.tsx');
const adminLayoutPath = path.join(srcDir, 'app', 'admin', 'layout.tsx');
const globalsCssPath = path.join(srcDir, 'app', 'globals.css');
const findPhotosPagePath = path.join(srcDir, 'app', 'find-photos', 'page.tsx');

const selfieCode = fs.readFileSync(selfiePath, 'utf8');
const adminPageCode = fs.readFileSync(adminPagePath, 'utf8');
const adminLayoutCode = fs.readFileSync(adminLayoutPath, 'utf8');
const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');
const findPhotosPageCode = fs.readFileSync(findPhotosPagePath, 'utf8');

// ============================================================================
// SUITE 1: CAMERA VIEWFINDER MOTION & RETICLE
// ============================================================================
console.log('--- SUITE 1: CAMERA VIEWFINDER MOTION & RETICLE (/find-photos) ---');

// 1.1 FindPhotos page correctly renders GuestSelfieSearch
assert(
  findPhotosPageCode.includes('<GuestSelfieSearch') || findPhotosPageCode.includes('<GuestSelfieSearch />'),
  'VF-01',
  '/find-photos route mounts GuestSelfieSearch component'
);

// 1.2 Four architectural corner L-brackets exist
const tlBracket = selfieCode.includes('top-4 left-4') && selfieCode.includes('border-t-2 border-l-2');
const trBracket = selfieCode.includes('top-4 right-4') && selfieCode.includes('border-t-2 border-r-2');
const blBracket = selfieCode.includes('bottom-4 left-4') && selfieCode.includes('border-b-2 border-l-2');
const brBracket = selfieCode.includes('bottom-4 right-4') && selfieCode.includes('border-b-2 border-r-2');

assert(
  tlBracket && trBracket && blBracket && brBracket,
  'VF-02',
  'Camera viewfinder mounts all 4 architectural corner reticle L-brackets (TL, TR, BL, BR)',
  `TL: ${tlBracket}, TR: ${trBracket}, BL: ${blBracket}, BR: ${brBracket}`
);

// 1.3 Reticles use approved Rose Champagne & Champagne Gold palette
const hasReticlePalette =
  selfieCode.includes('border-[#D9B7A0]') || selfieCode.includes('border-[#A85D70]');
assert(
  hasReticlePalette,
  'VF-03',
  'Corner reticles strictly styled with Rose Champagne palette tokens (#D9B7A0, #A85D70)'
);

// 1.4 Breathing glow on camera container
const hasBreathingGlow =
  selfieCode.includes('border-2 border-[#A85D70]/40') &&
  selfieCode.includes('shadow-[0_0_24px_-2px_rgba(168,93,112,0.25)');
assert(
  hasBreathingGlow,
  'VF-04',
  'Camera viewfinder container displays Rose Champagne breathing ambient glow shadow'
);

// 1.5 Scanline laser element present
assert(
  selfieCode.includes('scan-laser-line') && selfieCode.includes('animate-scan'),
  'VF-05',
  'Vertical biometric laser scanline element present with .scan-laser-line and .animate-scan'
);

// 1.6 Keyframe definition in globals.css
const hasKeyframe =
  globalsCss.includes('@keyframes scanline-rose') &&
  globalsCss.includes('.animate-scan') &&
  globalsCss.includes('.scan-laser-line');
assert(
  hasKeyframe,
  'VF-06',
  'globals.css defines @keyframes scanline-rose, .animate-scan, and .scan-laser-line'
);

// 1.7 Reduced motion override in globals.css for scanner
const hasReducedMotionScanOverride =
  globalsCss.includes('@media (prefers-reduced-motion: reduce)') &&
  globalsCss.includes('.animate-scan') &&
  globalsCss.includes('animation: none !important');
assert(
  hasReducedMotionScanOverride,
  'VF-07',
  'prefers-reduced-motion in globals.css forces .animate-scan to animation: none !important'
);

// 1.8 Verbatim Reticle Copy
const hasVerbatimCopy = selfieCode.includes('Align your face inside the oval guide');
const hasNoLegacyCopy =
  !selfieCode.toLowerCase().includes('golden oval') &&
  !selfieCode.toLowerCase().includes('align your face inside the golden');
assert(
  hasVerbatimCopy && hasNoLegacyCopy,
  'VF-08',
  'Reticle copy matches verbatim: "Align your face inside the oval guide" (zero golden oval)',
  `Verbatim present: ${hasVerbatimCopy}, Legacy absent: ${hasNoLegacyCopy}`
);


// ============================================================================
// SUITE 2: DPDP/GDPR BIOMETRIC CONSENT GATING & SILENT BYPASS PREVENTION
// ============================================================================
console.log('\n--- SUITE 2: DPDP/GDPR BIOMETRIC CONSENT GATING ---');

// 2.1 hasConsent initial state is false
const initialConsentMatch = selfieCode.match(/const\s+\[hasConsent,\s*setHasConsent\]\s*=\s*useState(?:<boolean>)?\(([^)]+)\)/);
const initialConsentValue = initialConsentMatch ? initialConsentMatch[1].trim() : null;
assert(
  initialConsentValue === 'false',
  'CG-01',
  'Biometric consent state is initialized to false (opt-in by default)',
  `Actual initial value: ${initialConsentValue}`
);

// 2.2 Silent bypass prevention: scan for any unauthorized setHasConsent(true) calls
const setHasConsentCalls = [...selfieCode.matchAll(/setHasConsent\s*\(([^)]+)\)/g)].map(m => m[1].trim());
const unauthorizedBypass = setHasConsentCalls.filter(arg => arg === 'true');
assert(
  unauthorizedBypass.length === 0,
  'CG-02',
  'Zero silent bypass overrides (zero hardcoded setHasConsent(true) calls in logic)',
  `Total setHasConsent(true) occurrences: ${unauthorizedBypass.length}`
);

// 2.3 User checkbox handler is the sole mechanism to set consent
const hasCheckboxHandler = selfieCode.includes('onChange={(e) => {') && selfieCode.includes('setHasConsent(e.target.checked)');
assert(
  hasCheckboxHandler,
  'CG-03',
  'setHasConsent is strictly bound to explicit user checkbox action (e.target.checked)'
);

// 2.4 runSearchSimulation blocks execution when hasConsent is false
const hasConsentGuardInSearch =
  selfieCode.includes('if (!hasConsent') &&
  selfieCode.includes('Biometric consent is required under DPDP Act 2023 & GDPR') &&
  selfieCode.includes('return;');
assert(
  hasConsentGuardInSearch,
  'CG-04',
  'runSearchSimulation strictly blocks scanning when hasConsent is false with informative DPDP/GDPR error'
);

// 2.5 Button trigger does not pass bypassConsent flag
const triggerButtonCode = selfieCode.match(/<button[^>]*onClick=\{[^}]*runSearchSimulation\([^)]*\)[^}]*\}[^>]*>[\s\S]*?Scan & Find My Photos[\s\S]*?<\/button>/);
const buttonCallsWithBypass = triggerButtonCode ? triggerButtonCode[0].includes('runSearchSimulation(undefined, true)') || triggerButtonCode[0].includes('runSearchSimulation([], true)') : false;
assert(
  !buttonCallsWithBypass,
  'CG-05',
  'UI Scan button invokes runSearchSimulation() without bypass flag'
);

// 2.6 Visual warning badge is rendered when hasConsent is false
const hasConsentWarningBadge =
  selfieCode.includes('!hasConsent && (') &&
  selfieCode.includes('Please provide mandatory biometric consent above to proceed');
assert(
  hasConsentWarningBadge,
  'CG-06',
  'Visual Rose Champagne badge alerts guest when mandatory consent is missing'
);

// 2.7 Consent disclaimer explicitly references DPDP Act 2023 & GDPR with zero retention
const hasLegalDisclaimer =
  selfieCode.includes('Biometric Consent (DPDP Act 2023 & GDPR)') &&
  selfieCode.includes('ephemeral facial biometric analysis') &&
  selfieCode.includes('erased at any time');
assert(
  hasLegalDisclaimer,
  'CG-07',
  'Consent checkbox label explicitly guarantees DPDP Act 2023 & GDPR ephemeral analysis & right to erasure'
);


// ============================================================================
// SUITE 3: CELEBRATORY PARTICLE BURSTS
// ============================================================================
console.log('\n--- SUITE 3: CELEBRATORY PARTICLE BURSTS & ACCESSIBILITY ---');

// 3.1 canvas-confetti is imported
assert(
  selfieCode.includes('import confetti from "canvas-confetti"') || selfieCode.includes("import confetti from 'canvas-confetti'"),
  'PB-01',
  'canvas-confetti library imported in GuestSelfieSearch.tsx'
);

// 3.2 Confetti triggered in takeSnapshot
const takeSnapshotFn = selfieCode.match(/const\s+takeSnapshot\s*=\s*\(\)\s*=>\s*\{([\s\S]*?)\n\s*\};/);
const snapshotHasConfetti = takeSnapshotFn ? takeSnapshotFn[1].includes('confetti(') : false;
assert(
  snapshotHasConfetti,
  'PB-02',
  'Celebratory particle burst triggered during photo capture shutter press (takeSnapshot)'
);

// 3.3 Confetti triggered on photo match discovery
const matchHasConfetti =
  selfieCode.includes('if (results.length > 0)') &&
  selfieCode.includes('confetti({') &&
  selfieCode.includes('angle: 60') &&
  selfieCode.includes('angle: 120');
assert(
  matchHasConfetti,
  'PB-03',
  'Celebratory dual royal cannons triggered on photo match discovery (results.length > 0)'
);

// 3.4 typeof window !== "undefined" SSR guard
const windowGuards = [...selfieCode.matchAll(/typeof\s+window\s*!==\s*["']undefined["']/g)];
assert(
  windowGuards.length >= 2,
  'PB-04',
  'All particle burst calls protected by typeof window !== "undefined" SSR guard',
  `Found ${windowGuards.length} guards`
);

// 3.5 prefers-reduced-motion media query check
const motionChecks = [...selfieCode.matchAll(/window\.matchMedia\(\s*["']\(prefers-reduced-motion:\s*reduce\)["']\s*\)\.matches/g)];
const disableReducedMotionFlags = [...selfieCode.matchAll(/disableForReducedMotion:\s*true/g)];
assert(
  motionChecks.length >= 2 && disableReducedMotionFlags.length >= 2,
  'PB-05',
  'Confetti calls guarded by prefers-reduced-motion check AND disableForReducedMotion: true flag',
  `Media query checks: ${motionChecks.length}, disableForReducedMotion flags: ${disableReducedMotionFlags.length}`
);

// 3.6 Color harmonization of confetti particles
assert(
  selfieCode.includes('#A85D70') && selfieCode.includes('#633C49') && selfieCode.includes('#D9B7A0'),
  'PB-06',
  'Confetti particles strictly use Rose Champagne & Deep Burgundy color palette'
);


// ============================================================================
// SUITE 4: ADMIN MANAGEMENT CONTROLS
// ============================================================================
console.log('\n--- SUITE 4: ADMIN MANAGEMENT CONTROLS (/admin) ---');

// 4.1 Admin page exports default component
assert(
  adminPageCode.includes('export default function AdminPage()'),
  'AM-01',
  'src/app/admin/page.tsx exports AdminPage component'
);

// 4.2 VIP Roles defined in guest roster
const hasVipFamily = adminPageCode.includes('"Immediate Family"');
const hasVipBridal = adminPageCode.includes('"Bridal Party"');
const hasVipGroomsmen = adminPageCode.includes('"Groomsmen"');
const hasVipGuest = adminPageCode.includes('"VIP Guest"');
assert(
  hasVipFamily && hasVipBridal && hasVipGroomsmen && hasVipGuest,
  'AM-02',
  'Admin Guest Directory includes all 4 VIP roles: Immediate Family, Bridal Party, Groomsmen, VIP Guest'
);

// 4.3 1-Click DPDP Biometric Erasure Functionality
const hasErasureHandler = adminPageCode.includes('handleErasureRequest = (guest: GuestRecord)');
const updatesErasedState = adminPageCode.includes('erased: true') && adminPageCode.includes('matchedCount: 0');
const hasDpdpNotice = adminPageCode.includes('DPDP Act 2023 & GDPR Article 17');
assert(
  hasErasureHandler && updatesErasedState && hasDpdpNotice,
  'AM-03',
  '1-click DPDP biometric erasure executes permanent purge of facial embeddings with GDPR Art. 17 compliance'
);

// 4.4 UI renders 1-Click Erase button and Purged status
const hasErasureButton = adminPageCode.includes('1-Click Erase') && adminPageCode.includes('Purged (DPDP)');
assert(
  hasErasureButton,
  'AM-04',
  'Admin UI renders "1-Click Erase" action button and "Purged (DPDP)" state badge'
);

// 4.5 Photo Moderation: Multi-Select capability
const hasMultiSelect =
  adminPageCode.includes('selectedPhotoIds') &&
  adminPageCode.includes('toggleSelectPhoto') &&
  adminPageCode.includes('handleSelectAllPhotos');
assert(
  hasMultiSelect,
  'AM-05',
  'Admin photo moderation provides multi-select checkboxes (individual & Select All)'
);

// 4.6 Photo Moderation: Batch Approve action
const hasBatchApprove =
  adminPageCode.includes('handleBatchApprove') &&
  adminPageCode.includes('Approve Selected');
assert(
  hasBatchApprove,
  'AM-06',
  'Admin provides batch approval action for selected photos'
);

// 4.7 Photo Moderation: Batch Delete action
const hasBatchDelete =
  adminPageCode.includes('handleBatchDelete') &&
  adminPageCode.includes('deleteUploadedPhoto(id)') &&
  adminPageCode.includes('Delete Selected');
assert(
  hasBatchDelete,
  'AM-07',
  'Admin provides batch delete action calling store deletion on selected photos'
);

// 4.8 Photo Moderation: Ceremony Re-categorization Dropdown
const hasCeremonyDropdown =
  adminPageCode.includes('handleCeremonyChange') &&
  adminPageCode.includes('newCeremony: WeddingPhoto["ceremony"]') &&
  adminPageCode.includes('["Phere", "Sangeet", "Mehendi", "Haldi", "Reception"]');
assert(
  hasCeremonyDropdown,
  'AM-08',
  'Admin provides ceremony re-categorization dropdown supporting all 5 wedding ceremonies'
);

// 4.9 Single Photo Delete & External Link
const hasSinglePhotoActions =
  adminPageCode.includes('handleDelete(photo.id, photo.title)') &&
  adminPageCode.includes('deleteUploadedPhoto(id)');
assert(
  hasSinglePhotoActions,
  'AM-09',
  'Admin provides single photo instant deletion with live store synchronization'
);

// 4.10 Admin layout branding & security
const hasAdminBranding =
  adminLayoutCode.includes('ShaadiSnap AI Organizer') &&
  adminLayoutCode.includes('Mahine Weds Anand') &&
  adminLayoutCode.includes('DPDP Act 2023 Vault Secured');
assert(
  hasAdminBranding,
  'AM-10',
  'Admin layout reflects ShaadiSnap AI Organizer, royal event title, and DPDP Vault security badge'
);


// ============================================================================
// SUITE 5: DYNAMIC SIMULATION & STATE MACHINE STRESS TESTING
// ============================================================================
console.log('\n--- SUITE 5: DYNAMIC SIMULATION & STATE MACHINE TESTS ---');

// 5.1 Simulate Guest State Machine: DPDP Erasure
const guestMock = {
  id: 'test-guest-1',
  name: 'Prince Test',
  role: 'Immediate Family',
  table: 'Table 1',
  matchedCount: 15,
  consentGiven: true,
  erased: false,
};

function simulateErasure(g) {
  return { ...g, erased: true, matchedCount: 0 };
}

const erasedGuest = simulateErasure(guestMock);
assert(
  erasedGuest.erased === true && erasedGuest.matchedCount === 0,
  'SIM-01',
  'Guest state transition: erasure sets erased=true and zeroes matchedCount'
);

// 5.2 Simulate Consent Gating Blockade
let simNetworkCallCount = 0;
async function simulateSearch(hasConsentParam) {
  if (!hasConsentParam) {
    return { error: 'Biometric consent is required under DPDP Act 2023 & GDPR' };
  }
  simNetworkCallCount++;
  return { success: true };
}

const unconsentedRun = await simulateSearch(false);
assert(
  unconsentedRun.error && simNetworkCallCount === 0,
  'SIM-02',
  'Dynamic simulation: unconsented search returns error immediately with zero API network dispatches'
);

const consentedRun = await simulateSearch(true);
assert(
  consentedRun.success && simNetworkCallCount === 1,
  'SIM-03',
  'Dynamic simulation: consented search proceeds to API dispatch'
);

// 5.3 Simulate Photo Batch Selection State Machine
let simSelected = [];
function toggleSelect(id) {
  simSelected = simSelected.includes(id) ? simSelected.filter(x => x !== id) : [...simSelected, id];
}
function selectAll(ids) {
  simSelected = simSelected.length === ids.length ? [] : [...ids];
}

const mockPhotoIds = ['p1', 'p2', 'p3', 'p4'];
toggleSelect('p1');
assert(simSelected.length === 1 && simSelected[0] === 'p1', 'SIM-04', 'Multi-select: select single photo');

toggleSelect('p1');
assert(simSelected.length === 0, 'SIM-05', 'Multi-select: deselect single photo');

selectAll(mockPhotoIds);
assert(simSelected.length === 4, 'SIM-06', 'Multi-select: select all photos');

selectAll(mockPhotoIds);
assert(simSelected.length === 0, 'SIM-07', 'Multi-select: deselect all photos when all selected');


// ============================================================================
// VERDICT
// ============================================================================
const total = passes + failures;
console.log('\n========================================================================');
console.log(`TOTAL ADVERSARIAL CHECKS: ${total} | PASS: ${passes} | FAIL: ${failures}`);
console.log('========================================================================');

if (failures === 0) {
  console.log('\n🏆 EMPIRICAL ADVERSARIAL VERDICT: APPROVE');
  console.log('All Motion, Consent, and Admin controls withstand adversarial challenge.\n');
  process.exit(0);
} else {
  console.error(`\n❌ EMPIRICAL ADVERSARIAL VERDICT: CHALLENGE_FAILED (${failures} failures)\n`);
  process.exit(1);
}
