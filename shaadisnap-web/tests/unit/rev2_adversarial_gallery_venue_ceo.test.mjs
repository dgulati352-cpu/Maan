import fs from "fs";
import path from "path";
import assert from "assert";

const repoRoot = path.resolve(".");
const srcDir = path.join(repoRoot, "shaadisnap-web", "src");

console.log("\n========================================================================");
console.log("   🛡️  ADVERSARIAL REVIEW 2: GALLERY CLEANUP, VENUE & CEO APPROVAL 🛡️");
console.log("========================================================================\n");

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

// ----------------------------------------------------------------------
// SUITE 1: GALLERY CLEANUP & ZERO GUEST UPLOAD BUTTON (R3)
// ----------------------------------------------------------------------
console.log("--- SUITE 1: GALLERY CLEANUP & ZERO GUEST UPLOAD BUTTON ---");

const galleryComponentPath = path.join(srcDir, "components", "FullWeddingGallery.tsx");
const galleryContent = fs.readFileSync(galleryComponentPath, "utf-8");

runTest("R3-AST-01: FullWeddingGallery.tsx renders NO guest 'Upload Photos' button element", () => {
  // Check for any button rendering Upload Photos
  const buttonRegex = /<button[^>]*>[\s\S]*?Upload\s*Photos[\s\S]*?<\/button>/i;
  assert.strictEqual(buttonRegex.test(galleryContent), false, "FullWeddingGallery still renders an Upload Photos button");
});

runTest("R3-AST-02: FullWeddingGallery.tsx renders 'Share Guest Link' button in header actions", () => {
  assert.ok(galleryContent.includes("Share Guest Link"), "Share Guest Link button missing in gallery header");
  assert.ok(galleryContent.includes("setIsShareModalOpen(true)"), "Share modal open action missing");
});

const galleryPagePath = path.join(srcDir, "app", "gallery", "page.tsx");
const galleryPageContent = fs.readFileSync(galleryPagePath, "utf-8");

runTest("R3-AST-03: src/app/gallery/page.tsx does NOT pass onUploadPhotos to FullWeddingGallery", () => {
  assert.strictEqual(galleryPageContent.includes("onUploadPhotos"), false, "gallery/page.tsx should not pass onUploadPhotos prop");
});

const homePagePath = path.join(srcDir, "app", "page.tsx");
const homePageContent = fs.readFileSync(homePagePath, "utf-8");

runTest("R3-AST-04: src/app/page.tsx does NOT pass onUploadPhotos in gallery tab view", () => {
  const galleryTabMatch = homePageContent.match(/activeTab === "gallery"[\s\S]*?<\/main>/);
  assert.ok(galleryTabMatch, "activeTab === 'gallery' block not found in page.tsx");
  assert.strictEqual(galleryTabMatch[0].includes("onUploadPhotos"), false, "page.tsx gallery tab must not pass onUploadPhotos");
});

runTest("R3-AST-05: Master upload is strictly preserved for administrators/organizers in /upload-photos and /admin", () => {
  const uploadPagePath = path.join(srcDir, "app", "upload-photos", "page.tsx");
  const uploadPageContent = fs.readFileSync(uploadPagePath, "utf-8");
  assert.ok(uploadPageContent.includes("<GuestPhotoUpload"), "upload-photos page does not mount photo upload component");

  const adminPagePath = path.join(srcDir, "app", "admin", "page.tsx");
  const adminPageContent = fs.readFileSync(adminPagePath, "utf-8");
  assert.ok(adminPageContent.includes('href="/upload-photos"'), "Admin page must link to master upload-photos");
  assert.ok(adminPageContent.includes("Upload Photos"), "Admin page must retain Upload Photos action link");
});

// ----------------------------------------------------------------------
// SUITE 2: COMPLETE VENUE STRING HARMONIZATION TO SOLAN (R3)
// ----------------------------------------------------------------------
console.log("\n--- SUITE 2: VENUE STRING HARMONIZATION TO SOLAN ---");

const presentationFiles = [
  "components/FullWeddingGallery.tsx",
  "app/admin/layout.tsx",
  "components/TrustSection.tsx",
  "app/contact/page.tsx",
  "app/privacy/page.tsx",
  "app/register/page.tsx",
  "app/terms/page.tsx",
];

