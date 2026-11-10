// ============================================================================
// EMPIRICAL CHALLENGER TEST HARNESS: MILESTONE 1 VERIFICATION
// Scope: Purge Mock Wedding Data & Demo Profiles, Store Hydration & Sanitization
// ============================================================================

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "src");

console.log("\n========================================================================");
console.log("   ⚔️  EMPIRICAL CHALLENGER: MILESTONE 1 ADVERSARIAL HARNESS ⚔️");
console.log("   Mock Data Purge, Demo Profiles, and Photo Store Sanitization");
console.log("========================================================================\n");

let passed = 0;
let failed = 0;
const failures = [];
const findings = [];

function check(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ↳ ${err.message}`);
    failed++;
    failures.push({ name, error: err.message });
  }
}

// ----------------------------------------------------------------------------
// Mock Browser Environment for localStorage and window events
// ----------------------------------------------------------------------------
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();
const dispatchedEvents = [];

global.localStorage = mockStorage;
global.window = {
  dispatchEvent: (event) => {
    dispatchedEvents.push(event.type);
    return true;
  },
  addEventListener: () => {},
  removeEventListener: () => {},
};
global.Event = class {
  constructor(type) {
    this.type = type;
  }
};

// ----------------------------------------------------------------------------
// Transpile and load TypeScript modules dynamically
// ----------------------------------------------------------------------------
function loadTsModule(filePath, aliasReplacements = {}) {
  const tsCode = fs.readFileSync(filePath, "utf-8");
  let transpiled = ts.transpileModule(tsCode, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  for (const [alias, replacement] of Object.entries(aliasReplacements)) {
    const regex = new RegExp(`["']${alias}["']`, "g");
    transpiled = transpiled.replace(regex, `"${replacement}"`);
  }

  const tempFilePath = path.join(__dirname, `temp_${path.basename(filePath, ".ts")}.mjs`);
  fs.writeFileSync(tempFilePath, transpiled);
  return { tempFilePath };
}

// Prepare transpiled modules
const mockDataPath = path.join(srcDir, "data/mockWeddingData.ts");
const storePath = path.join(srcDir, "lib/weddingPhotoStore.ts");

const tempMockData = loadTsModule(mockDataPath, {
  "@/lib/googleDrive": "./temp_stub_googleDrive.mjs",
});
// Create a small stub for googleDrive formatGoogleDriveImage
const tempStubGoogleDrivePath = path.join(__dirname, "temp_stub_googleDrive.mjs");
fs.writeFileSync(
  tempStubGoogleDrivePath,
  `export function formatGoogleDriveImage(id, width) { return "https://lh3.googleusercontent.com/d/" + id + "=s" + width; }\n`
);

const tempStore = loadTsModule(storePath, {
  "@/data/mockWeddingData": "./temp_mockWeddingData.mjs",
});

// Dynamic imports
const mockDataModule = await import(`./temp_mockWeddingData.mjs?t=${Date.now()}`);
const storeModule = await import(`./temp_weddingPhotoStore.mjs?t=${Date.now()}`);

// ============================================================================
// SUITE 1: RUNTIME EXPORTS OF mockWeddingData.ts
// ============================================================================
console.log("--- 1. RUNTIME EXPORTS OF mockWeddingData.ts ---");

check("CHAL-M1-01: MOCK_WEDDING_PHOTOS is exported as an empty array", () => {
  assert(
    Array.isArray(mockDataModule.MOCK_WEDDING_PHOTOS),
    "MOCK_WEDDING_PHOTOS must be exported as an Array"
  );
  assert.strictEqual(
    mockDataModule.MOCK_WEDDING_PHOTOS.length,
    0,
    `MOCK_WEDDING_PHOTOS must have length 0, found ${mockDataModule.MOCK_WEDDING_PHOTOS.length}`
  );
});

check("CHAL-M1-02: DEMO_SELFIES is exported as an empty array", () => {
  assert(
    Array.isArray(mockDataModule.DEMO_SELFIES),
    "DEMO_SELFIES must be exported as an Array"
  );
  assert.strictEqual(
    mockDataModule.DEMO_SELFIES.length,
    0,
    `DEMO_SELFIES must have length 0, found ${mockDataModule.DEMO_SELFIES.length}`
  );
});

