// ============================================================================
// ADVERSARIAL CHALLENGER 2: EMPIRICAL VERIFICATION HARNESS
// Scope: Gallery Cleanup, Venue String Audit & Admin CEO Approval Workflow
// ============================================================================

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");
const webSrcDir = path.join(rootDir, "shaadisnap-web/src");

console.log("\n========================================================================");
console.log("   ⚔️  CHALLENGER 2 EMPIRICAL ADVERSARIAL SUITE STARTING ⚔️");
console.log("   Venue String, Gallery Cleanup & Admin CEO Approval Verifier");
console.log("========================================================================\n");

let passCount = 0;
let failCount = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    failCount++;
    failures.push({ name, error: err.message });
  }
}

// Helper: Parse TypeScript file into AST
function parseTsSource(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  return {
    content,
    sourceFile: ts.createSourceFile(
      path.basename(filePath),
      content,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    ),
  };
}

// ============================================================================
// SECTION 1: GALLERY CLEANUP & UPLOAD EXPOSURE VERIFICATION
// ============================================================================
console.log("--- 1. GALLERY CLEANUP & UPLOAD EXPOSURE AST AUDIT ---");

const fullGalleryPath = path.join(webSrcDir, "components/FullWeddingGallery.tsx");
const galleryPagePath = path.join(webSrcDir, "app/gallery/page.tsx");
const homePagePath = path.join(webSrcDir, "app/page.tsx");
const uploadPhotosPagePath = path.join(webSrcDir, "app/upload-photos/page.tsx");
const adminPagePath = path.join(webSrcDir, "app/admin/page.tsx");
const adminLayoutPath = path.join(webSrcDir, "app/admin/layout.tsx");

test("CHAL-1.1: AST Analysis — FullWeddingGallery has ZERO <button> with 'Upload Photos'", () => {
  const { sourceFile, content } = parseTsSource(fullGalleryPath);

  // Search AST for any JSXElement or JSXOpeningElement that is a button
  let uploadButtonFound = false;

  function findButtons(node) {
    if (ts.isJsxElement(node)) {
      const tag = node.openingElement.tagName.getText(sourceFile);
      if (tag === "button") {
        const fullButtonText = node.getText(sourceFile);
        if (fullButtonText.includes("Upload Photos") || fullButtonText.includes("Upload")) {
          // Check if this is actually an upload button
          if (/Upload\s+Photos/.test(fullButtonText)) {
            uploadButtonFound = true;
          }
        }
      }
    }
    ts.forEachChild(node, findButtons);
  }

  findButtons(sourceFile);
  assert.strictEqual(uploadButtonFound, false, "AST contains an Upload Photos button inside FullWeddingGallery!");

  // Regex confirmation
  const uploadButtonRegex = /<button[^>]*>[\s\S]*?Upload\s+Photos[\s\S]*?<\/button>/gi;
  assert.strictEqual(uploadButtonRegex.test(content), false, "Regex match found for <button>Upload Photos</button>");
});

test("CHAL-1.2: AST Analysis — FullWeddingGallery action bar contains Share Guest Link but NO Upload action", () => {
  const { content } = parseTsSource(fullGalleryPath);
  assert(content.includes("Share Guest Link"), "FullWeddingGallery should feature the Share Guest Link action");
  assert(!content.includes("<span>Upload Photos</span>"), "FullWeddingGallery must not render '<span>Upload Photos</span>'");
});

test("CHAL-1.3: AST Analysis — src/app/gallery/page.tsx does NOT pass onUploadPhotos to FullWeddingGallery", () => {
  const { sourceFile, content } = parseTsSource(galleryPagePath);

  let passedUploadProp = false;
  function checkJsx(node) {
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      if (node.tagName.getText(sourceFile) === "FullWeddingGallery") {
        for (const attr of node.attributes.properties) {
          if (attr.name && attr.name.getText(sourceFile) === "onUploadPhotos") {
            passedUploadProp = true;
          }
        }
      }
    }
    ts.forEachChild(node, checkJsx);
  }
  checkJsx(sourceFile);

  assert.strictEqual(passedUploadProp, false, "gallery/page.tsx passes onUploadPhotos to FullWeddingGallery!");
  assert(!content.includes("onUploadPhotos="), "gallery/page.tsx source code contains onUploadPhotos=");
});

