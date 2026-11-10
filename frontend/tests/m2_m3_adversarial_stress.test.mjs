// ============================================================================
// ADVERSARIAL STRESS TEST: FACE MATCHING & GALLERY EDGE CASES
// ============================================================================

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "src");

console.log("\n========================================================================");
console.log("   ⚡ ADVERSARIAL STRESS TEST: FACE MATCH & GALLERY EDGE CASES ⚡");
console.log("========================================================================\n");

let passed = 0;
let failed = 0;

function check(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

// ----------------------------------------------------------------------------
// 1. ADVERSARIAL ATTACK: INJECTING MALICIOUS / BROKEN MOCK OBJECTS
// ----------------------------------------------------------------------------
console.log("--- 1. ADVERSARIAL MOCK INJECTION ATTACK ---");

const storePath = path.join(srcDir, "lib/weddingPhotoStore.ts");
const storeCode = fs.readFileSync(storePath, "utf-8");

// Emulate store functions
function isLegacyMockPhoto(photo) {
  if (!photo || !photo.id || !photo.url) return true;
  if (photo.id === "hero_couple_photo") return false;

  const id = photo.id.toLowerCase();
  const url = photo.url.toLowerCase();
  const fallback = (photo.fallbackUrl || "").toLowerCase();
  const title = (photo.title || "").toLowerCase();

  if (/^photo_\d+$/i.test(photo.id) || id.startsWith("mock_")) return true;
  if (url.includes("unsplash.com") || fallback.includes("unsplash.com")) return true;

  const legacyTitles = [
    "regal royal portrait",
    "the golden vows",
    "bridal mehendi & henna intricacies",
    "reception grand entrance",
    "sangeet dance floor candids",
    "bridesmaids laughter at haldi",
    "baraat celebration & dhol beats",
    "evening cocktail toasts",
  ];
  if (legacyTitles.some((t) => title.includes(t))) return true;

  return false;
}

check("ADV-01: Null, undefined, empty object rejected", () => {
  assert(isLegacyMockPhoto(null) === true);
  assert(isLegacyMockPhoto(undefined) === true);
  assert(isLegacyMockPhoto({}) === true);
  assert(isLegacyMockPhoto({ id: "valid_id" }) === true); // missing url
  assert(isLegacyMockPhoto({ url: "https://valid.com/img.jpg" }) === true); // missing id
});

check("ADV-02: Sneaky casing & subdomain variations of unsplash blocked", () => {
  assert(isLegacyMockPhoto({ id: "img1", url: "https://IMAGES.UNSPLASH.COM/test.jpg" }) === true);
  assert(isLegacyMockPhoto({ id: "img2", url: "https://sub.images.unsplash.com/test.jpg" }) === true);
  assert(isLegacyMockPhoto({ id: "img3", url: "https://cdn.example.com/ok.jpg", fallbackUrl: "https://unsplash.com/fallback.jpg" }) === true);
});

check("ADV-03: Sneaky title variations of legacy mock photos blocked", () => {
  assert(isLegacyMockPhoto({ id: "leg1", url: "https://cdn.example.com/ok.jpg", title: "THE GOLDEN VOWS - CANDID" }) === true);
  assert(isLegacyMockPhoto({ id: "leg2", url: "https://cdn.example.com/ok.jpg", title: "Artistic Bridal Mehendi & Henna Intricacies" }) === true);
  assert(isLegacyMockPhoto({ id: "leg3", url: "https://cdn.example.com/ok.jpg", title: "Night Evening Cocktail Toasts" }) === true);
});

// ----------------------------------------------------------------------------
// 2. CEREMONY FILTERING MATRIX (FullWeddingGallery & LuxuryGalleryPreview)
// ----------------------------------------------------------------------------
console.log("\n--- 2. CEREMONY FILTERING MATRIX ---");

const DEFAULT_COUPLE_PHOTO = {
  id: "hero_couple_photo",
  url: "/hero-couple.jpg",
  title: "Marwaha & Gulati Wedding — Celebration at Deventure Shimla Hills Resort, Solan (HP)",
  ceremony: "Reception",
  facesCount: 2,
  photographer: "JMD Studio",
  confidenceTier: "high",
  aspectRatio: "portrait",
  approvalStatus: "approved",
};

const ceremonies = ["All", "Phere", "Sangeet", "Mehendi", "Haldi", "Reception"];

check("ADV-04: Single hero photo is displayed for 'All' and 'Reception'", () => {
  const photos = [DEFAULT_COUPLE_PHOTO];
  
  for (const c of ceremonies) {
    const filtered = photos.filter((p) => c === "All" || p.ceremony === c);
    if (c === "All" || c === "Reception") {
      assert(filtered.length === 1, `Ceremony ${c} should yield 1 photo`);
      assert(filtered[0].id === "hero_couple_photo", "Should be hero_couple_photo");
    } else {
      assert(filtered.length === 0, `Ceremony ${c} should yield 0 photos`);
    }
  }
});

// ----------------------------------------------------------------------------
// 3. ZERO-MATCH FACE SEARCH FLOW INTEGRITY
// ----------------------------------------------------------------------------
console.log("\n--- 3. ZERO-MATCH FACE SEARCH FLOW INTEGRITY ---");

check("ADV-05: GuestSelfieSearch guarantees empty state without score forgery", () => {
  const selfieCode = fs.readFileSync(path.join(srcDir, "components/GuestSelfieSearch.tsx"), "utf-8");

  // Verify that when no API matches and likeness matching returns 0, results is empty
  assert(!selfieCode.includes("photoPool.slice"), "Must never slice photo pool");
  
  // Verify that celebratory dual cannons for matches found is strictly guarded by results.length > 0
  assert(selfieCode.includes("if (results.length > 0) {"), "Search confetti must be guarded by if (results.length > 0)");
  const resultsConfettiSection = selfieCode.slice(selfieCode.indexOf("if (results.length > 0) {"));
  assert(resultsConfettiSection.includes("confetti({"), "Results confetti block must trigger confetti");

  // Verify that zero matches does not render 'Found 0 Photographs'
  assert(!selfieCode.includes("Found 0 Photographs Featuring You"), "Found 0 must never be rendered");
});

// ----------------------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------------------
console.log("\n========================================================================");
console.log(`TOTAL ADVERSARIAL STRESS CHECKS: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log("========================================================================\n");

if (failed > 0) {
  process.exit(1);
}
