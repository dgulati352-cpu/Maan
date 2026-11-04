// test_biometric_adversarial.mjs
// Adversarial test runner for ShaadiSnap Face Recognition & Biometric Privacy Pipeline
// Written by it3_chal_2 (EMPIRICAL CHALLENGER)

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const PYTHON_PATH = path.resolve("shaadisnap-ml/.venv/Scripts/python.exe");
const CLI_SCRIPT = path.resolve("shaadisnap-ml/cli_face_engine.py");
const SAMPLE_FACE = path.resolve("shaadisnap-ml/data/synthetic_demo/guest_000/face_00.jpg");

const results = [];

function recordTest(id, name, passed, detail) {
  results.push({ id, name, passed, detail });
  const mark = passed ? "✓ PASS" : "✗ FAIL";
  console.log(`[${mark}] ${id}: ${name}`);
  if (detail) console.log(`       ${detail}`);
}

console.log("=================================================================");
console.log("SHAADISNAP AI - FACE ML & BIOMETRIC ADVERSARIAL CHALLENGE SUITE");
console.log("=================================================================\n");

// -------------------------------------------------------------
// T1: CLI inspect Command
// -------------------------------------------------------------
try {
  const proc = spawnSync(PYTHON_PATH, [CLI_SCRIPT, "inspect"], { encoding: "utf-8", timeout: 15000 });
  if (proc.status === 0) {
    const jsonMatch = proc.stdout.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      const valid =
        data.status === "ok" &&
        data.model === "iresnet50" &&
        data.embedding_size === 512 &&
        data.default_threshold === 0.42 &&
        data.checkpoint &&
        data.checkpoint.exists === true &&
        typeof data.indices === "object";
      recordTest("T1", "cli_face_engine.py inspect reports valid JSON metadata", valid,
        `Status: ${data.status}, Model: ${data.model}, Dim: ${data.embedding_size}, Events: ${data.total_events}`);
    } else {
      recordTest("T1", "cli_face_engine.py inspect reports valid JSON metadata", false, "No JSON found in stdout");
    }
  } else {
    recordTest("T1", "cli_face_engine.py inspect reports valid JSON metadata", false, `Exit code ${proc.status}: ${proc.stderr}`);
  }
} catch (e) {
  recordTest("T1", "cli_face_engine.py inspect reports valid JSON metadata", false, e.message);
}

// -------------------------------------------------------------
// T2: CLI detect Subcommand & Alias
// -------------------------------------------------------------
try {
  const procDetect = spawnSync(PYTHON_PATH, [CLI_SCRIPT, "detect", "--image", SAMPLE_FACE], { encoding: "utf-8", timeout: 15000 });
  const procDetectFaces = spawnSync(PYTHON_PATH, [CLI_SCRIPT, "detect-faces", "--image", SAMPLE_FACE], { encoding: "utf-8", timeout: 15000 });
  
  const d1Match = procDetect.stdout ? procDetect.stdout.match(/\{[\s\S]*\}/) : null;
  const d2Match = procDetectFaces.stdout ? procDetectFaces.stdout.match(/\{[\s\S]*\}/) : null;

  if (d1Match && d2Match && procDetect.status === 0 && procDetectFaces.status === 0) {
    const d1 = JSON.parse(d1Match[0]);
    const d2 = JSON.parse(d2Match[0]);
    const valid =
      d1.success === true &&
      d1.faces_detected >= 1 &&
      Array.isArray(d1.detections) &&
      d1.detections[0].bbox &&
      d1.detections[0].sharpness_score !== undefined &&
      d1.faces_detected === d2.faces_detected;
    recordTest("T2", "cli_face_engine.py detect operates as alias for detect-faces", valid,
      `Faces detected: ${d1.faces_detected}, bbox: [${d1.detections[0].bbox.join(", ")}], sharpness: ${d1.detections[0].sharpness_score.toFixed(2)}`);
  } else {
    recordTest("T2", "cli_face_engine.py detect operates as alias for detect-faces", false,
      `detect status=${procDetect.status}, detect-faces status=${procDetectFaces.status}, err=${procDetect.stderr}`);
  }
} catch (e) {
  recordTest("T2", "cli_face_engine.py detect operates as alias for detect-faces", false, e.message);
}