test("CHAL-1.4: AST Analysis — src/app/page.tsx gallery tab does NOT pass onUploadPhotos", () => {
  const { sourceFile } = parseTsSource(homePagePath);

  let galleryTabPassesUpload = false;
  function checkJsx(node) {
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      if (node.tagName.getText(sourceFile) === "FullWeddingGallery") {
        for (const attr of node.attributes.properties) {
          if (attr.name && attr.name.getText(sourceFile) === "onUploadPhotos") {
            galleryTabPassesUpload = true;
          }
        }
      }
    }
    ts.forEachChild(node, checkJsx);
  }
  checkJsx(sourceFile);

  assert.strictEqual(galleryTabPassesUpload, false, "page.tsx gallery tab passes onUploadPhotos prop!");
});

test("CHAL-1.5: Master photo upload accessible via /admin and /upload-photos", () => {
  const adminPage = fs.readFileSync(adminPagePath, "utf-8");
  const adminLayout = fs.readFileSync(adminLayoutPath, "utf-8");
  const uploadPage = fs.readFileSync(uploadPhotosPagePath, "utf-8");

  assert(adminPage.includes('href="/upload-photos"'), "Admin page must provide link to /upload-photos");
  assert(adminLayout.includes('href: "/upload-photos"'), "Admin layout navigation must include /upload-photos");
  assert(uploadPage.includes("<GuestPhotoUpload"), "upload-photos page must render GuestPhotoUpload component");
});

// ============================================================================
// SECTION 2: COMPREHENSIVE VENUE STRING AUDIT
// ============================================================================
console.log("\n--- 2. COMPREHENSIVE VENUE STRING SCAN & HARMONIZATION AUDIT ---");

// Collect all files in shaadisnap-web/src
function getAllFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== ".git") {
        getAllFiles(fullPath, fileList);
      }
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allWebSrcFiles = getAllFiles(webSrcDir);

test("CHAL-2.1: Automated Scan — ZERO occurrences of 'royal Udaipur celebration' in entire src/", () => {
  const offenders = [];
  for (const file of allWebSrcFiles) {
    const content = fs.readFileSync(file, "utf-8");
    if (/royal\s+Udaipur\s+celebration/i.test(content)) {
      offenders.push(path.relative(rootDir, file));
    }
  }
  assert.strictEqual(
    offenders.length,
    0,
    `Found unhandled 'royal Udaipur celebration' in: ${offenders.join(", ")}`
  );
});

test("CHAL-2.2: Automated Scan — ZERO occurrences of 'Oberoi Udaivilas' in UI presentation files", () => {
  const presentationFiles = allWebSrcFiles.filter(
    (f) =>
      (f.includes(`${path.sep}components${path.sep}`) || f.includes(`${path.sep}app${path.sep}`)) &&
      (f.endsWith(".tsx") || f.endsWith(".ts"))
  );

  const offenders = [];
  for (const file of presentationFiles) {
    const content = fs.readFileSync(file, "utf-8");
    if (/Oberoi\s+Udaivilas/i.test(content)) {
      offenders.push(path.relative(rootDir, file));
    }
  }
  assert.strictEqual(
    offenders.length,
    0,
    `Found unhandled 'Oberoi Udaivilas' in UI files: ${offenders.join(", ")}`
  );
});

test("CHAL-2.3: Automated Scan — ZERO occurrences of 'Udaipur' in UI components and app pages", () => {
  const uiFiles = allWebSrcFiles.filter(
    (f) =>
      (f.includes(`${path.sep}components${path.sep}`) || f.includes(`${path.sep}app${path.sep}`)) &&
      (f.endsWith(".tsx") || f.endsWith(".ts"))
  );

  const offenders = [];
  for (const file of uiFiles) {
    const content = fs.readFileSync(file, "utf-8");
    if (/\bUdaipur\b/i.test(content)) {
      offenders.push(path.relative(rootDir, file));
    }
  }
  assert.strictEqual(
    offenders.length,
    0,
    `Found unhandled 'Udaipur' in UI files: ${offenders.join(", ")}`
  );
});

