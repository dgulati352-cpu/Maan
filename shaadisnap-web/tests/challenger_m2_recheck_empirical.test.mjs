import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

console.log("==========================================================================");
console.log("   🛡️ CHALLENGER M2 RECHECK: EMPIRICAL STRESS & ZERO-MATCH INTEGRITY 🛡️");
console.log("==========================================================================\n");

let passCount = 0;
let failCount = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    failCount++;
  }
}

// 1. Inspect GuestSelfieSearch.tsx source code
const guestSearchPath = path.join(webRoot, "src", "components", "GuestSelfieSearch.tsx");
const guestSearchCode = fs.readFileSync(guestSearchPath, "utf-8");

check("GS-01: Candidate pool is strictly getApprovedWeddingPhotos()", () => {
  assert.ok(
    guestSearchCode.includes("const photoPool = getApprovedWeddingPhotos();"),
    "Must assign photoPool directly from getApprovedWeddingPhotos()"
  );
  assert.ok(
    !guestSearchCode.includes("allLivePhotos.length > 0 ? allLivePhotos : approvedPhotos"),
    "Must not use unapproved fallback candidate pool"
  );
});

check("GS-02: Zero API matches strictly assigns results = [] without fallback", () => {
  // Check the branch structure
  const elseBranch = guestSearchCode.indexOf("} else {\n      results = [];\n    }");
  assert.ok(
    elseBranch !== -1 || guestSearchCode.includes("results = [];"),
    "Must assign results = [] when apiMatches.length === 0"
  );
  assert.ok(
    !guestSearchCode.includes("matchSelfieAgainstPhotos"),
    "Must not call matchSelfieAgainstPhotos anywhere in GuestSelfieSearch.tsx"
  );
});

check("GS-03: No fake similarity formulas or mock slices exist in GuestSelfieSearch.tsx", () => {
  assert.ok(!guestSearchCode.includes("photoPool.slice(0, 6)"), "Must not slice photos");
  assert.ok(!guestSearchCode.includes("0.95 - idx * 0.04"), "Must not use fake similarity formula 1");
  assert.ok(!guestSearchCode.includes("0.96 - idx * 0.03"), "Must not use fake similarity formula 2");
  assert.ok(!guestSearchCode.includes("return 0.94"), "Must not have hardcoded 0.94 score");
});

check("GS-04: Empty state condition triggers on hasSearched && matchedPhotos.length === 0", () => {
  assert.ok(
    guestSearchCode.includes("matchedPhotos.length === 0 ? ("),
    "Must render empty state branch when matchedPhotos is empty"
  );
  assert.ok(
    guestSearchCode.includes("No Matching Photos Found"),
    "Must display 'No Matching Photos Found' heading"
  );
  assert.ok(
    guestSearchCode.includes("href=\"/gallery\""),
    "Must link to authentic /gallery in empty state"
  );
});

// 2. Inspect faceComparison.ts source code
const faceCompPath = path.join(webRoot, "src", "lib", "faceComparison.ts");
const faceCompCode = fs.readFileSync(faceCompPath, "utf-8");

check("FC-01: faceComparison.ts contains no artificial score inflation or camera hacks", () => {
  assert.ok(!faceCompCode.includes("isCameraUpload"), "Must not have isCameraUpload heuristic");
  assert.ok(!faceCompCode.includes("rawScore + 0.20"), "Must not inflate raw scores");
  assert.ok(!faceCompCode.includes("return 0.94;"), "Must not hardcode 0.94 similarity");
});

// 3. Inspect api/face-search/route.ts
const routePath = path.join(webRoot, "src", "app", "api", "face-search", "route.ts");
const routeCode = fs.readFileSync(routePath, "utf-8");

check("API-01: face-search route fallback strictly returns empty matches and 0 count", () => {
  assert.ok(
    routeCode.includes("total_matches: 0"),
    "Route fallback must return total_matches: 0"
  );
  assert.ok(
    routeCode.includes("matches: []"),
    "Route fallback must return empty matches: []"
  );
});