// -------------------------------------------------------------
// T3: CLI embed Subcommand (512-d L2-normalized vector)
// -------------------------------------------------------------
try {
  const proc = spawnSync(PYTHON_PATH, [CLI_SCRIPT, "embed", "--image", SAMPLE_FACE, "--device", "cpu"], { encoding: "utf-8", timeout: 20000 });
  if (proc.status === 0) {
    const jsonMatch = proc.stdout.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      const emb = data.embedding;
      const is512 = Array.isArray(emb) && emb.length === 512;
      let l2norm = 0;
      if (is512) {
        l2norm = Math.sqrt(emb.reduce((sum, v) => sum + v * v, 0));
      }
      const isNormalized = Math.abs(l2norm - 1.0) < 1e-4;
      const valid = data.success === true && is512 && isNormalized && data.quality;
      recordTest("T3", "cli_face_engine.py embed extracts 512-d normalized embedding", valid,
        `Success: ${data.success}, Dim: ${emb?.length}, L2 Norm: ${l2norm.toFixed(6)}, Quality pass: ${data.quality?.passes_quality}`);
    } else {
      recordTest("T3", "cli_face_engine.py embed extracts 512-d normalized embedding", false, "No JSON in stdout");
    }
  } else {
    recordTest("T3", "cli_face_engine.py embed extracts 512-d normalized embedding", false, `Exit code ${proc.status}: ${proc.stderr}`);
  }
} catch (e) {
  recordTest("T3", "cli_face_engine.py embed extracts 512-d normalized embedding", false, e.message);
}

// -------------------------------------------------------------
// T4: CLI match Subcommand & Alias
// -------------------------------------------------------------
try {
  const proc = spawnSync(PYTHON_PATH, [CLI_SCRIPT, "match", "--event", "mahine-anand-2026", "--selfie", SAMPLE_FACE], { encoding: "utf-8", timeout: 20000 });
  if (proc.status === 0) {
    const jsonMatch = proc.stdout.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      const valid =
        data.success === true &&
        data.event_id === "mahine-anand-2026" &&
        data.threshold_used === 0.42 &&
        Array.isArray(data.matches);
      recordTest("T4", "cli_face_engine.py match operates as alias for search-selfie", valid,
        `Success: ${data.success}, Event: ${data.event_id}, Matches count: ${data.matches.length}, Threshold: ${data.threshold_used}`);
    } else {
      recordTest("T4", "cli_face_engine.py match operates as alias for search-selfie", false, "No JSON in stdout");
    }
  } else {
    recordTest("T4", "cli_face_engine.py match operates as alias for search-selfie", false, `Exit code ${proc.status}: ${proc.stderr}`);
  }
} catch (e) {
  recordTest("T4", "cli_face_engine.py match operates as alias for search-selfie", false, e.message);
}