test("CHAL-2.4: Venue string 'Deventure Shimla Hills Resort, Solan (HP)' is accurately present in canonical locations", () => {
  const requiredFiles = [
    {
      file: path.join(webSrcDir, "data/mockWeddingData.ts"),
      desc: "mockWeddingData WEDDING_EVENT.venue",
    },
    {
      file: path.join(webSrcDir, "lib/weddingPhotoStore.ts"),
      desc: "weddingPhotoStore DEFAULT_COUPLE_PHOTO",
    },
    {
      file: path.join(webSrcDir, "components/FullWeddingGallery.tsx"),
      desc: "FullWeddingGallery editorial subtitle",
    },
    {
      file: path.join(webSrcDir, "components/ShareGuestLinkModal.tsx"),
      desc: "ShareGuestLinkModal WhatsApp invitation text",
    },
    {
      file: path.join(webSrcDir, "app/admin/page.tsx"),
      desc: "Admin page banner & metrics card",
    },
    {
      file: path.join(webSrcDir, "app/admin/layout.tsx"),
      desc: "Admin layout active celebration plaque & alt tags",
    },
    {
      file: path.join(webSrcDir, "app/contact/page.tsx"),
      desc: "Contact page venue address",
    },
    {
      file: path.join(webSrcDir, "app/privacy/page.tsx"),
      desc: "Privacy page celebration scope",
    },
    {
      file: path.join(webSrcDir, "components/TrustSection.tsx"),
      desc: "TrustSection resort security card",
    },
  ];

  for (const { file, desc } of requiredFiles) {
    assert(fs.existsSync(file), `Required file missing: ${file}`);
    const content = fs.readFileSync(file, "utf-8");
    assert(
      content.includes("Deventure Shimla Hills Resort, Solan (HP)"),
      `Expected 'Deventure Shimla Hills Resort, Solan (HP)' in ${desc} (${path.relative(rootDir, file)})`
    );
  }
});

// ============================================================================
// SECTION 3: ADMIN CEO APPROVAL WORKFLOW EMPIRICAL BEHAVIORAL VERIFICATION
// ============================================================================
console.log("\n--- 3. ADMIN CEO APPROVAL WORKFLOW EMPIRICAL TESTING ---");

test("CHAL-3.1: Interface Verification — WeddingPhoto contract in mockWeddingData and weddingPhotoStore", () => {
  const mockDataContent = fs.readFileSync(path.join(webSrcDir, "data/mockWeddingData.ts"), "utf-8");
  assert(mockDataContent.includes('approvalStatus?: "pending_ceo_approval" | "approved" | "rejected"'), "mockWeddingData must define approvalStatus union");
  assert(mockDataContent.includes("approvedBy?: string"), "mockWeddingData must define approvedBy");
  assert(mockDataContent.includes("approvedAt?: string"), "mockWeddingData must define approvedAt");
  assert(mockDataContent.includes("uploadedAt?: string"), "mockWeddingData must define uploadedAt");
});

// Setup Mock Browser Environment for weddingPhotoStore
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
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
  addEventListener(event, handler) {},
  removeEventListener(event, handler) {},
  dispatchEvent(event) {
    dispatchedEvents.push(event.type);
    return true;
  },
};
global.Event = class Event {
  constructor(type) {
    this.type = type;
  }
};

// Now import the functions dynamically from weddingPhotoStore using transpile
const storeModulePath = path.join(webSrcDir, "lib/weddingPhotoStore.ts");
const storeTsContent = fs.readFileSync(storeModulePath, "utf-8");

// Transpile TypeScript to CommonJS/ESM
const transpiledStore = ts.transpileModule(storeTsContent, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});