check("CHAL-M1-03: Zero Unsplash URLs or demo guest profiles in mockWeddingData.ts", () => {
  const content = fs.readFileSync(mockDataPath, "utf-8");
  assert(!content.includes("unsplash.com"), "mockWeddingData.ts must not contain any unsplash.com URLs");
  assert(!content.includes("Ananya Sharma"), "mockWeddingData.ts must not contain demo profile Ananya Sharma");
  assert(!content.includes("Rohit Malhotra"), "mockWeddingData.ts must not contain demo profile Rohit Malhotra");
  assert(!content.includes("Priya Varma"), "mockWeddingData.ts must not contain demo profile Priya Varma");
  assert(!content.includes("photo_01"), "mockWeddingData.ts must not contain mock ID photo_01");
});

check("CHAL-M1-04: drivePhotoUrl helper resolves valid Drive and fallback URLs", () => {
  assert.strictEqual(typeof mockDataModule.drivePhotoUrl, "function", "drivePhotoUrl must be a function");
  const fallback = mockDataModule.drivePhotoUrl("", "/fallback.jpg");
  assert.strictEqual(fallback, "/fallback.jpg", "Empty Drive input should return fallback");
  const driveResult = mockDataModule.drivePhotoUrl("sampleDriveFileId123", "/fallback.jpg");
  assert(driveResult.includes("googleusercontent.com"), "Drive file ID should resolve to Google CDN URL");
});

// ============================================================================
// SUITE 2: RUNTIME EXPORTS OF weddingPhotoStore.ts & DEFAULT_COUPLE_PHOTO
// ============================================================================
console.log("\n--- 2. RUNTIME EXPORTS OF weddingPhotoStore.ts & DEFAULT_COUPLE_PHOTO ---");

check("CHAL-M1-05: DEFAULT_COUPLE_PHOTO export & authentic store model inspection", () => {
  // Check if DEFAULT_COUPLE_PHOTO is exported directly
  if (storeModule.DEFAULT_COUPLE_PHOTO) {
    assert.strictEqual(
      storeModule.DEFAULT_COUPLE_PHOTO.url,
      "/hero-couple.jpg",
      `storeModule.DEFAULT_COUPLE_PHOTO.url must be '/hero-couple.jpg'`
    );
    assert.strictEqual(storeModule.DEFAULT_COUPLE_PHOTO.id, "hero_couple_photo");
  } else {
    // If not exported as named export, record advisory finding and verify through getApprovedWeddingPhotos()
    findings.push({
      issue: "DEFAULT_COUPLE_PHOTO is not exported as a named export from weddingPhotoStore.ts",
      severity: "ADVISORY",
      detail: "Declared as 'const DEFAULT_COUPLE_PHOTO' instead of 'export const DEFAULT_COUPLE_PHOTO'. It is correctly accessible through getApprovedWeddingPhotos() but direct named imports { DEFAULT_COUPLE_PHOTO } are unavailable."
    });
    // Fallback: check through getApprovedWeddingPhotos()
    mockStorage.clear();
    const approved = storeModule.getApprovedWeddingPhotos();
    const couplePhoto = approved.find((p) => p.id === "hero_couple_photo");
    assert(couplePhoto, "DEFAULT_COUPLE_PHOTO (hero_couple_photo) must be present in store");
    assert.strictEqual(couplePhoto.url, "/hero-couple.jpg", "Couple photo URL must be '/hero-couple.jpg'");
  }
});

check("CHAL-M1-06: Clean store getApprovedWeddingPhotos() returns ONLY authentic photos (1 item)", () => {
  mockStorage.clear();
  const approved = storeModule.getApprovedWeddingPhotos();
  assert.strictEqual(approved.length, 1, `Clean store must return exactly 1 approved photo, got ${approved.length}`);
  assert.strictEqual(approved[0].id, "hero_couple_photo");
  assert.strictEqual(approved[0].url, "/hero-couple.jpg");
  assert.strictEqual(approved[0].approvalStatus, "approved");
});

