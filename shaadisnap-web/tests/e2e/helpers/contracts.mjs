import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const WEB_ROOT = path.resolve(__dirname, '../../..');

export function readSourceFile(relPath) {
  const fullPath = path.resolve(WEB_ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Source file not found at expected path: ${fullPath} (rel: ${relPath})`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

export function extractCssVariables(cssContent) {
  const vars = {};
  const regex = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let match;
  while ((match = regex.exec(cssContent)) !== null) {
    vars[match[1]] = match[2].trim();
  }
  return vars;
}

export function parseClamp(clampStr) {
  if (!clampStr) return null;
  const m = clampStr.match(/clamp\(\s*([\d.]+)rem\s*,\s*([\d.]+)rem\s*\+\s*([\d.]+)vw\s*,\s*([\d.]+)rem\s*\)/);
  if (!m) return null;
  return {
    minRem: parseFloat(m[1]),
    baseRem: parseFloat(m[2]),
    vwMult: parseFloat(m[3]),
    maxRem: parseFloat(m[4]),
  };
}

export function evaluateClampPx(parsedClamp, viewportWidthPx, rootFontSize = 16) {
  const minPx = parsedClamp.minRem * rootFontSize;
  const maxPx = parsedClamp.maxRem * rootFontSize;
  const fluidPx = (parsedClamp.baseRem * rootFontSize) + (parsedClamp.vwMult * (viewportWidthPx / 100));
  return Math.min(Math.max(fluidPx, minPx), maxPx);
}

export function getMilestoneForFeature(id) {
  const m = id.match(/^F(\d+)/);
  if (!m) return null;
  const num = parseInt(m[1], 10);
  if (num >= 1 && num <= 5) return 1;
  if (num >= 6 && num <= 11) return 2;
  if (num >= 12 && num <= 19) return 3;
  if (num >= 20 && num <= 26) return 4;
  if (num >= 27 && num <= 31) return 5;
  if (num >= 32 && num <= 33) return 6;
  return null;
}

// 0. Upcoming Milestone Contract Specifications (Staged for M2–M6)
export const HERO_HEADLINE_SPEC = 'Your Wedding Memories, Just One Face Away.';
export const HOW_IT_WORKS_STEPS_SPEC = [
  'Photographer or couple uploads wedding gallery',
  'Guest snaps or uploads a single selfie with consent',
  'AI engine computes facial embeddings and matches in seconds',
  'Guest accesses private high-res gallery and downloads photos',
];
export const FEATURES_COLUMNS_SPEC = [
  'ArcFace High-Precision Vector Engine',
  'Zero Permanent Vector Storage (Ephemeral Biometric Vault)',
  'Ceremony-Based Categorization (Haldi, Mehendi, Sangeet)',
  'Client-Side High-Speed ZIP Bundling',
  'Organizer Live Upload Queue & Metrics',
];
export const TRUST_PILLARS_SPEC = [
  'DPDP Act 2023 Compliant',
  'Ephemeral Biometric Vault',
  '99.4% Face Accuracy',
];

// 1. Rose Champagne Design Tokens Contract
export const DESIGN_TOKENS = {
  rosePrimary: '#A85D70',
  roseHover: '#914C60',
  roseSoft: '#F1D5D5',
  ivoryWarm: '#FFF8F3',
  burgundyDeep: '#633C49',
  champagne: '#D9B7A0',
  whitePure: '#FFFFFF',
  textBody: '#765D62',
  textMuted: '#947A80',
  borderSubtle: '#EADDE0',
  success: '#3D7A5A',
  warning: '#B87B2E',
  error: '#A63B48',
  maxWidthContent: 1280,
  sidebarWidthAdmin: 250,
  radiusCardSm: 16,
  radiusCardLg: 24,
};

// 2. Verbatim Biometric Consent Copy (PROJECT.md § Interface Contract 3)
export const VERBATIM_CONSENT_COPY =
  'I authorize ShaadiSnap to perform ephemeral facial biometric analysis solely for the purpose of discovering my photographs. My selfie is never added to public models, and my biometric data can be erased at any time in compliance with DPDP Act 2023 & GDPR.';

// 3. Discrete Stage Progression (PROJECT.md § Interface Contract 4)
export const DISCRETE_STAGES = [
  'Uploading selfie',
  'Validating image',
  'Detecting face',
  'Generating embedding',
  'Searching photos',
  'Preparing gallery',
  'Completed',
];

// 4. Allowed File Formats & Size Constraints
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

// 5. Ceremony Categories
export const CEREMONIES = ['All', 'Mehendi', 'Haldi', 'Sangeet', 'Phere', 'Reception'];

// 6. ArcFace / CompreFace Matching Constants
export const MATCH_THRESHOLD_TAU = 0.42;
export const HIGH_CONFIDENCE_THRESHOLD = 0.70;

// 7. Test Assertions
export function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

export function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message ? message + ': ' : ''}Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assertDeepEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${message ? message + ': ' : ''}Expected deep equality:\nExpected: ${expectedStr}\nActual:   ${actualStr}`);
  }
}

export function assertMatch(actual, regex, message) {
  if (!regex.test(String(actual))) {
    throw new Error(`${message ? message + ': ' : ''}String "${actual}" did not match pattern ${regex}`);
  }
}

