// test_live_api_endpoints.mjs
// Live HTTP endpoint testing against active Next.js dev server on http://localhost:3000

import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const SAMPLE_IMAGE_PATH = path.resolve("shaadisnap-ml/data/synthetic_demo/guest_000/face_00.jpg");
const imageBuffer = fs.readFileSync(SAMPLE_IMAGE_PATH);

async function runLiveTests() {
  console.log("=================================================================");
  console.log("LIVE HTTP ENDPOINT EMPIRICAL VERIFICATION (http://localhost:3000)");
  console.log("=================================================================\n");

  const results = [];
  function record(id, name, passed, detail) {
    results.push({ id, name, passed, detail });
    console.log(`[${passed ? "✓ PASS" : "✗ FAIL"}] ${id}: ${name}`);
    if (detail) console.log(`       ${detail}`);
  }

  // -------------------------------------------------------------
  // Test L1: Missing consent rejected with HTTP 400
  // -------------------------------------------------------------
  try {
    const fd = new FormData();
    const file = new File([imageBuffer], "selfie.jpg", { type: "image/jpeg" });
    fd.append("file", file);
    fd.append("eventId", "mahine-anand-2026");

    const res = await fetch(`${BASE_URL}/api/face-search`, { method: "POST", body: fd });
    const json = await res.json();
    const passed = res.status === 400 && json.error?.includes("Biometric consent is required");
    record("L1", "POST /api/face-search without hasConsent returns HTTP 400", passed,
      `Status: ${res.status}, Error: "${json.error}"`);
  } catch (e) {
    record("L1", "POST /api/face-search without hasConsent returns HTTP 400", false, e.message);
  }

  // -------------------------------------------------------------
  // Test L2: hasConsent='false' rejected with HTTP 400
  // -------------------------------------------------------------
  try {
    const fd = new FormData();
    const file = new File([imageBuffer], "selfie.jpg", { type: "image/jpeg" });
    fd.append("file", file);
    fd.append("eventId", "mahine-anand-2026");
    fd.append("hasConsent", "false");

    const res = await fetch(`${BASE_URL}/api/face-search`, { method: "POST", body: fd });
    const json = await res.json();
    const passed = res.status === 400 && json.error?.includes("Biometric consent is required");
    record("L2", "POST /api/face-search with hasConsent='false' returns HTTP 400", passed,
      `Status: ${res.status}, Error: "${json.error}"`);
  } catch (e) {
    record("L2", "POST /api/face-search with hasConsent='false' returns HTTP 400", false, e.message);
  }

  // -------------------------------------------------------------
  // Test L3: hasConsent='0' rejected with HTTP 400
  // -------------------------------------------------------------
  try {
    const fd = new FormData();
    const file = new File([imageBuffer], "selfie.jpg", { type: "image/jpeg" });
    fd.append("file", file);
    fd.append("eventId", "mahine-anand-2026");
    fd.append("hasConsent", "0");

    const res = await fetch(`${BASE_URL}/api/face-search`, { method: "POST", body: fd });
    const json = await res.json();
    const passed = res.status === 400 && json.error?.includes("Biometric consent is required");
    record("L3", "POST /api/face-search with hasConsent='0' returns HTTP 400", passed,
      `Status: ${res.status}, Error: "${json.error}"`);
  } catch (e) {
    record("L3", "POST /api/face-search with hasConsent='0' returns HTTP 400", false, e.message);
  }

  // -------------------------------------------------------------
  // Test L4: Valid consent but missing file returns HTTP 400
  // -------------------------------------------------------------
  try {
    const fd = new FormData();
    fd.append("eventId", "mahine-anand-2026");
    fd.append("hasConsent", "true");

    const res = await fetch(`${BASE_URL}/api/face-search`, { method: "POST", body: fd });
    const json = await res.json();
    const passed = res.status === 400 && json.error?.includes("No selfie photo provided");
    record("L4", "POST /api/face-search with consent=true but missing file returns HTTP 400", passed,
      `Status: ${res.status}, Error: "${json.error}"`);
  } catch (e) {
    record("L4", "POST /api/face-search with consent=true but missing file returns HTTP 400", false, e.message);
  }

  // -------------------------------------------------------------
  // Test L5: Valid consent + selfie with threshold='NaN'
  // -------------------------------------------------------------
  try {
    const fd = new FormData();
    const file = new File([imageBuffer], "selfie.jpg", { type: "image/jpeg" });
    fd.append("file", file);
    fd.append("eventId", "mahine-anand-2026");
    fd.append("hasConsent", "true");
    fd.append("threshold", "NaN");

    const res = await fetch(`${BASE_URL}/api/face-search`, { method: "POST", body: fd });
    const json = await res.json();
    // Engine executes safely, threshold clamped to 0.42, returns HTTP 200 with success
    const passed = res.status === 200 && json.success === true && json.threshold_used === 0.42;
    record("L5", "POST /api/face-search with threshold='NaN' executes safely with threshold 0.42", passed,
      `Status: ${res.status}, Success: ${json.success}, Engine: ${json.engine}, Threshold Used: ${json.threshold_used}, Matches: ${json.matches?.length}`);
  } catch (e) {
    record("L5", "POST /api/face-search with threshold='NaN' executes safely with threshold 0.42", false, e.message);
  }

  // -------------------------------------------------------------
  // Test L6: Valid consent + selfie with out-of-range threshold='-5.0' (clamped to 0.1)
  // -------------------------------------------------------------
  try {
    const fd = new FormData();
    const file = new File([imageBuffer], "selfie.jpg", { type: "image/jpeg" });
    fd.append("file", file);
    fd.append("eventId", "mahine-anand-2026");
    fd.append("hasConsent", "true");
    fd.append("threshold", "-5.0");

    const res = await fetch(`${BASE_URL}/api/face-search`, { method: "POST", body: fd });
    const json = await res.json();
    const passed = res.status === 200 && json.success === true && Math.abs(json.threshold_used - 0.1) < 1e-4;
    record("L6", "POST /api/face-search with threshold='-5.0' clamps threshold to 0.10", passed,
      `Status: ${res.status}, Success: ${json.success}, Threshold Used: ${json.threshold_used}`);
  } catch (e) {
    record("L6", "POST /api/face-search with threshold='-5.0' clamps threshold to 0.10", false, e.message);
  }

  // -------------------------------------------------------------
  // Test L7: Valid consent + selfie with out-of-range threshold='10.0' (clamped to 0.99)
  // -------------------------------------------------------------
  try {
    const fd = new FormData();
    const file = new File([imageBuffer], "selfie.jpg", { type: "image/jpeg" });
    fd.append("file", file);
    fd.append("eventId", "mahine-anand-2026");
    fd.append("hasConsent", "true");
    fd.append("threshold", "10.0");

    const res = await fetch(`${BASE_URL}/api/face-search`, { method: "POST", body: fd });
    const json = await res.json();
    const passed = res.status === 200 && json.success === true && Math.abs(json.threshold_used - 0.99) < 1e-4;
    record("L7", "POST /api/face-search with threshold='10.0' clamps threshold to 0.99", passed,
      `Status: ${res.status}, Success: ${json.success}, Threshold Used: ${json.threshold_used}`);
  } catch (e) {
    record("L7", "POST /api/face-search with threshold='10.0' clamps threshold to 0.99", false, e.message);
  }

  // -------------------------------------------------------------
  // Test L8: Zero vector leaks in live response
  // -------------------------------------------------------------
  try {
    const fd = new FormData();
    const file = new File([imageBuffer], "selfie.jpg", { type: "image/jpeg" });
    fd.append("file", file);
    fd.append("eventId", "mahine-anand-2026");
    fd.append("hasConsent", "true");
    fd.append("threshold", "0.42");

    const res = await fetch(`${BASE_URL}/api/face-search`, { method: "POST", body: fd });
    const jsonText = await res.text();
    const json = JSON.parse(jsonText);
    const hasEmbeddingField = jsonText.includes('"embedding":') || jsonText.includes('"embeddings":');
    record("L8", "Zero raw 512-d feature vectors or embeddings in live HTTP response", !hasEmbeddingField,
      `Response length: ${jsonText.length} bytes, hasEmbedding: ${hasEmbeddingField}`);
  } catch (e) {
    record("L8", "Zero raw 512-d feature vectors or embeddings in live HTTP response", false, e.message);
  }

  // -------------------------------------------------------------
  // Test L9: Upload boundary rejects MIME spoofing (exploit.exe with image/jpeg)
  // -------------------------------------------------------------
  try {
    const fd = new FormData();
    const dummy = new File([Buffer.from("malicious content")], "exploit.exe", { type: "image/jpeg" });
    fd.append("file", dummy);
    fd.append("ceremony", "Sangeet");

    const res = await fetch(`${BASE_URL}/api/upload-photo`, { method: "POST", body: fd });
    const json = await res.json();
    const passed = res.status === 400 && json.error?.includes("Invalid file type");
    record("L9", "POST /api/upload-photo rejects exploit.exe with image/jpeg MIME", passed,
      `Status: ${res.status}, Error: "${json.error}"`);
  } catch (e) {
    record("L9", "POST /api/upload-photo rejects exploit.exe with image/jpeg MIME", false, e.message);
  }

  // -------------------------------------------------------------
  // Test L10: Upload boundary rejects extension without valid MIME (photo.jpg with application/x-sh)
  // -------------------------------------------------------------
  try {
    const fd = new FormData();
    const dummy = new File([Buffer.from("sh payload")], "photo.jpg", { type: "application/x-sh" });
    fd.append("file", dummy);
    fd.append("ceremony", "Sangeet");

    const res = await fetch(`${BASE_URL}/api/upload-photo`, { method: "POST", body: fd });
    const json = await res.json();
    const passed = res.status === 400 && json.error?.includes("Invalid file type");
    record("L10", "POST /api/upload-photo rejects photo.jpg with application/x-sh MIME", passed,
      `Status: ${res.status}, Error: "${json.error}"`);
  } catch (e) {
    record("L10", "POST /api/upload-photo rejects photo.jpg with application/x-sh MIME", false, e.message);
  }

  console.log("\n=================================================================");
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  console.log(`TOTAL LIVE TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`STATUS: ${failed === 0 ? "ALL LIVE VERIFICATIONS PASSED" : "FAILURES DETECTED"}`);
  console.log("=================================================================");
  process.exit(failed === 0 ? 0 : 1);
}

runLiveTests();