check("CHAL-M1-07: getApprovedWeddingPhotos() contains zero Unsplash URLs and zero mock IDs", () => {
  mockStorage.clear();
  const approved = storeModule.getApprovedWeddingPhotos();
  for (const p of approved) {
    assert(!p.url.includes("unsplash.com"), `Approved photo ${p.id} contains unsplash URL: ${p.url}`);
    if (p.fallbackUrl) {
      assert(!p.fallbackUrl.includes("unsplash.com"), `Approved photo ${p.id} contains unsplash fallbackUrl`);
    }
    assert(!/^photo_\d+$/i.test(p.id), `Approved photo has legacy mock ID: ${p.id}`);
    assert(!p.id.startsWith("mock_"), `Approved photo has mock_ prefix: ${p.id}`);
  }
});

// ============================================================================
// SUITE 3: DIRTY LOCALSTORAGE SANITIZATION & PURGE
// ============================================================================
console.log("\n--- 3. DIRTY LOCALSTORAGE SANITIZATION & PURGE ---");

const STORAGE_KEY = "shaadisnap_live_wedding_photos";

const DIRTY_MOCK_PHOTOS = [
  {
    id: "photo_01",
    url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=85",
    fallbackUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=75",
    title: "Regal Royal Portrait",
    ceremony: "Reception",
    facesCount: 2,
    photographer: "Royal Wedding Photography",
    approvalStatus: "approved",
  },
  {
    id: "photo_02",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85",
    title: "The Golden Vows",
    ceremony: "Phere",
    facesCount: 2,
    photographer: "Royal Wedding Photography",
    approvalStatus: "approved",
  },
  {
    id: "photo_03",
    url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85",
    title: "Bridal Mehendi & Henna Intricacies",
    ceremony: "Mehendi",
    facesCount: 1,
    photographer: "Royal Wedding Photography",
    approvalStatus: "approved",
  },
  {
    id: "mock_custom_101",
    url: "https://images.unsplash.com/photo-999999999999",
    title: "Fake Stock Photo",
    ceremony: "Sangeet",
    approvalStatus: "approved",
  },
];

check("CHAL-M1-08: Dirty localStorage simulation — getWeddingPhotos() purges all mock photos from memory", () => {
  // Seed dirty localStorage with 4 mock photos
  mockStorage.setItem(STORAGE_KEY, JSON.stringify(DIRTY_MOCK_PHOTOS));

  // Call getWeddingPhotos()
  const photos = storeModule.getWeddingPhotos();

  // Must only contain default couple photo
  assert.strictEqual(photos.length, 1, `Expected 1 photo after sanitization, got ${photos.length}`);
  assert.strictEqual(photos[0].id, "hero_couple_photo");
  assert.strictEqual(photos[0].url, "/hero-couple.jpg");

  // Verify zero mock photos remain in returned array
  const hasMock = photos.some((p) => p.id.startsWith("photo_") || p.id.startsWith("mock_") || p.url.includes("unsplash"));
  assert.strictEqual(hasMock, false, "getWeddingPhotos() still returned mock photos!");
});

check("CHAL-M1-09: Dirty localStorage simulation — storage is overwritten and sanitized in-place", () => {
  // Check the actual localStorage content after getWeddingPhotos() was called
  const rawStorage = mockStorage.getItem(STORAGE_KEY);
  assert(rawStorage, "localStorage must not be null");
  const storedArray = JSON.parse(rawStorage);

  // The stored array of uploads should be empty (all 4 were mock)
  assert.strictEqual(storedArray.length, 0, `localStorage should have 0 uploads after purging, got ${storedArray.length}`);

  // Raw storage must not contain any unsplash links or photo_ IDs
  assert(!rawStorage.includes("unsplash.com"), "localStorage still contains unsplash.com after purge!");
  assert(!rawStorage.includes("photo_01"), "localStorage still contains photo_01 after purge!");
  assert(!rawStorage.includes("mock_custom_101"), "localStorage still contains mock_custom_101 after purge!");
});