export function assertThrows(fn, expectedErrorSubstring, message) {
  let threw = false;
  try {
    fn();
  } catch (err) {
    threw = true;
    if (expectedErrorSubstring && !err.message.includes(expectedErrorSubstring)) {
      throw new Error(`${message ? message + ': ' : ''}Expected error containing "${expectedErrorSubstring}", got "${err.message}"`);
    }
  }
  if (!threw) {
    throw new Error(message || 'Expected function to throw, but it succeeded');
  }
}

// 8. Color Contrast Ratio (WCAG 2.2 Formula)
function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return [r, g, b].map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (brighter + 0.05) / (darker + 0.05);
}

// 9. Clamp Calculator: clamp(minRem, valVw, maxRem)
export function computeClampPx(minRem, valVw, maxRem, viewportWidthPx, rootFontSize = 16) {
  const minPx = minRem * rootFontSize;
  const maxPx = maxRem * rootFontSize;
  const valPx = (valVw / 100) * viewportWidthPx;
  return Math.min(Math.max(valPx, minPx), maxPx);
}

// 10. Cosine Similarity & Vector Confidence
export function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function classifyConfidenceTier(similarity, tau = MATCH_THRESHOLD_TAU) {
  if (similarity < tau) return null; // No match
  if (similarity >= HIGH_CONFIDENCE_THRESHOLD) return 'high';
  return 'medium';
}

// 11. File Validation Simulator
export function validateUploadFile({ name, size, type }) {
  if (!name) return { valid: false, error: 'File name is required' };
  if (size <= 0) return { valid: false, error: 'File is empty (0 bytes)' };
  if (size > MAX_UPLOAD_SIZE_BYTES) {
    return { valid: false, error: `File size exceeds 20MB limit (size: ${(size / (1024 * 1024)).toFixed(1)}MB)` };
  }
  const ext = '.' + name.split('.').pop().toLowerCase();
  const validExt = ALLOWED_IMAGE_EXTENSIONS.includes(ext);
  const validType = ALLOWED_IMAGE_TYPES.includes(type);
  if (!validExt || !validType) {
    return { valid: false, error: `Unsupported file type "${ext || type}". Only JPG, PNG, and WebP are accepted.` };
  }
  return { valid: true };
}

// 12. GCS Signed URL Simulator
export function generateV4SignedUrl({ bucket, key, method = 'PUT', expiresInSeconds = 900, serviceAccountEmail = 'storage-signer@shaadisnap.iam.gserviceaccount.com' }) {
  const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const datestamp = timestamp.substring(0, 8);
  const credential = `${serviceAccountEmail}/${datestamp}/auto/storage/goog4_request`;
  const signedUrl = `https://storage.googleapis.com/${bucket}/${key}?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=${encodeURIComponent(credential)}&X-Goog-Date=${timestamp}&X-Goog-Expires=${expiresInSeconds}&X-Goog-SignedHeaders=host&X-Goog-Signature=mock_signature_${Date.now()}`;
  return {
    url: signedUrl,
    expiresAt: Date.now() + expiresInSeconds * 1000,
    bucket,
    key,
    method,
  };
}

// 13. DPDP Erasure Simulator
export class BiometricVaultStore {
  constructor() {
    this.embeddings = new Map(); // guestId -> vector[]
    this.guestConsents = new Map(); // guestId -> { timestamp, consentToken, active }
    this.auditLogs = [];
  }

  enrollGuest(guestId, eventId, vector, consentToken) {
    this.embeddings.set(guestId, vector);
    this.guestConsents.set(guestId, {
      eventId,
      timestamp: Date.now(),
      consentToken,
      active: true,
    });
  }

  eraseBiometrics(guestId, eventId, operator = 'admin') {
    const hasRecord = this.embeddings.has(guestId);
    let deletedCount = 0;
    if (hasRecord) {
      this.embeddings.delete(guestId);
      deletedCount = 1;
    }
    const consent = this.guestConsents.get(guestId);
    if (consent) {
      consent.active = false;
      consent.erasedAt = Date.now();
    }
    const auditRecord = {
      auditTimestamp: Date.now(),
      eventId,
      guestId,
      deletedFaceSignatures: deletedCount,
      operator,
      status: 'PURGED',
      compliance: 'DPDP_ACT_2023_SEC_12',
    };
    this.auditLogs.push(auditRecord);
    return {
      success: true,
      guestId,
      eventId,
      deletedFaceSignatures: deletedCount,
      auditTimestamp: auditRecord.auditTimestamp,
      message: 'Biometric signatures physically purged in compliance with DPDP Act 2023 & GDPR.',
    };
  }

  hasActiveBiometrics(guestId) {
    return this.embeddings.has(guestId);
  }
}

// 14. 7-Stage State Machine Simulation
export class DiscreteProcessingStateMachine {
  constructor() {
    this.currentStageIndex = 0;
    this.completed = false;
    this.failed = false;
    this.errorMessage = null;
  }

  getCurrentStage() {
    return DISCRETE_STAGES[this.currentStageIndex];
  }

  advance() {
    if (this.failed) throw new Error('Cannot advance failed stepper');
    if (this.currentStageIndex < DISCRETE_STAGES.length - 1) {
      this.currentStageIndex++;
      if (this.currentStageIndex === DISCRETE_STAGES.length - 1) {
        this.completed = true;
      }
    }
    return this.getCurrentStage();
  }

  fail(reason) {
    this.failed = true;
    this.errorMessage = reason;
  }

  retry() {
    this.failed = false;
    this.errorMessage = null;
  }
}