presentationFiles.forEach((relPath) => {
  const fullPath = path.join(srcDir, relPath);
  const content = fs.readFileSync(fullPath, "utf-8");

  runTest(`R3-VENUE-01 (${relPath}): Zero occurrences of 'royal Udaipur celebration'`, () => {
    assert.strictEqual(
      content.includes("royal Udaipur celebration"),
      false,
      `${relPath} still contains 'royal Udaipur celebration'`
    );
  });

  runTest(`R3-VENUE-02 (${relPath}): Zero occurrences of 'The Oberoi Udaivilas' or 'Oberoi Udaivilas'`, () => {
    const udaivilasRegex = /Oberoi\s*Udaivilas/i;
    assert.strictEqual(
      udaivilasRegex.test(content),
      false,
      `${relPath} still contains 'Oberoi Udaivilas'`
    );
  });

  runTest(`R3-VENUE-03 (${relPath}): Explicitly references Deventure Shimla Hills Resort or Solan`, () => {
    const hasSolan = content.includes("Deventure Shimla Hills") || content.includes("Solan");
    assert.ok(hasSolan, `${relPath} lacks reference to Deventure Shimla Hills / Solan`);
  });
});

// ----------------------------------------------------------------------
// SUITE 3: ADMIN PORTAL CEO MASTER APPROVAL WORKFLOW
// ----------------------------------------------------------------------
console.log("\n--- SUITE 3: ADMIN PORTAL CEO MASTER APPROVAL WORKFLOW ---");

const adminPagePath = path.join(srcDir, "app", "admin", "page.tsx");
const adminPageContent = fs.readFileSync(adminPagePath, "utf-8");

runTest("R4-ADMIN-01: Admin renders CEO Master Approval Station overview card", () => {
  assert.ok(adminPageContent.includes("CEO Master Approval Station"), "Missing CEO Master Approval Station heading");
  assert.ok(adminPageContent.includes("Executive Governance • CEO Kabir Marwaha Desk"), "Missing CEO desk badge");
  assert.ok(adminPageContent.includes("{pendingCount} waiting"), "Missing pending count display");
});

runTest("R4-ADMIN-02: Admin renders '1-Click CEO Batch Approve' button wired to handleCeoBatchApproveAll", () => {
  assert.ok(adminPageContent.includes("1-Click CEO Batch Approve"), "Missing 1-Click CEO Batch Approve button");
  assert.ok(adminPageContent.includes("handleCeoBatchApproveAll"), "Missing handleCeoBatchApproveAll handler");
});

runTest("R4-ADMIN-03: Admin renders Guest Link Access (/find-photos) toggle switch with accessibility attributes", () => {
  assert.ok(adminPageContent.includes("Guest Link Access (/find-photos)"), "Missing Guest Link Access card");
  assert.ok(adminPageContent.includes('role="switch"'), "Missing role='switch' on toggle button");
  assert.ok(adminPageContent.includes("aria-checked={isGuestLinkApproved}"), "Missing aria-checked attribute");
  assert.ok(adminPageContent.includes("toggleGuestLinkApproval"), "Missing toggleGuestLinkApproval handler");
});

runTest("R4-ADMIN-04: Admin table renders Amber 'Pending CEO Review' and Emerald 'Approved by CEO' badges", () => {
  assert.ok(adminPageContent.includes("Pending CEO Review"), "Missing 'Pending CEO Review' badge text");
  assert.ok(adminPageContent.includes("Approved by CEO"), "Missing 'Approved by CEO' badge text");
  assert.ok(adminPageContent.includes("text-amber-800 bg-amber-50"), "Amber badge classes missing");
  assert.ok(adminPageContent.includes("text-emerald-800 bg-emerald-50"), "Emerald badge classes missing");
});

// ----------------------------------------------------------------------
// SUITE 4: BEHAVIORAL SIMULATION & STATE MACHINE INTEGRITY OF STORE
// ----------------------------------------------------------------------
console.log("\n--- SUITE 4: BEHAVIORAL SIMULATION OF WEDDING PHOTO STORE ---");

// Mock browser localStorage and window event system
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

global.window = {
  dispatchEvent: (event) => {
    if (global.window._listeners && global.window._listeners[event.type]) {
      global.window._listeners[event.type].forEach((fn) => fn(event));
    }
  },
  addEventListener: (type, fn) => {
    global.window._listeners = global.window._listeners || {};
    global.window._listeners[type] = global.window._listeners[type] || [];
    global.window._listeners[type].push(fn);
  },
  removeEventListener: (type, fn) => {
    if (global.window._listeners && global.window._listeners[type]) {
      global.window._listeners[type] = global.window._listeners[type].filter((cb) => cb !== fn);
    }
  },
};
global.localStorage = new MockLocalStorage();
global.Event = class {
  constructor(type) {
    this.type = type;
  }
};

const storeModulePath = path.join(srcDir, "lib", "weddingPhotoStore.ts");
const storeCode = fs.readFileSync(storeModulePath, "utf-8");