check("CHAL-M1-10: Mixed localStorage — authentic uploads are preserved while mock photos are purged", () => {
  const authenticUpload = {
    id: "uploaded_authentic_12345",
    url: "https://storage.googleapis.com/real-bucket/real-photo.jpg",
    title: "Genuine Sangeet Celebration",
    ceremony: "Sangeet",
    facesCount: 3,
    photographer: "Guest Live Upload",
    approvalStatus: "approved",
  };

  // Mix authentic upload with 2 mock photos
  const mixedStorage = [DIRTY_MOCK_PHOTOS[0], authenticUpload, DIRTY_MOCK_PHOTOS[1]];
  mockStorage.setItem(STORAGE_KEY, JSON.stringify(mixedStorage));

  const result = storeModule.getWeddingPhotos();

  // Should have authentic upload + DEFAULT_COUPLE_PHOTO = 2
  assert.strictEqual(result.length, 2, `Expected 2 photos (1 authentic + 1 couple), got ${result.length}`);
  const authenticFound = result.find((p) => p.id === "uploaded_authentic_12345");
  assert(authenticFound, "Authentic upload was mistakenly purged!");
  assert.strictEqual(authenticFound.url, "https://storage.googleapis.com/real-bucket/real-photo.jpg");

  // Verify mock photos are gone
  assert(!result.some((p) => p.id === "photo_01"), "photo_01 was not purged");
  assert(!result.some((p) => p.id === "photo_02"), "photo_02 was not purged");

  // Verify localStorage now contains ONLY the authentic upload
  const sanitizedStorage = JSON.parse(mockStorage.getItem(STORAGE_KEY));
  assert.strictEqual(sanitizedStorage.length, 1, `localStorage should contain 1 photo, got ${sanitizedStorage.length}`);
  assert.strictEqual(sanitizedStorage[0].id, "uploaded_authentic_12345");
});

// ============================================================================
// SUITE 4: ADVERSARIAL STRESS TESTING: isLegacyMockPhoto ORACLE
// ============================================================================
console.log("\n--- 4. ADVERSARIAL STRESS TESTING: isLegacyMockPhoto ORACLE ---");

check("CHAL-M1-11: isLegacyMockPhoto correctly identifies all mock IDs and patterns", () => {
  const oracle = storeModule.isLegacyMockPhoto;
  assert(typeof oracle === "function", "isLegacyMockPhoto must be exported function");

  // True negatives (must NOT be considered legacy mock)
  assert.strictEqual(oracle({ id: "hero_couple_photo", url: "/hero-couple.jpg" }), false, "hero_couple_photo must NOT be mock");
  assert.strictEqual(oracle({ id: "uploaded_1700000000", url: "https://lh3.googleusercontent.com/d/abc=s0" }), false, "Google Drive upload must NOT be mock");
  assert.strictEqual(oracle({ id: "candid_999", url: "blob:http://localhost:3000/xyz", title: "Candid Shot" }), false, "Candid shot must NOT be mock");

  // True positives (MUST be identified as legacy mock)
  assert.strictEqual(oracle(null), true, "null must return true");
  assert.strictEqual(oracle(undefined), true, "undefined must return true");
  assert.strictEqual(oracle({}), true, "empty object must return true");
  assert.strictEqual(oracle({ id: "photo_01", url: "/something.jpg" }), true, "photo_01 must be legacy mock");
  assert.strictEqual(oracle({ id: "photo_08", url: "/something.jpg" }), true, "photo_08 must be legacy mock");
  assert.strictEqual(oracle({ id: "PHOTO_05", url: "/something.jpg" }), true, "PHOTO_05 (case-insensitive) must be legacy mock");
  assert.strictEqual(oracle({ id: "mock_photo_x", url: "/real.jpg" }), true, "mock_ prefix must be legacy mock");
  assert.strictEqual(oracle({ id: "good_id", url: "https://images.unsplash.com/photo-123" }), true, "Unsplash URL must be legacy mock");
  assert.strictEqual(oracle({ id: "good_id", url: "HTTPS://IMAGES.UNSPLASH.COM/PHOTO-123" }), true, "Uppercase Unsplash URL must be legacy mock");
  assert.strictEqual(oracle({ id: "good_id", url: "/real.jpg", fallbackUrl: "https://images.unsplash.com/photo-123" }), true, "Unsplash fallbackUrl must be legacy mock");
  assert.strictEqual(oracle({ id: "good_id", url: "/real.jpg", title: "The Golden Vows ceremony" }), true, "Legacy title 'The Golden Vows' must be mock");
  assert.strictEqual(oracle({ id: "good_id", url: "/real.jpg", title: "Bridal Mehendi & Henna Intricacies" }), true, "Legacy title 'Bridal Mehendi' must be mock");
});

