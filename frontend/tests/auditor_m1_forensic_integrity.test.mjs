// ============================================================================
// FORENSIC AUDITOR INDEPENDENT VERIFICATION SUITE: MILESTONE 1
// Target: mockWeddingData.ts and weddingPhotoStore.ts
// Integrity Mode: development
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

console.log("========================================================================");
console.log("   🔍 FORENSIC AUDITOR INDEPENDENT INTEGRITY VERIFICATION SUITE 🔍");
console.log("========================================================================\n");

let passed = 0;
let failed = 0;
const findings = [];

function check(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    failed++;
    findings.push({ desc, error: err.message });
  }
}

// ----------------------------------------------------------------------------
// 1. STATIC AST & SOURCE AUDIT: mockWeddingData.ts
// ----------------------------------------------------------------------------
console.log("--- 1. STATIC SOURCE AUDIT: mockWeddingData.ts ---");

const mockDataPath = path.join(srcDir, "data/mockWeddingData.ts");
const mockDataContent = fs.readFileSync(mockDataPath, "utf-8");

check("M1-01: mockWeddingData.ts exists and is readable", () => {
  assert(fs.existsSync(mockDataPath), "mockWeddingData.ts must exist");
});

check("M1-02: MOCK_WEDDING_PHOTOS is exported strictly as empty array []", () => {
  const match = mockDataContent.match(/export\s+const\s+MOCK_WEDDING_PHOTOS:\s*WeddingPhoto\[\]\s*=\s*\[\s*\];/);
  assert(match, "MOCK_WEDDING_PHOTOS must be exported as empty array []");
});

check("M1-03: DEMO_SELFIES is exported strictly as empty array []", () => {
  const match = mockDataContent.match(/export\s+const\s+DEMO_SELFIES:\s*DemoSelfie\[\]\s*=\s*\[\s*\];/);
  assert(match, "DEMO_SELFIES must be exported as empty array []");
});

check("M1-04: mockWeddingData.ts contains zero Unsplash URLs", () => {
  assert(!mockDataContent.includes("unsplash.com"), "mockWeddingData.ts must not contain unsplash.com");
});

check("M1-05: mockWeddingData.ts contains zero mock photo IDs (photo_01 to photo_08)", () => {
  assert(!/photo_0[1-8]/.test(mockDataContent), "mockWeddingData.ts must not contain photo_01 to photo_08");
});

check("M1-06: mockWeddingData.ts contains zero demo profile names (Ananya Sharma, Rohit Malhotra, Priya Varma)", () => {
  assert(!mockDataContent.includes("Ananya Sharma"), "Must not contain Ananya Sharma");
  assert(!mockDataContent.includes("Rohit Malhotra"), "Must not contain Rohit Malhotra");
  assert(!mockDataContent.includes("Priya Varma"), "Must not contain Priya Varma");
});

check("M1-07: WEDDING_EVENT metadata contract preserved", () => {
  assert(mockDataContent.includes("WEDDING_EVENT"), "WEDDING_EVENT must exist");
  assert(mockDataContent.includes("Deventure Shimla Hills Resort, Solan (HP)"), "Venue must be authentic");
});

// ----------------------------------------------------------------------------
// 2. STATIC AST & SOURCE AUDIT: weddingPhotoStore.ts
// ----------------------------------------------------------------------------
console.log("\n--- 2. STATIC SOURCE AUDIT: weddingPhotoStore.ts ---");

const storePath = path.join(srcDir, "lib/weddingPhotoStore.ts");
const storeContent = fs.readFileSync(storePath, "utf-8");

check("M1-08: weddingPhotoStore.ts exists and is readable", () => {
  assert(fs.existsSync(storePath), "weddingPhotoStore.ts must exist");
});

check("M1-09: weddingPhotoStore.ts does not import MOCK_WEDDING_PHOTOS", () => {
  assert(!/import\s+.*MOCK_WEDDING_PHOTOS.*from/i.test(storeContent), "Must not import MOCK_WEDDING_PHOTOS");
});

