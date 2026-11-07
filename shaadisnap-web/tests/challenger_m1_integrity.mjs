// ============================================================================
// EMPIRICAL CHALLENGER 2: MILESTONE 1 VERIFICATION & STRESS TEST HARNESS
// Scope: Photo ID validity, hero image integrity, mock blocking & upload preservation
// ============================================================================

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDir = path.resolve(__dirname, "..");
const srcDir = path.join(webDir, "src");
const publicDir = path.join(webDir, "public");

console.log("\n========================================================================");
console.log("   🛡️  EMPIRICAL CHALLENGER: MILESTONE 1 DEEP VERIFICATION SUITE  🛡️");
console.log("========================================================================\n");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testFailures = [];

function runTest(suite, name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${suite} > ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${suite} > ${name}`);
    console.error(`     ↳ Error: ${err.message}`);
    failedTests++;
    testFailures.push({ suite, name, error: err.message, stack: err.stack });
  }
}

async function runAsyncTest(suite, name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${suite} > ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${suite} > ${name}`);
    console.error(`     ↳ Error: ${err.message}`);
    failedTests++;
    testFailures.push({ suite, name, error: err.message, stack: err.stack });
  }
}

// ============================================================================
// SUITE 1: PHYSICAL FILE & IMAGE INTEGRITY OF public/hero-couple.jpg
// ============================================================================
console.log("--- SUITE 1: Hero Couple Image File & Byte Integrity ---");

const heroImagePath = path.join(publicDir, "hero-couple.jpg");

runTest("Image Integrity", "1.1: File exists at public/hero-couple.jpg", () => {
  assert(fs.existsSync(heroImagePath), `File does not exist at ${heroImagePath}`);
});

runTest("Image Integrity", "1.2: File is a regular file and size > 0", () => {
  const stat = fs.statSync(heroImagePath);
  assert(stat.isFile(), "hero-couple.jpg is not a regular file");
  assert(stat.size > 0, `hero-couple.jpg is empty (size: ${stat.size})`);
  console.log(`     ↳ File size on disk: ${stat.size} bytes (${(stat.size / 1024).toFixed(2)} KB)`);
});

runTest("Image Integrity", "1.3: File size is within expected photographic range (> 100 KB)", () => {
  const stat = fs.statSync(heroImagePath);
  assert(stat.size >= 100000, `hero-couple.jpg is suspiciously small: ${stat.size} bytes`);
});

runTest("Image Integrity", "1.4: JPEG Start of Image (SOI) magic marker is valid (FF D8 FF)", () => {
  const buffer = fs.readFileSync(heroImagePath);
  assert(buffer.length >= 4, "File too small for JPEG header");
  const byte0 = buffer[0];
  const byte1 = buffer[1];
  const byte2 = buffer[2];
  const isSoi = byte0 === 0xff && byte1 === 0xd8 && byte2 === 0xff;
  assert(
    isSoi,
    `Invalid JPEG header: [0x${byte0.toString(16)}, 0x${byte1.toString(16)}, 0x${byte2.toString(16)}]`
  );
});

runTest("Image Integrity", "1.5: JPEG Segment marker (JFIF E0 or Exif E1) is present", () => {
  const buffer = fs.readFileSync(heroImagePath);
  const byte3 = buffer[3];
  // 0xE0 is APP0 (JFIF), 0xE1 is APP1 (Exif)
  const isJfifOrExif = byte3 === 0xe0 || byte3 === 0xe1;
  assert(
    isJfifOrExif,
    `Expected APP0 (0xE0) or APP1 (0xE1) marker, found: 0x${byte3.toString(16)}`
  );
  console.log(`     ↳ Format segment marker: 0x${byte3.toString(16).toUpperCase()} (${byte3 === 0xe0 ? "JFIF" : "Exif"})`);
});