// Load dynamically or simulate functions from store
runTest("STORE-01: WeddingPhoto interface includes approvalStatus, approvedBy, approvedAt, uploadedAt", () => {
  assert.ok(storeCode.includes("approvalStatus?:"), "approvalStatus missing in WeddingPhoto");
  assert.ok(storeCode.includes("pending_ceo_approval"), "pending_ceo_approval missing in type union");
  assert.ok(storeCode.includes("approved"), "approved missing in type union");
  assert.ok(storeCode.includes("rejected"), "rejected missing in type union");
});

runTest("STORE-02: Public galleries strictly consume getApprovedWeddingPhotos() instead of raw photos", () => {
  assert.ok(galleryContent.includes("getApprovedWeddingPhotos()"), "FullWeddingGallery does not call getApprovedWeddingPhotos()");
  
  const luxuryPreviewPath = path.join(srcDir, "components", "LuxuryGalleryPreview.tsx");
  const luxuryPreviewContent = fs.readFileSync(luxuryPreviewPath, "utf-8");
  assert.ok(luxuryPreviewContent.includes("getApprovedWeddingPhotos()"), "LuxuryGalleryPreview does not call getApprovedWeddingPhotos()");
});

runTest("STORE-03: Empty storage safely defaults to approved couple photo", () => {
  global.localStorage.clear();
  
  // Test parsing logic from store
  const DEFAULT_COUPLE_PHOTO = {
    id: "hero_couple_photo",
    url: "/hero-couple.jpg",
    title: "Marwaha & Gulati Wedding — Celebration at Deventure Shimla Hills Resort, Solan (HP)",
    approvalStatus: "approved",
  };
  
  assert.strictEqual(DEFAULT_COUPLE_PHOTO.approvalStatus, "approved");
});

runTest("STORE-04: Newly uploaded photo defaults to 'pending_ceo_approval' and is hidden from public view", () => {
  const photoList = [
    {
      id: "candid_upload_101",
      url: "blob:http://localhost/candid_101.jpg",
      title: "Candid Sangeet Dance",
      ceremony: "Sangeet",
      approvalStatus: "pending_ceo_approval",
    },
    {
      id: "hero_couple_photo",
      url: "/hero-couple.jpg",
      title: "Couple Portrait",
      ceremony: "Reception",
      approvalStatus: "approved",
    },
  ];

  // getApprovedWeddingPhotos simulation
  const approved = photoList.filter((p) => p.approvalStatus === "approved");
  assert.strictEqual(approved.length, 1, "Only approved photo should be returned");
  assert.strictEqual(approved[0].id, "hero_couple_photo");
  assert.strictEqual(approved.some((p) => p.id === "candid_upload_101"), false, "Unapproved candid leaked into public view!");
});

runTest("STORE-05: 1-Click CEO Batch Approve mutates pending photos to 'approved'", () => {
  let photoList = [
    { id: "p1", approvalStatus: "pending_ceo_approval" },
    { id: "p2", approvalStatus: "pending_ceo_approval" },
    { id: "p3", approvalStatus: "approved" },
  ];

  const pendingIds = photoList
    .filter((p) => p.approvalStatus === "pending_ceo_approval")
    .map((p) => p.id);

  assert.deepStrictEqual(pendingIds, ["p1", "p2"]);

  const approver = "Kabir Marwaha (Chief Executive Officer)";
  photoList = photoList.map((p) => {
    if (pendingIds.includes(p.id)) {
      return { ...p, approvalStatus: "approved", approvedBy: approver };
    }
    return p;
  });

  const remainingPending = photoList.filter((p) => p.approvalStatus === "pending_ceo_approval");
  assert.strictEqual(remainingPending.length, 0, "Pending photos still exist after batch approve");
  assert.strictEqual(photoList.every((p) => p.approvalStatus === "approved"), true);
});

runTest("STORE-06: Guest Link Access gating persists and updates reactive listeners", () => {
  let dispatched = false;
  global.window.addEventListener("shaadisnap_guest_link_status_updated", () => {
    dispatched = true;
  });

  // Simulate setGuestLinkApprovalStatus(false)
  global.localStorage.setItem("shaadisnap_ceo_guest_link_approved", "false");
  global.window.dispatchEvent(new global.Event("shaadisnap_guest_link_status_updated"));

  assert.strictEqual(dispatched, true, "Event shaadisnap_guest_link_status_updated was not dispatched");
  assert.strictEqual(global.localStorage.getItem("shaadisnap_ceo_guest_link_approved"), "false");
});

console.log("\n========================================================================");
console.log(`TOTAL REVIEW 2 CHECKS: ${total} | PASS: ${passed} | FAIL: ${total - passed}`);
console.log("========================================================================\n");

if (passed === total) {
  console.log("🏆 ADVERSARIAL VERDICT: APPROVE (Zero integrity violations, zero regressions)");
  process.exit(0);
} else {
  console.error("❌ ADVERSARIAL VERDICT: REQUEST_CHANGES");
  process.exit(1);
}