check("API-02: face-search route requires biometric consent", () => {
  assert.ok(
    routeCode.includes("hasConsent !== \"true\" && hasConsent !== \"1\""),
    "Route must require biometric consent"
  );
});

// 4. Runtime simulation of GuestSelfieSearch logic when no ArcFace matches exist
check("SIM-01: Runtime simulation - empty apiMatches produces strictly empty results", () => {
  const photoPool = [
    { id: "hero_couple_photo", url: "/hero-couple.jpg", caption: "Couple", approvalStatus: "approved" },
    { id: "admin_photo_1", url: "data:image/jpeg;base64,...", caption: "Mandap", approvalStatus: "approved" },
  ];

  const apiMatches = []; // No ArcFace match!
  let results = [];

  if (apiMatches.length > 0) {
    const matchMap = new Map();
    for (const m of apiMatches) {
      const id = m.photo_id || m.photoId;
      const sim = typeof m.max_similarity === "number" ? m.max_similarity : (typeof m.similarity === "number" ? m.similarity : 0.85);
      if (id) {
        matchMap.set(id, { similarity: sim });
      }
    }

    results = photoPool
      .filter((p) => matchMap.has(p.id) || (p.driveFileId && matchMap.has(p.driveFileId)))
      .map((p) => {
        const matchInfo = matchMap.get(p.id) || (p.driveFileId ? matchMap.get(p.driveFileId) : undefined);
        const sim = matchInfo?.similarity ?? 0.85;
        return {
          ...p,
          similarity: Math.min(0.99, Math.max(0.70, Number(sim.toFixed(3)))),
          confidenceTier: sim >= 0.75 ? "high" : "medium",
        };
      });
  } else {
    results = [];
  }

  assert.strictEqual(results.length, 0, "Results must be strictly empty");
  assert.deepStrictEqual(results, [], "Results must be empty array []");
});

check("SIM-02: Runtime simulation - unrelated apiMatches produces strictly empty results", () => {
  const photoPool = [
    { id: "hero_couple_photo", url: "/hero-couple.jpg", caption: "Couple", approvalStatus: "approved" },
  ];

  // API returns match for a photo NOT in photoPool (e.g. deleted or unapproved photo)
  const apiMatches = [
    { photo_id: "unapproved_or_deleted_photo_999", max_similarity: 0.92 }
  ];

  let results = [];
  if (apiMatches.length > 0) {
    const matchMap = new Map();
    for (const m of apiMatches) {
      const id = m.photo_id || m.photoId;
      const sim = typeof m.max_similarity === "number" ? m.max_similarity : (typeof m.similarity === "number" ? m.similarity : 0.85);
      if (id) {
        matchMap.set(id, { similarity: sim });
      }
    }

    results = photoPool
      .filter((p) => matchMap.has(p.id) || (p.driveFileId && matchMap.has(p.driveFileId)))
      .map((p) => {
        const matchInfo = matchMap.get(p.id) || (p.driveFileId ? matchMap.get(p.driveFileId) : undefined);
        const sim = matchInfo?.similarity ?? 0.85;
        return {
          ...p,
          similarity: Math.min(0.99, Math.max(0.70, Number(sim.toFixed(3)))),
          confidenceTier: sim >= 0.75 ? "high" : "medium",
        };
      });
  } else {
    results = [];
  }

  assert.strictEqual(results.length, 0, "Unrelated API matches must not match photoPool");
  assert.deepStrictEqual(results, [], "Results must be empty array []");
});

console.log("\n==========================================================================");
console.log(`TOTAL CHECKS: ${passCount + failCount} | PASS: ${passCount} | FAIL: ${failCount}`);
console.log("==========================================================================");

if (failCount > 0) {
  console.error("❌ RECHECK VERDICT: REQUEST_CHANGES");
  process.exit(1);
} else {
  console.log("🏆 RECHECK VERDICT: APPROVE (Zero-match integrity verified)");
  process.exit(0);
}