runTest("Image Integrity", "1.6: JPEG End of Image (EOI) marker is valid (FF D9)", () => {
  const buffer = fs.readFileSync(heroImagePath);
  const lastByte1 = buffer[buffer.length - 2];
  const lastByte2 = buffer[buffer.length - 1];
  const isEoi = lastByte1 === 0xff && lastByte2 === 0xd9;
  assert(
    isEoi,
    `Invalid JPEG EOF marker: [0x${lastByte1.toString(16)}, 0x${lastByte2.toString(16)}]`
  );
  console.log(`     ↳ Valid EOF marker confirmed at byte offset ${buffer.length - 2}`);
});

// ============================================================================
// SUITE 2: STATIC CODE & AST INTEGRITY: mockWeddingData.ts & weddingPhotoStore.ts
// ============================================================================
console.log("\n--- SUITE 2: Static Code & AST Integrity ---");

const mockDataPath = path.join(srcDir, "data/mockWeddingData.ts");
const storePath = path.join(srcDir, "lib/weddingPhotoStore.ts");

runTest("Static Code Audit", "2.1: mockWeddingData.ts exports MOCK_WEDDING_PHOTOS as empty array []", () => {
  const content = fs.readFileSync(mockDataPath, "utf-8");
  const sourceFile = ts.createSourceFile(
    "mockWeddingData.ts",
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  let foundMockPhotos = false;
  let isEmptyArray = false;

  function visit(node) {
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (decl.name.getText(sourceFile) === "MOCK_WEDDING_PHOTOS") {
          foundMockPhotos = true;
          if (decl.initializer && ts.isArrayLiteralExpression(decl.initializer)) {
            isEmptyArray = decl.initializer.elements.length === 0;
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  assert(foundMockPhotos, "MOCK_WEDDING_PHOTOS not found in mockWeddingData.ts");
  assert(isEmptyArray, "MOCK_WEDDING_PHOTOS is NOT an empty array []");
});

runTest("Static Code Audit", "2.2: mockWeddingData.ts exports DEMO_SELFIES as empty array []", () => {
  const content = fs.readFileSync(mockDataPath, "utf-8");
  const sourceFile = ts.createSourceFile(
    "mockWeddingData.ts",
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  let foundDemoSelfies = false;
  let isEmptyArray = false;

  function visit(node) {
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (decl.name.getText(sourceFile) === "DEMO_SELFIES") {
          foundDemoSelfies = true;
          if (decl.initializer && ts.isArrayLiteralExpression(decl.initializer)) {
            isEmptyArray = decl.initializer.elements.length === 0;
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  assert(foundDemoSelfies, "DEMO_SELFIES not found in mockWeddingData.ts");
  assert(isEmptyArray, "DEMO_SELFIES is NOT an empty array []");
});

runTest("Static Code Audit", "2.3: Zero Unsplash image URLs in mockWeddingData.ts", () => {
  const content = fs.readFileSync(mockDataPath, "utf-8");
  assert(!content.includes("unsplash.com"), "mockWeddingData.ts still contains unsplash.com references");
});

runTest("Static Code Audit", "2.4: Zero demo guest profiles (Ananya, Rohit, Priya) in mockWeddingData.ts", () => {
  const content = fs.readFileSync(mockDataPath, "utf-8");
  assert(!content.includes("Ananya Sharma"), "Ananya Sharma still in mockWeddingData.ts");
  assert(!content.includes("Rohit Malhotra"), "Rohit Malhotra still in mockWeddingData.ts");
  assert(!content.includes("Priya Varma"), "Priya Varma still in mockWeddingData.ts");
});

runTest("Static Code Audit", "2.5: BASE_APPROVED_PHOTOS in weddingPhotoStore.ts contains ONLY DEFAULT_COUPLE_PHOTO", () => {
  const content = fs.readFileSync(storePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    "weddingPhotoStore.ts",
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  let baseApprovedPhotosFound = false;
  let elementsCount = -1;
  let elementText = "";

  function visit(node) {
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (decl.name.getText(sourceFile) === "BASE_APPROVED_PHOTOS") {
          baseApprovedPhotosFound = true;
          if (decl.initializer && ts.isArrayLiteralExpression(decl.initializer)) {
            elementsCount = decl.initializer.elements.length;
            elementText = decl.initializer.elements.map((el) => el.getText(sourceFile)).join(", ");
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  assert(baseApprovedPhotosFound, "BASE_APPROVED_PHOTOS not found in weddingPhotoStore.ts");
  assert.strictEqual(elementsCount, 1, `BASE_APPROVED_PHOTOS must have exactly 1 element, found ${elementsCount}`);
  assert.strictEqual(elementText, "DEFAULT_COUPLE_PHOTO", `BASE_APPROVED_PHOTOS element is ${elementText}`);
});

runTest("Static Code Audit", "2.6: DEFAULT_COUPLE_PHOTO strictly configured with authentic attributes", () => {
  const content = fs.readFileSync(storePath, "utf-8");
  assert(content.includes('id: "hero_couple_photo"'), "DEFAULT_COUPLE_PHOTO must have id 'hero_couple_photo'");
  assert(content.includes('url: "/hero-couple.jpg"'), "DEFAULT_COUPLE_PHOTO must have url '/hero-couple.jpg'");
  assert(content.includes('approvalStatus: "approved"'), "DEFAULT_COUPLE_PHOTO must have approvalStatus 'approved'");
});

runTest("Static Code Audit", "2.7: hero_couple_photo url '/hero-couple.jpg' points directly to valid file in public/", () => {
  // Extract url from DEFAULT_COUPLE_PHOTO in code
  const content = fs.readFileSync(storePath, "utf-8");
  const match = content.match(/id:\s*"hero_couple_photo"[\s\S]*?url:\s*"([^"]+)"/);
  assert(match, "Could not match hero_couple_photo url in weddingPhotoStore.ts");
  const relativeUrl = match[1];
  assert.strictEqual(relativeUrl, "/hero-couple.jpg");

  // Verify file in public/
  const targetPath = path.join(publicDir, relativeUrl.replace(/^\//, ""));
  assert(fs.existsSync(targetPath), `Relative URL ${relativeUrl} does not resolve to file at ${targetPath}`);
});

// ============================================================================
// SUITE 3: DYNAMIC RUNTIME STORE EXECUTION & ADVERSARIAL STRESS-TESTING
// ============================================================================
console.log("\n--- SUITE 3: Dynamic Runtime Store Execution & Stress-Testing ---");

// Set up Mock Browser Environment for Node.js
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, value) => mockStorage.set(key, String(value)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

const dispatchedEvents = [];
globalThis.window = {
  dispatchEvent: (event) => {
    dispatchedEvents.push(event.type || event);
    return true;
  },
  localStorage: globalThis.localStorage,
};
globalThis.Event = class Event {
  constructor(type) {
    this.type = type;
  }
};

// Transpile weddingPhotoStore.ts to ESM
const storeTsContent = fs.readFileSync(storePath, "utf-8");
const transpiledStore = ts.transpileModule(storeTsContent, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});

// Write to temporary test file in shaadisnap-web/tests/temp_m1_store.mjs
const tempStorePath = path.join(__dirname, "temp_m1_store.mjs");
const processedCode = transpiledStore.outputText.replace(
  /["']@\/data\/mockWeddingData["']/g,
  '"../src/data/mockWeddingData.ts"'
);

// We need a dummy or direct mock module for mockWeddingData
const tempMockDataPath = path.join(srcDir, "data/mockWeddingData.js");
fs.writeFileSync(
  tempMockDataPath,
  `export const WEDDING_EVENT = { venue: "Deventure Shimla Hills Resort, Solan (HP)" };
export const MOCK_WEDDING_PHOTOS = [];
export const DEMO_SELFIES = [];\n`
);

const processedCodeFixed = transpiledStore.outputText.replace(
  /["']@\/data\/mockWeddingData["']/g,
  '"../src/data/mockWeddingData.js"'
);
fs.writeFileSync(tempStorePath, processedCodeFixed);

const store = await import(`./temp_m1_store.mjs?update=${Date.now()}`);

await runAsyncTest("Runtime Store", "3.1: Clean Initial State — getApprovedWeddingPhotos() contains ONLY hero_couple_photo", async () => {
  mockStorage.clear();
  const approved = store.getApprovedWeddingPhotos();
  assert.strictEqual(approved.length, 1, `Expected exactly 1 approved photo, got ${approved.length}`);
  assert.strictEqual(approved[0].id, "hero_couple_photo");
  assert.strictEqual(approved[0].url, "/hero-couple.jpg");
  assert.strictEqual(approved[0].approvalStatus, "approved");
});

await runAsyncTest("Runtime Store", "3.2: Photo ID verification — All IDs in getApprovedWeddingPhotos() are strictly valid", async () => {
  const approved = store.getApprovedWeddingPhotos();
  for (const photo of approved) {
    assert(photo.id, "Photo ID must exist");
    assert(typeof photo.id === "string", "Photo ID must be string");
    assert(photo.id.trim().length > 0, "Photo ID must not be empty");
    assert(!photo.id.startsWith("photo_"), `Photo ID ${photo.id} is a legacy mock ID`);
    assert(!photo.id.startsWith("mock_"), `Photo ID ${photo.id} is a mock ID`);
    assert(!photo.url.includes("unsplash.com"), `Photo URL ${photo.url} contains unsplash`);
  }
});

await runAsyncTest("Runtime Store", "3.3: Mock Pollution Defense — Dirty localStorage with mock photos is completely blocked & pruned", async () => {
  mockStorage.clear();
  // Dirty cache simulation with legacy mock photos (photo_01 to photo_08, Unsplash links, legacy titles)
  const legacyPollutedCache = [
    {
      id: "photo_01",
      url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
      title: "Regal Royal Portrait",
      ceremony: "Reception",
      approvalStatus: "approved",
    },
    {
      id: "photo_02",
      url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
      title: "The Golden Vows",
      ceremony: "Phere",
      approvalStatus: "approved",
    },
    {
      id: "mock_intruder_99",
      url: "https://images.unsplash.com/photo-9999",
      title: "Mock Intruder",
      ceremony: "Haldi",
      approvalStatus: "approved",
    },
    {
      id: "sneaky_stock_photo",
      url: "https://example.com/cdn/stock.jpg",
      title: "Bridal Mehendi & Henna Intricacies",
      ceremony: "Mehendi",
      approvalStatus: "approved",
    },
  ];

  mockStorage.set("shaadisnap_live_wedding_photos", JSON.stringify(legacyPollutedCache));

  // 1. getWeddingPhotos() should prune them and clean localStorage
  const adminPhotos = store.getWeddingPhotos();
  assert(
    !adminPhotos.some((p) => p.id === "photo_01" || p.id === "photo_02" || p.id === "mock_intruder_99" || p.id === "sneaky_stock_photo"),
    "Legacy mock photos leaked into getWeddingPhotos()"
  );

  // 2. localStorage must have been pruned
  const cleanedStorage = JSON.parse(mockStorage.get("shaadisnap_live_wedding_photos") || "[]");
  assert.strictEqual(cleanedStorage.length, 0, "Dirty mock photos were not pruned from localStorage");

  // 3. getApprovedWeddingPhotos() must return ONLY hero_couple_photo
  const approved = store.getApprovedWeddingPhotos();
  assert.strictEqual(approved.length, 1, `Expected 1 approved photo, got ${approved.length}`);
  assert.strictEqual(approved[0].id, "hero_couple_photo");
});

await runAsyncTest("Runtime Store", "3.4: Authentic Admin Upload & CEO Approval Lifecycle", async () => {
  mockStorage.clear();
  dispatchedEvents.length = 0;

  // Step 1: Admin uploads a genuine event photo
  store.addUploadedPhoto({
    id: "authentic_sangeet_dance_001",
    url: "/uploads/sangeet_couple_dance.jpg",
    title: "Couple Sangeet Performance",
    ceremony: "Sangeet",
    photographer: "Official Wedding Team",
  });

  // Verify event dispatched
  assert(dispatchedEvents.includes("shaadisnap_photos_updated"), "Event shaadisnap_photos_updated was not dispatched");

  // Verify photo is pending and NOT visible in public approved gallery
  const adminPhotosAfterUpload = store.getWeddingPhotos();
  const pendingPhoto = adminPhotosAfterUpload.find((p) => p.id === "authentic_sangeet_dance_001");
  assert(pendingPhoto, "Uploaded photo not found in getWeddingPhotos()");
  assert.strictEqual(pendingPhoto.approvalStatus, "pending_ceo_approval", "Status must default to pending_ceo_approval");

  const publicBeforeApproval = store.getApprovedWeddingPhotos();
  assert(
    !publicBeforeApproval.some((p) => p.id === "authentic_sangeet_dance_001"),
    "Pending photo must NOT appear in getApprovedWeddingPhotos()"
  );
  assert.strictEqual(publicBeforeApproval.length, 1, "Public gallery must strictly have only 1 photo (hero couple)");

  // Step 2: CEO approves the authentic photo
  dispatchedEvents.length = 0;
  store.approvePhoto("authentic_sangeet_dance_001", "Kabir Marwaha (Chief Executive Officer)");

  assert(dispatchedEvents.includes("shaadisnap_photos_updated"), "Event shaadisnap_photos_updated was not dispatched on approval");

  // Verify approved status in store
  const adminPhotosAfterApproval = store.getWeddingPhotos();
  const approvedPhoto = adminPhotosAfterApproval.find((p) => p.id === "authentic_sangeet_dance_001");
  assert.strictEqual(approvedPhoto.approvalStatus, "approved");
  assert.strictEqual(approvedPhoto.approvedBy, "Kabir Marwaha (Chief Executive Officer)");
  assert(approvedPhoto.approvedAt, "approvedAt must be set");

  // Step 3: Now verify public gallery features BOTH the couple photo and the authentic approved photo
  const publicAfterApproval = store.getApprovedWeddingPhotos();
  assert.strictEqual(publicAfterApproval.length, 2, "Public gallery must have 2 photos after approval");
  assert(publicAfterApproval.some((p) => p.id === "hero_couple_photo"), "Hero couple photo missing");
  assert(publicAfterApproval.some((p) => p.id === "authentic_sangeet_dance_001"), "Approved authentic photo missing");
});

await runAsyncTest("Runtime Store", "3.5: Batch Approval of Genuine Uploads Preserves All Authentic Photos", async () => {
  mockStorage.clear();
  dispatchedEvents.length = 0;

  store.addUploadedPhoto({
    id: "haldi_01",
    url: "/uploads/haldi_ceremony_01.jpg",
    title: "Haldi Celebration",
    ceremony: "Haldi",
  });
  store.addUploadedPhoto({
    id: "mehendi_02",
    url: "/uploads/mehendi_ceremony_02.jpg",
    title: "Mehendi Hands",
    ceremony: "Mehendi",
  });
  store.addUploadedPhoto({
    id: "phere_03",
    url: "/uploads/phere_ceremony_03.jpg",
    title: "Sacred Phere",
    ceremony: "Phere",
  });

  // Verify all 3 added
  assert.strictEqual(store.getWeddingPhotos().length, 4); // 3 uploads + 1 hero photo
  assert.strictEqual(store.getApprovedWeddingPhotos().length, 1); // Only hero photo

  // Batch approve haldi_01 and phere_03
  store.batchApprovePhotos(["haldi_01", "phere_03"], "Kabir Marwaha (Chief Executive Officer)");

  const approved = store.getApprovedWeddingPhotos();
  assert.strictEqual(approved.length, 3, "Expected 3 approved photos (hero + haldi_01 + phere_03)");
  assert(approved.some((p) => p.id === "hero_couple_photo"));
  assert(approved.some((p) => p.id === "haldi_01"));
  assert(approved.some((p) => p.id === "phere_03"));
  assert(!approved.some((p) => p.id === "mehendi_02"), "mehendi_02 was not approved and must not appear");
});

await runAsyncTest("Runtime Store", "3.6: Adversarial Attack — Injecting Mock Photo via addUploadedPhoto is permanently blocked", async () => {
  mockStorage.clear();

  // Adversary tries to inject a mock photo with an unsplash url and mock ID
  store.addUploadedPhoto({
    id: "photo_05",
    url: "https://images.unsplash.com/photo-sangeet-fake",
    title: "Sangeet Dance Floor Candids",
    ceremony: "Sangeet",
    approvalStatus: "approved", // Adversary tries to force approved status
  });

  // Even if approvalStatus was "approved", isLegacyMockPhoto must flag and block it
  const publicPhotos = store.getApprovedWeddingPhotos();
  assert(
    !publicPhotos.some((p) => p.id === "photo_05"),
    "ADVERSARIAL LEAK: Mock photo with ID photo_05 appeared in getApprovedWeddingPhotos()!"
  );

  // Even if adversary calls approvePhoto("photo_05")
  store.approvePhoto("photo_05");
  const publicPhotosAfterApprove = store.getApprovedWeddingPhotos();
  assert(
    !publicPhotosAfterApprove.some((p) => p.id === "photo_05"),
    "ADVERSARIAL LEAK: Mock photo with ID photo_05 appeared after approvePhoto()!"
  );
});

await runAsyncTest("Runtime Store", "3.7: Authentic Rejection and Deletion Flow", async () => {
  mockStorage.clear();

  store.addUploadedPhoto({
    id: "candid_reject_test",
    url: "/uploads/candid_blur.jpg",
    title: "Blurry Moment",
    ceremony: "Reception",
  });

  store.approvePhoto("candid_reject_test");
  assert.strictEqual(store.getApprovedWeddingPhotos().length, 2);

  // Reject photo
  store.rejectPhoto("candid_reject_test");
  const publicAfterReject = store.getApprovedWeddingPhotos();
  assert.strictEqual(publicAfterReject.length, 1);
  assert(!publicAfterReject.some((p) => p.id === "candid_reject_test"));

  // Delete photo
  store.deleteUploadedPhoto("candid_reject_test");
  const adminAfterDelete = store.getWeddingPhotos();
  assert(!adminAfterDelete.some((p) => p.id === "candid_reject_test"));
});

await runAsyncTest("Runtime Store", "3.8: SSR Environment Verification (window is undefined)", async () => {
  // Temporarily simulate SSR
  const savedWindow = globalThis.window;
  try {
    delete globalThis.window;
    const ssrPhotos = store.getApprovedWeddingPhotos();
    assert.strictEqual(ssrPhotos.length, 1, "SSR must return BASE_APPROVED_PHOTOS with 1 element");
    assert.strictEqual(ssrPhotos[0].id, "hero_couple_photo");
    assert.strictEqual(ssrPhotos[0].url, "/hero-couple.jpg");
  } finally {
    globalThis.window = savedWindow;
  }
});

// Clean up temporary files
try {
  if (fs.existsSync(tempStorePath)) fs.unlinkSync(tempStorePath);
  if (fs.existsSync(tempMockDataPath)) fs.unlinkSync(tempMockDataPath);
} catch (e) {
  // ignore cleanup error
}

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log("\n========================================================================");
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
if (failedTests === 0) {
  console.log("🏆 ALL EMPIRICAL VERIFICATION TESTS PASSED CLEANLY! 🏆");
} else {
  console.error("💥 FAILURES DETECTED IN VERIFICATION SUITE!");
}
console.log("========================================================================\n");

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