check("CHAL-M1-12: Malformed JSON in localStorage does not crash store", () => {
  mockStorage.setItem(STORAGE_KEY, "{corrupt json !!!");
  let photos;
  assert.doesNotThrow(() => {
    photos = storeModule.getWeddingPhotos();
  }, "Corrupt localStorage must not throw");
  assert.strictEqual(photos.length, 1);
  assert.strictEqual(photos[0].id, "hero_couple_photo");
});

check("CHAL-M1-13: Unapproved authentic photo is EXCLUDED from getApprovedWeddingPhotos()", () => {
  mockStorage.clear();
  storeModule.addUploadedPhoto({
    id: "guest_pending_upload_99",
    url: "https://lh3.googleusercontent.com/d/file123=s0",
    title: "Pending Guest Selfie",
    ceremony: "Reception",
    approvalStatus: "pending_ceo_approval",
  });

  const publicPhotos = storeModule.getApprovedWeddingPhotos();
  assert.strictEqual(publicPhotos.length, 1, "Only hero couple photo should be approved");
  assert.strictEqual(publicPhotos[0].id, "hero_couple_photo");
  assert(!publicPhotos.some((p) => p.id === "guest_pending_upload_99"), "Pending photo leaked into public approved view!");
});

check("CHAL-M1-14: Persistence resistance — subsequent getWeddingPhotos() calls stay clean after mock purge", () => {
  mockStorage.clear();
  mockStorage.setItem(STORAGE_KEY, JSON.stringify(DIRTY_MOCK_PHOTOS));
  const call1 = storeModule.getWeddingPhotos();
  const call2 = storeModule.getWeddingPhotos();
  assert.strictEqual(call1.length, 1, `Call 1 should return 1 photo, got ${call1.length}`);
  assert.strictEqual(call2.length, 1, `Call 2 should return 1 photo, got ${call2.length}`);
  assert.strictEqual(call1[0].id, "hero_couple_photo");
  assert.strictEqual(call2[0].id, "hero_couple_photo");
});

// Cleanup temp transpiled files
try {
  if (fs.existsSync(tempMockData.tempFilePath)) fs.unlinkSync(tempMockData.tempFilePath);
  if (fs.existsSync(tempStore.tempFilePath)) fs.unlinkSync(tempStore.tempFilePath);
  if (fs.existsSync(tempStubGoogleDrivePath)) fs.unlinkSync(tempStubGoogleDrivePath);
} catch (e) {
  // ignore cleanup error
}

// ============================================================================
// VERDICT
// ============================================================================
console.log("\n========================================================================");
console.log(`TOTAL ADVERSARIAL CHECKS: ${passed + failed}`);
console.log(`  ✅ PASSED: ${passed}`);
console.log(`  ❌ FAILED: ${failed}`);
console.log("========================================================================");

if (findings.length > 0) {
  console.log("\nFINDINGS / OBSERVATIONS:");
  findings.forEach((f) => {
    console.log(`  [${f.severity}] ${f.issue}`);
    console.log(`     ↳ ${f.detail}`);
  });
}

if (failed > 0) {
  console.error("\n❌ CHALLENGE VERDICT: REQUEST_CHANGES");
  process.exit(1);
} else {
  console.log("\n💎 CHALLENGE VERDICT: APPROVE 💎");
  console.log("All Milestone 1 empirical verifications and adversarial stress tests passed cleanly!\n");
  process.exit(0);
}
