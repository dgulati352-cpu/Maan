import fs from "fs";
import path from "path";
import assert from "assert";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("\n==========================================================================");
console.log("   🛡️ CHALLENGER M2: EMPIRICAL INTEGRITY & ADVERSARIAL VERIFICATION 🛡️");
console.log("==========================================================================\n");

let passed = 0;
let total = 0;
const findings = [];

function check(desc, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}`);
    console.error(`     Reason: ${err.message}`);
    findings.push({ check: desc, error: err.message });
  }
}

const componentPath = path.resolve(__dirname, "..", "src", "components", "GuestSelfieSearch.tsx");
const faceComparisonPath = path.resolve(__dirname, "..", "src", "lib", "faceComparison.ts");

assert.ok(fs.existsSync(componentPath), `GuestSelfieSearch.tsx not found at ${componentPath}`);
const componentCode = fs.readFileSync(componentPath, "utf-8");

// =========================================================================
// SECTION 1: MANDATORY MOCK & SIMULATION PURGE INVARIANTS
// =========================================================================
console.log("--- SECTION 1: Mock & Arbitrary Slicing Purge ---");

check("PURGE-01: photoPool.slice(0, 6) does NOT exist anywhere in GuestSelfieSearch.tsx", () => {
  assert.ok(
    !componentCode.includes("photoPool.slice(0, 6)"),
    "Found forbidden arbitrary photo slicing 'photoPool.slice(0, 6)' in component!"
  );
  assert.ok(
    !/photoPool\s*\.\s*slice\s*\(\s*0\s*,\s*6\s*\)/.test(componentCode),
    "Regex match found for photoPool.slice(0, 6)!"
  );
});

check("PURGE-02: Simulated similarity formula (0.95 - idx * 0.04) does NOT exist anywhere", () => {
  assert.ok(
    !componentCode.includes("0.95 - idx * 0.04"),
    "Found forbidden simulated score formula '0.95 - idx * 0.04'!"
  );
  assert.ok(
    !/0\.95\s*-\s*idx\s*\*\s*0\.04/.test(componentCode),
    "Regex match found for 0.95 - idx * 0.04!"
  );
});

check("PURGE-03: Simulated similarity formula (0.96 - idx * 0.03) does NOT exist anywhere", () => {
  assert.ok(
    !componentCode.includes("0.96 - idx * 0.03"),
    "Found forbidden simulated score formula '0.96 - idx * 0.03'!"
  );
  assert.ok(
    !/0\.96\s*-\s*idx\s*\*\s*0\.03/.test(componentCode),
    "Regex match found for 0.96 - idx * 0.03!"
  );
});

check("PURGE-04: DEMO_SELFIES does NOT exist in GuestSelfieSearch.tsx", () => {
  assert.ok(
    !componentCode.includes("DEMO_SELFIES"),
    "DEMO_SELFIES constant or import still present in GuestSelfieSearch.tsx!"
  );
});

check("PURGE-05: Demo profiles (Ananya, Rohit, Priya) purged from GuestSelfieSearch.tsx", () => {
  const forbiddenNames = ["Ananya", "Rohit", "Priya"];
  for (const name of forbiddenNames) {
    assert.ok(
      !componentCode.includes(name),
      `Found demo persona name '${name}' still present in GuestSelfieSearch.tsx!`
    );
  }
});

check("PURGE-06: MOCK_WEDDING_PHOTOS import completely removed", () => {
  assert.ok(
    !componentCode.includes("MOCK_WEDDING_PHOTOS"),
    "MOCK_WEDDING_PHOTOS is still imported or referenced in GuestSelfieSearch.tsx!"
  );
});

// =========================================================================
// SECTION 2: HONEST EMPTY STATE UI SPECIFICATION
// =========================================================================
console.log("\n--- SECTION 2: Honest Empty State Presentation ---");

check("EMPTY-01: Empty state renders Primary CTA Link to /gallery", () => {
  assert.ok(
    componentCode.includes('href="/gallery"'),
    "Empty state is missing <Link href=\"/gallery\">!"
  );
  assert.ok(
    componentCode.includes("Browse Full Wedding Album"),
    "Empty state is missing 'Browse Full Wedding Album' CTA copy!"
  );
});

check("EMPTY-02: Structured capture tips exist for Lighting", () => {
  assert.ok(
    componentCode.includes("Lighting") &&
    (componentCode.includes("Well-lit") || componentCode.includes("lighting") || componentCode.includes("light")),
    "Structured lighting tip missing from empty state!"
  );
});

check("EMPTY-03: Structured capture tips exist for Angle", () => {
  assert.ok(
    componentCode.includes("Angle") &&
    (componentCode.includes("eye level") || componentCode.includes("directly toward the camera") || componentCode.includes("angle")),
    "Structured angle tip missing from empty state!"
  );
});

check("EMPTY-04: Structured capture tips exist for Obstructions", () => {
  assert.ok(
    componentCode.includes("Obstructions") &&
    (componentCode.includes("sunglasses") || componentCode.includes("masks") || componentCode.includes("obstructions")),
    "Structured obstructions tip missing from empty state!"
  );
});

check("EMPTY-05: Structured capture tips exist for Sharpness", () => {
  assert.ok(
    componentCode.includes("Sharpness") &&
    (componentCode.includes("motion blur") || componentCode.includes("focused") || componentCode.includes("clear")),
    "Structured sharpness tip missing from empty state!"
  );
});

check("EMPTY-06: Heading 'No Matching Photos Found' with τ = 0.70 threshold explanation", () => {
  assert.ok(
    componentCode.includes("No Matching Photos Found"),
    "Missing 'No Matching Photos Found' heading!"
  );
  assert.ok(
    componentCode.includes("τ = 0.70"),
    "Missing calibrated threshold τ = 0.70 indicator in empty state!"
  );
});

check("EMPTY-07: Interactive Secondary CTAs for Retake Selfie and Upload Another Photo", () => {
  assert.ok(
    componentCode.includes("Retake Selfie"),
    "Missing 'Retake Selfie' action button in empty state!"
  );
  assert.ok(
    componentCode.includes("Upload Another Photo"),
    "Missing 'Upload Another Photo' action button in empty state!"
  );
});

check("EMPTY-08: Results Header and Download All are concealed when matchedPhotos.length === 0", () => {
  assert.ok(
    componentCode.includes("matchedPhotos.length === 0 ? (") ||
    componentCode.includes("matchedPhotos.length > 0 ? (") ||
    componentCode.includes("matchedPhotos.length === 0 ?"),
    "Results conditional render branch missing!"
  );
  // Ensure Download All is within the matchedPhotos.length > 0 branch
  const matchBranch = componentCode.split("matchedPhotos.length === 0 ?")[1];
  assert.ok(matchBranch, "Could not isolate matchedPhotos.length === 0 branch");
  const [emptyView, resultsView] = matchBranch.split(": (");
  assert.ok(
    !emptyView.includes("Download All ("),
    "'Download All' button is erroneously present in the empty state view!"
  );
  assert.ok(
    !emptyView.includes("Found ") || !emptyView.includes("Photographs Featuring You"),
    "'Found X Photographs Featuring You' header is erroneously present in the empty state view!"
  );
});

check("EMPTY-09: Ceremony Filter Tabs are concealed when matchedPhotos.length === 0", () => {
  const matchBranch = componentCode.split("matchedPhotos.length === 0 ?")[1];
  const [emptyView, resultsView] = matchBranch.split(": (");
  assert.ok(
    !emptyView.includes('["All", "Phere", "Sangeet", "Mehendi", "Haldi", "Reception"]'),
    "Ceremony filter tabs are erroneously present in the empty state view!"
  );
});

// =========================================================================
// SECTION 3: ADVERSARIAL LOGIC & WORKER CLAIM VERIFICATION
// =========================================================================
console.log("\n--- SECTION 3: Adversarial Logic & Worker Claim Audit ---");

check("CLAIM-01: Audit worker claim '$content.Contains(\"const photoPool = getApprovedWeddingPhotos();\")'", () => {
  const exactClaim = "const photoPool = getApprovedWeddingPhotos();";
  const hasExact = componentCode.includes(exactClaim);
  if (!hasExact) {
    // Check what is actually there:
    const match = componentCode.match(/const\s+photoPool\s*=\s*([^;]+);/);
    throw new Error(
      `Worker claimed '${exactClaim}' in handoff check #3, but actual code is: 'const photoPool = ${match ? match[1].trim() : "UNKNOWN"};'`
    );
  }
});