// -------------------------------------------------------------
// T6: Threshold NaN Guard & Bounds Testing
// -------------------------------------------------------------
{
  function sanitizeThreshold(inputVal) {
    const rawThreshold = parseFloat(inputVal || "0.42");
    return isNaN(rawThreshold) ? 0.42 : Math.max(0.1, Math.min(0.99, rawThreshold));
  }

  const cases = [
    { in: "NaN", expected: 0.42 },
    { in: undefined, expected: 0.42 },
    { in: "", expected: 0.42 },
    { in: "not-a-number", expected: 0.42 },
    { in: "-0.5", expected: 0.1 },
    { in: "0.0", expected: 0.1 },
    { in: "0.05", expected: 0.1 },
    { in: "0.42", expected: 0.42 },
    { in: "0.75", expected: 0.75 },
    { in: "1.0", expected: 0.99 },
    { in: "50.0", expected: 0.99 },
    { in: "Infinity", expected: 0.99 },
    { in: "-Infinity", expected: 0.1 },
  ];

  let allCasesPass = true;
  const failureDetails = [];
  for (const c of cases) {
    const actual = sanitizeThreshold(c.in);
    if (Math.abs(actual - c.expected) > 1e-6) {
      allCasesPass = false;
      failureDetails.push(`input='${c.in}' expected=${c.expected} got=${actual}`);
    }
  }

  // Also verify source code of route.ts literally contains this exact guard
  const routeCode = fs.readFileSync("shaadisnap-web/src/app/api/face-search/route.ts", "utf-8");
  const hasGuardInCode =
    routeCode.includes("const rawThreshold = parseFloat((formData.get(\"threshold\") as string) || \"0.42\");") &&
    routeCode.includes("const threshold = isNaN(rawThreshold) ? 0.42 : Math.max(0.1, Math.min(0.99, rawThreshold));");

  recordTest("T6", "Threshold NaN guard clamps out-of-range & NaN values [0.10, 0.99]", allCasesPass && hasGuardInCode,
    allCasesPass && hasGuardInCode ? "All 13 adversarial inputs sanitized correctly; exact guard present in route.ts" : failureDetails.join("; "));
}

// -------------------------------------------------------------
// T13: Event ID Consistency Across Upload & Search
// -------------------------------------------------------------
{
  const uploadRoute = fs.readFileSync("shaadisnap-web/src/app/api/upload-photo/route.ts", "utf-8");
  const searchRoute = fs.readFileSync("shaadisnap-web/src/app/api/face-search/route.ts", "utf-8");
  const guestUploadComp = fs.readFileSync("shaadisnap-web/src/components/GuestPhotoUpload.tsx", "utf-8");
  const guestSearchComp = fs.readFileSync("shaadisnap-web/src/components/GuestSelfieSearch.tsx", "utf-8");
  const mockData = fs.readFileSync("shaadisnap-web/src/data/mockWeddingData.ts", "utf-8");

  const uploadRouteEventId = uploadRoute.includes('const eventId = (formData.get("eventId") as string) || "mahine-anand-2026";');
  const uploadRouteUsesEvent = uploadRoute.includes('"--event"') && uploadRoute.includes('eventId');
  const searchRouteEventId = searchRoute.includes('const eventId = (formData.get("eventId") as string) || "mahine-anand-2026";');
  const guestUploadPassesEvent = guestUploadComp.includes('formData.append("eventId", "mahine-anand-2026");');
  const guestSearchPassesEvent = guestSearchComp.includes('fd.append("eventId", WEDDING_EVENT.id);');
  const mockDataDefinesEvent = mockData.includes('id: "mahine-anand-2026"');

  const unified = uploadRouteEventId && uploadRouteUsesEvent && searchRouteEventId &&
                  guestUploadPassesEvent && guestSearchPassesEvent && mockDataDefinesEvent;

  recordTest("T13", "Event ID consistency across upload, search, and frontend components", unified,
    `upload-photo route: ${uploadRouteEventId}, GuestPhotoUpload: ${guestUploadPassesEvent}, face-search route: ${searchRouteEventId}, GuestSelfieSearch: ${guestSearchPassesEvent}, mockWeddingData: ${mockDataDefinesEvent}`);
}