check("M1-10: BASE_APPROVED_PHOTOS contains strictly [DEFAULT_COUPLE_PHOTO]", () => {
  const match = storeContent.match(/const\s+BASE_APPROVED_PHOTOS:\s*WeddingPhoto\[\]\s*=\s*\[\s*DEFAULT_COUPLE_PHOTO,?\s*\];/);
  assert(match, "BASE_APPROVED_PHOTOS must only contain DEFAULT_COUPLE_PHOTO");
});

check("M1-11: DEFAULT_COUPLE_PHOTO URL is strictly '/hero-couple.jpg'", () => {
  assert(storeContent.includes('url: "/hero-couple.jpg"'), "DEFAULT_COUPLE_PHOTO must use /hero-couple.jpg");
});

check("M1-12: Asset /hero-couple.jpg exists on disk in public/", () => {
  const heroAssetPath = path.join(rootDir, "public/hero-couple.jpg");
  assert(fs.existsSync(heroAssetPath), "public/hero-couple.jpg must exist");
  const stat = fs.statSync(heroAssetPath);
  assert(stat.size > 50000, "public/hero-couple.jpg must be authentic non-empty image");
});

check("M1-13: isLegacyMockPhoto function is implemented and guards store", () => {
  assert(storeContent.includes("export function isLegacyMockPhoto"), "isLegacyMockPhoto must be exported");
  assert(storeContent.includes("unsplash.com"), "isLegacyMockPhoto must check unsplash.com");
  assert(storeContent.includes("hero_couple_photo"), "isLegacyMockPhoto must preserve hero_couple_photo");
});

// ----------------------------------------------------------------------------
// 3. RUNTIME BEHAVIORAL AUDIT: STORE PURGING & REHYDRATION DEFENSE
// ----------------------------------------------------------------------------
console.log("\n--- 3. RUNTIME BEHAVIORAL AUDIT: STORE PURGING & REHYDRATION DEFENSE ---");

// Mock browser localStorage and window
class MockStorage {
  constructor() {
    this.data = new Map();
  }
  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }
  setItem(key, value) {
    this.data.set(key, String(value));
  }
  removeItem(key) {
    this.data.delete(key);
  }
  clear() {
    this.data.clear();
  }
}

const mockStorage = new MockStorage();
global.localStorage = mockStorage;
global.window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};
global.Event = class {
  constructor(name) {
    this.name = name;
  }
};

// Transpile weddingPhotoStore to test runtime behavior directly
const transpiled = ts.transpileModule(storeContent, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});