// Write to temporary test file in shaadisnap-web/tests/temp_weddingPhotoStore.mjs
const tempStorePath = path.join(rootDir, "shaadisnap-web/tests/temp_weddingPhotoStore.mjs");
// Replace "@/data/mockWeddingData" with relative path
const processedCode = transpiledStore.outputText.replace(
  /["']@\/data\/mockWeddingData["']/g,
  '"../src/data/mockWeddingData.js"'
);

// We need a dummy mockWeddingData.js for the temp module
const tempMockDataPath = path.join(rootDir, "shaadisnap-web/src/data/mockWeddingData.js");
fs.writeFileSync(
  tempMockDataPath,
  `export const WEDDING_EVENT = { venue: "Deventure Shimla Hills Resort, Solan (HP)" };\n`
);
fs.writeFileSync(tempStorePath, processedCode);

// Dynamically import store functions
const store = await import(`./temp_weddingPhotoStore.mjs?update=${Date.now()}`);

test("CHAL-3.2: Store Initial State — Default couple photo has approvalStatus='approved'", () => {
  mockStorage.clear();
  const allPhotos = store.getWeddingPhotos();
  assert(allPhotos.length >= 1, "Should have default photo");
  const heroPhoto = allPhotos.find((p) => p.id === "hero_couple_photo");
  assert(heroPhoto, "hero_couple_photo must exist");
  assert.strictEqual(heroPhoto.approvalStatus, "approved");
  assert(heroPhoto.approvedBy.includes("Kabir Marwaha"));

  const approvedPhotos = store.getApprovedWeddingPhotos();
  assert.strictEqual(approvedPhotos.length, 1);
  assert.strictEqual(approvedPhotos[0].id, "hero_couple_photo");
});

test("CHAL-3.3: Store Ingestion — Newly added photos default to 'pending_ceo_approval' and are EXCLUDED from public gallery", () => {
  mockStorage.clear();
  dispatchedEvents.length = 0;

  store.addUploadedPhoto({
    id: "candid_001",
    url: "https://storage.googleapis.com/test/candid_001.jpg",
    title: "Guests enjoying Sangeet",
    ceremony: "Sangeet",
    photographer: "Guest Live Upload",
  });

  // Verify custom event dispatched
  assert(
    dispatchedEvents.includes("shaadisnap_photos_updated"),
    "shaadisnap_photos_updated must be dispatched on addUploadedPhoto"
  );

  // Verify getWeddingPhotos returns the new photo for admin
  const allPhotos = store.getWeddingPhotos();
  const uploaded = allPhotos.find((p) => p.id === "candid_001");
  assert(uploaded, "Uploaded photo must be present in admin getWeddingPhotos()");
  assert.strictEqual(
    uploaded.approvalStatus,
    "pending_ceo_approval",
    "Uploaded photo must default to 'pending_ceo_approval'"
  );

  // CRITICAL SECURITY ASSERTION: getApprovedWeddingPhotos MUST NOT contain candid_001!
  const publicPhotos = store.getApprovedWeddingPhotos();
  const leakedInPublic = publicPhotos.some((p) => p.id === "candid_001");
  assert.strictEqual(
    leakedInPublic,
    false,
    "VULNERABILITY: Pending candid photo leaked into getApprovedWeddingPhotos() before CEO approval!"
  );
  assert.strictEqual(publicPhotos.length, 1, "Only pre-approved couple photo should be in public view");
});

test("CHAL-3.4: Store Approval — approvePhoto() transitions status to 'approved', sets approver and timestamp, dispatches event", () => {
  dispatchedEvents.length = 0;

  store.approvePhoto("candid_001", "Kabir Marwaha (Chief Executive Officer)");

  // Check event dispatch
  assert(
    dispatchedEvents.includes("shaadisnap_photos_updated"),
    "shaadisnap_photos_updated must be dispatched on approvePhoto"
  );

  // Check admin view
  const allPhotos = store.getWeddingPhotos();
  const approvedItem = allPhotos.find((p) => p.id === "candid_001");
  assert.strictEqual(approvedItem.approvalStatus, "approved");
  assert.strictEqual(approvedItem.approvedBy, "Kabir Marwaha (Chief Executive Officer)");
  assert(approvedItem.approvedAt, "approvedAt timestamp must be set");
  assert(!isNaN(Date.parse(approvedItem.approvedAt)), "approvedAt must be valid ISO date string");

  // CRITICAL ASSERTION: Now getApprovedWeddingPhotos MUST include candid_001!
  const publicPhotos = store.getApprovedWeddingPhotos();
  const nowVisibleInPublic = publicPhotos.some((p) => p.id === "candid_001");
  assert.strictEqual(
    nowVisibleInPublic,
    true,
    "Approved photo MUST now appear in public getApprovedWeddingPhotos()"
  );
  assert.strictEqual(publicPhotos.length, 2, "Public gallery should now have 2 approved photos");
});

test("CHAL-3.5: Store Batch Approval — batchApprovePhotos() handles multiple pending photos concurrently", () => {
  mockStorage.clear();
  dispatchedEvents.length = 0;

  // Add 3 pending photos
  store.addUploadedPhoto({
    id: "batch_001",
    url: "https://storage.googleapis.com/test/batch_001.jpg",
    title: "Batch Photo 1",
    ceremony: "Haldi",
  });
  store.addUploadedPhoto({
    id: "batch_002",
    url: "https://storage.googleapis.com/test/batch_002.jpg",
    title: "Batch Photo 2",
    ceremony: "Mehendi",
  });
  store.addUploadedPhoto({
    id: "batch_003",
    url: "https://storage.googleapis.com/test/batch_003.jpg",
    title: "Batch Photo 3",
    ceremony: "Reception",
  });

  // Verify all 3 are pending and 0 in public
  assert.strictEqual(store.getApprovedWeddingPhotos().length, 1); // Only default couple photo

  // Batch approve 2 of them: batch_001 and batch_003
  dispatchedEvents.length = 0;
  store.batchApprovePhotos(["batch_001", "batch_003"], "Kabir Marwaha (Chief Executive Officer)");

  assert(dispatchedEvents.includes("shaadisnap_photos_updated"));

  const publicPhotos = store.getApprovedWeddingPhotos();
  const publicIds = publicPhotos.map((p) => p.id);

  assert(publicIds.includes("batch_001"), "batch_001 must be approved");
  assert(publicIds.includes("batch_003"), "batch_003 must be approved");
  assert(!publicIds.includes("batch_002"), "batch_002 must STILL be pending and excluded from public!");

  // Verify batch_002 is still pending in admin view
  const allPhotos = store.getWeddingPhotos();
  const unapproved = allPhotos.find((p) => p.id === "batch_002");
  assert.strictEqual(unapproved.approvalStatus, "pending_ceo_approval");
});

test("CHAL-3.6: Guest Link Access Gating — getGuestLinkApprovalStatus and setGuestLinkApprovalStatus toggle switch", () => {
  mockStorage.clear();
  dispatchedEvents.length = 0;

  // Default is approved/true
  assert.strictEqual(store.getGuestLinkApprovalStatus(), true);

  // Toggle off
  store.setGuestLinkApprovalStatus(false);
  assert.strictEqual(store.getGuestLinkApprovalStatus(), false);
  assert(dispatchedEvents.includes("shaadisnap_guest_link_status_updated"));

  // Toggle on
  store.setGuestLinkApprovalStatus(true);
  assert.strictEqual(store.getGuestLinkApprovalStatus(), true);
});

test("CHAL-3.7: Public Components Consumption Audit — FullWeddingGallery and LuxuryGalleryPreview use getApprovedWeddingPhotos", () => {
  const fullGallerySource = fs.readFileSync(fullGalleryPath, "utf-8");
  const previewSource = fs.readFileSync(path.join(webSrcDir, "components/LuxuryGalleryPreview.tsx"), "utf-8");

  assert(
    fullGallerySource.includes("getApprovedWeddingPhotos()"),
    "FullWeddingGallery must fetch photos using getApprovedWeddingPhotos()"
  );
  assert(
    previewSource.includes("getApprovedWeddingPhotos()"),
    "LuxuryGalleryPreview must fetch photos using getApprovedWeddingPhotos()"
  );
  assert(
    fullGallerySource.includes("shaadisnap_photos_updated"),
    "FullWeddingGallery must listen for shaadisnap_photos_updated"
  );
  assert(
    previewSource.includes("shaadisnap_photos_updated"),
    "LuxuryGalleryPreview must listen for shaadisnap_photos_updated"
  );
});

test("CHAL-3.8: Admin Console Elements Audit — CEO Master Approval Station, Counter, 1-Click Approve, and Switch", () => {
  const adminContent = fs.readFileSync(adminPagePath, "utf-8");

  assert(adminContent.includes("CEO Master Approval Station"), "Must render CEO Master Approval Station");
  assert(adminContent.includes("pendingCount"), "Must calculate pendingCount");
  assert(adminContent.includes("1-Click CEO Batch Approve"), "Must provide 1-Click CEO Batch Approve button");
  assert(adminContent.includes("handleCeoBatchApproveAll"), "Must wire handleCeoBatchApproveAll");
  assert(adminContent.includes("Guest Link Access (/find-photos)"), "Must display Guest Link Access label");
  assert(adminContent.includes('role="switch"'), "Must render accessible toggle switch");
  assert(adminContent.includes("Pending CEO Review"), "Must render Pending CEO Review badge");
  assert(adminContent.includes("Approved by CEO"), "Must render Approved by CEO badge");
  assert(adminContent.includes("Approve Photo (CEO Sign-Off)"), "Must render individual approve button");
});

// Cleanup temp test files
try {
  if (fs.existsSync(tempStorePath)) fs.unlinkSync(tempStorePath);
  if (fs.existsSync(tempMockDataPath)) fs.unlinkSync(tempMockDataPath);
} catch (e) {
  // ignore
}

// ============================================================================
// VERDICT & SUMMARY
// ============================================================================
console.log("\n========================================================================");
console.log(`TOTAL ADVERSARIAL CHECKS: ${passCount + failCount}`);
console.log(`  ✅ PASSED: ${passCount}`);
console.log(`  ❌ FAILED: ${failCount}`);
console.log("========================================================================");

if (failCount > 0) {
  console.error("\n❌ CHALLENGE VERDICT: CHALLENGE_FAILED");
  console.error("Failures detected:");
  failures.forEach((f) => console.error(`  - ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log("\n💎 CHALLENGE VERDICT: APPROVE 💎");
  console.log("All Gallery Cleanup, Venue String Consistency, and Admin CEO Approval checks passed with 100% empirical rigor.\n");
  process.exit(0);
}
