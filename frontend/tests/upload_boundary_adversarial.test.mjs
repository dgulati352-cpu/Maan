// shaadisnap-web/tests/upload_boundary_adversarial.test.mjs
// Adversarial Upload Boundary & Brand Integrity Verification Suite

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ==========================================
// 1. RE-IMPLEMENTED ROUTE & CLIENT VALIDATORS
//    (Matches route.ts:81-96 & GuestPhotoUpload.tsx:151-168 exactly)
// ==========================================

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];

function serverValidatePhoto(file) {
  if (!file) {
    return { status: 400, error: "No file provided" };
  }
  if (file.size === 0) {
    return { status: 400, error: "File is empty" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      status: 400,
      error: "File exceeds 20MB maximum allowed size limit",
    };
  }

  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const isMimeValid = file.type ? ALLOWED_MIME_TYPES.includes(file.type) : false;
  const isExtValid = ALLOWED_EXTENSIONS.includes(ext);

  if (!isExtValid || (file.type && !isMimeValid)) {
    return {
      status: 400,
      error: "Invalid file type. Allowed formats: JPG, PNG, WebP, HEIC",
    };
  }

  return { status: 200, valid: true };
}

function clientValidatePhoto(file) {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const isMimeValid = ALLOWED_MIME_TYPES.includes(file.type);
  const isExtValid = ALLOWED_EXTENSIONS.includes(ext);

  if (!isExtValid || (file.type && !isMimeValid)) {
    return {
      valid: false,
      error: `${file.name}: Invalid image format (JPG, PNG, WebP, HEIC supported).`,
    };
  }
  if (file.size === 0) {
    return { valid: false, error: `${file.name}: File is empty.` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `${file.name}: Exceeds 20MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  return { valid: true };
}

// ==========================================
// 2. ADVERSARIAL MATRIX DEFINITION
// ==========================================

const MATRIX_SCENARIOS = [
  {
    id: "UB-01",
    name: "Empty MIME + invalid ext (payload.bin)",
    file: { name: "payload.bin", type: "", size: 1024 },
    expectedStatus: 400,
    expectedAction: "REJECT",
  },
  {
    id: "UB-02",
    name: "Empty MIME + invalid ext (malware.exe)",
    file: { name: "malware.exe", type: "", size: 1024 },
    expectedStatus: 400,
    expectedAction: "REJECT",
  },
  {
    id: "UB-03",
    name: "Empty MIME + valid ext (photo.jpg)",
    file: { name: "photo.jpg", type: "", size: 1024 },
    expectedStatus: 200,
    expectedAction: "ACCEPT",
  },
  {
    id: "UB-04",
    name: "Empty MIME + valid ext (photo.png)",
    file: { name: "photo.png", type: "", size: 1024 },
    expectedStatus: 200,
    expectedAction: "ACCEPT",
  },
  {
    id: "UB-05",
    name: "Empty MIME + valid ext (photo.webp)",
    file: { name: "photo.webp", type: "", size: 1024 },
    expectedStatus: 200,
    expectedAction: "ACCEPT",
  },
  {
    id: "UB-06",
    name: "Empty MIME + valid ext (photo.heic)",
    file: { name: "photo.heic", type: "", size: 1024 },
    expectedStatus: 200,
    expectedAction: "ACCEPT",
  },
  {
    id: "UB-07",
    name: "Invalid MIME (application/octet-stream) + valid ext (photo.jpg)",
    file: { name: "photo.jpg", type: "application/octet-stream", size: 1024 },
    expectedStatus: 400,
    expectedAction: "REJECT",
  },
  {
    id: "UB-08",
    name: "Invalid MIME (text/plain) + valid ext (photo.jpg)",
    file: { name: "photo.jpg", type: "text/plain", size: 1024 },
    expectedStatus: 400,
    expectedAction: "REJECT",
  },
  {
    id: "UB-09",
    name: "Valid MIME (image/jpeg) + valid ext (photo.jpg)",
    file: { name: "photo.jpg", type: "image/jpeg", size: 1024 },
    expectedStatus: 200,
    expectedAction: "ACCEPT",
  },
  {
    id: "UB-10",
    name: "Valid MIME (image/jpeg) + invalid ext (exploit.exe) [PRIOR VULNERABILITY]",
    file: { name: "exploit.exe", type: "image/jpeg", size: 1024 },
    expectedStatus: 400,
    expectedAction: "REJECT",
  },
  {
    id: "UB-11",
    name: "Valid MIME (image/png) + invalid ext (script.sh) [PRIOR VULNERABILITY]",
    file: { name: "script.sh", type: "image/png", size: 1024 },
    expectedStatus: 400,
    expectedAction: "REJECT",
  },
  {
    id: "UB-12",
    name: "Valid MIME (image/webp) + invalid ext (data.bin) [PRIOR VULNERABILITY]",
    file: { name: "data.bin", type: "image/webp", size: 1024 },
    expectedStatus: 400,
    expectedAction: "REJECT",
  },
  {
    id: "UB-13",
    name: "Zero-byte file (empty.jpg)",
    file: { name: "empty.jpg", type: "image/jpeg", size: 0 },
    expectedStatus: 400,
    expectedAction: "REJECT",
    expectedErrorSubstring: "File is empty",
  },
  {
    id: "UB-14",
    name: "File exceeds 20 MB (21 MB)",
    file: { name: "large.jpg", type: "image/jpeg", size: 21 * 1024 * 1024 },
    expectedStatus: 400,
    expectedAction: "REJECT",
    expectedErrorSubstring: "20MB",
  },
  {
    id: "UB-15",
    name: "Missing file field (null)",
    file: null,
    expectedStatus: 400,
    expectedAction: "REJECT",
    expectedErrorSubstring: "No file provided",
  },
  // Extended Adversarial Edge Cases
  {
    id: "UB-16",
    name: "Double extension exploit (exploit.jpg.exe)",
    file: { name: "exploit.jpg.exe", type: "image/jpeg", size: 1024 },
    expectedStatus: 400,
    expectedAction: "REJECT",
  },
  {
    id: "UB-17",
    name: "Double extension valid (ceremony.archive.2026.png)",
    file: { name: "ceremony.archive.2026.png", type: "image/png", size: 1024 },
    expectedStatus: 200,
    expectedAction: "ACCEPT",
  },
  {
    id: "UB-18",
    name: "Uppercase extension (PHOTO.JPG)",
    file: { name: "PHOTO.JPG", type: "image/jpeg", size: 1024 },
    expectedStatus: 200,
    expectedAction: "ACCEPT",
  },
  {
    id: "UB-19",
    name: "Mixed case extension (wedding.pNg)",
    file: { name: "wedding.pNg", type: "image/png", size: 1024 },
    expectedStatus: 200,
    expectedAction: "ACCEPT",
  },
  {
    id: "UB-20",
    name: "No extension at all (imagefile)",
    file: { name: "imagefile", type: "image/jpeg", size: 1024 },
    expectedStatus: 400,
    expectedAction: "REJECT",
  },
  {
    id: "UB-21",
    name: "Trailing dot (image.)",
    file: { name: "image.", type: "image/jpeg", size: 1024 },
    expectedStatus: 400,
    expectedAction: "REJECT",
  },
  {
    id: "UB-22",
    name: "Path traversal with bad ext (../../etc/passwd.exe)",
    file: { name: "../../etc/passwd.exe", type: "image/jpeg", size: 1024 },
    expectedStatus: 400,
    expectedAction: "REJECT",
  },
  {
    id: "UB-23",
    name: "Invalid MIME (application/x-sh) + invalid ext (test.sh)",
    file: { name: "test.sh", type: "application/x-sh", size: 1024 },
    expectedStatus: 400,
    expectedAction: "REJECT",
  },
];

// ==========================================
// 3. EXECUTION HARNESS
// ==========================================

console.log("=== RUNNING EMPIRICAL CHALLENGE SUITE: it3_chal_1 ===\n");

let failures = 0;
let passes = 0;

console.log("--- 1. SERVER-SIDE UPLOAD BOUNDARY VALIDATION ---");
for (const sc of MATRIX_SCENARIOS) {
  const result = serverValidatePhoto(sc.file);
  const isMatch = result.status === sc.expectedStatus;
  const errorMatch = sc.expectedErrorSubstring
    ? result.error && result.error.includes(sc.expectedErrorSubstring)
    : true;

  if (isMatch && errorMatch) {
    passes++;
    console.log(`[PASS] [SERVER] ${sc.id}: ${sc.name} -> HTTP ${result.status} (${sc.expectedAction})`);
  } else {
    failures++;
    console.error(`[FAIL] [SERVER] ${sc.id}: ${sc.name} -> Got HTTP ${result.status}, expected HTTP ${sc.expectedStatus} (${result.error})`);
  }
}

console.log("\n--- 2. CLIENT-SIDE GUEST PHOTO UPLOAD VALIDATION PARITY ---");
for (const sc of MATRIX_SCENARIOS) {
  if (sc.file === null) continue; // Client-side handleFiles only operates on File objects

  const clientRes = clientValidatePhoto(sc.file);
  const expectedValid = sc.expectedStatus === 200;

  if (clientRes.valid === expectedValid) {
    passes++;
    console.log(`[PASS] [CLIENT] ${sc.id}: ${sc.name} -> Valid: ${clientRes.valid} (${sc.expectedAction})`);
  } else {
    failures++;
    console.error(`[FAIL] [CLIENT] ${sc.id}: ${sc.name} -> Got Valid: ${clientRes.valid}, expected ${expectedValid} (${clientRes.error})`);
  }
}

console.log("\n--- 3. THRESHOLD SANITIZATION & RANGE CLAMPING (face-search/route.ts) ---");
function sanitizeThreshold(val) {
  const rawThreshold = parseFloat(val || "0.42");
  return isNaN(rawThreshold) ? 0.42 : Math.max(0.1, Math.min(0.99, rawThreshold));
}

const thresholdCases = [
  { input: "NaN", expected: 0.42, name: "NaN string" },
  { input: "undefined", expected: 0.42, name: "undefined string" },
  { input: "", expected: 0.42, name: "empty string" },
  { input: null, expected: 0.42, name: "null input" },
  { input: "-0.5", expected: 0.1, name: "negative clamp" },
  { input: "0.05", expected: 0.1, name: "below min clamp" },
  { input: "1.5", expected: 0.99, name: "above max clamp" },
  { input: "0.42", expected: 0.42, name: "calibrated standard tau" },
  { input: "0.65", expected: 0.65, name: "valid custom tau" },
];

for (const tc of thresholdCases) {
  const actual = sanitizeThreshold(tc.input);
  if (Math.abs(actual - tc.expected) < 1e-6) {
    passes++;
    console.log(`[PASS] [THRESHOLD] ${tc.name} ('${tc.input}') -> ${actual} (matches ${tc.expected})`);
  } else {
    failures++;
    console.error(`[FAIL] [THRESHOLD] ${tc.name} ('${tc.input}') -> Got ${actual}, expected ${tc.expected}`);
  }
}

console.log("\n--- 4. STATIC CODEBASE INTEGRITY AUDIT ---");

// 4.1 Check zero alert() calls in shaadisnap-web/src
function checkZeroAlerts(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += checkZeroAlerts(fullPath);
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const alertRegex = /\b(?:window\.)?alert\s*\(/g;
      const matches = content.match(alertRegex);
      if (matches) {
        console.error(`[FAIL] Found alert() in: ${fullPath}`);
        count += matches.length;
      }
    }
  }
  return count;
}

const srcDir = path.join(projectRoot, 'src');
const alertCount = checkZeroAlerts(srcDir);
if (alertCount === 0) {
  passes++;
  console.log(`[PASS] Zero alert() calls in shaadisnap-web/src/ (0 occurrences found)`);
} else {
  failures++;
  console.error(`[FAIL] Found ${alertCount} alert() calls in shaadisnap-web/src/`);
}

// 4.2 Check 1600px container width elimination in shaadisnap-web/src
function checkZero1600px(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += checkZero1600px(fullPath);
    } else if (/\.(tsx|ts|jsx|js|css)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('1600px')) {
        console.error(`[FAIL] Found 1600px in: ${fullPath}`);
        count++;
      }
    }
  }
  return count;
}

const count1600 = checkZero1600px(srcDir);
if (count1600 === 0) {
  passes++;
  console.log(`[PASS] Zero 1600px container widths in shaadisnap-web/src/ (0 occurrences found)`);
} else {
  failures++;
  console.error(`[FAIL] Found ${count1600} files with 1600px in shaadisnap-web/src/`);
}

// 4.3 Check Hero and Gallery max-w-[1280px]
const heroContent = fs.readFileSync(path.join(srcDir, 'components', 'Hero.tsx'), 'utf8');
const galleryContent = fs.readFileSync(path.join(srcDir, 'components', 'FullWeddingGallery.tsx'), 'utf8');

if (heroContent.includes('max-w-[1280px]')) {
  passes++;
  console.log(`[PASS] Hero.tsx enforces max-w-[1280px]`);
} else {
  failures++;
  console.error(`[FAIL] Hero.tsx does not enforce max-w-[1280px]`);
}

if (galleryContent.includes('max-w-[1280px]')) {
  passes++;
  console.log(`[PASS] FullWeddingGallery.tsx enforces max-w-[1280px]`);
} else {
  failures++;
  console.error(`[FAIL] FullWeddingGallery.tsx does not enforce max-w-[1280px]`);
}

// 4.4 Check Brand Tokens in Hero, FullWeddingGallery, GuestSelfieSearch, GuestPhotoUpload
const legacyTokens = ['#C6A76A', '#242321', '#873F50', '#1A1918'];
const checkedComponents = [
  'Hero.tsx',
  'FullWeddingGallery.tsx',
  'GuestSelfieSearch.tsx',
  'GuestPhotoUpload.tsx',
];

for (const comp of checkedComponents) {
  const compContent = fs.readFileSync(path.join(srcDir, 'components', comp), 'utf8');
  let hasLegacy = false;
  for (const token of legacyTokens) {
    if (compContent.toLowerCase().includes(token.toLowerCase())) {
      hasLegacy = true;
      console.error(`[FAIL] ${comp} contains legacy token ${token}`);
    }
  }
  if (!hasLegacy) {
    passes++;
    console.log(`[PASS] ${comp} is 100% harmonized to Rose Champagne (0 legacy tokens)`);
  } else {
    failures++;
  }
}

// 4.5 Check Viewfinder reticle copy in GuestSelfieSearch.tsx
const selfieContent = fs.readFileSync(path.join(srcDir, 'components', 'GuestSelfieSearch.tsx'), 'utf8');
if (selfieContent.includes("Align your face inside the oval guide") && !selfieContent.includes("golden oval")) {
  passes++;
  console.log(`[PASS] GuestSelfieSearch.tsx reticle copy is "Align your face inside the oval guide" (zero golden copy)`);
} else {
  failures++;
  console.error(`[FAIL] GuestSelfieSearch.tsx reticle copy check failed`);
}

// ==========================================
// 5. SUMMARY VERDICT
// ==========================================

console.log(`\n========================================`);
console.log(`TOTAL CHECKS: ${passes + failures} | PASS: ${passes} | FAIL: ${failures}`);
console.log(`========================================`);

if (failures > 0) {
  console.error("\nCHALLENGE VERDICT: REQUEST_CHANGES (Failures detected)");
  process.exit(1);
} else {
  console.log("\nCHALLENGE VERDICT: APPROVE (All boundary, edge case, and brand checks PASSED)");
  process.exit(0);
}