const tempTestModulePath = path.join(__dirname, "temp_auditor_store.mjs");
const processedTs = transpiled.outputText.replace(
  /["']@\/data\/mockWeddingData["']/g,
  '"../src/data/mockWeddingData.ts"'
);
fs.writeFileSync(tempTestModulePath, processedTs);

let testStore;
try {
  testStore = await import(`./temp_auditor_store.mjs?v=${Date.now()}`);
} catch (e) {
  // If ts-node/esm resolution needs transpiled mockWeddingData
  const transpiledMock = ts.transpileModule(mockDataContent, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const tempMockPath = path.join(__dirname, "temp_auditor_mock.mjs");
  fs.writeFileSync(tempMockPath, transpiledMock.outputText.replace(/@\/lib\/googleDrive/g, "../src/lib/googleDrive"));
  const processedWithLocalMock = transpiled.outputText.replace(
    /["']@\/data\/mockWeddingData["']/g,
    '"./temp_auditor_mock.mjs"'
  );
  fs.writeFileSync(tempTestModulePath, processedWithLocalMock);
  testStore = await import(`./temp_auditor_store.mjs?v=${Date.now()}`);
}

check("M1-14: Store initial state contains strictly 1 approved photo (hero_couple_photo)", () => {
  mockStorage.clear();
  const approved = testStore.getApprovedWeddingPhotos();
  assert.strictEqual(approved.length, 1, `Expected 1 approved photo, got ${approved.length}`);
  assert.strictEqual(approved[0].id, "hero_couple_photo");
  assert.strictEqual(approved[0].url, "/hero-couple.jpg");
  assert.strictEqual(approved[0].approvalStatus, "approved");
});

check("M1-15: Legacy mock data in localStorage is purged on read", () => {
  // Seed localStorage with legacy contaminated cache
  const contaminated = [
    {
      id: "photo_01",
      url: "https://images.unsplash.com/photo-1519741497674-611481863552",
      title: "The Golden Vows",
      ceremony: "Phere",
      approvalStatus: "approved",
    },
    {
      id: "photo_02",
      url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
      title: "Bridal Mehendi & Henna Intricacies",
      ceremony: "Mehendi",
      approvalStatus: "approved",
    },
    {
      id: "genuine_user_upload_101",
      url: "/uploads/genuine_moment.jpg",
      title: "Family Portrait",
      ceremony: "Reception",
      approvalStatus: "approved",
    },
  ];

  mockStorage.setItem("shaadisnap_live_wedding_photos", JSON.stringify(contaminated));

  // Call getWeddingPhotos
  const photos = testStore.getWeddingPhotos();

  // Legacy mock photos must be eliminated
  assert(!photos.some(p => p.id === "photo_01"), "photo_01 must be purged");
  assert(!photos.some(p => p.id === "photo_02"), "photo_02 must be purged");
  assert(!photos.some(p => p.url.includes("unsplash.com")), "Unsplash URLs must be purged");

  // Genuine upload and hero couple must be present
  assert(photos.some(p => p.id === "genuine_user_upload_101"), "Genuine upload must be preserved");
  assert(photos.some(p => p.id === "hero_couple_photo"), "Hero couple must be preserved");

  // LocalStorage must have been sanitized
  const storedJson = JSON.parse(mockStorage.getItem("shaadisnap_live_wedding_photos"));
  assert.strictEqual(storedJson.length, 1, "localStorage should contain only 1 real upload");
  assert.strictEqual(storedJson[0].id, "genuine_user_upload_101");
});

check("M1-16: isLegacyMockPhoto catches all forbidden patterns", () => {
  assert.strictEqual(testStore.isLegacyMockPhoto(null), true, "Null should be legacy/invalid");
  assert.strictEqual(testStore.isLegacyMockPhoto({ id: "hero_couple_photo", url: "/hero-couple.jpg" }), false, "Hero couple must pass");
  assert.strictEqual(testStore.isLegacyMockPhoto({ id: "photo_01", url: "https://foo.com/bar.jpg" }), true, "photo_01 must be legacy");
  assert.strictEqual(testStore.isLegacyMockPhoto({ id: "mock_test", url: "https://foo.com/bar.jpg" }), true, "mock_ prefix must be legacy");
  assert.strictEqual(testStore.isLegacyMockPhoto({ id: "valid_id", url: "https://images.unsplash.com/photo-123" }), true, "Unsplash url must be legacy");
  assert.strictEqual(testStore.isLegacyMockPhoto({ id: "valid_id", url: "https://foo.com/bar.jpg", title: "The Golden Vows" }), true, "Legacy title must be legacy");
  assert.strictEqual(testStore.isLegacyMockPhoto({ id: "valid_id", url: "https://foo.com/bar.jpg", title: "Authentic Family Toast" }), false, "Valid photo must pass");
});

// Cleanup temp test module
try {
  fs.unlinkSync(tempTestModulePath);
  const tempMockPath = path.join(__dirname, "temp_auditor_mock.mjs");
  if (fs.existsSync(tempMockPath)) fs.unlinkSync(tempMockPath);
} catch {}

// ----------------------------------------------------------------------------
// Summary
// ----------------------------------------------------------------------------
console.log("\n========================================================================");
console.log(`TOTAL FORENSIC CHECKS: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log(`VERDICT: ${failed === 0 ? "CLEAN" : "INTEGRITY VIOLATION"}`);
console.log("========================================================================\n");

if (failed > 0) process.exit(1);
else process.exit(0);