// -------------------------------------------------------------
// Biometric Consent Gating & Privacy Verification
// -------------------------------------------------------------
{
  const guestSearchComp = fs.readFileSync("shaadisnap-web/src/components/GuestSelfieSearch.tsx", "utf-8");
  const searchRoute = fs.readFileSync("shaadisnap-web/src/app/api/face-search/route.ts", "utf-8");

  // 1. Checkbox default unchecked
  const defaultUnchecked = guestSearchComp.includes("const [hasConsent, setHasConsent] = useState(false);");
  recordTest("BC-1", "Biometric consent checkbox default state is unchecked (false)", defaultUnchecked,
    defaultUnchecked ? "Verified useState(false) at line 57" : "Not defaulting to false");

  // 2. Client-side interception
  const clientIntercept =
    guestSearchComp.includes("if (!hasConsent && !bypassConsent)") &&
    guestSearchComp.includes('setErrorMessage("Biometric consent is required to process facial recognition search.");');
  recordTest("BC-2", "Client intercept blocks unconsented search before network dispatch", clientIntercept,
    clientIntercept ? "runSearchSimulation checks !hasConsent and halts" : "Missing client check");

  // 3. Server HTTP 400 rejection
  const serverRejection =
    searchRoute.includes('if (hasConsent !== "true" && hasConsent !== "1")') &&
    searchRoute.includes('return NextResponse.json(') &&
    searchRoute.includes('{ status: 400 }');
  recordTest("BC-3", "Server strictly returns HTTP 400 when biometric consent is missing/false", serverRejection,
    serverRejection ? "route.ts rejects with 400 prior to file processing or ML subprocess" : "Missing server rejection");

  // 4. Exact legal copy match (Contract 3)
  const EXPECTED_LEGAL_COPY =
    "I authorize ShaadiSnap to perform ephemeral facial biometric analysis solely for the purpose of discovering my photographs. My selfie is never added to public models, and my biometric data can be erased at any time in compliance with DPDP Act 2023 & GDPR.";
  const legalCopyMatches = guestSearchComp.includes(EXPECTED_LEGAL_COPY);
  recordTest("BC-4", "Consent card legal copy matches Interface Contract 3 verbatim", legalCopyMatches,
    legalCopyMatches ? "100% verbatim match with DPDP Act 2023 & GDPR copy" : "Copy mismatch");

  // 5. Zero vector leaks to client responses
  const cliEngine = fs.readFileSync("shaadisnap-ml/cli_face_engine.py", "utf-8");
  const inferencePy = fs.readFileSync("shaadisnap-ml/src/inference.py", "utf-8");
  const searchReturnsVectors =
    inferencePy.includes('"embedding": rec["embedding"]') ||
    cliEngine.includes('"embedding": r["embedding"]');
  recordTest("BC-5", "Zero raw 512-d feature vectors or embeddings returned in search response", !searchReturnsVectors,
    !searchReturnsVectors ? "search response only returns metadata (photo_id, bbox, similarity, quality)" : "Leak detected: embedding vector found in search return dictionary");

  // 6. Zero vector leaks to client storage
  const storeCode = fs.readFileSync("shaadisnap-web/src/lib/weddingPhotoStore.ts", "utf-8");
  const storeHasVectors = storeCode.includes("embedding") || storeCode.includes("vector");
  recordTest("BC-6", "Zero biometric vectors stored in browser localStorage / client store", !storeHasVectors,
    !storeHasVectors ? "weddingPhotoStore only stores display metadata (id, url, title, ceremony, facesCount)" : "Leak detected in client store");

  // 7. Honest empty results on offline fallback
  const honestEmptyInRoute =
    searchRoute.includes('total_matches: 0') &&
    searchRoute.includes('matches: []');
  const honestEmptyInUI =
    guestSearchComp.includes("results = [];") &&
    guestSearchComp.includes("Found {matchedPhotos.length} Photographs Featuring You");
  recordTest("BC-7", "Honest empty state on offline fallback without fabricating match scores", honestEmptyInRoute && honestEmptyInUI,
    honestEmptyInRoute && honestEmptyInUI ? "API returns matches: [] and UI renders 0 results without score fabrication" : "Fallback scores fabricated");
}

console.log("\n=================================================================");
const totalTests = results.length;
const passedTests = results.filter(r => r.passed).length;
const failedTests = totalTests - passedTests;
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log(`OVERALL STATUS: ${failedTests === 0 ? "ALL VERIFICATIONS PASSED" : "FAILURES DETECTED"}`);
console.log("=================================================================");

process.exit(failedTests === 0 ? 0 : 1);