check("CLAIM-02: Audit behavior when apiMatches.length === 0", () => {
  // Check if code has unconditional empty assignment when apiMatches is empty,
  // or if it falls back to in-browser matchSelfieAgainstPhotos
  const hasDirectEmptyBranch = /if\s*\(\s*apiMatches\.length\s*>\s*0\s*\)\s*\{[\s\S]*?\}\s*else\s*\{\s*results\s*=\s*\[\s*\]\s*;\s*\}/.test(componentCode);
  const hasFallbackElseIf = componentCode.includes("matchSelfieAgainstPhotos(selfieImage, photoPool, 0.70)");
  
  if (hasFallbackElseIf) {
    throw new Error(
      "When apiMatches.length === 0, code does NOT unconditionally set results = []. " +
      "It branches into 'else if (selfieImage)' and calls matchSelfieAgainstPhotos, violating 'when apiMatches.length === 0, results is []'."
    );
  }
  
  assert.ok(hasDirectEmptyBranch, "Missing clean 'else { results = []; }' branch when apiMatches.length === 0!");
});

check("ADVERSARIAL-01: Biometric heuristic does not fabricate 0.94 score for arbitrary camera uploads", () => {
  if (fs.existsSync(faceComparisonPath)) {
    const faceCompCode = fs.readFileSync(faceComparisonPath, "utf-8");
    const hasFabricatedCameraScore = faceCompCode.includes("if (isCameraUpload)") && faceCompCode.includes("return 0.94");
    if (hasFabricatedCameraScore) {
      throw new Error(
        "src/lib/faceComparison.ts contains hardcoded heuristic: 'if (isCameraUpload) { return 0.94; }'. " +
        "This returns 94% similarity for any photo tagged as a camera upload, even when apiMatches is empty!"
      );
    }
  }
});

console.log("\n==========================================================================");
console.log(`TOTAL ADVERSARIAL CHECKS: ${total} | PASS: ${passed} | FAIL: ${findings.length}`);
console.log("==========================================================================");

if (findings.length > 0) {
  console.log("\n❌ VULNERABILITIES & REGRESSIONS DETECTED:");
  for (const f of findings) {
    console.log(`  - [${f.check}]: ${f.error}`);
  }
  console.log("\n🛡️ ADVERSARIAL VERDICT: REQUEST_CHANGES");
  process.exit(1);
} else {
  console.log("\n🏆 ADVERSARIAL VERDICT: APPROVE (All empirical invariants verified)");
  process.exit(0);
}
